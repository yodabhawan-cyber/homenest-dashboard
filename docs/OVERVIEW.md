# HomeNest System Overview

**The Digital Hearth** - A private, family-first AI voice assistant with personalized agents for each family member.

## What Is HomeNest?

HomeNest is a complete smart home voice assistant that gives each family member their own AI agent with unique personality, memory, and access controls. Think "Alexa for families, but with privacy and personalization."

## Core Innovations

1. **Per-Person AI Agents** - Each family member gets their own OpenClaw agent
2. **5-Tier Smart Routing** - Instant home automation, fast family queries, intelligent fallback
3. **Kid-Safe Architecture** - Age-appropriate content filtering and access controls
4. **Voice Profile Switching** - PIN-protected profiles via voice commands
5. **Web-Based Setup** - Zero command-line configuration needed
6. **Fully Distributable** - Ready to sell/white-label

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VOICE SATELLITE SPEAKER                      │
│                    (Voice PE / HA Compatible)                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOME ASSISTANT                              │
│  • Wake word detection (OK Nabu / Hey Yoda)                     │
│  • Sends audio to Whisper STT                                   │
│  • Receives text response → sends to TTS                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE PROXY (proxy_v4.py)                     │
│  Port: 11434 (pretends to be Ollama for HA)                    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │          5-TIER ROUTING SYSTEM                       │      │
│  │                                                       │      │
│  │  1. HOME (0.2s)    → HA direct (lights, climate)    │      │
│  │  2. FAMILY (0.05s) → Local JSON (chores, meals)     │      │
│  │  3. LOCAL (1s)     → Ollama phi4-mini (Q&A)         │      │
│  │  4. CLOUD (2s)     → OpenAI GPT-4o-mini (complex)   │      │
│  │  5. AGENT (5-8s)   → OpenClaw personal agents       │      │
│  │                                                       │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                  │
│  Current Profile: Determines which agent to route to            │
│  Safety Filters: Kid-safe content, guest restrictions           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERSONAL AI AGENTS                            │
│                   (OpenClaw Multi-Agent)                         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Snehal Agent │  │ Ayush Agent  │  │ Ahana Agent  │         │
│  │ Professional │  │ Playful      │  │ Sweet        │         │
│  │ Full access  │  │ Kid-safe     │  │ Kid-safe     │         │
│  │ Work email   │  │ School email │  │ Stories      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Each has own:                                                   │
│  • SOUL.md (personality)                                        │
│  • MEMORY.md (long-term memory)                                 │
│  • Workspace (private files)                                    │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         WEB DASHBOARD                            │
│                      (React + Vite)                              │
│  Port: 3100                                                      │
│                                                                  │
│  Pages:                                                          │
│  • /setup     - First-time configuration wizard                 │
│  • /          - Home (family status, climate, security)         │
│  • /shopping  - Shopping list                                   │
│  • /chores    - Chores & rewards                                │
│  • /meals     - Weekly meal planner                             │
│  • /activity  - Voice interaction log                           │
│  • /smarthome - Device controls                                 │
│  • /cameras   - Live camera feeds                               │
│  • /settings  - System configuration                            │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPPORT SERVICES                            │
│                                                                  │
│  • API Proxy (port 3200) - HA API proxy for dashboard          │
│  • Setup API (port 3201) - Setup wizard backend                │
│  • Whisper STT (port 10300) - Local speech-to-text            │
│  • Piper TTS (port 10200) - Local text-to-speech              │
│  • Ollama (port 11435) - Local LLM (phi4-mini)                │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Voice Proxy (`proxy_v4.py`)
- **What:** Python HTTP server that routes voice queries
- **Why:** Intelligent routing saves time/money, enables offline operation
- **How:** Analyzes query → picks fastest/cheapest tier → returns response
- **Port:** 11434 (mimics Ollama API for HA compatibility)

### 2. Personal AI Agents (OpenClaw workspaces)
- **What:** Separate AI agent per family member
- **Why:** Personalization, privacy, age-appropriate responses
- **How:** Each agent has own SOUL.md, MEMORY.md, workspace
- **Location:** `agents/[name]/workspace/`

### 3. Web Dashboard (React)
- **What:** Browser-based control panel
- **Why:** Easy family management, no command-line needed
- **How:** React SPA with API integrations
- **Port:** 3100

### 4. Setup Wizard (React + Node)
- **What:** Web-based first-time configuration
- **Why:** Non-technical users can install
- **How:** Step-by-step form → generates all configs
- **Ports:** 3100 (UI), 3201 (API)

### 5. Support APIs
- **API Proxy:** Proxies HA requests (keeps token server-side)
- **Setup API:** Handles configuration generation
- **Family Manager:** Python script for chores/rewards logic

## Data Flow Examples

### Example 1: "Turn on kitchen lights" (HOME tier, 0.2s)

```
Voice → HA → Whisper STT → Voice Proxy
                              │
                              ├─ Classify: HOME tier
                              ├─ Parse: "kitchen" + "lights" + "on"
                              ├─ Call HA API directly
                              └─ Return: "Kitchen lights on"
                                   │
                                   └─> Piper TTS → Speaker
```

### Example 2: "What chores does Ayush have?" (FAMILY tier, 0.05s)

```
Voice → HA → Whisper STT → Voice Proxy
                              │
                              ├─ Classify: FAMILY tier
                              ├─ Current Profile: Snehal (parent, can see all)
                              ├─ Run: python3 family_manager.py chores today ayush
                              ├─ Read: config/chores.json
                              └─ Return: "Ayush has 3 chores: make bed, homework, clean room"
                                   │
                                   └─> Piper TTS → Speaker
```

### Example 3: "Check my email" as Ayush (AGENT tier, 5-8s)

```
Voice: "This is Ayush 1-2-3" → Voice Proxy
                                  │
                                  ├─ Verify PIN (123 matches)
                                  ├─ Switch profile to Ayush
                                  └─ Return: "Hi Ayush!"

Voice: "Check my email" → Voice Proxy
                            │
                            ├─ Classify: AGENT tier (email = complex)
                            ├─ Current Profile: Ayush (child, age 10)
                            ├─ Route to: openclaw:ayush agent
                            │    │
                            │    └─ OpenClaw Agent (Ayush's workspace)
                            │         ├─ Read: SOUL.md (playful, kid-safe)
                            │         ├─ Read: MEMORY.md (knows Ayush's context)
                            │         ├─ Access: School emails only (filtered)
                            │         ├─ Block: Parent emails, work stuff
                            │         └─ Return: "You have 2 emails from school..."
                            │
                            └─ Filter response for kid-safety
                                 │
                                 └─> ElevenLabs (Charlotte voice) → Speaker
```

## Technology Stack

**Backend:**
- Python 3.9+ (Voice proxy, family manager)
- Node.js 18+ (API proxies, setup wizard)
- OpenClaw Gateway (Multi-agent orchestration)

**Frontend:**
- React 19
- Vite 8
- Tailwind CSS 4
- React Router 7

**AI/ML:**
- OpenAI GPT-4o-mini (cloud tier)
- Ollama phi4-mini (local tier)
- Whisper (speech-to-text)
- Piper / ElevenLabs (text-to-speech)

**Smart Home:**
- Home Assistant
- RTSP cameras (Reolink)
- Z-Wave/Zigbee devices

**Storage:**
- JSON files (config, chores, meals, profiles)
- SQLite (future: shopping, calendar)
- Markdown files (agent memories, SOUL.md)

## Security Model

**API Keys:**
- Stored in `.env` (not in git)
- Never exposed to client-side
- Proxied through backend APIs

**Data Isolation:**
- Each agent has separate workspace
- Kids can't access parent data
- Siblings can't see each other's private info
- Shared data: chores, meals, home status

**Voice Security:**
- PIN-protected profile switching
- Guest mode (restricted access)
- Activity logging (parent audit trail)

**Content Filtering:**
- Age-based restrictions (toddler → teen → adult)
- Block list for dangerous/inappropriate topics
- Response filtering for kid profiles

## Deployment Modes

**Development:**
```bash
npm run dev  # Dashboard with HMR
python3 proxy_v4.py  # Voice proxy
node dashboard/setup-api.js  # Setup API
```

**Production:**
- systemd/launchd services (auto-start on boot)
- Built dashboard (static files)
- PM2 for Node.js processes
- Docker Compose (future)

**Distribution:**
- Git clone → npm install → setup wizard
- Pre-built packages (macOS .app, Linux .deb)
- Docker image
- NPM global package

## Current State (v1.0.0)

✅ **Complete & Working:**
- Voice proxy with 5-tier routing
- Per-person AI agents
- Web-based setup wizard
- Family features (chores, meals, screen time)
- Home Assistant integration
- Dashboard (all pages functional)
- Distribution-ready package

🚧 **In Progress:**
- Custom wake word ("Hey Yoda")
- Voice PE satellite setup
- Auto OpenClaw config merge

📋 **Planned:**
- Docker packaging
- NPM global install
- Mobile app
- Voice cloning
- Multi-language support

## Key Files to Understand

Start with these files to understand the system:

1. **proxy_v4.py** - Voice routing brain
2. **dashboard/src/pages/Setup.jsx** - Setup wizard UI
3. **dashboard/setup-api.js** - Setup backend
4. **config/profiles.json** - Family member definitions
5. **agents/[name]/workspace/SOUL.md** - Agent personalities

## Development Workflow

To continue development:

1. Read this OVERVIEW.md
2. Review FILE_STRUCTURE.md for file locations
3. Check COMPONENTS.md for component details
4. Reference API_REFERENCE.md for endpoints
5. Follow DEVELOPMENT.md for contribution guidelines

## Questions for Next Developer

When picking up this project, ask yourself:

- What feature am I adding?
- Which tier does it belong to? (HOME/FAMILY/LOCAL/CLOUD/AGENT)
- Does it need to be per-person or shared?
- What config files need updating?
- How does it affect the setup wizard?
- Is it kid-safe by default?

## Contact & Support

- **GitHub:** https://github.com/yodabhawan-cyber/homenest-dashboard
- **Original Developer:** Yoda (OpenClaw) 🐸
- **Client:** Snehal Bhawan
- **Built:** March 2026

---

**Next:** Read FILE_STRUCTURE.md to understand where everything lives.
