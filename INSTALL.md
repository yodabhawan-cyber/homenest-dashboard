# 🏠 HomeNest Installation Guide

Complete setup guide for deploying HomeNest to a new family.

## Prerequisites

- **Hardware:**
  - Mac mini / Linux server / Raspberry Pi 4+ (4GB+ RAM recommended)
  - Voice PE satellite speaker (or Home Assistant compatible smart speaker)
  - (Optional) Home Assistant Green / server

- **Software:**
  - macOS 12+ / Ubuntu 20.04+ / Debian 11+
  - Python 3.9+
  - Node.js 18+
  - OpenClaw Gateway installed

- **Accounts:**
  - OpenAI API key (for cloud fallback)
  - (Optional) ElevenLabs API key (for character voices)
  - Home Assistant long-lived access token

## Step 1: Clone Repository

```bash
git clone https://github.com/yodabhawan-cyber/homenest-dashboard.git
cd homenest-dashboard
```

## Step 2: Run Setup Wizard

```bash
python3 setup-wizard.py
```

This will:
1. Ask for family member names, ages, personalities
2. Generate PINs for voice profile switching
3. Create personalized OpenClaw agent workspaces
4. Generate configuration files

## Step 3: Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in:
```bash
OPENCLAW_TOKEN=your-openclaw-gateway-token
HA_TOKEN=your-home-assistant-token
OPENAI_API_KEY=your-openai-key
```

## Step 4: Configure OpenClaw Agents

The wizard will output an OpenClaw configuration. Add it to `~/.openclaw/openclaw.json`:

```json
{
  "agents": {
    "list": [
      {
        "id": "snehal",
        "name": "Snehal's Assistant",
        "workspace": "/path/to/homenest/agents/snehal/workspace",
        "model": {
          "primary": "openai/gpt-4o-mini"
        }
      },
      {
        "id": "ayush",
        "name": "Ayush's Learning Companion",
        "workspace": "/path/to/homenest/agents/ayush/workspace",
        "model": {
          "primary": "openai/gpt-4o-mini"
        }
      }
      // ... more agents
    ]
  }
}
```

Then restart OpenClaw Gateway:
```bash
openclaw gateway restart
```

## Step 5: Install Dashboard

```bash
cd dashboard
npm install
npm run build
```

## Step 6: Install Services (Auto-start on boot)

### macOS (launchd)

```bash
# Voice Proxy
sudo cp launchd/com.homenest.voice-proxy.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.homenest.voice-proxy.plist

# Dashboard API Proxy
sudo cp launchd/com.homenest.api-proxy.plist /Library/LaunchDaemons/
sudo launchctl load /Library/LaunchDaemons/com.homenest.api-proxy.plist
```

### Linux (systemd)

```bash
# Voice Proxy
sudo cp systemd/homenest-voice-proxy.service /etc/systemd/system/
sudo systemctl enable homenest-voice-proxy
sudo systemctl start homenest-voice-proxy

# Dashboard API Proxy
sudo cp systemd/homenest-api-proxy.service /etc/systemd/system/
sudo systemctl enable homenest-api-proxy
sudo systemctl start homenest-api-proxy
```

## Step 7: Configure Home Assistant

### Add Voice Assistant Pipeline

1. Go to Settings → Voice Assistants
2. Create new pipeline:
   - **Name:** HomeNest
   - **Conversation Agent:** Extended OpenAI Conversation
   - **STT:** Whisper (local)
   - **TTS:** Piper (local) or ElevenLabs
   - **Wake word:** OK Nabu (or custom)

### Configure Extended OpenAI Conversation

Settings → Devices & Services → Extended OpenAI Conversation:
- **Base URL:** `http://localhost:11434/v1`
- **API Key:** (leave blank or use placeholder)
- **Model:** `openclaw`

## Step 8: Test Voice Profiles

Say to your speaker:
- "This is Snehal" → Should greet you by name
- "This is Ayush 1-2-3" → Should require PIN verification
- "What chores do I have?" → Should show personalized chores

Each person's queries now route to their own AI agent!

## Step 9: Access Dashboard

Open browser to:
- **Local:** http://localhost:3100
- **Network:** http://<server-ip>:3100

## Customization

### Edit Agent Personalities

```bash
nano agents/snehal/workspace/SOUL.md
```

Each agent has its own SOUL.md that defines personality, tone, and behavior.

### Add Custom Rewards

Edit `config/rewards.json`:
```json
{
  "id": "custom_reward",
  "name": "Movie Night",
  "cost": 25,
  "category": "big"
}
```

### Configure Per-Room Voices

Edit `config/voices.json`:
```json
{
  "ahana_room": {
    "provider": "elevenlabs",
    "voice_id": "charlotte",
    "speed": 1.0
  }
}
```

## Troubleshooting

### Voice Proxy Not Starting
```bash
# Check logs
tail -f logs/voice-proxy.log

# Test manually
python3 proxy_v4.py
```

### Agent Not Routing Correctly
```bash
# Verify OpenClaw agents
openclaw agents list

# Check profile config
cat config/profiles.json
```

### Dashboard Not Loading
```bash
# Check API proxy
curl http://localhost:3200/health

# Rebuild dashboard
cd dashboard && npm run build
```

## Next Steps

1. Teach family members their PINs
2. Set up bedtime reminders (already created by wizard)
3. Configure school email parser
4. Add calendar integration
5. Set up per-room voice routing

## Support

- Documentation: See README.md
- Issues: https://github.com/yodabhawan-cyber/homenest-dashboard/issues
- Community: (Add Discord/forum link)

---

**🎉 Congratulations!** Your HomeNest family AI is ready!

Each family member now has their own personalized AI assistant that learns and adapts to them individually.
