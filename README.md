# 🏠 HomeNest — Family AI Voice Assistant

A private, family-first AI voice assistant built on Home Assistant + OpenClaw. Designed for households with kids — featuring voice profiles, chore tracking, screen time management, and kid-safe content filtering.

**Built for the Bhawan family. Designed to be sellable.**

## Architecture

```
Voice PE Speaker → HA (wake word) → Mac mini STT (Whisper)
                                          ↓
                                   Voice Proxy v4
                                   ┌─────────────┐
                                   │  5 Tiers:    │
                                   │  HOME → HA   │  ~0.2s (lights, devices)
                                   │  FAMILY      │  ~0.05s (chores, stars, bedtime)
                                   │  LOCAL → φ4  │  ~1s (general Q&A, local LLM)
                                   │  CLOUD → GPT │  ~2s (complex questions)
                                   │  AGENT → OC  │  ~5-8s (email, calendar, tasks)
                                   └──────┬───────┘
                                          ↓
                                   TTS (Piper local / ElevenLabs cloud)
                                          ↓
                                   Voice PE Speaker
```

## ✨ Key Feature: Per-Person AI Agents

Each family member gets their **own personalized AI agent** that:
- **Learns individually** — Remembers YOUR preferences, patterns, and context
- **Adapts personality** — Kids get playful & educational, adults get professional & efficient
- **Protects privacy** — Kids can't access parent emails, siblings can't snoop
- **Matches voice** — Different voice per person (Charlotte for kids, Piper for adults)
- **Persists memory** — Each agent builds its own long-term memory over time

**Example:** When Ayush asks "Check my email" → Routes to Ayush's agent → Only shows school emails (kid-safe filtered). When Dad asks the same thing → Routes to Dad's agent → Full work email access.

## Features

### Voice Features (via Proxy v4)
- **Per-person AI agents** — Each family member has their own AI with unique personality & memory
- **5-tier smart routing** — instant for home/family, local LLM for general, cloud for complex
- **Voice profile switching** — "This is Ayush 1-2-3" with PIN verification
- **Morning briefing** — "Good morning" → weather + chores + schedule
- **Weather** — Live Sydney weather with 30min cache
- **Meal planner** — "What's for dinner?" reads weekly plan
- **Screen time tracker** — Per-kid usage and limits
- **Homework timer** — Start/stop/check countdown timers
- **Chore & reward system** — Complete chores → earn stars → redeem rewards
- **Reward shop** — "What can I redeem?" / "Redeem stars for ice cream"
- **Emergency mode** — "I need help!" → instant alert to parent via Telegram
- **Guest mode** — Restricted access for visitors
- **Kid-safe filter** — Blocks inappropriate content and dangerous actions
- **Activity logging** — Every interaction logged for parent audit trail

### Dashboard (React + Vite + Tailwind CSS 4)
- **Home** — Family status, weather, briefing, emergency button, guest mode
- **Chores** — Per-kid chore lists with completion tracking, homework timers
- **Profiles** — Family member management
- **Smart Home** — All HA lights with working toggle switches, grouped by room
- **Cameras** — Live RTSP snapshots from 11 Reolink cameras with motion detection
- **Activity Log** — Timeline of all voice interactions, color-coded by tier
- **Calendar** — Weekly family events view
- **Meal Planner** — Editable weekly meal grid + shopping list
- **Screen Time** — Per-kid usage dashboards with weekly charts
- **Settings** — Voice profiles, PINs, guest mode, email parser config

### Integrations
- **Home Assistant** — Full entity control (51 lights, 12 cameras, media players)
- **OpenClaw** — Email, calendar, task management via voice
- **ElevenLabs** — Character voices per room (Charlotte for kids' rooms)
- **Piper** — Free local TTS for default rooms
- **Whisper** — Local STT on Mac mini (small model)
- **Ollama/phi4-mini** — Local LLM for general questions
- **Gmail** — School email parser (School Bytes, HeyGuru)

## Services (all auto-start on boot via launchd)

| Service | Port | Launchd Label |
|---------|------|---------------|
| Voice Proxy v4 | 11434 | com.openclaw.voice-proxy |
| Whisper STT | 10300 | com.openclaw.wyoming-whisper |
| Piper TTS | 10200 | com.openclaw.wyoming-piper |
| Ollama (phi4-mini) | 11435 | com.homenest.ollama |
| Dashboard API Proxy | 3200 | com.homenest.api-proxy |
| Dashboard Dev | 3100 | (manual) |

## Directory Structure

```
homenest/
├── proxy_v4.py              # Voice proxy (5-tier routing)
├── config/
│   ├── profiles.json        # Family profiles + PINs
│   ├── chores.json          # Chore definitions + completions
│   ├── rewards.json         # Reward shop items + redemptions
│   ├── meals.json           # Weekly meal plans
│   ├── screen_time.json     # Screen time limits + usage
│   ├── calendar.json        # Family events
│   ├── activity_log.json    # Voice interaction log
│   └── voices.json          # Per-room TTS voice config
├── skills/
│   ├── family/
│   │   ├── SKILL.md
│   │   └── family_manager.py
│   └── school_email/
│       └── parser.py
├── dashboard/
│   ├── api-proxy.js         # HA API proxy (port 3200)
│   ├── src/pages/           # React pages
│   └── ...
└── logs/
```

## Quick Start

```bash
# All services auto-start on boot. To manually restart:
launchctl stop com.openclaw.voice-proxy && launchctl start com.openclaw.voice-proxy
launchctl stop com.homenest.api-proxy && launchctl start com.homenest.api-proxy

# Dashboard
cd homenest/dashboard && npm run dev -- --port 3100

# Test voice proxy
curl -s http://127.0.0.1:11434/api/chat \
  -d '{"model":"openclaw","messages":[{"role":"user","content":"What chores does Ayush have?"}],"stream":false}'
```

## Performance

| Query Type | Latency | Example |
|-----------|---------|---------|
| Family (chores/stars) | 0.05s | "How many stars does Ayush have?" |
| Weather (cached) | 0.00s | "What's the weather?" |
| Meals/Screen time | 0.00s | "What's for dinner?" |
| Home automation | 0.2s | "Turn on the kitchen light" |
| Local LLM | 0.7-1.4s | "What is photosynthesis?" |
| Cloud (GPT-4o-mini) | 1.5-2s | "Explain gravity" |
| Agent (OpenClaw) | 5-8s | "Check my email" |

## Future Plans
- [ ] Per-room voice (ElevenLabs for kids' rooms, Piper everywhere else)
- [ ] Custom "Hey Yoda" wake word
- [ ] Screen time integration with real device tracking
- [ ] School email auto-parser (live Gmail integration)
- [ ] Family calendar sync
- [ ] HomeNest subscription product ($10-15/month)
