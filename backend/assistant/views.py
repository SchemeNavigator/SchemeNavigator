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
    Body: { "message": "<user text>", "history": [...], "profile": {...} }
    Returns: { "answer": str, "referencedSchemes": Scheme[], "profileUpdated": bool }
    """

    def post(self, request):
        _require_session(request)
        message = (request.data.get("message") or "").strip()
        if not message:
            return Response({"error": "message is required"}, status=400)

        history = request.data.get("history", [])
        profile = request.data.get("profile", None)
        language = request.data.get("language", "en-IN")

        agent = AssistantAgent()
        result = agent.chat(
            history=history,
            message=message,
            current_profile=profile,
            language=language,
        )

        answer = result["answer"]
        referenced_ids = result.get("referenced_scheme_ids", [])
        updated_profile = result.get("updated_profile")

        # Hydrate referenced scheme objects
        referenced_schemes = []
        if referenced_ids:
            schemes_qs = Scheme.objects.filter(slug__in=referenced_ids)
            referenced_schemes = SchemeSerializer(schemes_qs, many=True).data

        return Response(
            {
                "answer": answer,
                "referencedSchemes": referenced_schemes,
                "profileUpdated": bool(updated_profile),
                "updatedProfile": updated_profile,
            }
        )


class TTSView(APIView):
    """
    GET  /api/assistant/tts/?text=<text>&lang=<lang>&rate=<rate>
    POST /api/assistant/tts/
    Body: { "text": "<text>", "lang": "<lang>", "rate": 1.0 }

    Returns MP3 audio stream of high-fidelity neural speech.
    Zero credits used, disk-cached for instant sub-millisecond response.
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        text = (request.query_params.get("text") or "").strip()
        lang = (request.query_params.get("lang") or "or-IN").strip()
        try:
            rate = float(request.query_params.get("rate") or 1.0)
        except (ValueError, TypeError):
            rate = 1.0

        if not text:
            return Response({"error": "text parameter is required"}, status=400)

        return self._synthesize(text, lang, rate)

    def post(self, request):
        text = (request.data.get("text") or "").strip()
        lang = (request.data.get("lang") or "or-IN").strip()
        try:
            rate = float(request.data.get("rate") or 1.0)
        except (ValueError, TypeError):
            rate = 1.0

        if not text:
            return Response({"error": "text field is required"}, status=400)

        return self._synthesize(text, lang, rate)

    def _synthesize(self, text: str, lang: str, rate: float):
        from django.http import HttpResponse
        from asgiref.sync import async_to_sync
        from .tts_service import synthesize_neural_speech

        try:
            audio_bytes = async_to_sync(synthesize_neural_speech)(text, lang, rate)
            if not audio_bytes:
                return Response({"error": "Failed to generate audio"}, status=500)

            response = HttpResponse(audio_bytes, content_type="audio/mpeg")
            response["Content-Length"] = str(len(audio_bytes))
            response["Cache-Control"] = "public, max-age=86400"
            return response
        except Exception as e:
            logger.error(f"TTSView synthesis error: {e}", exc_info=True)
            return Response({"error": f"Speech synthesis failed: {str(e)}"}, status=500)


