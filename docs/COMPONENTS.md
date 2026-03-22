# HomeNest Components

Detailed breakdown of every component in the system.

## Component Map

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACES                       │
├─────────────────────────────────────────────────────────┤
│ • Voice Satellite Speaker (Voice PE / HA Compatible)    │
│ • Web Dashboard (React, port 3100)                      │
│ • Setup Wizard (React, /setup route)                    │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     ORCHESTRATION                        │
├─────────────────────────────────────────────────────────┤
│ • Home Assistant (Wake word, STT/TTS orchestration)     │
│ • Voice Proxy (5-tier routing, profile management)      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    AI/ML SERVICES                        │
├─────────────────────────────────────────────────────────┤
│ • OpenClaw Agents (Personal AI per family member)       │
│ • Ollama phi4-mini (Local LLM)                          │
│ • OpenAI GPT-4o-mini (Cloud LLM)                        │
│ • Whisper (STT)                                         │
│ • Piper / ElevenLabs (TTS)                              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                       │
├─────────────────────────────────────────────────────────┤
│ • API Proxy (HA API gateway)                            │
│ • Setup API (Configuration wizard backend)              │
│ • Family Manager (Chores/rewards CLI)                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
├─────────────────────────────────────────────────────────┤
│ • JSON Files (config/, chores, meals, etc.)             │
│ • Agent Workspaces (SOUL.md, MEMORY.md)                 │
│ • Activity Logs (voice interaction history)             │
└─────────────────────────────────────────────────────────┘
```

---

## 1. Voice Proxy (`proxy_v4.py`)

**File:** `proxy_v4.py`  
**Language:** Python 3.9+  
**Port:** 11434  
**Purpose:** Main voice assistant brain. Routes queries intelligently.

### Responsibilities
- Receive voice queries from Home Assistant
- Classify query into 5 tiers (HOME/FAMILY/LOCAL/CLOUD/AGENT)
- Route to appropriate service
- Manage voice profiles (PIN-based switching)
- Apply kid-safe content filtering
- Log all interactions

### Key Functions

**`classify_request(text: str) -> str`**
```python
# Returns: 'home' | 'family' | 'local' | 'cloud' | 'agent'
# Examples:
#   "turn on lights" → 'home'
#   "what chores do I have" → 'family'
#   "what is photosynthesis" → 'local'
#   "explain quantum physics" → 'cloud'
#   "check my email" → 'agent'
```

**`switch_profile(text: str) -> (bool, str)`**
```python
# Handles: "This is Snehal", "This is Ayush 1-2-3"
# Returns: (switched: bool, message: str)
# Updates global: current_profile
```

**`call_openclaw(messages: list, profile: dict) -> str`**
```python
# Routes to personal agent based on profile
# Reads: profile['agent_workspace'] → extracts agent_id
# Calls: http://openclaw_url with model="openclaw:{agent_id}"
```

**`handle_family_command(text: str) -> str`**
```python
# Routes to family_manager.py CLI
# Examples:
#   "what chores" → python3 family_manager.py chores today
#   "how many stars" → python3 family_manager.py stars check [name]
```

**`is_kid_safe_request(text: str) -> (bool, str)`**
```python
# Returns: (safe: bool, reason: str)
# Blocks: violence, weapons, inappropriate topics
# Blocks: dangerous actions (fire, chemicals, etc.)
```

### State Management
```python
current_profile = {
    'id': 'snehal',
    'name': 'Snehal',
    'role': 'parent',
    'age_group': 'adult',
    'agent_workspace': 'agents/snehal/workspace'
}

guest_mode = False
```

### Configuration
- **Environment:** `.env` (OPENCLAW_URL, OPENCLAW_TOKEN, HA_TOKEN, OPENAI_KEY)
- **Profiles:** `config/profiles.json`
- **Activity Log:** `config/activity_log.json` (writes to)

### Performance Targets
- HOME tier: < 0.3s
- FAMILY tier: < 0.1s
- LOCAL tier: < 2s
- CLOUD tier: < 3s
- AGENT tier: < 10s

---

## 2. Personal AI Agents (OpenClaw Workspaces)

**Location:** `agents/[name]/workspace/`  
**Technology:** OpenClaw Gateway  
**Purpose:** Individual AI for each family member

### Directory Structure
```
agents/snehal/workspace/
├── SOUL.md         # Personality definition
├── IDENTITY.md     # Agent identity
├── USER.md         # About the human
├── MEMORY.md       # Long-term memory
├── AGENTS.md       # Workspace instructions
└── memory/         # Daily logs (YYYY-MM-DD.md)
```

### Key Files

**SOUL.md**
```markdown
# Defines agent personality
- Communication style
- Response length preference
- Access permissions
- Safety rules (for kids)
- Core values

Example for parent:
- Professional tone
- Brief responses
- Full email access

Example for child:
- Playful, encouraging
- Simple language
- School emails only
- Positive reinforcement
```

**MEMORY.md**
```markdown
# Long-term memory
- Preferences learned over time
- Important context
- Patterns noticed
- Things to remember

Example:
"Ayush loves Minecraft and struggles with fractions.
He usually does homework at 4pm after school.
He earned his first 25 stars on March 15."
```

### Agent Configuration (OpenClaw)
```json
{
  "id": "ayush",
  "name": "Ayush's Learning Companion",
  "workspace": "/path/to/agents/ayush/workspace",
  "model": {
    "primary": "openai/gpt-4o-mini",
    "fallbacks": []
  }
}
```

### How It Works
1. Voice query comes in: "Check my email"
2. Current profile: `ayush`
3. Voice proxy calls: `http://openclaw_url` with `model="openclaw:ayush"`
4. OpenClaw Gateway:
   - Loads `agents/ayush/workspace/`
   - Reads `SOUL.md` for personality
   - Reads `MEMORY.md` for context
   - Applies age-appropriate filtering
   - Processes query with OpenAI
   - Returns kid-safe response

---

## 3. Web Dashboard

**Location:** `dashboard/`  
**Technology:** React 19 + Vite 8 + Tailwind CSS 4  
**Port:** 3100  
**Purpose:** Family control panel

### Pages

**`src/pages/Setup.jsx`** - First-time setup wizard
- Step 1: API keys
- Step 2: Connection testing
- Step 3: Family members
- Step 4: Complete

**`src/pages/Home.jsx`** - Dashboard home
- Climate stats (temp, humidity, air quality, power)
- Family presence (who's home)
- Security status (doors, windows, cameras)
- Quick controls (lights, A/C)

**`src/pages/Shopping.jsx`** - Shopping list
- Add/remove items
- Categories (Groceries, Household, Kids)
- Mark as completed
- localStorage persistence

**`src/pages/Chores.jsx`** - Chores & tasks
- Per-person chore lists
- Due dates
- Complete/delete
- Assigned to family members

**`src/pages/Meals.jsx`** - Meal planner
- 7-day weekly grid
- Breakfast/Lunch/Dinner
- Click-to-edit inline
- localStorage persistence

**`src/pages/Activity.jsx`** - Voice interaction log
- Recent voice commands
- Which tier handled it
- Timestamp
- Who said it

**`src/pages/SmartHome.jsx`** - Device controls
- Lights grouped by room
- Toggle switches
- Brightness control
- Climate controls

**`src/pages/Cameras.jsx`** - Camera feeds
- Live RTSP snapshots
- 12 Reolink cameras
- Motion detection status
- Grid layout

**`src/pages/Rewards.jsx`** - Reward shop
- Available rewards
- Star costs
- Redemption history

**`src/pages/ScreenTime.jsx`** - Screen time tracking
- Per-kid usage
- Daily/weekly limits
- Device breakdown

**`src/pages/Calendar.jsx`** - Family calendar
- Weekly events
- Per-person view

**`src/pages/Profiles.jsx`** - Family management
- Add/edit/remove members
- PIN management
- Voice preferences

**`src/pages/Settings.jsx`** - System settings
- API key management
- Voice configuration
- Backup/restore

### Routing (`src/App.jsx`)
```jsx
<Route path="/setup" element={<Setup />} />
<Route path="/" element={<Home />} />
<Route path="/shopping" element={<Shopping />} />
<Route path="/chores" element={<Chores />} />
// ... etc
```

### Styling (`src/index.css`)
```css
:root {
  --accent-orange: #ff6b35;  /* Primary brand */
  --accent-purple: #a855f7;  /* Secondary brand */
  --bg-primary: #0a0e1a;     /* Dark navy */
  --bg-card: #1a1f2e;        /* Card background */
  --text-primary: #f8f9fa;   /* Main text */
}

.glass-card {
  /* Main card style with glass-morphism */
}
```

### State Management
- **Local State:** React useState/useEffect
- **Persistence:** localStorage (shopping, chores, meals)
- **API Calls:** fetch() to backend APIs

### API Integration
- Calls `/api/setup/*` (setup wizard)
- Calls `http://localhost:3200/api/*` (HA proxy)
- Future: WebSocket for real-time updates

---

## 4. Setup API (`dashboard/setup-api.js`)

**File:** `dashboard/setup-api.js`  
**Language:** Node.js 18+  
**Port:** 3201  
**Purpose:** Backend for setup wizard

### Endpoints

**`GET /api/setup/status`**
```javascript
// Returns: { setup_complete: boolean }
// Used by: Setup.jsx (redirect if already set up)
```

**`POST /api/setup/test`**
```javascript
// Body: { service: string, config: object }
// Services: 'openai' | 'home_assistant' | 'elevenlabs' | 'openclaw'
// Returns: { success: boolean, error?: string }
```

**`POST /api/setup/complete`**
```javascript
// Body: { openai_key, ha_url, ha_token, family_members, ... }
// Actions:
//   1. Write .env file
//   2. Create agent workspaces
//   3. Generate profiles.json
//   4. Output openclaw-agents-config.json
//   5. Mark setup complete
// Returns: { success: boolean, next_steps: string[] }
```

### Key Functions

**`testOpenAI(apiKey: string)`**
```javascript
// Calls: https://api.openai.com/v1/models
// Returns: { success, error? }
```

**`createAgentWorkspaces(familyMembers, baseDir)`**
```javascript
// Creates:
//   agents/[name]/workspace/
//   ├── SOUL.md (generated from personality)
//   ├── IDENTITY.md
//   ├── USER.md
//   ├── MEMORY.md
//   └── AGENTS.md
```

**`generateSOUL(member)`**
```javascript
// Input: { name, age, role, personality }
// Output: Personalized SOUL.md content
// Different templates for kids vs adults
```

**`writeEnvFile(config)`**
```javascript
// Creates .env with:
//   OPENAI_API_KEY=...
//   HA_URL=...
//   HA_TOKEN=...
//   etc.
```

---

## 5. API Proxy (`dashboard/api-proxy.js`)

**File:** `dashboard/api-proxy.js`  
**Language:** Node.js 18+  
**Port:** 3200  
**Purpose:** Proxy Home Assistant API for dashboard

### Why It Exists
- Keep HA token server-side (security)
- CORS handling
- Request filtering/validation

### Endpoints

**`/api/states`**
```javascript
// Proxies: HA_URL/api/states
// Returns: All HA entities
```

**`/api/services/{domain}/{service}`**
```javascript
// Proxies: HA_URL/api/services/{domain}/{service}
// Examples:
//   POST /api/services/light/turn_on
//   POST /api/services/climate/set_temperature
```

**`/api/camera_proxy/{entity_id}`**
```javascript
// Proxies: HA_URL/api/camera_proxy/{entity_id}
// Returns: Camera snapshot (JPEG)
```

**`/api/camera_proxy_stream/{entity_id}`**
```javascript
// Proxies: HA_URL/api/camera_proxy_stream/{entity_id}
// Returns: MJPEG stream
```

---

## 6. Family Manager (`skills/family/family_manager.py`)

**File:** `skills/family/family_manager.py`  
**Language:** Python 3.9+  
**Type:** CLI tool  
**Purpose:** Chores/rewards/bedtime logic

### Commands

**Chores:**
```bash
# List today's chores
python3 family_manager.py chores today [name]

# List remaining chores
python3 family_manager.py chores remaining [name]

# Complete a chore
python3 family_manager.py chores complete [name] [chore]

# Whose turn is it?
python3 family_manager.py chores whose-turn [task]
```

**Stars/Rewards:**
```bash
# Check star balance
python3 family_manager.py stars check [name]

# Show reward shop
python3 family_manager.py stars shop [name]

# Redeem reward
python3 family_manager.py stars redeem [name] [reward]
```

**Bedtime:**
```bash
# Check bedtime
python3 family_manager.py bedtime check [name]
```

### Data Files
- Reads: `config/chores.json`, `config/rewards.json`
- Writes: Updates completion status, star balances

### Used By
- Voice proxy (FAMILY tier)
- Dashboard (future: direct integration)

---

## 7. Home Assistant Integration

**Product:** Home Assistant Green / Core  
**Version:** 2024.3+  
**Purpose:** Smart home orchestration, wake word, STT/TTS

### Configuration

**Voice Assistant Pipeline:**
- Wake Word: OK Nabu (or custom "Hey Yoda")
- STT: Whisper (local, port 10300)
- Conversation Agent: Extended OpenAI Conversation
- TTS: Piper (local, port 10200) or ElevenLabs
- Voice Satellite: Voice PE

**Extended OpenAI Conversation Settings:**
- Base URL: `http://localhost:11434/v1`
- API Key: (leave blank)
- Model: `openclaw`

### Entities Used
- **Lights:** 51 entities (all rooms)
- **Cameras:** 12 entities (Reolink)
- **Climate:** AC units
- **Media Players:** Apple TVs, Plex
- **Sensors:** Temperature, humidity, air quality, power

---

## 8. OpenClaw Gateway

**Product:** OpenClaw  
**Version:** Latest  
**Purpose:** Multi-agent orchestration

### Configuration (`~/.openclaw/openclaw.json`)
```json
{
  "agents": {
    "list": [
      {
        "id": "snehal",
        "name": "Snehal's Assistant",
        "workspace": "/path/to/agents/snehal/workspace",
        "model": {
          "primary": "openai/gpt-4o-mini"
        }
      }
      // ... more agents
    ]
  }
}
```

### How HomeNest Uses It
1. Voice proxy calls: `http://localhost:18789/v1/chat/completions`
2. Model specified: `openclaw:snehal` (agent ID)
3. OpenClaw routes to correct agent workspace
4. Agent processes with its SOUL.md personality
5. Returns personalized response

---

## Component Dependencies

```
Setup Wizard (UI)
  └─> Setup API
      └─> Creates:
          ├─> .env
          ├─> config/profiles.json
          ├─> agents/*/workspace/
          └─> openclaw-agents-config.json

Voice Query
  └─> Home Assistant
      └─> Whisper STT
          └─> Voice Proxy
              ├─> (HOME) → HA API
              ├─> (FAMILY) → Family Manager → config/*.json
              ├─> (LOCAL) → Ollama
              ├─> (CLOUD) → OpenAI
              └─> (AGENT) → OpenClaw Gateway
                               └─> Personal Agent
                                   ├─> Reads: SOUL.md, MEMORY.md
                                   └─> Calls: OpenAI
                                       └─> Returns response
              └─> TTS (Piper/ElevenLabs)
                  └─> Speaker

Dashboard
  └─> API Proxy
      └─> Home Assistant API
```

---

## Next: Read API_REFERENCE.md for complete endpoint documentation.
