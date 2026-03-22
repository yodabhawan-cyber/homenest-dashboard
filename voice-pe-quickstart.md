# Voice PE Quick Start - Home Assistant Voice 0acc68

## ✅ Device Detected

**Device:** Home Assistant Voice 0acc68  
**Type:** Voice Preview Edition (ESPHome)  
**Entities:** 15  
**Status:** Connected

## Current Configuration

- **Wake word:** "Okay Nabu"  
- **Wake sound:** ON  
- **Mute:** ON ⚠️ (needs to be OFF)  
- **Sensitivity:** Slightly sensitive  
- **LED Ring:** Available

## Step 1: Unmute the Device 🔊

**In Home Assistant:**
1. Go to **Settings → Devices & Services**
2. Click **ESPHome → Home Assistant Voice 0acc68**
3. Find "**Mute**" switch
4. **Turn it OFF** (currently ON)

## Step 2: Test Wake Word

1. Say: **"Okay Nabu"**
2. LED ring should light up
3. Say: **"What time is it?"**
4. Device should respond with current time

**If this works**, your device is ready for HomeNest integration!

## Step 3: Create HomeNest Assistant Pipeline

**In Home Assistant UI:**

1. Go to **Settings → Voice Assistants**
2. Click **"+ Add Assistant"**
3. Configure:
   - **Name:** HomeNest Assistant
   - **Language:** English
   - **Conversation agent:** Home Assistant
   - **Speech-to-Text:** faster-whisper (or Whisper)
   - **Text-to-Speech:** piper (or Google Translate)
   - **Wake word:** Okay Nabu

4. **Save**

5. **Assign to Voice PE device:**
   - Go back to **Settings → Devices & Services**
   - Click **ESPHome → Home Assistant Voice 0acc68**
   - Find "**Assistant**" selector
   - Change from "preferred" to "**HomeNest Assistant**"

## Step 4: Route to HomeNest Voice Proxy

Create automation to intercept voice commands and route to proxy_v4.py.

**In Home Assistant:**

1. **Settings → Automations & Scenes**
2. **Create Automation**
3. Switch to **YAML mode** (⋮ menu → Edit in YAML)
4. Paste this:

```yaml
alias: Voice PE → HomeNest Proxy
description: Route Voice PE commands to HomeNest voice proxy
trigger:
  - platform: event
    event_type: assist_pipeline_end
    event_data:
      device_id: "YOUR_DEVICE_ID_HERE"  # Replace with actual device ID
action:
  - service: rest_command.homenest_voice_proxy
    data:
      text: "{{ trigger.event.data.stt_output }}"
mode: queued
max: 10
```

5. **Save**

## Step 5: Add REST Command

Add this to Home Assistant's `configuration.yaml`:

```yaml
rest_command:
  homenest_voice_proxy:
    url: "http://YOUR_MAC_IP:11434/api/chat"
    method: POST
    content_type: "application/json"
    payload: >
      {
        "model": "openclaw",
        "messages": [
          {
            "role": "user",
            "content": "{{ text }}"
          }
        ],
        "stream": false
      }
```

**Replace `YOUR_MAC_IP`** with your Mac's IP address (e.g., `192.168.4.52`)

6. **Restart Home Assistant** to load the new configuration

## Step 6: Test End-to-End

1. Say: **"Okay Nabu"**
2. Wait for chime
3. Say: **"What's the weather?"**
4. Device should:
   - Send audio to faster-whisper (STT)
   - Route text to proxy_v4.py (port 11434)
   - Get response from OpenClaw agent
   - Play response via Piper (TTS)

## Troubleshooting

### Wake word not working
- Check mute is OFF
- Try increasing sensitivity: `select.home_assistant_voice_0acc68_wake_word_sensitivity`
- Test by pressing the button on the device (bypasses wake word)

### No response after speaking
- Check proxy_v4.py is running: `curl http://localhost:11434/api/tags`
- Review HA logs: **Developer Tools → Logs**
- Check automation fired: **Settings → Automations → Voice PE → HomeNest Proxy** (should show last triggered)

### Response not playing
- Check TTS service is running
- Test manually: **Developer Tools → Services** → `tts.piper_speak`
- Verify device is not muted

### Wrong assistant responding
- Make sure device is assigned to "HomeNest Assistant"
- Check automation is intercepting commands

## Next Steps

Once basic flow works:

1. **Add profile switching** ("This is Ayush PIN 333")
2. **Custom wake word** "Hey Yoda"
3. **ElevenLabs TTS** for better voice quality
4. **Add more Voice PE satellites** for multi-room

## Files

- **Voice Proxy:** `~/.openclaw/workspace/homenest/proxy_v4.py`
- **Test:** `curl http://localhost:11434/api/tags`
- **Logs:** `~/.openclaw/workspace/homenest/logs/voice.log`

## Entity IDs Reference

```
select.home_assistant_voice_0acc68_assistant
select.home_assistant_voice_0acc68_wake_word
switch.home_assistant_voice_0acc68_mute
switch.home_assistant_voice_0acc68_wake_sound
select.home_assistant_voice_0acc68_wake_word_sensitivity
light.home_assistant_voice_0acc68_led_ring
media_player.home_assistant_voice_0acc68_media_player
assist_satellite.home_assistant_voice_0acc68_assist_satellite
```

---

**Ready to test! Start with Step 1 (unmute) and work your way through.** 🎉
