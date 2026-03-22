# HomeNest Quick Reference Card

One-page cheat sheet for developers and AI agents.

## 🎯 What Is HomeNest?

Family AI voice assistant with per-person agents. Each family member gets their own AI with unique personality and memory.

## 📁 Critical Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `proxy_v4.py` | Voice routing brain | Adding voice commands |
| `dashboard/src/pages/Setup.jsx` | Setup wizard UI | Changing onboarding |
| `dashboard/setup-api.js` | Setup backend | Config generation logic |
| `config/profiles.json` | Family definitions | Adding/editing members |
| `agents/*/workspace/SOUL.md` | Agent personalities | Changing behavior |
| `.env` | API keys | Never commit! |

## 🔀 5-Tier Routing

```
Query → Classify → Route:

HOME (0.2s)   → HA direct        → "Turn on lights"
FAMILY (0.05s)→ Local JSON       → "What chores do I have?"
LOCAL (1s)    → Ollama phi4      → "What is photosynthesis?"
CLOUD (2s)    → OpenAI GPT       → "Explain quantum physics"
AGENT (5-8s)  → OpenClaw + Agent → "Check my email"
```

## 🚪 Ports

| Service | Port | Command |
|---------|------|---------|
| Dashboard | 3100 | `cd dashboard && npm run dev` |
| API Proxy | 3200 | `node dashboard/api-proxy.js` |
| Setup API | 3201 | `node dashboard/setup-api.js` |
| Voice Proxy | 11434 | `python3 proxy_v4.py` |
| OpenClaw | 18789 | External service |

## 🔑 Key Functions

**Voice Proxy (`proxy_v4.py`):**
```python
classify_request(text)      # → 'home'|'family'|'local'|'cloud'|'agent'
switch_profile(text)        # Handle "This is Ayush 1-2-3"
call_openclaw(msgs, profile) # Route to personal agent
is_kid_safe_request(text)  # Content filtering
```

**Setup API (`dashboard/setup-api.js`):**
```javascript
testOpenAI(apiKey)           // Test connection
createAgentWorkspaces(members) // Generate agents
writeEnvFile(config)         // Create .env
```

## 📝 Adding Features

### New Voice Command
1. Edit `proxy_v4.py` → `classify_request()` - add pattern
2. Add handler function
3. Test: `curl -X POST http://localhost:11434/api/chat -d '{...}'`

### New Dashboard Page
1. Create `dashboard/src/pages/NewPage.jsx`
2. Add route in `dashboard/src/App.jsx`
3. Add nav item
4. Test: http://localhost:3100/newpage

### New Family Feature
1. Create `config/feature.json`
2. Add CLI in `skills/family/family_manager.py` (optional)
3. Add voice patterns in `proxy_v4.py`
4. Add dashboard page

## 🐛 Debugging

**Voice Proxy:**
```bash
# Add to proxy_v4.py
DEBUG = True
print(f"[DEBUG] {variable}")

# Check logs
tail -f logs/voice-proxy.log
```

**Dashboard:**
```bash
# Browser console
console.log('Debug:', data)

# Network tab
# Check /api/* requests

# React DevTools
# Inspect component state
```

**API Testing:**
```bash
# Voice proxy
curl -X POST http://localhost:11434/api/chat \
  -d '{"model":"openclaw","messages":[{"role":"user","content":"test"}]}'

# HA proxy
curl http://localhost:3200/api/states

# Setup API
curl http://localhost:3201/api/setup/status
```

## 📊 Data Flow

```
Voice → HA → Whisper STT → Voice Proxy
                              │
                    ┌─────────┼─────────┐
                HOME    FAMILY    AGENT
                 │        │         │
                HA       JSON    OpenClaw
                                    │
                            Personal Agent
                            (SOUL.md + MEMORY.md)
                                    │
                                 Response
                                    │
                            Piper/ElevenLabs
                                    │
                                 Speaker
```

## 🔒 Security Checklist

- [ ] `.env` in `.gitignore`
- [ ] No secrets in code
- [ ] Kid-safe filtering enabled
- [ ] Input sanitization
- [ ] API keys server-side only

## 🚀 Deployment Steps

1. `git pull`
2. `cp .env.example .env` → fill in keys
3. `cd dashboard && npm install && npm run build`
4. Configure systemd/launchd services
5. `python3 proxy_v4.py`
6. Test: http://localhost:3100

## 📦 Git Workflow

```bash
# Feature branch
git checkout -b feature/name

# Commit
git commit -m "feat: description"

# Push
git push origin feature/name

# Types: feat|fix|docs|style|refactor|test|chore
```

## 🎨 UI Customization

**Colors** (`dashboard/src/index.css`):
```css
:root {
  --accent-orange: #ff6b35;  /* Primary */
  --accent-purple: #a855f7;  /* Secondary */
  --bg-primary: #0a0e1a;     /* Dark */
}
```

**Components:**
```jsx
<div className="glass-card p-6">
  <div style={{ background: 'var(--accent-orange)' }}>
    Content
  </div>
</div>
```

## 🧪 Testing

**Manual:**
- [ ] Voice commands (all tiers)
- [ ] Profile switching
- [ ] Setup wizard (fresh install)
- [ ] Dashboard pages
- [ ] Kid-safe filtering

**Automated (future):**
```bash
npm test           # Jest (frontend)
pytest tests/      # Python tests
playwright test    # E2E tests
```

## 📞 Quick Help

**Issue:** Voice proxy not routing correctly
→ Check `current_profile` state, verify `classify_request()` logic

**Issue:** Dashboard not loading data
→ Check API proxy running (3200), verify HA connection, browser console

**Issue:** Setup wizard fails
→ Check setup API logs, verify API keys valid, ensure write permissions

**Issue:** Kid queries getting adult content
→ Check `is_kid_safe_request()`, verify `current_profile.role === 'child'`

## 📚 Documentation

| Doc | Read When |
|-----|-----------|
| OVERVIEW.md | Understanding architecture |
| FILE_STRUCTURE.md | Finding files |
| COMPONENTS.md | Component details |
| API_REFERENCE.md | API endpoints |
| DEVELOPMENT.md | Adding features |

## 💡 Remember

✅ Update docs when changing code  
✅ Test setup wizard on clean machine  
✅ Never commit `.env`  
✅ Kids can't access parent data  
✅ Each person has own agent  

---

**Stuck? → Read [HANDOFF_SUMMARY.md](HANDOFF_SUMMARY.md)**  
**New? → Start with [OVERVIEW.md](OVERVIEW.md)**

---

*Print this page and keep it handy!* 📄
