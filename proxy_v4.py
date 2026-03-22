"""
HomeNest Voice Proxy v4 — Full family assistant.
Tiers: HOME → FAMILY → LOCAL → CLOUD → AGENT
Features: Voice profiles, morning briefing, emergency mode, activity logging,
          homework timer, meal queries, weather, guest mode, screen time
"""
import http.server
import json
import urllib.request
import urllib.error
import time
import re
import os
import subprocess
import threading
from datetime import datetime, date, timedelta

# ─── Configuration ───────────────────────────────────────────────────────────
OPENCLAW_URL = os.getenv("OPENCLAW_URL", "http://127.0.0.1:18789/v1/chat/completions")
OPENCLAW_TOKEN = os.getenv("OPENCLAW_TOKEN", "your-openclaw-token-here")
HA_TOKEN = os.getenv("HA_TOKEN", "your-home-assistant-token-here")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "your-openai-key-here")
HA_URL = os.getenv("HA_URL", "http://homeassistant.local:8123")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11435")
PORT = int(os.getenv("PORT", "11434"))
LOCAL_MODEL = os.getenv("LOCAL_MODEL", "phi4-mini")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(BASE_DIR, "config") if os.path.exists(os.path.join(BASE_DIR, "config")) else os.path.join(BASE_DIR, "..", "homenest", "config")
FAMILY_MANAGER = os.path.join(BASE_DIR, "skills", "family", "family_manager.py") if os.path.exists(os.path.join(BASE_DIR, "skills")) else os.path.join(BASE_DIR, "..", "homenest", "skills", "family", "family_manager.py")

# ─── Activity Logger ─────────────────────────────────────────────────────────
ACTIVITY_LOG = os.path.join(CONFIG_DIR, "activity_log.json")

def log_activity(who, action, tier):
    """Log a voice/action event for the activity dashboard."""
    try:
        try:
            with open(ACTIVITY_LOG) as f:
                data = json.load(f)
        except:
            data = {"entries": []}
        data["entries"].insert(0, {
            "timestamp": datetime.now().isoformat(),
            "who": who,
            "action": action[:100],
            "tier": tier,
        })
        # Keep last 200 entries
        data["entries"] = data["entries"][:200]
        with open(ACTIVITY_LOG, "w") as f:
            json.dump(data, f, indent=2)
    except:
        pass  # Non-critical

# ─── Voice Profiles & Session ────────────────────────────────────────────────
PROFILES_FILE = os.path.join(CONFIG_DIR, "profiles.json")
current_profile = {"name": "Family", "role": "parent", "age_group": "adult", "id": "default"}
guest_mode = False

VOICE_PINS = {
    "ayush": "123",  # "this is ayush one two three"
    "ahana": "456",  # "this is ahana four five six"
}

DEFAULT_PROFILES = {
    "default": {"name": "Family", "role": "parent", "age_group": "adult"},
    "snehal": {"name": "Snehal", "role": "parent", "age_group": "adult"},
    "ayush": {"name": "Ayush", "role": "child", "age_group": "10-12"},
    "ahana": {"name": "Ahana", "role": "child", "age_group": "6-9"},
    "guest": {"name": "Guest", "role": "guest", "age_group": "adult"},
}

def load_profiles():
    try:
        with open(PROFILES_FILE) as f:
            return json.load(f)
    except:
        return DEFAULT_PROFILES

def switch_profile(text):
    """Handle profile switching. Returns (switched, message)."""
    global current_profile, guest_mode
    t = text.lower()

    # "this is snehal" / "switch to parent mode"
    if re.search(r'\bthis\s+is\s+snehal\b|\bparent\s+mode\b|\bdad\s+mode\b', t):
        current_profile = {**DEFAULT_PROFILES["snehal"], "id": "snehal"}
        guest_mode = False
        return True, "Hi Snehal! Switched to parent mode."

    # "this is ayush [PIN]"
    m = re.search(r'\bthis\s+is\s+(ayush|ahana)\b.*?(\d+)?', t)
    if m:
        name = m.group(1)
        pin = m.group(2) or ""
        # Verify PIN
        digits_in_text = re.findall(r'\d', t)
        pin_attempt = "".join(digits_in_text)
        expected = VOICE_PINS.get(name, "")
        if expected and pin_attempt != expected:
            return True, f"Hmm, that PIN doesn't match. Try again!"
        current_profile = {**DEFAULT_PROFILES[name], "id": name}
        guest_mode = False
        return True, f"Hey {name.capitalize()}! I've switched to your profile."

    # "guest mode" / "enable guest mode"
    if re.search(r'\bguest\s+mode\b', t):
        if "off" in t or "disable" in t:
            guest_mode = False
            current_profile = {**DEFAULT_PROFILES["default"], "id": "default"}
            return True, "Guest mode disabled. Back to family mode."
        guest_mode = True
        current_profile = {**DEFAULT_PROFILES["guest"], "id": "guest"}
        return True, "Guest mode enabled. I'll keep things limited and private."

    return False, ""

# ─── Kid-Safe Content Filter ─────────────────────────────────────────────────
BLOCKED_TOPICS_KIDS = [
    r'\b(violence|violent|kill|murder|blood|gore|weapon)\b',
    r'\b(sex|sexual|porn|nude|naked|xxx)\b',
    r'\b(drug|cocaine|heroin|meth|marijuana|weed)\b',
    r'\b(suicide|self.harm|cut\s+yourself)\b',
    r'\b(bomb|explosive|how\s+to\s+make)\b',
    r'\b(gambling|bet|casino)\b',
    r'\b(alcohol|beer|wine|vodka|drunk)\b',
]

BLOCKED_ACTIONS_KIDS = [
    r'\b(unlock|disarm|disable.*alarm|open.*gate|open.*garage)\b',
    r'\b(delete|remove|erase)\b',
    r'\b(send.*message|send.*email|call|text)\b',
    r'\b(buy|purchase|order|pay)\b',
]

def is_kid_safe_request(text):
    t = text.lower()
    for p in BLOCKED_TOPICS_KIDS:
        if re.search(p, t):
            return False, "topic"
    for p in BLOCKED_ACTIONS_KIDS:
        if re.search(p, t):
            return False, "action"
    return True, None

def filter_response_for_kids(text):
    t = text.lower()
    for p in BLOCKED_TOPICS_KIDS:
        if re.search(p, t):
            return "I'm not sure about that one. Maybe ask your mum or dad?"
    return text

# ─── Homework Timer ──────────────────────────────────────────────────────────
homework_timers = {}  # {"ayush": {"start": timestamp, "duration_min": 30}}

def handle_homework_timer(text):
    """Manage homework timers."""
    t = text.lower()
    name = None
    for n in ["ayush", "ahana"]:
        if n in t:
            name = n
            break
    if not name:
        name = "ayush"  # default

    if re.search(r'\b(start|begin)\b', t):
        duration = 30  # default 30 min
        m = re.search(r'(\d+)\s*min', t)
        if m:
            duration = int(m.group(1))
        homework_timers[name] = {"start": time.time(), "duration_min": duration}
        return f"Started {name.capitalize()}'s homework timer for {duration} minutes. Good luck!"

    if re.search(r'\b(stop|end|finish|done)\b', t):
        if name in homework_timers:
            elapsed = (time.time() - homework_timers[name]["start"]) / 60
            del homework_timers[name]
            return f"Great job {name.capitalize()}! You studied for {int(elapsed)} minutes."
        return f"{name.capitalize()} doesn't have a homework timer running."

    if re.search(r'\b(how\s+(long|much)|remaining|left)\b', t):
        if name in homework_timers:
            elapsed = (time.time() - homework_timers[name]["start"]) / 60
            remaining = homework_timers[name]["duration_min"] - elapsed
            if remaining <= 0:
                return f"{name.capitalize()}'s homework time is up! Great effort."
            return f"{name.capitalize()} has {int(remaining)} minutes of homework time remaining."
        return f"{name.capitalize()} doesn't have a homework timer running."

    return None  # Not a timer command

# ─── Weather ─────────────────────────────────────────────────────────────────
weather_cache = {"data": None, "timestamp": 0}

def get_weather():
    """Get current weather for Sydney."""
    now = time.time()
    if weather_cache["data"] and now - weather_cache["timestamp"] < 1800:  # 30 min cache
        return weather_cache["data"]
    try:
        req = urllib.request.Request("https://wttr.in/Sydney?format=j1",
            headers={"User-Agent": "HomeNest/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            current = data.get("current_condition", [{}])[0]
            weather_cache["data"] = {
                "temp_c": current.get("temp_C", "?"),
                "feels_like": current.get("FeelsLikeC", "?"),
                "description": current.get("weatherDesc", [{}])[0].get("value", "Unknown"),
                "humidity": current.get("humidity", "?"),
                "wind_kmph": current.get("windspeedKmph", "?"),
                "precip_mm": current.get("precipMM", "0"),
            }
            weather_cache["timestamp"] = now
            return weather_cache["data"]
    except:
        return {"temp_c": "?", "description": "unavailable", "feels_like": "?", "humidity": "?", "wind_kmph": "?", "precip_mm": "0"}

def weather_response(text):
    """Generate weather voice response."""
    w = get_weather()
    t = text.lower()

    if re.search(r'\brain|umbrella|wet\b', t):
        rain = float(w.get("precip_mm", "0"))
        if rain > 0:
            return f"Yes, there's some rain in Sydney — about {w['precip_mm']}mm. Better grab an umbrella!"
        return f"No rain right now in Sydney. It's {w['temp_c']} degrees and {w['description'].lower()}."

    return f"It's currently {w['temp_c']} degrees in Sydney, feels like {w['feels_like']}. {w['description']}. Humidity is {w['humidity']}%."

# ─── Morning Briefing ────────────────────────────────────────────────────────
def morning_briefing():
    """Generate personalized morning briefing."""
    parts = []

    # Weather
    w = get_weather()
    parts.append(f"Good morning! It's {w['temp_c']} degrees in Sydney, {w['description'].lower()}.")
    if float(w.get("precip_mm", "0")) > 0:
        parts.append("Looks like rain today, so grab those umbrellas!")

    # Today's chores
    try:
        result = subprocess.run(["python3", FAMILY_MANAGER, "report"], capture_output=True, text=True, timeout=5)
        if result.stdout.strip():
            parts.append(result.stdout.strip().replace("\n", ". "))
    except:
        pass

    # Weather-aware suggestions
    temp = float(w.get("temp_c", "20"))
    if temp < 15:
        parts.append("It's a bit chilly — grab a jacket!")
    elif temp > 32:
        parts.append("It's a hot one — stay hydrated and wear sunscreen!")

    # Day of week fun
    day = date.today().strftime("%A")
    if day == "Friday":
        parts.append("It's Friday! Almost the weekend.")
    elif day == "Saturday":
        parts.append("It's Saturday — enjoy the day off!")
    elif day == "Monday":
        parts.append("Happy Monday — new week, fresh start!")

    return " ".join(parts)

# ─── Meal Planner ────────────────────────────────────────────────────────────
MEALS_FILE = os.path.join(CONFIG_DIR, "meals.json")

def get_meal_info(text):
    """Answer meal-related questions."""
    try:
        with open(MEALS_FILE) as f:
            data = json.load(f)
    except:
        return "I don't have a meal plan set up yet."

    t = text.lower()
    today = date.today().strftime("%A").lower()
    plans = data.get("plans", {})

    # "what's for dinner" / "what's for lunch"
    meal_type = "dinner"
    if "breakfast" in t:
        meal_type = "breakfast"
    elif "lunch" in t:
        meal_type = "lunch"

    # Check specific day
    day = today
    for d in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
        if d in t:
            day = d
            break
    if "tomorrow" in t:
        tomorrow = (date.today() + timedelta(days=1)).strftime("%A").lower()
        day = tomorrow

    if day in plans:
        meal = plans[day].get(meal_type, "nothing planned")
        return f"{meal_type.capitalize()} on {day.capitalize()} is {meal}."

    # Shopping list
    if re.search(r'\bshopping|grocery|groceries|list\b', t):
        items = data.get("shopping_list", [])
        if items:
            return "Shopping list: " + ", ".join(items[:10]) + ("... and more." if len(items) > 10 else ".")
        return "Shopping list is empty."

    return f"Today's {meal_type} is {plans.get(today, {}).get(meal_type, 'not planned yet')}."

# ─── Screen Time ─────────────────────────────────────────────────────────────
SCREEN_TIME_FILE = os.path.join(CONFIG_DIR, "screen_time.json")

def get_screen_time(text):
    """Answer screen time questions."""
    try:
        with open(SCREEN_TIME_FILE) as f:
            data = json.load(f)
    except:
        return "Screen time tracking isn't set up yet."

    t = text.lower()
    name = None
    for n in ["ayush", "ahana"]:
        if n in t:
            name = n
            break

    if not name:
        # Report both
        parts = []
        for kid in ["ayush", "ahana"]:
            info = data.get("kids", {}).get(kid, {})
            used = info.get("used_today_min", 0)
            limit = info.get("daily_limit_min", 120)
            remaining = max(0, limit - used)
            parts.append(f"{kid.capitalize()} has used {used} minutes and has {remaining} minutes left")
        return ". ".join(parts) + "."

    info = data.get("kids", {}).get(name, {})
    used = info.get("used_today_min", 0)
    limit = info.get("daily_limit_min", 120)
    remaining = max(0, limit - used)

    if remaining <= 0:
        return f"{name.capitalize()} has used all their screen time for today ({limit} minutes)."
    return f"{name.capitalize()} has used {used} minutes of screen time. {remaining} minutes remaining out of {limit}."

# ─── Emergency Mode ──────────────────────────────────────────────────────────
def handle_emergency(text):
    """Handle emergency alerts. Sends notification to parent via OpenClaw."""
    try:
        # Log the emergency
        log_activity("system", f"🚨 EMERGENCY: {text[:80]}", "emergency")

        # Send alert via OpenClaw (which will forward to Snehal via Telegram)
        messages = [{"role": "user", "content": f"EMERGENCY ALERT from HomeNest: A family member said: '{text}'. Send an immediate alert to Snehal via Telegram. This is urgent."}]
        call_openclaw(messages)
        return "I've sent an emergency alert to your dad right away. Stay calm, help is coming."
    except:
        return "I'm trying to reach your dad. Stay calm and stay safe."

# ─── Route Classification ────────────────────────────────────────────────────
HOME_PATTERNS = [
    r'\b(turn\s+(on|off)|switch\s+(on|off)|toggle)\b',
    r'\b(dim|brighten|set.*brightness|set.*temperature|set.*color)\b',
    r'\b(lock|unlock)\b',
    r'\b(open|close)\s+(the\s+)?(garage|door|gate|blind|curtain|cover|shade)\b',
    r'\b(what|which)\s+(lights?|switches?|devices?)\s+(are|is)\s+(on|off|open|closed)\b',
    r'\b(is\s+the\s+.+\s+(on|off|open|closed|locked|unlocked))\b',
    r'\b(set|change)\s+(the\s+)?(thermostat|temperature|fan\s+speed)\b',
    r'\b(start|stop|pause|play|next|previous|volume)\b.*\b(media|music|tv|speaker)\b',
]

AGENT_PATTERNS = [
    r'\b(remember|don\'t forget|note\s+that|save|add.*to.*list)\b',
    r'\b(check\s+my\s+(email|calendar|tasks|inbox))\b',
    r'\b(what.*todo|what.*outstanding|what.*tasks)\b',
    r'\b(search|look\s+up|find|research)\b',
    r'\b(schedule|remind\s+me|set.*reminder)\b',
    r'\b(send.*message|send.*email)\b',
]

CLOUD_PATTERNS = [
    r'\b(explain|describe|compare|analyze|why\s+does|how\s+does.*work)\b',
    r'\b(write|compose|draft|create.*story|create.*poem)\b',
    r'\b(translate|in\s+(french|spanish|hindi|german|chinese|japanese))\b',
    r'\b(summarize|summary)\b',
]

FAMILY_PATTERNS = [
    r'\b(chores?|assignment|bedtime)\b',
    r'\b(ayush|ahana)\b.*\b(done|finish|complete|did)\b',
    r'\b(who.*turn|whose\s+turn)\b',
    r'\b(allowance|reward|star|point|sticker)\b',
    r'\b(how\s+many\s+stars?)\b',
    r'\b(family\s+report|daily\s+report)\b',
    r'\b(mark.*done|mark.*complete)\b',
    r'\b(reward\s+shop|what\s+can\s+i\s+(get|buy|redeem))\b',
    r'\b(redeem|spend)\s+.*star',
]

# New feature patterns
PROFILE_PATTERNS = [
    r'\bthis\s+is\s+(snehal|ayush|ahana)\b',
    r'\b(switch|change)\s+(to\s+)?(parent|kid|child|guest)\s+mode\b',
    r'\bguest\s+mode\b',
]

BRIEFING_PATTERNS = [
    r'\bgood\s+morning\b',
    r'\bmorning\s+briefing\b',
    r'\bwhat.*today\b.*\blook\s+like\b',
]

WEATHER_PATTERNS = [
    r'\b(weather|temperature|forecast|rain|umbrella|cold|hot|warm)\b',
]

MEAL_PATTERNS = [
    r'\b(what.*for\s+(dinner|lunch|breakfast|tea))\b',
    r'\b(meal|menu|eat|food|cook|recipe)\b',
    r'\b(shopping\s+list|grocery|groceries)\b',
]

SCREEN_TIME_PATTERNS = [
    r'\bscreen\s*time\b',
    r'\b(ipad|tv|tablet)\s+(time|usage|limit)\b',
    r'\bhow\s+(long|much).*\b(watch|play|screen)\b',
]

HOMEWORK_TIMER_PATTERNS = [
    r'\bhomework\s+timer\b',
    r'\b(start|stop|begin|end|finish).*homework\b',
    r'\bhow\s+(long|much).*homework.*left\b',
]

EMERGENCY_PATTERNS = [
    r'\b(i\s+need\s+help|emergency|help\s+me|someone.*help)\b',
    r'\b(i\'m\s+scared|i\'m\s+hurt|something.*wrong)\b',
    r'\bcall.*help\b',
]

def classify_request(text):
    t = text.lower().strip()

    # Emergency — highest priority
    for p in EMERGENCY_PATTERNS:
        if re.search(p, t):
            return 'emergency'

    # Profile switching
    for p in PROFILE_PATTERNS:
        if re.search(p, t):
            return 'profile'

    # Morning briefing
    for p in BRIEFING_PATTERNS:
        if re.search(p, t):
            return 'briefing'

    # Home automation
    for p in HOME_PATTERNS:
        if re.search(p, t):
            return 'home'

    # Homework timer
    for p in HOMEWORK_TIMER_PATTERNS:
        if re.search(p, t):
            return 'homework_timer'

    # Family chores/rewards
    for p in FAMILY_PATTERNS:
        if re.search(p, t):
            return 'family'

    # Screen time
    for p in SCREEN_TIME_PATTERNS:
        if re.search(p, t):
            return 'screen_time'

    # Weather
    for p in WEATHER_PATTERNS:
        if re.search(p, t):
            return 'weather'

    # Meals
    for p in MEAL_PATTERNS:
        if re.search(p, t):
            return 'meal'

    # Agent tasks
    for p in AGENT_PATTERNS:
        if re.search(p, t):
            return 'agent'

    # Cloud (complex)
    for p in CLOUD_PATTERNS:
        if re.search(p, t):
            return 'cloud'

    # Default: local LLM
    return 'local'


# ─── System Prompts ──────────────────────────────────────────────────────────
VOICE_SYSTEM_ADULT = """You are HomeNest, a friendly family voice assistant in the Bhawan home in Sydney, Australia.
Keep responses concise — they'll be spoken aloud.
Family: Snehal (dad), Ayush (10), Ahana (6), Arlo (dog).
No markdown — just natural speech. Be warm and helpful."""

VOICE_SYSTEM_CHILD = """You are HomeNest, a friendly family assistant talking to a child.
Keep answers simple, educational, fun, and short (1-3 sentences).
Never discuss violence, drugs, alcohol, or adult topics.
If asked something inappropriate, say "That's a great question for your parents!"
No markdown — just natural speech."""

VOICE_SYSTEM_GUEST = """You are HomeNest, a voice assistant. A guest is speaking.
Be polite but limited. Don't share family information.
You can answer general questions and control basic devices (lights).
No markdown — just natural speech."""


# ─── API Callers ─────────────────────────────────────────────────────────────
def call_ha_conversation(text):
    req = urllib.request.Request(
        f"{HA_URL}/api/conversation/process",
        data=json.dumps({"text": text, "language": "en", "agent_id": "conversation.home_assistant"}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {HA_TOKEN}"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read())
        speech = result.get("response", {}).get("speech", {}).get("plain", {}).get("speech", "")
        return speech or "Done."

def call_local_llm(text, system_prompt=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": text})
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps({"model": LOCAL_MODEL, "messages": messages, "stream": False,
            "options": {"num_predict": 150, "temperature": 0.7}}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
        return result.get("message", {}).get("content", "Sorry, I couldn't process that.")

def call_openai_direct(text, system_prompt=None):
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": text})
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps({"model": "gpt-4o-mini", "messages": messages, "max_tokens": 300, "temperature": 0.7}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {OPENAI_KEY}"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read())
        return result.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, couldn't process that.")

def call_openclaw(messages):
    req = urllib.request.Request(
        OPENCLAW_URL,
        data=json.dumps({"model": "openclaw:main", "messages": messages, "user": "ha-voice-homenest"}).encode(),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {OPENCLAW_TOKEN}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())
        return result.get("choices", [{}])[0].get("message", {}).get("content", "Sorry, something went wrong.")


# ─── Family Command Handler ──────────────────────────────────────────────────
def handle_family_command(text):
    t = text.lower().strip()
    name = None
    for n in ["ayush", "ahana"]:
        if n in t:
            name = n
            break

    m = re.search(r'whose?\s+turn.*?(feed|set|clean|make|pack)', t)
    if m:
        return run_family_cmd(["chores", "whose-turn", m.group(1)])

    if re.search(r'\b(done|finish|complete|mark.*done|mark.*complete)\b', t) and name:
        for chore in ["homework", "bed", "feed", "pack", "clean", "dinner", "table"]:
            if chore in t:
                return run_family_cmd(["chores", "complete", name, chore])
        return run_family_cmd(["chores", "complete", name, "homework"])

    if re.search(r'\b(what|which).*chore', t):
        return run_family_cmd(["chores", "today", name] if name else ["chores", "today"])

    if re.search(r'\b(remaining|left|still|todo)\b', t):
        return run_family_cmd(["chores", "remaining", name] if name else ["chores", "remaining"])

    if re.search(r'\bstar', t) and name:
        if re.search(r'\b(redeem|spend|use)\b', t):
            # Try to extract what they want to redeem
            for reward_kw in ["screen", "movie", "bedtime", "ice cream", "park", "book", "friend", "skip", "dessert"]:
                if reward_kw in t:
                    return run_family_cmd(["stars", "redeem", name, reward_kw])
            return run_family_cmd(["stars", "shop", name])
        if re.search(r'\b(shop|store|rewards?)\b', t):
            return run_family_cmd(["stars", "shop", name])
        return run_family_cmd(["stars", "check", name])

    if "bedtime" in t:
        if name:
            return run_family_cmd(["bedtime", "check", name])
        return run_family_cmd(["bedtime", "check", "ayush"]) + " " + run_family_cmd(["bedtime", "check", "ahana"])

    if re.search(r'\b(report|summary)\b', t):
        return run_family_cmd(["report", name] if name else ["report"])

    return run_family_cmd(["chores", "today"])

def run_family_cmd(args):
    try:
        cmd = ["python3", FAMILY_MANAGER] + [a for a in args if a]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        output = result.stdout.strip()
        if not output:
            return "I couldn't find that information."
        return output.replace("⬜", "").replace("✅", "done:").replace("  ", " ").strip()
    except Exception as e:
        return f"Sorry, I had trouble checking that."


# ─── Response Formatting ─────────────────────────────────────────────────────
def ollama_response(content, elapsed=0):
    return json.dumps({
        "model": "openclaw",
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "message": {"role": "assistant", "content": content},
        "done": True, "done_reason": "stop",
        "total_duration": int(elapsed * 1e9),
        "prompt_eval_count": 10,
        "eval_count": max(1, len(content.split())),
        "eval_duration": int(elapsed * 1e9),
    }).encode()


# ─── HTTP Handler ────────────────────────────────────────────────────────────
class Handler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        cl = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(cl) if cl > 0 else b'{}'

        if self.path == "/api/pull":
            self._json_response(200, ndjson=True,
                data='{"status":"pulling manifest"}\n{"status":"success"}\n')
            return

        if self.path == "/api/show":
            self._ok({"modelfile": "FROM openclaw", "parameters": "",
                "template": "{{ .Prompt }}",
                "details": {"family": "openclaw", "parameter_size": "7B"},
                "model_info": {"general.architecture": "openclaw"}})
            return

        if self.path in ("/api/chat", "/v1/chat/completions"):
            data = json.loads(body)
            messages = data.get("messages", [])
            user_text = next((m["content"] for m in reversed(messages) if m.get("role") == "user"), "")

            is_child = current_profile.get("role") == "child"
            is_guest = current_profile.get("role") == "guest" or guest_mode
            who = current_profile.get("id", "default")

            # Kid safety check
            if is_child:
                safe, reason = is_kid_safe_request(user_text)
                if not safe:
                    content = "That's a great question for your mum or dad!" if reason == "topic" else \
                              "I can't do that — you'll need to ask a parent."
                    log_activity(who, f"Blocked ({reason}): {user_text[:50]}", "safety")
                    self._send_ollama_response(content, 0)
                    return

            # Guest restrictions
            if is_guest:
                # Guests can only do general Q&A and basic lights
                route = classify_request(user_text)
                if route not in ('local', 'cloud', 'home', 'weather'):
                    content = "Sorry, that feature isn't available in guest mode."
                    self._send_ollama_response(content, 0)
                    return

            route = classify_request(user_text)
            system_prompt = VOICE_SYSTEM_CHILD if is_child else (VOICE_SYSTEM_GUEST if is_guest else VOICE_SYSTEM_ADULT)
            start = time.time()

            try:
                if route == 'emergency':
                    print(f"[🚨 EMERGENCY] {user_text[:80]}", flush=True)
                    content = handle_emergency(user_text)

                elif route == 'profile':
                    switched, content = switch_profile(user_text)
                    print(f"[PROFILE] → {current_profile.get('name', '?')}", flush=True)

                elif route == 'briefing':
                    print(f"[BRIEFING]", flush=True)
                    content = morning_briefing()

                elif route == 'home':
                    if is_child and re.search(r'\b(unlock|disarm|open.*gate|open.*garage)\b', user_text.lower()):
                        content = "I can't do that — you'll need to ask a parent."
                    else:
                        print(f"[HOME] {user_text[:80]}", flush=True)
                        content = call_ha_conversation(user_text)

                elif route == 'homework_timer':
                    print(f"[TIMER] {user_text[:80]}", flush=True)
                    content = handle_homework_timer(user_text)
                    if not content:
                        content = call_local_llm(user_text, system_prompt)

                elif route == 'family':
                    print(f"[FAMILY] {user_text[:80]}", flush=True)
                    content = handle_family_command(user_text)

                elif route == 'screen_time':
                    print(f"[SCREEN] {user_text[:80]}", flush=True)
                    content = get_screen_time(user_text)

                elif route == 'weather':
                    print(f"[WEATHER] {user_text[:80]}", flush=True)
                    content = weather_response(user_text)

                elif route == 'meal':
                    print(f"[MEAL] {user_text[:80]}", flush=True)
                    content = get_meal_info(user_text)

                elif route == 'local':
                    print(f"[LOCAL] {user_text[:80]}", flush=True)
                    try:
                        content = call_local_llm(user_text, system_prompt)
                    except Exception as e:
                        print(f"  [LOCAL fallback→CLOUD] {e}", flush=True)
                        content = call_openai_direct(user_text, system_prompt)

                elif route == 'cloud':
                    print(f"[CLOUD] {user_text[:80]}", flush=True)
                    content = call_openai_direct(user_text, system_prompt)

                elif route == 'agent':
                    print(f"[AGENT] {user_text[:80]}", flush=True)
                    content = call_openclaw(messages)

                else:
                    content = call_local_llm(user_text, system_prompt)

            except Exception as e:
                print(f"[ERR {route}] {e}", flush=True)
                try:
                    content = call_openai_direct(user_text, system_prompt)
                except:
                    content = "Sorry, I had trouble with that."

            if is_child:
                content = filter_response_for_kids(content)

            elapsed = time.time() - start
            print(f"  → [{route.upper()}] {elapsed:.1f}s ({who})", flush=True)

            # Log activity
            log_activity(who, user_text[:80], route)

            self._send_ollama_response(content, elapsed)
            return

        if self.path == "/api/generate":
            data = json.loads(body)
            content = call_local_llm(data.get("prompt", ""), VOICE_SYSTEM_ADULT)
            self._ok({"model": "openclaw", "response": content, "done": True})
            return

        if self.path == "/api/embeddings":
            self._ok({"embedding": [0.0] * 384})
            return

        self._ok({"status": "ok"})

    def do_GET(self):
        if self.path in ("/api/tags", "/v1/models"):
            self._ok({"models": [{"name": "openclaw", "model": "openclaw",
                "size": 1000000, "digest": "openclaw",
                "details": {"family": "openclaw", "parameter_size": "7B"}}]})
        elif self.path == "/api/version":
            self._ok({"version": "0.6.2"})
        elif self.path == "/":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Ollama is running")
        else:
            self.send_response(200)
            self.end_headers()

    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()

    def _ok(self, obj):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(obj).encode())

    def _json_response(self, code, data="", ndjson=False):
        self.send_response(code)
        ct = "application/x-ndjson" if ndjson else "application/json"
        self.send_header("Content-Type", ct)
        self.end_headers()
        self.wfile.write(data.encode() if isinstance(data, str) else data)

    def _send_ollama_response(self, content, elapsed):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(ollama_response(content, elapsed))

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        urllib.request.urlopen(req, timeout=3)
        print(f"✓ Ollama ({LOCAL_MODEL}) at {OLLAMA_URL}", flush=True)
    except:
        print(f"⚠ Ollama not reachable — LOCAL falls back to CLOUD", flush=True)

    srv = http.server.HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"HomeNest Voice Proxy v4 on :{PORT}", flush=True)
    print(f"  Tiers: HOME | FAMILY | LOCAL | CLOUD | AGENT", flush=True)
    print(f"  Features: profiles, briefing, weather, meals, screen time,", flush=True)
    print(f"            homework timer, emergency, guest mode, activity log", flush=True)
    print(f"  Kid-safe filter: ON", flush=True)
    srv.serve_forever()
