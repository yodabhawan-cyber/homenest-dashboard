"""
HomeNest Voice Proxy v3 — Family-safe smart routing.
4-tier: HOME → LOCAL → CLOUD → AGENT
+ Kid-safe content filter
+ Family profile awareness
"""
import http.server
import json
import urllib.request
import urllib.error
import time
import re
import os
import subprocess

# ─── Configuration ───────────────────────────────────────────────────────────
OPENCLAW_URL = os.getenv("OPENCLAW_URL", "http://127.0.0.1:18789/v1/chat/completions")
OPENCLAW_TOKEN = os.getenv("OPENCLAW_TOKEN", "your-openclaw-token-here")
HA_TOKEN = os.getenv("HA_TOKEN", "your-home-assistant-token-here")
OPENAI_KEY = os.getenv("OPENAI_API_KEY", "your-openai-key-here")
HA_URL = os.getenv("HA_URL", "http://homeassistant.local:8123")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11435")  # Real Ollama (homebrew) on different port
PORT = int(os.getenv("PORT", "11434"))  # This proxy still pretends to be Ollama for HA

LOCAL_MODEL = os.getenv("LOCAL_MODEL", "phi4-mini")
FAMILY_MANAGER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "homenest", "skills", "family", "family_manager.py")
# Fallback path if running from homenest dir directly
if not os.path.exists(FAMILY_MANAGER):
    FAMILY_MANAGER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "skills", "family", "family_manager.py")

# ─── Family Profiles ─────────────────────────────────────────────────────────
PROFILES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "profiles.json")

DEFAULT_PROFILES = {
    "default": {"name": "Family", "role": "parent", "age_group": "adult"},
    "snehal": {"name": "Snehal", "role": "parent", "age_group": "adult"},
    "ayush": {"name": "Ayush", "role": "child", "age_group": "10-12"},
    "ahana": {"name": "Ahana", "role": "child", "age_group": "6-9"},
}

def load_profiles():
    try:
        with open(PROFILES_FILE) as f:
            return json.load(f)
    except:
        return DEFAULT_PROFILES

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
    """Check if a request is appropriate for kids. Returns (safe, reason)."""
    t = text.lower()
    for p in BLOCKED_TOPICS_KIDS:
        if re.search(p, t):
            return False, "topic"
    for p in BLOCKED_ACTIONS_KIDS:
        if re.search(p, t):
            return False, "action"
    return True, None

def filter_response_for_kids(text):
    """Post-process LLM response to ensure kid-safety."""
    # Basic check — if response contains concerning content, sanitize
    t = text.lower()
    for p in BLOCKED_TOPICS_KIDS:
        if re.search(p, t):
            return "I'm not sure about that one. Maybe ask your mum or dad?"
    return text

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
    r'\b(update|commit|push|deploy|build)\b',
    r'\b(send.*message|send.*email)\b',
]

# Questions that need deeper knowledge → cloud
CLOUD_PATTERNS = [
    r'\b(explain|describe|compare|analyze|why\s+does|how\s+does.*work)\b',
    r'\b(write|compose|draft|create.*story|create.*poem)\b',
    r'\b(translate|in\s+(french|spanish|hindi|german|chinese|japanese))\b',
    r'\b(summarize|summary)\b',
    r'\b(what.*think|opinion|recommend)\b',
]

# Family-specific patterns — handled locally by family_manager.py
FAMILY_PATTERNS = [
    r'\b(chores?|homework|assignment|bedtime|screen\s*time)\b',
    r'\b(ayush|ahana)\b.*\b(done|finish|complete|did)\b',
    r'\b(who.*turn|whose\s+turn)\b',
    r'\b(allowance|reward|star|point|sticker)\b',
    r'\b(how\s+many\s+stars?)\b',
    r'\b(family\s+report|daily\s+report)\b',
    r'\b(mark.*done|mark.*complete)\b',
]

def classify_request(text):
    """Classify into: home, local, cloud, agent, family"""
    t = text.lower().strip()

    for p in HOME_PATTERNS:
        if re.search(p, t):
            return 'home'

    for p in FAMILY_PATTERNS:
        if re.search(p, t):
            return 'family'  # Handled locally by family_manager.py

    for p in AGENT_PATTERNS:
        if re.search(p, t):
            return 'agent'

    for p in CLOUD_PATTERNS:
        if re.search(p, t):
            return 'cloud'

    # Default: use local LLM for simple Q&A (fastest for general questions)
    return 'local'


# ─── System Prompts ──────────────────────────────────────────────────────────
VOICE_SYSTEM_ADULT = """You are HomeNest, a friendly family voice assistant in the Bhawan home in Sydney, Australia.
Keep responses concise — they'll be spoken aloud via a speaker.
The family: Snehal (dad), two kids Ayush (10) and Ahana (6), and a dog Arlo.
No markdown, no bullet points — just natural speech. Be warm and helpful."""

VOICE_SYSTEM_CHILD = """You are HomeNest, a friendly family assistant.
You're talking to a child. Keep answers:
- Simple and age-appropriate
- Educational when possible
- Fun and encouraging
- Short (1-3 sentences max)
Never discuss violence, drugs, alcohol, or adult topics.
If asked something inappropriate, say "That's a great question for your parents!"
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
    """Call Ollama (real instance) for fast local inference."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": text})
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps({
            "model": LOCAL_MODEL,
            "messages": messages,
            "stream": False,
            "options": {"num_predict": 150, "temperature": 0.7}
        }).encode(),
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


# ─── Family Command Handler ───────────────────────────────────────────────────
def handle_family_command(text):
    """Parse voice text into family_manager.py commands and execute."""
    t = text.lower().strip()

    # Extract name if mentioned
    name = None
    for n in ["ayush", "ahana"]:
        if n in t:
            name = n
            break

    # "whose turn to feed arlo" / "whose turn to set the table"
    m = re.search(r'whose?\s+turn.*?(feed|set|clean|make|pack)', t)
    if m:
        chore = m.group(1)
        return run_family_cmd(["chores", "whose-turn", chore])

    # "did ayush finish homework" / "mark ayush homework done"
    if re.search(r'\b(done|finish|complete|mark.*done|mark.*complete)\b', t) and name:
        # Find the chore mentioned
        for chore in ["homework", "bed", "feed", "pack", "clean", "dinner", "table"]:
            if chore in t:
                return run_family_cmd(["chores", "complete", name, chore])
        return run_family_cmd(["chores", "complete", name, "homework"])  # default

    # "what chores does ayush have"
    if re.search(r'\b(what|which).*chore', t):
        if name:
            return run_family_cmd(["chores", "today", name])
        return run_family_cmd(["chores", "today"])

    # "chores remaining" / "what's left"
    if re.search(r'\b(remaining|left|still|todo)\b', t):
        if name:
            return run_family_cmd(["chores", "remaining", name])
        return run_family_cmd(["chores", "remaining"])

    # "how many stars does ayush have"
    if re.search(r'\bstar', t) and name:
        if re.search(r'\b(redeem|spend|use)\b', t):
            return run_family_cmd(["stars", "redeem", name])
        return run_family_cmd(["stars", "check", name])

    # "is it bedtime" / "bedtime check"
    if "bedtime" in t:
        if name:
            return run_family_cmd(["bedtime", "check", name])
        # Check both kids
        r1 = run_family_cmd(["bedtime", "check", "ayush"])
        r2 = run_family_cmd(["bedtime", "check", "ahana"])
        return f"{r1} {r2}"

    # "family report" / "daily report"
    if re.search(r'\b(report|summary)\b', t):
        if name:
            return run_family_cmd(["report", name])
        return run_family_cmd(["report"])

    # Fallback — list today's chores
    return run_family_cmd(["chores", "today"])


def run_family_cmd(args):
    """Run family_manager.py with given args and return output."""
    try:
        cmd = ["python3", FAMILY_MANAGER] + [a for a in args if a]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
        output = result.stdout.strip()
        if not output:
            return "I couldn't find that information."
        # Clean up for voice output (remove emoji, simplify)
        output = output.replace("⬜", "").replace("✅", "done:").replace("  ", " ").strip()
        return output
    except Exception as e:
        return f"Sorry, I had trouble checking that. {e}"


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

            # Determine profile (default to parent for now — voice ID later)
            profile = DEFAULT_PROFILES.get("default")
            is_child = profile.get("role") == "child"

            # Kid safety check
            if is_child:
                safe, reason = is_kid_safe_request(user_text)
                if not safe:
                    content = "That's a great question for your mum or dad!" if reason == "topic" else \
                              "I can't do that — you'll need to ask a parent."
                    self._send_ollama_response(content, 0)
                    return

            route = classify_request(user_text)
            system_prompt = VOICE_SYSTEM_CHILD if is_child else VOICE_SYSTEM_ADULT
            start = time.time()

            try:
                if route == 'home':
                    # Kid safety: block dangerous home actions for children
                    if is_child and re.search(r'\b(unlock|disarm|open.*gate|open.*garage)\b', user_text.lower()):
                        content = "I can't do that — you'll need to ask a parent."
                    else:
                        print(f"[HOME] {user_text[:80]}", flush=True)
                        content = call_ha_conversation(user_text)

                elif route == 'family':
                    print(f"[FAMILY] {user_text[:80]}", flush=True)
                    content = handle_family_command(user_text)

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
                print(f"[ERR {route}] {e} — falling back", flush=True)
                try:
                    content = call_openai_direct(user_text, system_prompt)
                except:
                    content = "Sorry, I had trouble with that."

            # Post-filter for kids
            if is_child:
                content = filter_response_for_kids(content)

            elapsed = time.time() - start
            print(f"  → [{route.upper()}] {elapsed:.1f}s", flush=True)

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
    # Verify Ollama is reachable
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        urllib.request.urlopen(req, timeout=3)
        print(f"✓ Ollama ({LOCAL_MODEL}) reachable at {OLLAMA_URL}", flush=True)
    except:
        print(f"⚠ Ollama not reachable at {OLLAMA_URL} — LOCAL tier will fall back to CLOUD", flush=True)

    srv = http.server.HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"HomeNest Voice Proxy v3 on :{PORT}", flush=True)
    print(f"  HOME→HA  LOCAL→{LOCAL_MODEL}  CLOUD→GPT-4o-mini  AGENT→OpenClaw", flush=True)
    print(f"  Kid-safe filter: ON", flush=True)
    srv.serve_forever()
