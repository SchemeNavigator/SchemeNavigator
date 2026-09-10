"""
Scheme catalogue views.
"""
import hashlib
import json

from django.core.cache import cache
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scheme
from .serializers import SchemeSerializer

CACHE_TTL = 60 * 10  # 10 minutes


def _schemes_cache_key(params: dict) -> str:
    """Stable cache key from query params."""
    canonical = json.dumps(params, sort_keys=True)
    return "schemes:list:" + hashlib.md5(canonical.encode()).hexdigest()


class SchemeListView(APIView):
    """
    GET /api/schemes/
    Query params: category, state, search, page (default 1), limit (default 50)
    """

    authentication_classes = []  # public endpoint
    permission_classes = []

    def get(self, request):
        params = {
            "category": request.query_params.get("category", ""),
            "state": request.query_params.get("state", ""),
            "search": request.query_params.get("search", ""),
            "page": request.query_params.get("page", "1"),
            "limit": request.query_params.get("limit", "50"),
        }

        cache_key = _schemes_cache_key(params)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        qs = Scheme.objects.all()

        if params["category"] and params["category"].lower() != "all":
            qs = qs.filter(category__iexact=params["category"])

        if params["state"] and params["state"] != "All India":
            # covered_states is a JSON array; filter via contains
            # Matches schemes where covered_states contains 'All India' OR the given state
            qs = qs.filter(
                Q(covered_states__contains=["All India"])
                | Q(covered_states__contains=[params["state"]])
            )

        if params["search"]:
            q = params["search"]
            qs = qs.filter(
                Q(name__icontains=q)
                | Q(short_description__icontains=q)
                | Q(tags__icontains=q)
            )

        total = qs.count()

        try:
            page = max(1, int(params["page"]))
            limit = min(200, max(1, int(params["limit"])))
        except ValueError:
            page, limit = 1, 50

        offset = (page - 1) * limit
        schemes = qs[offset: offset + limit]
        serializer = SchemeSerializer(schemes, many=True)

        import math

        total_pages = math.ceil(total / limit) if limit > 0 else 1

        result = {
            "schemes": serializer.data,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "totalPages": total_pages,
            },
        }

        cache.set(cache_key, result, CACHE_TTL)
        return Response(result)


class SchemeDetailView(APIView):
    """
    GET /api/schemes/<id_or_slug>/
    Accepts both the database pk (int) and the slug string.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request, id_or_slug):
        cache_key = f"schemes:detail:{id_or_slug}"
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        # Try slug first, then integer pk
        scheme = Scheme.objects.filter(slug=id_or_slug).first()
        if scheme is None:
            try:
                scheme = Scheme.objects.get(pk=int(id_or_slug))
            except (ValueError, Scheme.DoesNotExist):
                from rest_framework.exceptions import NotFound
                raise NotFound(f"Scheme '{id_or_slug}' not found.")

        data = SchemeSerializer(scheme).data
        cache.set(cache_key, data, CACHE_TTL)
        return Response(data)
