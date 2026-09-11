"""
AssistantAgent — powers the natural-language conversational chatbot interface.

Responsibilities:
1. Detect if the user is describing themselves → call ProfileAgent to update profile.
2. Smart intent extraction & multi-category retrieval across 3,866 schemes.
3. Build multi-turn conversation context window (last 10 messages).
4. Call LLM with grounded scheme context in Hindi / Hinglish / English.
5. Return clean conversational answer + list of referenced scheme IDs + profile updates.
"""
import json
import logging
import re

from .litellm_client import call_llm
from .profile_agent import ProfileAgent

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are Mitra (मित्र), the highly intelligent, empathetic, versatile, and conversational AI Welfare Counselor on SchemeNavigator for Indian citizens.

YOUR CORE CAPABILITIES & INTELLIGENCE:
1. **Conversational Reasoning & General Intelligence**:
   - You have deep reasoning, general knowledge, math, translation, and communication capabilities.
   - If the user asks general questions, math, jokes, greetings, letter writing, or everyday questions (e.g. "what is capital of India", "how are you", "write an application", "solve 25*14"), answer naturally, accurately, and politely.
   - For general chat, do not force scheme recommendations.
2. **Specialized Citizen Welfare & Government Schemes Counseling**:
   - When the citizen asks about welfare schemes, scholarships, farming subsidies, Mudra loans, pensions, healthcare (Ayushman Bharat), housing (PMAY), or describes their situation:
   - Carefully consider the Citizen Profile context (Age, State, Gender, Caste, Income, Occupation, Disability, Education) if available.
   - Ground your recommendations strictly in the verified database schemes provided below.
   - Explain benefits, eligibility criteria, required documents, and official application procedures step-by-step.
   - Be encouraging, respectful, and crystal clear.

CONVERSATION & LANGUAGE PURITY RULES:
- **Language Matching**:
  - Always respond in the EXACT same language that the user writes or speaks in.
  - If the user writes/speaks in Hindi (हिंदी): Respond in 100% natural, polite, grammatically correct Hindi.
  - If the user writes/speaks in Hinglish (e.g. "mujhe 12th ke baad scholarship chahiye"): Respond in warm, respectful Hinglish/Hindi.
  - If the user writes/speaks in Odia (ଓଡ଼ିଆ): Respond in fluent, natural Odia.
  - If the user writes/speaks in Bengali (বাংলা): Respond in fluent Bengali.
  - If the user writes/speaks in Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, or Punjabi: Respond in that respective language.
  - If the user writes/speaks in English: Respond in clean, fluent English.
- **Scheme Slug Tagging**:
  - When (and ONLY when) you recommend actual welfare schemes from the database, append their slugs at the very end in this format:
    <schemes>slug-1,slug-2</schemes>
  - For casual chat, general knowledge, or greetings, do NOT output any <schemes> tag.

CITIZEN PROFILE CONTEXT:
{profile_context}

AVAILABLE SCHEMES CONTEXT (Verified from Database):
{scheme_context}
"""

INTENT_CATEGORY_MAP = {
    # Agriculture
    "kisan": ["Agriculture", "Financial Assistance"],
    "kheti": ["Agriculture", "Financial Assistance"],
    "farmer": ["Agriculture", "Financial Assistance"],
    "farming": ["Agriculture", "Financial Assistance"],
    "crop": ["Agriculture"],
    "tractor": ["Agriculture", "Financial Assistance"],
    "fertilizer": ["Agriculture"],
    "fasal": ["Agriculture"],
    # Education & Skills
    "student": ["Education", "Skill Development"],
    "scholarship": ["Education", "Financial Assistance"],
    "study": ["Education", "Skill Development"],
    "padhai": ["Education", "Skill Development"],
    "college": ["Education"],
    "school": ["Education"],
    "fee": ["Education", "Financial Assistance"],
    "skill": ["Skill Development", "Employment"],
    "training": ["Skill Development"],
    # Loans & Business
    "loan": ["Business", "Financial Assistance"],
    "business": ["Business", "Financial Assistance"],
    "startup": ["Business"],
    "dukaan": ["Business", "Financial Assistance"],
    "shop": ["Business", "Financial Assistance"],
    "mudra": ["Business", "Financial Assistance"],
    "subsidy": ["Financial Assistance", "Agriculture", "Business"],
    "svanidhi": ["Business", "Financial Assistance"],
    # Women & Child
    "woman": ["Women & Child", "Social Security"],
    "women": ["Women & Child", "Social Security"],
    "mahila": ["Women & Child", "Social Security"],
    "girl": ["Women & Child", "Education"],
    "beti": ["Women & Child", "Education"],
    "maternity": ["Women & Child", "Healthcare"],
    "sukanya": ["Women & Child", "Financial Assistance"],
    # Healthcare
    "health": ["Healthcare"],
    "hospital": ["Healthcare"],
    "illness": ["Healthcare"],
    "ilaj": ["Healthcare"],
    "treatment": ["Healthcare"],
    "ayushman": ["Healthcare"],
    "medicine": ["Healthcare"],
    "dawa": ["Healthcare"],
    # Housing
    "house": ["Housing"],
    "housing": ["Housing"],
    "ghar": ["Housing"],
    "makan": ["Housing"],
    "awas": ["Housing"],
    "pmay": ["Housing"],
    # Social Security & Pensions
    "pension": ["Social Security"],
    "elderly": ["Social Security"],
    "senior": ["Social Security"],
    "old age": ["Social Security"],
    "vriddha": ["Social Security"],
    "bima": ["Social Security", "Financial Assistance"],
    "insurance": ["Social Security"],
    # Employment
    "job": ["Employment", "Skill Development"],
    "naukri": ["Employment"],
    "employment": ["Employment"],
    "berojgar": ["Employment", "Skill Development"],
    "unemployed": ["Employment", "Skill Development"],
}

PROFILE_DETECTION_KEYWORDS = [
    "i am", "i'm", "i have", "my income", "my age", "i live",
    "my family", "i work", "i farm", "i study", "i'm a", "i am a",
    "year old", "years old", "from ", "belong to", "my state",
    "meri umar", "meri age", "mai ", "main ", "mera state",
    "st ", "sc ", "obc ", "general", "bpl", "ration card",
]


def _might_contain_profile(text: str) -> bool:
    """Heuristic: does this message contain self-description?"""
    lower = text.lower()
    return any(kw in lower for kw in PROFILE_DETECTION_KEYWORDS)


def _search_schemes(query: str, limit: int = 8) -> list[dict]:
    """
    Intelligent keyword + intent + category search across schemes in the database.
    Returns list of Scheme serializer dicts.
    """
    from django.db.models import Q
    from schemes.models import Scheme
    from schemes.serializers import SchemeSerializer

    q_lower = query.lower()
    matched_categories = set()
    for keyword, categories in INTENT_CATEGORY_MAP.items():
        if keyword in q_lower:
            matched_categories.update(categories)

    filter_q = Q()
    # Search query in text fields
    words = [w.strip() for w in re.split(r"\s+", query) if len(w.strip()) >= 3]
    for w in words[:4]:
        filter_q |= Q(name__icontains=w) | Q(tags__icontains=w) | Q(short_description__icontains=w)

    if matched_categories:
        filter_q |= Q(category__in=matched_categories)

    qs = Scheme.objects.filter(filter_q).order_by("-popular_score")[:limit]

    if not qs.exists():
        # Fallback: return top popular schemes
        qs = Scheme.objects.order_by("-popular_score")[:limit]

    return [dict(s) for s in SchemeSerializer(qs, many=True).data]


def _build_scheme_context(schemes: list[dict]) -> str:
    """Format scheme summaries for injection into the system prompt."""
    if not schemes:
        return "No specific schemes loaded for this query."
    lines = []
    for s in schemes:
        name = s.get("name", "")
        slug = s.get("slug", "")
        cat = s.get("category", "")
        desc = s.get("shortDescription") or s.get("short_description", "")
        benefits = s.get("benefits", [])
        benefit_text = ""
        if benefits and isinstance(benefits, list):
            b0 = benefits[0]
            if isinstance(b0, dict):
                benefit_text = f" | Benefit: {b0.get('amountOrValue') or b0.get('title') or b0.get('description', '')}"
        states = s.get("coveredStates") or s.get("covered_states", [])
        state_str = ", ".join(states) if isinstance(states, list) else "All India"

        lines.append(
            f"- [{slug}] **{name}** ({cat}) [Valid: {state_str}]: {desc}{benefit_text}"
        )
    return "\n".join(lines)


def _extract_scheme_slugs(text: str) -> list[str]:
    """
    Parse <schemes>slug1,slug2</schemes> tags from the LLM response.
    Returns a list of slug strings.
    """
    match = re.search(r"<schemes>(.*?)</schemes>", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return []
    raw = match.group(1)
    return [s.strip() for s in raw.split(",") if s.strip()]


def _clean_response(text: str) -> str:
    """Remove the <schemes>...</schemes> tag from the user-facing text."""
    return re.sub(r"<schemes>.*?</schemes>", "", text, flags=re.IGNORECASE | re.DOTALL).strip()


def _is_scheme_query(text: str) -> bool:
    """Check if the user is looking for government schemes, welfare, loans, scholarships, or subsidies."""
    lower = text.lower()
    scheme_triggers = [
        "scholarship", "scholarships", "kisan", "kheti", "loan", "loans", "yojana", "yojna", "scheme", "schemes",
        "pension", "pensions", "ayushman", "mudra", "awas", "pmay", "subsidy", "subsidies", "apply", "form",
        "farmer", "farmers", "student", "students", "college", "school", "elderly", "senior", "disable", "divyang",
        "mahila", "woman", "women", "girl", "beti", "sukanya", "vaya vandana", "fasal", "crop", "tractor", "fertilizer",
        "berojgar", "naukri", "job", "employment", "bpl", "ration", "caste", "obc", "sc", "st", "general",
        "chahiye", "batao", "mil sakti", "milega", "eligibility", "documents", "patrata", "sarkari", "government"
    ]
    return any(trig in lower for trig in scheme_triggers) or _might_contain_profile(text)


def _handle_casual_question(message: str) -> dict:
    """Answer casual questions, general knowledge, math, jokes, and chit-chat naturally."""
    lower = message.strip().lower()
    is_hindi = any(kw in lower for kw in ["kya", "hai", "kaise", "kese", "sunao", "bhai", "batao", "namaste", "haal", "kaun"])

    # 1. Simple Math evaluation (e.g. 15 * 8, 25 + 50, 100 / 4)
    math_match = re.search(r"(\d+)\s*([\+\-\*\/xX])\s*(\d+)", lower)
    if math_match:
        n1 = int(math_match.group(1))
        op = math_match.group(2).lower()
        n2 = int(math_match.group(3))
        res = 0
        if op in ("*", "x"):
            res = n1 * n2
        elif op == "+":
            res = n1 + n2
        elif op == "-":
            res = n1 - n2
        elif op == "/":
            res = n1 / n2 if n2 != 0 else "undefined"

        if is_hindi:
            ans = f"**{n1} {op} {n2}** का उत्तर **{res}** है।"
        else:
            ans = f"The result of **{n1} {op} {n2}** is **{res}**."
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 2. Capital of India / States
    if "capital of india" in lower or "bharat ki rajdhani" in lower or "capital of bharat" in lower:
        if is_hindi:
            ans = "भारत की राजधानी **नई दिल्ली (New Delhi)** है।"
        else:
            ans = "The capital of India is **New Delhi**."
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 3. Jokes / Fun
    if "joke" in lower or "chutkula" in lower or "funny" in lower or "hasi" in lower:
        if is_hindi:
            ans = (
                "😄 **यहाँ एक मजेदार चुटकुला है:**\n\n"
                "अध्यापक: 'अगर तुम्हारे पास 10 आम हैं और तुमने 3 आम अपने दोस्त को दे दिए, तो तुम्हारे पास क्या बचेगा?'\n\n"
                "छात्र: 'सर, 10 आम और 1 नया दोस्त!' 😂\n\n"
                "💡 *अगर आपको पढ़ाई या छात्रवृत्ति से जुड़ी योजनाएं जाननी हों, तो जरूर बताएं!*"
            )
        else:
            ans = (
                "😄 **Here's a quick light-hearted joke for you:**\n\n"
                "Teacher: 'If you have 10 mangoes and give 3 to your friend, what do you get?'\n\n"
                "Student: '10 mangoes and 1 new best friend!' 😂\n\n"
                "💡 *Feel free to ask me about government schemes, scholarships, or subsidies whenever you're ready!*"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 4. Greetings / How are you / Chit-chat
    if any(g in lower for g in ["hi", "hello", "hey", "namaste", "how are you", "kese ho", "kaise ho", "kya haal"]):
        if is_hindi:
            ans = (
                "नमस्ते! 😊 मैं बिल्कुल ठीक हूँ, पूछने के लिए धन्यवाद!\n\n"
                "मैं आपका **AI योजना सलाहकार (Scheme Mitra)** हूँ। मैं भारत सरकार की छात्रवृत्ति, किसान सब्सिडी, बिजनेस लोन और स्वास्थ्य योजनाओं की जानकारी देने के लिए यहाँ हूँ।\n\n"
                "बताइए, आज मैं आपकी क्या सहायता कर सकता हूँ?"
            )
        else:
            ans = (
                "Hello! 😊 I'm doing great, thank you for asking!\n\n"
                "I am your **AI Scheme Advisor (Scheme Mitra)**. I'm here to help you discover verified scholarships, farming subsidies, business loans, and healthcare schemes across India.\n\n"
                "How can I help you today?"
            )
        return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}

    # 5. Generic polite conversational response
    if is_hindi:
        ans = (
            f"मैंने आपकी बात समझ ली! 😊\n\n"
            "मैं आपका **AI योजना सलाहकार** हूँ। आप मुझसे किसी भी सरकारी योजना, छात्रवृत्ति, लोन, या सब्सिडी के बारे में पूछ सकते हैं, या अपनी आयु, राज्य और व्यवसाय बताकर सटीक योजनाएं जान सकते हैं।"
        )
    else:
        ans = (
            f"I understand! 😊\n\n"
            "As your **AI Scheme Advisor**, I'm always here to help you navigate 3,800+ central and state government schemes, scholarships, farming subsidies, and business loans.\n\n"
            "Feel free to ask about any specific welfare scheme or share your profile!"
        )
    return {"answer": ans, "referenced_scheme_ids": [], "updated_profile": None}


class AssistantAgent:
    """
    Handles conversational turns for the SchemeNavigator AI Advisor (Scheme Mitra).
    """

    def __init__(self):
        self._profile_agent = ProfileAgent()

    def chat(
        self,
        history: list[dict],
        message: str,
        current_profile: dict | None = None,
    ) -> dict:
        """
        Process one chat message in context of multi-turn conversation.

        Args:
            history: List of {"role": "user"|"assistant", "content": str} dicts.
            message: The new user message.
            current_profile: The session's current UserProfile dict (may be None).

        Returns:
            {
                "answer": str,
                "referenced_scheme_ids": list[str],
                "updated_profile": dict | None,
            }
        """
        clean_msg = message.strip()
        updated_profile = None

        # ── Step 1: Profile extraction ────────────────────────────────────────
        if _might_contain_profile(clean_msg):
            extracted = self._profile_agent.extract(clean_msg)
            if extracted:
                merged = dict(current_profile or {})
                merged.update(extracted)
                updated_profile = merged

        # ── Step 2: Retrieve relevant schemes ────────────────────────────────
        is_scheme_req = _is_scheme_query(clean_msg)
        relevant_schemes = _search_schemes(clean_msg, limit=8) if is_scheme_req else []

        # Also incorporate top recommendations if we have a profile and user is asking for schemes
        effective_profile = updated_profile or current_profile
        if effective_profile and is_scheme_req:
            try:
                from agents.recommendation_agent import RecommendationAgent
                reco_agent = RecommendationAgent()
                top_recos = reco_agent.recommend(effective_profile, top_n=5)
                reco_schemes = [r["scheme"] for r in top_recos[:4]]
                seen_slugs = {s.get("slug") for s in relevant_schemes}
                for s in reco_schemes:
                    if s.get("slug") not in seen_slugs:
                        relevant_schemes.append(s)
                        seen_slugs.add(s.get("slug"))
            except Exception as exc:
                logger.warning("Assistant: could not load recommendations: %s", exc)

        # Build citizen profile context string
        if effective_profile:
            prof_parts = []
            for k, label in [
                ("age", "Age"), ("gender", "Gender"), ("state", "State"),
                ("caste_category", "Caste Category"), ("income", "Annual Income"),
                ("occupation", "Occupation"), ("is_student", "Student Status"),
                ("has_disability", "Disability Status"), ("marital_status", "Marital Status")
            ]:
                val = effective_profile.get(k)
                if val is not None and val != "":
                    prof_parts.append(f"{label}: {val}")
            profile_context = ", ".join(prof_parts) if prof_parts else "No specific profile attributes provided."
        else:
            profile_context = "No specific citizen profile provided."
        scheme_context = _build_scheme_context(relevant_schemes[:10]) if is_scheme_req else "No specific schemes needed for casual chat."

        # ── Step 3: Build messages for LLM ────────────────────────────────────
        system_content = SYSTEM_PROMPT_TEMPLATE.format(
            scheme_context=scheme_context,
            profile_context=profile_context
        )
        llm_messages = [{"role": "system", "content": system_content}]

        # Include last 10 conversation turns for rich memory
        if history and isinstance(history, list):
            for turn in history[-10:]:
                role = turn.get("role")
                content = turn.get("content") or turn.get("text")
                if role in ("user", "assistant") and content:
                    llm_messages.append({"role": role, "content": content})

        llm_messages.append({"role": "user", "content": clean_msg})

        # ── Step 4: Call LLM with Fallback ────────────────────────────────────
        try:
            raw_response = call_llm(llm_messages, temperature=0.5, max_tokens=1024)
        except Exception as exc:
            logger.warning("AssistantAgent LLM call fell back to local conversational engine: %s", exc)
            if not is_scheme_req:
                return _handle_casual_question(clean_msg)
            raw_response = self._generate_conversational_fallback(
                clean_msg, relevant_schemes, effective_profile
            )

        # ── Step 5: Extract referenced schemes and clean response ─────────────
        referenced_slugs = _extract_scheme_slugs(raw_response)
        answer = _clean_response(raw_response)

        return {
            "answer": answer,
            "referenced_scheme_ids": referenced_slugs,
            "updated_profile": updated_profile,
        }

    def _generate_conversational_fallback(
        self, message: str, schemes: list[dict], profile: dict | None
    ) -> str:
        """Generate high-quality conversational response even without external LLM."""
        is_hindi = any(
            kw in message.lower()
            for kw in [
                "kya", "hai", "mujhe", "mera", "meri", "kaise", "batao", "yojana", "chahiye",
                "kisan", "kheti", "paisa", "pension", "naukri", "shiksha", "padhai", "kitna"
            ]
        )

        top_schemes = schemes[:3]
        slugs = ",".join(s.get("slug", "") for s in top_schemes if s.get("slug"))

        if not top_schemes:
            if is_hindi:
                return (
                    "मुझे आपकी आवश्यकता से संबंधित विशिष्ट योजना नहीं मिली। "
                    "कृपया थोड़ा और विवरण दें (जैसे आपका राज्य, आयु, या किस प्रकार की सहायता चाहिए — छात्रवृत्ति, लोन, या स्वास्थ्य) ताकि मैं सटीक योजना ढूँढ सकूँ।"
                )
            else:
                return (
                    "I could not find exact matching schemes for this specific query. "
                    "Please provide a few more details (like your State, Age, or the type of assistance you need — e.g., Scholarship, Business Loan, or Healthcare) so I can help you better."
                )

        if is_hindi:
            greeting = "नमस्ते! आपके पूछे गए विषय के आधार पर, यहाँ भारत सरकार की प्रमुख कल्याणकारी योजनाएँ हैं:\n\n"
            scheme_bullets = []
            for s in top_schemes:
                name = s.get("name", "")
                desc = s.get("shortDescription") or s.get("short_description", "")
                cat = s.get("category", "")
                benefits = s.get("benefits", [])
                b_text = ""
                if benefits and isinstance(benefits, list):
                    b0 = benefits[0]
                    if isinstance(b0, dict):
                        b_text = f"\n  - 💰 **मुख्य लाभ:** {b0.get('amountOrValue') or b0.get('title') or b0.get('description', '')}"
                scheme_bullets.append(f"🎯 **{name}** ({cat})\n  - 📋 **विवरण:** {desc}{b_text}")

            outro = "\n\n💡 *सलाह: आप अपना राज्य (State), आयु (Age), और व्यवसाय (Occupation) बताकर और भी सटीक योजनाएँ जान सकते हैं!*"
            return greeting + "\n\n".join(scheme_bullets) + outro + f"\n\n<schemes>{slugs}</schemes>"
        else:
            greeting = "Here are the top verified government welfare schemes matching your request:\n\n"
            scheme_bullets = []
            for s in top_schemes:
                name = s.get("name", "")
                desc = s.get("shortDescription") or s.get("short_description", "")
                cat = s.get("category", "")
                benefits = s.get("benefits", [])
                b_text = ""
                if benefits and isinstance(benefits, list):
                    b0 = benefits[0]
                    if isinstance(b0, dict):
                        b_text = f"\n  - 💰 **Key Benefit:** {b0.get('amountOrValue') or b0.get('title') or b0.get('description', '')}"
                scheme_bullets.append(f"🎯 **{name}** ({cat})\n  - 📋 **Overview:** {desc}{b_text}")

            outro = "\n\n💡 *Tip: Feel free to share your State, Age, and Occupation so I can personalize your recommendations even further!*"
            return greeting + "\n\n".join(scheme_bullets) + outro + f"\n\n<schemes>{slugs}</schemes>"



