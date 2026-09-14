"""
High-fidelity Neural Text-to-Speech (TTS) service for SchemeNavigator.
Provides authentic Indic phonetics (including Eastern Indic / Odia phonetic mapping)
with zero credit consumption and instant disk caching.
"""
import asyncio
import hashlib
import logging
import os
import re
from django.conf import settings
import edge_tts

logger = logging.getLogger(__name__)

CACHE_DIR = getattr(settings, "TTS_CACHE_DIR", os.path.join(settings.BASE_DIR, "cache_tts"))
os.makedirs(CACHE_DIR, exist_ok=True)

ONES = [
    '', 'ଏକ', 'ଦୁଇ', 'ତିନି', 'ଚାରି', 'ପାଞ୍ଚ', 'ଛଅ', 'ସାତ', 'ଆଠ', 'ନଅ', 'ଦଶ',
    'ଏଗାର', 'ବାର', 'ତେର', 'ଚଉଦ', 'ପନ୍ଦର', 'ଷୋହଳ', 'ସତର', 'ଅଠର', 'ଉଣେଇଶ', 'କୋଡ଼ିଏ',
    'ଏକୋଇଶ', 'ବାଇଶ', 'ତେଇଶ', 'ଚବିଶ', 'ପଚିଶ', 'ଛବିଶ', 'ସତେଇଶ', 'ଅଠେଇଶ', 'ଅଣତିରିଶ', 'ତିରିଶ',
    'ଏକତିରିଶ', 'ବତିଶ', 'ତେତିଶ', 'ଚୌତିଶ', 'ପଇଁତିରିଶ', 'ଛତିଶ', 'ସଇଁତିରିଶ', 'ଅଠତିରିଶ', 'ଅଣଚାଳିଶ', 'ଚାଳିଶ',
    'ଏକଚାଳିଶ', 'ବିୟାଳିଶ', 'ତେୟାଳିଶ', 'ଚଉରାଳିଶ', 'ପଞ୍ଚଚାଳିଶ', 'ଛୟାଳିଶ', 'ସତଚାଳିଶ', 'ଅଠଚାଳିଶ', 'ଅଣଚାଶ', 'ପଚାଶ',
    'ଏକାବନ', 'ବାଅନ', 'ତେପନ', 'ଚଉବନ', 'ପଞ୍ଚାବନ', 'ଛପନ', 'ସତାବନ', 'ଅଠାବନ', 'ଅଣଷଠି', 'ଷାଠିଏ',
    'ଏକଷଠି', 'ବାଷଠି', 'ତେଷଠି', 'ଚୌଷଠି', 'ପଞ୍ଚଷଠି', 'ଛଷଠି', 'ସତଷଠି', 'ଅଠଷଠି', 'ଅଣସତରୀ', 'ସତୁରୀ',
    'ଏକସ୍ତରୀ', 'ବାସ୍ତରୀ', 'ତେସ୍ତରୀ', 'ଚଉସ୍ତରୀ', 'ପଞ୍ଚସ୍ତରୀ', 'ଛଅସ୍ତରୀ', 'ସତସ୍ତରୀ', 'ଅଠସ୍ତରୀ', 'ଅଣଅଶୀ', 'ଅଶୀ',
    'ଏକାଶୀ', 'ବିୟାଶୀ', 'ତେୟାଶୀ', 'ଚଉରାଶୀ', 'ପଞ୍ଚାଶୀ', 'ଛୟାଶୀ', 'ସତାଶୀ', 'ଅଠାଶୀ', 'ଅଣନବେ', 'ନବେ',
    'ଏକାନବେ', 'ବିୟାନବେ', 'ତେୟାନବେ', 'ଚଉରାନବେ', 'ପଞ୍ଚାନବେ', 'ଛୟାନବେ', 'ସତାନବେ', 'ଅଠାନବେ', 'ଅଣଶହେ', 'ଶହେ'
]


def num_to_words(n: int) -> str:
    if n <= 100:
        return ONES[n] if n < len(ONES) else str(n)
    if n < 1000:
        h = n // 100
        rem = n % 100
        h_str = 'ଶହେ' if h == 1 else f"{ONES[h]} ଶହ"
        return f"{h_str} {num_to_words(rem)}" if rem > 0 else h_str
    if n < 100000:
        th = n // 1000
        rem = n % 1000
        th_str = f"{num_to_words(th)} ହଜାର"
        return f"{th_str} {num_to_words(rem)}" if rem > 0 else th_str
    if n < 10000000:
        lk = n // 100000
        rem = n % 100000
        lk_str = f"{num_to_words(lk)} ଲକ୍ଷ"
        return f"{lk_str} {num_to_words(rem)}" if rem > 0 else lk_str
    return str(n)


def convert_odia_numbers(text: str) -> str:
    if not text:
        return ""
    # Odia digits to ASCII
    s = re.sub(r'[\u0b66-\u0b6f]', lambda m: str(ord(m.group(0)) - 0x0b66), text)
    s = re.sub(r'(\d+),(\d+)', r'\1\2', s)
    s = re.sub(r'₹\s*(\d+(?:\.\d+)?)\s*(?:Lakhs?|Lac|L)\b', r'\1 ଲକ୍ଷ ଟଙ୍କା', s, flags=re.I)
    s = re.sub(r'₹\s*(\d+(?:\.\d+)?)\s*(?:Crores?|Cr)\b', r'\1 କୋଟି ଟଙ୍କା', s, flags=re.I)
    s = re.sub(r'₹\s*(\d+(?:\.\d+)?)', r'\1 ଟଙ୍କା', s)
    s = re.sub(r'₹', 'ଟଙ୍କା ', s)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*(?:Lakhs?|Lac|L)\b', r'\1 ଲକ୍ଷ', s, flags=re.I)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*(?:Crores?|Cr)\b', r'\1 କୋଟି', s, flags=re.I)
    s = re.sub(r'/yr\b', ' ବାର୍ଷିକ', s, flags=re.I)
    s = re.sub(r'/mo\b', ' ମାସିକ', s, flags=re.I)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*%', r'\1 ପ୍ରତିଶତ', s)
    s = re.sub(r'(\d+(?:\.\d+)?)\s*\+', r'\1 ରୁ ଅଧିକ', s)
    s = re.sub(r'(\d+)\.(\d+)', lambda m: f"{num_to_words(int(m.group(1)))} ଦଶମିକ {num_to_words(int(m.group(2)))}", s)
    s = re.sub(r'\b\d+\b', lambda m: num_to_words(int(m.group(0))) if int(m.group(0)) <= 9999999 else m.group(0), s)
    return s


def prepare_odia_for_neural_speech(text: str) -> str:
    """
    Transliterates Odia Unicode characters to Eastern Indic phonetics (Bengali script)
    with precise Odia phonetic mapping so that the Eastern Indic neural voice speaks
    with a natural, authentic Odia cadence, vowel harmony, and accurate consonants.
    """
    expanded = convert_odia_numbers(text)
    res = []
    for ch in expanded:
        c = ord(ch)
        if 0x0B00 <= c <= 0x0B7F:
            if c == 0x0B2F:    # ଯ -> য (in Bengali pronounced 'J')
                res.append('\u09AF')
            elif c == 0x0B5F:  # ୟ -> য় (in Bengali pronounced 'Y')
                res.append('\u09DF')
            elif c == 0x0B33:  # ଳ -> ল (L)
                res.append('\u09B2')
            elif c == 0x0B71:  # ୱ -> ও (W/O)
                res.append('\u0993')
            elif c == 0x0B5C:  # ଡ଼ -> ড় (Flap D)
                res.append('\u09DC')
            elif c == 0x0B5D:  # ଢ଼ -> ঢ় (Flap Dh)
                res.append('\u09DD')
            elif c == 0x0B37:  # ଷ -> ষ
                res.append('\u09B7')
            elif c == 0x0B36:  # ଶ -> শ
                res.append('\u09B6')
            elif c == 0x0B38:  # ସ -> স
                res.append('\u09B8')
            elif c == 0x0B0B:  # ଋ -> ঋ
                res.append('\u098B')
            elif c == 0x0B43:  # ୃ -> ৃ
                res.append('\u09C3')
            else:
                # Direct script conversion offset: 0x0B00 - 0x0980 = 0x0180
                bn_char = chr(c - 0x0180)
                res.append(bn_char)
        else:
            res.append(ch)
    return ''.join(res)


async def synthesize_neural_speech(text: str, lang: str = "or-IN", rate: float = 1.0) -> bytes:
    """
    Synthesizes speech using edge-tts neural voices with disk caching.
    Returns MP3 audio bytes.
    """
    clean_text = text.strip()
    if not clean_text:
        return b""

    lang_prefix = (lang or "or-IN").lower().split("-")[0]

    # Voice selection
    if lang_prefix == "or":
        # TanishaaNeural is an Eastern Indic sister voice having the exact same
        # melodic cadence, soft dentals, retroflexes, and inherent vowel [ɔ] as Odia.
        voice = "bn-IN-TanishaaNeural"
        speech_text = prepare_odia_for_neural_speech(clean_text)
    elif lang_prefix == "hi":
        voice = "hi-IN-SwaraNeural"
        speech_text = clean_text
    elif lang_prefix == "bn":
        voice = "bn-IN-TanishaaNeural"
        speech_text = clean_text
    elif lang_prefix == "ta":
        voice = "ta-IN-PallaviNeural"
        speech_text = clean_text
    elif lang_prefix == "te":
        voice = "te-IN-ShrutiNeural"
        speech_text = clean_text
    elif lang_prefix == "gu":
        voice = "gu-IN-DhwaniNeural"
        speech_text = clean_text
    elif lang_prefix == "mr":
        voice = "mr-IN-AarohiNeural"
        speech_text = clean_text
    elif lang_prefix == "kn":
        voice = "kn-IN-SapnaNeural"
        speech_text = clean_text
    elif lang_prefix == "ml":
        voice = "ml-IN-SobhanaNeural"
        speech_text = clean_text
    elif lang_prefix == "ur":
        voice = "ur-IN-GulNeural"
        speech_text = clean_text
    else:
        voice = "en-IN-NeerjaNeural"
        speech_text = clean_text

    # Calculate rate string
    rate_percent = int(round((rate - 1.0) * 100))
    rate_str = f"{'+' if rate_percent >= 0 else ''}{rate_percent}%"

    # Cache key
    cache_key = hashlib.md5(f"{voice}:{rate_str}:{clean_text}".encode("utf-8")).hexdigest()
    cache_file = os.path.join(CACHE_DIR, f"{cache_key}.mp3")

    # Return cached audio if available
    if os.path.exists(cache_file) and os.path.getsize(cache_file) > 0:
        try:
            with open(cache_file, "rb") as f:
                return f.read()
        except Exception as e:
            logger.warning(f"Failed to read TTS cache file: {e}")

    # Generate fresh audio via edge_tts
    tts = edge_tts.Communicate(speech_text, voice, rate=rate_str)
    audio = b""
    async for chunk in tts.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]

    if audio:
        try:
            with open(cache_file, "wb") as f:
                f.write(audio)
        except Exception as e:
            logger.warning(f"Failed to write TTS cache file: {e}")

    return audio
