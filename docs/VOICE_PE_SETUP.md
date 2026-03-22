# Voice PE Satellite Setup

## Overview

Voice Preview (Voice PE) satellites connect to Home Assistant and stream audio for:
- **Wake word detection** ("Hey Yoda")
- **Speech-to-Text** (STT via faster-whisper or Whisper)
- **AI processing** (via OpenClaw personal agents)
- **Text-to-Speech** (TTS via Piper or ElevenLabs)

## Architecture

```
Voice PE Satellite (ESP32/Atom Echo)
    ↓ [Audio Stream]
Home Assistant Wyoming Protocol
    ↓ [STT]
HomeNest Voice Proxy (proxy_v4.py on port 11434)
    ↓ [5-tier routing: HOME/FAMILY/LOCAL/CLOUD/AGENT]
OpenClaw Gateway (port 18789)
    ↓ [Personal Agent: snehal/anushka/ayush/ahana]
Agent Response
    ↓ [TTS]
Voice PE Satellite (plays audio)
```

## Prerequisites

✅ Home Assistant with Wyoming Protocol integration
✅ Voice PE device added to HA (ESPHome or Wyoming)
✅ STT configured (faster-whisper recommended)
✅ TTS configured (Piper or ElevenLabs)
✅ HomeNest Voice Proxy running (proxy_v4.py)

## Step 1: Find Your Voice PE Device

In Home Assistant:
1. Go to **Settings → Devices & Services**
2. Find your Voice PE device (under ESPHome or Wyoming)
3. Note the **device name** and **entity IDs**

Common entity patterns:
- `binary_sensor.{device}_voice_assistant_running`
- `select.{device}_wake_word`
- `switch.{device}_use_wake_word`

## Step 2: Configure Wake Word

### Option A: Built-in Wake Word (Recommended for start)
Use Home Assistant's built-in wake word engine:

1. In HA, go to your Voice PE device
2. Find "Wake Word" entity (e.g., `select.atom_echo_wake_word`)
3. Select "okay nabu" or another available wake word
4. Enable wake word: `switch.atom_echo_use_wake_word` → ON

### Option B: Custom "Hey Yoda" Wake Word (Advanced)
Requires training openWakeWord model:

```bash
# Install openWakeWord
pip3 install openwakeword

# Train custom wake word (requires audio samples)
# See: https://github.com/dscripka/openWakeWord
```

**For now, use Option A** - we'll add custom wake word later.

## Step 3: Configure Voice Assistant Pipeline

In Home Assistant:
1. **Settings → Voice Assistants**
2. **Add Assistant**

Configure pipeline:
- **Name:** "HomeNest Assistant"
- **Language:** English
- **Conversation Agent:** Home Assistant (we'll override this)
- **Speech-to-Text:** faster-whisper (or Whisper)
- **Text-to-Speech:** piper (or ElevenLabs)
- **Wake word:** (Select your wake word from Step 2)

3. **Assign to Voice PE device:**
   - Go to your Voice PE device settings
   - Set "Voice Assistant" to "HomeNest Assistant"

## Step 4: Route to HomeNest Voice Proxy

**Problem:** By default, Voice PE sends to HA's conversation agent.  
**Solution:** We need to intercept and route to proxy_v4.py.

### Method 1: Home Assistant Automation (Easiest)

Create automation to catch voice commands:

```yaml
alias: "Voice PE → HomeNest Proxy"
trigger:
  - platform: event
    event_type: voice_assistant_run_end
    event_data:
      satellite_id: "your_voice_pe_device_id"
condition: []
action:
  - service: rest_command.homenest_voice_proxy
    data:
      text: "{{ trigger.event.data.stt_output }}"
      device: "{{ trigger.event.data.satellite_id }}"
```

Add REST command in `configuration.yaml`:

```yaml
rest_command:
  homenest_voice_proxy:
    url: "http://localhost:11434/api/chat"
    method: POST
    headers:
      Content-Type: "application/json"
    payload: '{"model":"openclaw","messages":[{"role":"user","content":"{{ text }}"}],"stream":false}'
```

### Method 2: Wyoming Protocol Proxy (Advanced)

Modify proxy_v4.py to listen on Wyoming protocol port and intercept audio.

**For now, use Method 1** - automation is simpler.

## Step 5: Test the Setup

1. **Say wake word:** "Okay Nabu" (or your selected wake word)
2. **Wait for chime** (device LED should light up)
3. **Speak command:** "What's the weather?"
4. **Listen for response** via TTS

**Expected flow:**
```
You: "Okay Nabu"
[Device chimes]
You: "What's the weather?"
[STT → proxy_v4.py → OpenClaw agent → TTS]
Device: [Speaks weather forecast]
```

## Troubleshooting

### Device not responding to wake word
- Check `switch.{device}_use_wake_word` is ON
- Verify wake word is selected in device settings
- Check microphone sensitivity
- Review HA logs: Developer Tools → Logs

### STT not working
- Check `stt.faster_whisper` state (should not be "unavailable")
- Verify faster-whisper add-on is running
- Test STT in HA: Settings → Voice Assistants → Test

### TTS not playing
- Check `tts.piper` state
- Verify Piper add-on is running
- Test TTS: Developer Tools → Services → `tts.piper_speak`

### Voice commands not reaching OpenClaw
- Check proxy_v4.py is running: `curl http://localhost:11434/api/tags`
- Review proxy logs
- Test automation manually in HA

## Next Steps

Once basic Voice PE is working:

1. **Custom wake word** "Hey Yoda"
2. **ElevenLabs TTS** for better voice quality
3. **Multi-room setup** (add more Voice PE satellites)
4. **Profile switching** via voice ("This is Ayush PIN 333")

## Files

- **Voice Proxy:** `~/.openclaw/workspace/homenest/proxy_v4.py`
- **HA Config:** `/config/configuration.yaml` (on HA host)
- **HA Automations:** `/config/automations.yaml`

## Reference

- Voice PE hardware: https://www.home-assistant.io/voice_control/voice_remote_local_assistant/
- Wyoming Protocol: https://github.com/rhasspy/wyoming
- faster-whisper: https://github.com/SYSTRAN/faster-whisper
- Piper TTS: https://github.com/rhasspy/piper
