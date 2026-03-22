# HomeNest API Reference

Complete reference for all APIs in the system.

## API Overview

HomeNest has 4 main APIs:

| API | Port | Purpose | File |
|-----|------|---------|------|
| Voice Proxy | 11434 | Voice query routing | `proxy_v4.py` |
| Setup API | 3201 | Configuration wizard | `dashboard/setup-api.js` |
| Dashboard API Proxy | 3200 | HA API gateway | `dashboard/api-proxy.js` |
| OpenClaw Gateway | 18789 | Multi-agent orchestration | External (OpenClaw) |

---

## 1. Voice Proxy API (Port 11434)

**Purpose:** Receives voice queries from Home Assistant, routes intelligently.  
**Protocol:** HTTP (Ollama-compatible)  
**Base URL:** `http://localhost:11434`

### Endpoints

#### POST `/api/chat`

Ollama chat completion endpoint (main voice interface).

**Request:**
```json
{
  "model": "openclaw",
  "messages": [
    { "role": "user", "content": "Turn on kitchen lights" }
  ],
  "stream": false
}
```

**Response:**
```json
{
  "model": "openclaw",
  "created_at": "2026-03-22T06:30:00Z",
  "message": {
    "role": "assistant",
    "content": "Kitchen lights are on."
  },
  "done": true,
  "done_reason": "stop",
  "total_duration": 234000000,
  "eval_count": 5
}
```

**Behavior:**
1. Extracts user text from messages
2. Checks current profile (determines agent routing)
3. Applies kid-safe filtering if child profile
4. Classifies request (HOME/FAMILY/LOCAL/CLOUD/AGENT)
5. Routes to appropriate tier
6. Returns response in Ollama format

#### POST `/api/generate`

Ollama text generation endpoint (alternative interface).

**Request:**
```json
{
  "model": "openclaw",
  "prompt": "What's the weather?"
}
```

**Response:**
```json
{
  "model": "openclaw",
  "response": "It's 22°C in Sydney, sunny with light breeze.",
  "done": true
}
```

#### GET `/api/tags`

List available models (for HA compatibility).

**Response:**
```json
{
  "models": [
    {
      "name": "openclaw",
      "model": "openclaw",
      "size": 1000000,
      "digest": "openclaw",
      "details": {
        "family": "openclaw",
        "parameter_size": "7B"
      }
    }
  ]
}
```

#### GET `/api/version`

Get proxy version.

**Response:**
```json
{
  "version": "0.6.2"
}
```

---

## 2. Setup API (Port 3201)

**Purpose:** Backend for web-based setup wizard.  
**Protocol:** HTTP + JSON  
**Base URL:** `http://localhost:3201`

### Endpoints

#### GET `/api/setup/status`

Check if setup has been completed.

**Response:**
```json
{
  "setup_complete": false,
  "completed_at": null,
  "family_members": 0
}
```

**Or if complete:**
```json
{
  "setup_complete": true,
  "completed_at": "2026-03-22T05:30:00Z",
  "family_members": 4
}
```

#### POST `/api/setup/test`

Test API connection to external service.

**Request:**
```json
{
  "service": "openai",
  "config": {
    "api_key": "sk-..."
  }
}
```

**Services:**
- `"openai"` - Test OpenAI API
- `"home_assistant"` - Test HA connection
- `"elevenlabs"` - Test ElevenLabs API
- `"openclaw"` - Test OpenClaw Gateway

**Response (success):**
```json
{
  "success": true,
  "message": "Connected"
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

#### POST `/api/setup/complete`

Complete setup wizard and generate all configuration.

**Request:**
```json
{
  "openai_key": "sk-...",
  "ha_url": "http://homeassistant.local:8123",
  "ha_token": "eyJ...",
  "openclaw_url": "http://127.0.0.1:18789/v1/chat/completions",
  "openclaw_token": "...",
  "elevenlabs_key": "sk_...",
  "family_members": [
    {
      "id": 1710000000,
      "name": "Snehal",
      "age": 35,
      "role": "parent",
      "personality": "professional",
      "voice": "piper",
      "pin": "111"
    },
    {
      "id": 1710000001,
      "name": "Ayush",
      "age": 10,
      "role": "child",
      "personality": "playful",
      "voice": "charlotte",
      "pin": "333"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Setup complete!",
  "openclaw_config_path": "/path/to/openclaw-agents-config.json",
  "next_steps": [
    "Agents created in agents/ directory",
    "Add agents config from openclaw-agents-config.json to ~/.openclaw/openclaw.json",
    "Restart OpenClaw Gateway",
    "Start voice proxy"
  ]
}
```

**Actions Performed:**
1. Writes `.env` file with API keys
2. Creates `agents/[name]/workspace/` directories
3. Generates SOUL.md, IDENTITY.md, USER.md for each agent
4. Writes `config/profiles.json`
5. Outputs `openclaw-agents-config.json`
6. Marks setup as complete in `config/setup-status.json`

---

## 3. Dashboard API Proxy (Port 3200)

**Purpose:** Proxy Home Assistant API (keeps token server-side).  
**Protocol:** HTTP  
**Base URL:** `http://localhost:3200`

### Endpoints

#### GET `/api/states`

Get all Home Assistant entities.

**Request:**
```http
GET /api/states
```

**Response:**
```json
[
  {
    "entity_id": "light.kitchen",
    "state": "on",
    "attributes": {
      "friendly_name": "Kitchen Light",
      "brightness": 255
    },
    "last_changed": "2026-03-22T05:30:00Z"
  }
  // ... more entities
]
```

#### GET `/api/states/{entity_id}`

Get single entity state.

**Request:**
```http
GET /api/states/light.kitchen
```

**Response:**
```json
{
  "entity_id": "light.kitchen",
  "state": "on",
  "attributes": {
    "friendly_name": "Kitchen Light",
    "brightness": 255
  }
}
```

#### POST `/api/services/{domain}/{service}`

Call Home Assistant service.

**Request:**
```http
POST /api/services/light/turn_on
Content-Type: application/json

{
  "entity_id": "light.kitchen",
  "brightness": 200
}
```

**Response:**
```json
[
  {
    "entity_id": "light.kitchen",
    "state": "on"
  }
]
```

**Common Services:**
- `light/turn_on` - Turn on lights
- `light/turn_off` - Turn off lights
- `climate/set_temperature` - Set thermostat
- `media_player/play_media` - Play media

#### GET `/api/camera_proxy/{entity_id}`

Get camera snapshot.

**Request:**
```http
GET /api/camera_proxy/camera.driveway
```

**Response:**
```
Content-Type: image/jpeg

[JPEG binary data]
```

#### GET `/api/camera_proxy_stream/{entity_id}`

Get camera MJPEG stream.

**Request:**
```http
GET /api/camera_proxy_stream/camera.driveway
```

**Response:**
```
Content-Type: multipart/x-mixed-replace; boundary=frame

[MJPEG stream]
```

#### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "ha_url": "http://homeassistant.local:8123"
}
```

---

## 4. OpenClaw Gateway API (Port 18789)

**Purpose:** Multi-agent orchestration (external service).  
**Protocol:** HTTP + JSON (OpenAI-compatible)  
**Base URL:** `http://localhost:18789`

### Endpoints

#### POST `/v1/chat/completions`

OpenAI-compatible chat completions.

**Request:**
```json
{
  "model": "openclaw:snehal",
  "messages": [
    { "role": "user", "content": "Check my email" }
  ],
  "user": "ha-voice-snehal"
}
```

**Model Format:**
- `"openclaw:main"` - Default/main agent
- `"openclaw:snehal"` - Snehal's personal agent
- `"openclaw:ayush"` - Ayush's personal agent
- `"openclaw:[agent_id]"` - Any configured agent

**Response:**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1710000000,
  "model": "openclaw:snehal",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "You have 3 new emails..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 30,
    "total_tokens": 50
  }
}
```

**Headers:**
```http
Authorization: Bearer {OPENCLAW_TOKEN}
Content-Type: application/json
```

---

## Voice Command Examples

### Profile Switching
```
User: "This is Snehal"
Response: "Hi Snehal! Switched to parent mode."

User: "This is Ayush 1-2-3"
Response: "Hey Ayush! I've switched to your profile."
```

### Home Automation (HOME tier)
```
User: "Turn on kitchen lights"
Tier: HOME
Response: "Kitchen lights on." (0.2s)

User: "Set AC to 22 degrees"
Tier: HOME
Response: "Setting bedroom AC to 22°C." (0.3s)
```

### Family Queries (FAMILY tier)
```
User: "What chores does Ayush have?"
Tier: FAMILY
Response: "Ayush has 3 chores today: make bed, homework, clean room." (0.05s)

User: "How many stars do I have?"
Tier: FAMILY (if logged in as Ayush)
Response: "You have 18 stars! You can redeem 10 for extra screen time." (0.05s)
```

### General Knowledge (LOCAL tier)
```
User: "What is photosynthesis?"
Tier: LOCAL
Response: "Photosynthesis is how plants make food using sunlight..." (1.2s)
```

### Complex Questions (CLOUD tier)
```
User: "Explain quantum entanglement"
Tier: CLOUD
Response: "Quantum entanglement is a phenomenon where particles..." (2.1s)
```

### Personal Tasks (AGENT tier)
```
User: "Check my email" (as Snehal)
Tier: AGENT → openclaw:snehal
Response: "You have 5 new emails. 2 from work, 1 from school..." (6.3s)

User: "Check my email" (as Ayush)
Tier: AGENT → openclaw:ayush
Response: "You have 2 emails from school about the field trip..." (5.8s)
Note: Kid-safe filtered, only school emails shown
```

---

## Error Responses

### Voice Proxy Errors

**Invalid Profile PIN:**
```json
{
  "message": {
    "content": "Hmm, that PIN doesn't match. Try again!"
  }
}
```

**Kid-Unsafe Request:**
```json
{
  "message": {
    "content": "That's a great question for your mum or dad!"
  }
}
```

**Guest Mode Restriction:**
```json
{
  "message": {
    "content": "Sorry, that feature isn't available in guest mode."
  }
}
```

### Setup API Errors

**Connection Test Failed:**
```json
{
  "success": false,
  "error": "Could not connect to Home Assistant at http://homeassistant.local:8123"
}
```

**Setup Already Complete:**
```json
{
  "setup_complete": true,
  "message": "Setup has already been completed. Use /settings to modify configuration."
}
```

### API Proxy Errors

**HA Unreachable:**
```json
{
  "error": "Home Assistant unavailable"
}
```

**Invalid Entity:**
```json
{
  "error": "Entity light.invalid_room not found"
}
```

---

## Rate Limits

**Voice Proxy:** None (local)  
**Setup API:** None (local)  
**API Proxy:** None (local)  
**OpenClaw Gateway:** Configured per agent  
**External APIs:**
- OpenAI: As per API key tier
- ElevenLabs: As per subscription

---

## Authentication

**Voice Proxy:**
- No auth (local network only)
- Profile switching via PIN

**Setup API:**
- No auth (first-run only, then redirects to settings)

**API Proxy:**
- No auth (keeps HA token server-side)

**OpenClaw Gateway:**
- Bearer token (`OPENCLAW_TOKEN` in .env)

**External APIs:**
- OpenAI: API key in `.env`
- Home Assistant: Long-lived token in `.env`
- ElevenLabs: API key in `.env`

---

## CORS Configuration

All APIs include CORS headers:
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## WebSocket Support

**Current:** Not implemented  
**Planned:** Real-time dashboard updates via WebSocket

---

## Next: Read DEVELOPMENT.md to learn how to extend these APIs.
