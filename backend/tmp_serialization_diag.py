import json
import os

os.environ.setdefault("PYTHONPATH", "backend")

from types import SimpleNamespace

from app.llm.model_factory import ModelFactory
from app.llm.prompt_manager import PromptManager
from app.models.survey import SurveyRequest


def main():
    # Load backend/.env if present so ModelFactory can be constructed locally
    try:
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"')
                    if k and k not in os.environ:
                        os.environ[k] = v
    except Exception:
        pass

    # Create model wrapper (no network call)
    wrapper = ModelFactory.create()

    captured = {}

    def fake_post(*args, **kwargs):
        # capture the json payload without serializing
        captured['json'] = kwargs.get('json') if 'json' in kwargs else (args[1] if len(args) > 1 else None)
        return SimpleNamespace(status_code=200, text='{}', headers={}, json=lambda: {})

    wrapper._httpx = SimpleNamespace(post=fake_post)

    # Build variables like IntentExtractionNode
    survey_data = {
        "age": 19,
        "gender": "Male",
        "state": "Delhi",
        "district": "New Delhi",
        "area": "Urban",
        "category": "General",
        "minority": False,
        "disability": False,
        "disability_percentage": 0,
        "employment_status": "Student",
        "occupation": "Student",
        "bpl": False,
        "annual_income": 180000,
    }

    survey = SurveyRequest(**survey_data)
    pm = PromptManager()
    variables = {
        "survey": survey.model_dump() if hasattr(survey, 'model_dump') else {},
        "conversation_history": [],
        "current_timestamp": "now",
    }

    rendered = pm.render('intent', variables)

    # Call wrapper.generate but our fake_post will capture payload
    wrapper.generate(rendered)

    payload = captured.get('json')
    if payload is None:
        print(json.dumps({"error": "no_payload_captured"}))
        return

    # Inspect the content field
    try:
        messages = payload.get('messages')
        first = messages[0] if messages else None
        content = first.get('content') if first else None
        result = {
            "messages_len": len(messages) if messages else 0,
            "content_type": type(content).__name__ if content is not None else None,
            "content_repr": repr(content)[:200],
        }
    except Exception as exc:
        result = {"error": "inspection_failed", "detail": str(exc)}

    print(json.dumps(result))


if __name__ == '__main__':
    main()
