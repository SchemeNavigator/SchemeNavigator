"""
Assistant views — stateless.

Conversation messages are no longer stored on the server.  Each chat request
is a single-turn call to the LLM with no persistent history.
The frontend (SchemeAdvisorChat) maintains the visible message list in
component state, which is discarded when the component unmounts.

GET  /api/assistant/messages/  — always returns an empty list
POST /api/assistant/chat/      — runs single-turn LLM call, returns answer
"""
import logging

from rest_framework.response import Response
from rest_framework.views import APIView

from sessions_app.profile_views import _require_session
from schemes.models import Scheme
from schemes.serializers import SchemeSerializer
from agents.assistant_agent import AssistantAgent

logger = logging.getLogger(__name__)


class AssistantMessagesView(APIView):
    """
    GET /api/assistant/messages/  — conversation history is not stored server-side
    """

    def get(self, request):
        _require_session(request)
        return Response({"messages": []})


class AssistantChatView(APIView):
    """
    POST /api/assistant/chat/
    Body: { "message": "<user text>" }
    Returns: { "answer": str, "referencedSchemes": Scheme[] }
    """

    def post(self, request):
        _require_session(request)
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"error": "message is required"}, status=400)

        # Single-turn call — no history, no profile stored on the server.
        agent = AssistantAgent()
        result = agent.chat(
            history=[],
            message=message,
            current_profile=None,
        )

        answer = result["answer"]
        referenced_ids = result.get("referenced_scheme_ids", [])

        # Hydrate referenced scheme objects
        referenced_schemes = []
        if referenced_ids:
            schemes_qs = Scheme.objects.filter(slug__in=referenced_ids)
            referenced_schemes = SchemeSerializer(schemes_qs, many=True).data

        return Response(
            {
                "answer": answer,
                "referencedSchemes": referenced_schemes,
                "profileUpdated": False,
            }
        )
