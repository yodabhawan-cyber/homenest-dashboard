# HomeNest Development Guide

How to continue development, add features, and extend the system.

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Git
- OpenClaw Gateway installed
- Home Assistant (optional for testing)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/yodabhawan-cyber/homenest-dashboard.git
cd homenest-dashboard

# 2. Install dashboard dependencies
cd dashboard
npm install
cd ..

# 3. Copy environment template
cp .env.example .env
# Edit .env with your API keys

# 4. Start development servers
# Terminal 1: Voice Proxy
python3 proxy_v4.py

# Terminal 2: Dashboard
cd dashboard && npm run dev

# Terminal 3: Setup API (if working on setup)
node dashboard/setup-api.js

# Terminal 4: API Proxy (if working on dashboard)
node dashboard/api-proxy.js
```

### Development URLs
- Dashboard: http://localhost:3100
- Setup Wizard: http://localhost:3100/setup
- API Proxy: http://localhost:3200
- Setup API: http://localhost:3201
- Voice Proxy: http://localhost:11434

---

## Adding New Features

### Adding a Voice Command

**Example: Add "Good night" command**

1. **Edit `proxy_v4.py`**

Find `classify_request()` and add pattern:
```python
def classify_request(text):
    t = text.lower()
    
    # ... existing patterns ...
    
    # NEW: Good night command
    if re.search(r'\b(good\s*night|goodnight|bedtime)\b', t):
        return 'family'  # Route to FAMILY tier
    
    # ... rest of function ...
```

2. **Add handler function**
```python
def handle_good_night():
    """Handle good night routine"""
    profile = current_profile.get('id', 'default')
    
    # Get bedtime for current person
    bedtime = run_family_cmd(['bedtime', 'check', profile])
    
    # Turn off lights
    # ... HA API calls ...
    
    return f"{bedtime} Sweet dreams!"
```

3. **Hook into routing**
```python
# In HTTP handler, FAMILY tier section:
if 'good night' in user_text.lower():
    content = handle_good_night()
```

4. **Test**
```bash
# Restart voice proxy
python3 proxy_v4.py

# Test from HA voice assistant or:
curl -X POST http://localhost:11434/api/chat \
  -d '{"model":"openclaw","messages":[{"role":"user","content":"Good night"}],"stream":false}'
```

### Adding a Dashboard Page

**Example: Add "Weather" page**

1. **Create page component**

`dashboard/src/pages/Weather.jsx`:
```jsx
import { useState, useEffect } from 'react';

export default function Weather() {
  const [weather, setWeather] = useState(null);
  
  useEffect(() => {
    fetchWeather();
  }, []);
  
  async function fetchWeather() {
    const res = await fetch('/api/weather');
    const data = await res.json();
    setWeather(data);
  }
  
  return (
    <div>
      <h1>Weather</h1>
      {weather && (
        <div className="glass-card p-6">
          <p>Temperature: {weather.temp}°C</p>
          <p>Conditions: {weather.conditions}</p>
        </div>
      )}
    </div>
  );
}
```

2. **Add route**

`dashboard/src/App.jsx`:
```jsx
import Weather from './pages/Weather';

// In routes:
<Route path="/weather" element={<Weather />} />
```

3. **Add navigation item**
```jsx
const navItems = [
  // ... existing items ...
  { path: '/weather', icon: '🌤️', label: 'Weather' },
];
```

4. **Create API endpoint** (if needed)

`dashboard/api-proxy.js`:
```javascript
if (url.pathname === '/api/weather') {
  // Call weather API or HA sensor
  // Return JSON
}
```

5. **Test**
```bash
cd dashboard && npm run dev
# Open http://localhost:3100/weather
```

### Adding a Family Feature

**Example: Add "Allowance Tracker"**

1. **Create config file**

`config/allowance.json`:
```json
{
  "ayush": {
    "weekly_amount": 10,
    "balance": 25,
    "last_paid": "2026-03-15"
  },
  "ahana": {
    "weekly_amount": 5,
    "balance": 10,
    "last_paid": "2026-03-15"
  }
}
```

2. **Add CLI command** (optional)

`skills/family/family_manager.py`:
```python
def allowance_check(name):
    data = read_json('allowance.json')
    if name in data:
        return f"{name} has ${data[name]['balance']} allowance."
    return f"No allowance data for {name}."
```

3. **Add voice command**

`proxy_v4.py`:
```python
if re.search(r'\b(allowance|pocket\s*money)\b', t):
    name = current_profile.get('id')
    return run_family_cmd(['allowance', 'check', name])
```

4. **Add dashboard page** (see "Adding a Dashboard Page" above)

5. **Update docs**
- Add to README.md features list
- Update FILE_STRUCTURE.md with new config file
- Document in COMPONENTS.md

### Adding an Agent Personality Template

**Example: Add "Creative" personality**

1. **Create template generator**

`dashboard/setup-api.js`, in `generateSOUL()`:
```javascript
if (member.personality === 'creative') {
  return `# SOUL.md - ${member.name}'s Creative Companion

You are ${member.name}'s creative AI partner. You inspire, brainstorm, and help them express themselves.

## Personality
- **Style:** Creative, imaginative, encouraging
- **Tone:** Inspiring and playful
- **Response length:** Varies - brief for ideas, detailed for explanations

## What You Do
- Help with creative projects (writing, art, music)
- Brainstorm ideas together
- Encourage experimentation
- Celebrate unique perspectives

## Communication Style
Be enthusiastic about new ideas. Ask "what if?" questions. Support creative risks.
`;
}
```

2. **Add to setup wizard**

`dashboard/src/pages/Setup.jsx`, in `FamilyMemberCard`:
```jsx
<select value={member.personality} onChange={...}>
  <option value="professional">Professional</option>
  <option value="friendly">Friendly</option>
  <option value="playful">Playful</option>
  <option value="creative">Creative</option>  {/* NEW */}
</select>
```

3. **Test**
```bash
# Run setup wizard
# Select "Creative" personality
# Check generated SOUL.md
```

---

## Code Style Guide

### Python (`proxy_v4.py`, `family_manager.py`)

**Conventions:**
- Functions: `snake_case`
- Constants: `UPPER_CASE`
- Classes: `PascalCase` (if used)
- Indentation: 4 spaces

**Example:**
```python
def handle_voice_command(text):
    """
    Process a voice command.
    
    Args:
        text (str): User's voice input
        
    Returns:
        str: Response to speak
    """
    if not text:
        return "I didn't catch that."
    
    # Classify and route
    tier = classify_request(text)
    return route_to_tier(tier, text)
```

### JavaScript (`*.js`, `*.jsx`)

**Conventions:**
- Functions: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_CASE`
- Indentation: 2 spaces

**Example:**
```javascript
async function fetchWeatherData() {
  try {
    const response = await fetch('/api/weather');
    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Weather fetch failed:', err);
    return null;
  }
}
```

### React Components

**Pattern:**
```jsx
import { useState, useEffect } from 'react';

export default function MyComponent({ propName }) {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  function handleAction() {
    // Event handlers
  }
  
  return (
    <div className="glass-card p-6">
      {/* JSX */}
    </div>
  );
}
```

### CSS (Tailwind + Custom)

**Prefer Tailwind classes:**
```jsx
<div className="p-6 rounded-xl bg-opacity-80">
```

**Use custom CSS variables for theme:**
```jsx
<div style={{ background: 'var(--accent-orange)' }}>
```

**Define new variables in `dashboard/src/index.css`:**
```css
:root {
  --new-color: #hexcode;
}
```

---

## Testing

### Manual Testing Checklist

**Voice Proxy:**
- [ ] Profile switching (with/without PIN)
- [ ] HOME tier (lights, climate)
- [ ] FAMILY tier (chores, stars, meals)
- [ ] LOCAL tier (general Q&A)
- [ ] CLOUD tier (complex questions)
- [ ] AGENT tier (email, calendar)
- [ ] Kid-safe filtering (test as child)
- [ ] Guest mode restrictions

**Dashboard:**
- [ ] All pages load
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] Responsive on mobile
- [ ] Dark theme renders properly

**Setup Wizard:**
- [ ] All 4 steps complete
- [ ] Connection tests pass
- [ ] Agent workspaces created
- [ ] Config files generated
- [ ] .env file written

### Automated Testing (Future)

**Planned:**
- Unit tests (Jest for JS, pytest for Python)
- Integration tests (API endpoint tests)
- E2E tests (Playwright for dashboard)

---

## Debugging

### Voice Proxy Debug Mode

Add verbose logging:
```python
# In proxy_v4.py, add at top:
DEBUG = True

# Use throughout:
if DEBUG:
    print(f"[DEBUG] Variable value: {var}")
```

### Dashboard Debug Tools

**React DevTools:**
- Install browser extension
- Inspect component state

**Network Tab:**
- Check API calls
- Verify request/response

**Console:**
```javascript
console.log('Debug:', variable);
console.table(arrayOfObjects);
```

### API Debugging

**curl commands:**
```bash
# Test voice proxy
curl -X POST http://localhost:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"openclaw","messages":[{"role":"user","content":"test"}]}'

# Test HA proxy
curl http://localhost:3200/api/states

# Test setup API
curl http://localhost:3201/api/setup/status
```

---

## Git Workflow

### Branching

**Main branches:**
- `main` - Production-ready code
- `develop` - Integration branch (future)

**Feature branches:**
```bash
git checkout -b feature/voice-good-night
# ... make changes ...
git commit -m "feat: Add good night voice command"
git push origin feature/voice-good-night
# ... create pull request ...
```

### Commit Messages

**Format:** `type: description`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructure
- `test` - Tests
- `chore` - Maintenance

**Examples:**
```bash
git commit -m "feat: Add weather dashboard page"
git commit -m "fix: Profile switching PIN validation"
git commit -m "docs: Update API reference with new endpoint"
```

---

## Performance Optimization

### Voice Proxy

**Caching:**
```python
# Cache weather data (already implemented)
weather_cache = {'data': None, 'expires': 0}

if time.time() < weather_cache['expires']:
    return weather_cache['data']
```

**Parallel Requests:**
```python
import concurrent.futures

with concurrent.futures.ThreadPoolExecutor() as executor:
    future_weather = executor.submit(fetch_weather)
    future_calendar = executor.submit(fetch_calendar)
    
    weather = future_weather.result()
    calendar = future_calendar.result()
```

### Dashboard

**Code Splitting:**
```jsx
import { lazy, Suspense } from 'react';

const Weather = lazy(() => import('./pages/Weather'));

<Suspense fallback={<div>Loading...</div>}>
  <Weather />
</Suspense>
```

**Memoization:**
```jsx
import { useMemo } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);
```

---

## Security Best Practices

### API Keys
- ✅ Store in `.env` (never in code)
- ✅ Add `.env` to `.gitignore`
- ✅ Use `.env.example` for template
- ❌ Never commit secrets

### Input Validation
```python
def sanitize_input(text):
    # Remove dangerous characters
    text = re.sub(r'[^\w\s\-\.]', '', text)
    return text.strip()[:500]  # Limit length
```

### Content Filtering
```python
def is_kid_safe(text):
    blocked = ['violence', 'weapon', ...]
    for word in blocked:
        if word in text.lower():
            return False
    return True
```

---

## Deployment

### Production Checklist

- [ ] Set `DEBUG = False` in proxy_v4.py
- [ ] Build dashboard: `npm run build`
- [ ] Configure systemd/launchd services
- [ ] Set up reverse proxy (nginx) if needed
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Configure firewall (only allow necessary ports)
- [ ] Set up automated backups
- [ ] Test on clean system

### Environment-Specific Config

**Development:**
```bash
# .env
DEBUG=true
HA_URL=http://localhost:8123
```

**Production:**
```bash
# .env
DEBUG=false
HA_URL=https://ha.example.com
```

---

## Documentation

### When to Update Docs

**Always update when:**
- Adding new feature
- Changing API
- Adding config file
- Modifying architecture

**Which docs to update:**
- `README.md` - User-facing features
- `docs/OVERVIEW.md` - Architecture changes
- `docs/FILE_STRUCTURE.md` - New files/directories
- `docs/COMPONENTS.md` - Component changes
- `docs/API_REFERENCE.md` - API changes
- `docs/DEVELOPMENT.md` - Developer workflow changes

### Documentation Style

**Be specific:**
❌ "The system routes queries."
✅ "proxy_v4.py classifies queries into 5 tiers and routes to the fastest appropriate service."

**Include examples:**
```markdown
## Example

Input: "Turn on kitchen lights"
Tier: HOME
Response time: 0.2s
```

**Keep it current:**
- Update docs in same commit as code changes
- Add "Last updated: YYYY-MM-DD" to major docs

---

## Getting Help

### Resources
- **Docs:** Start with `docs/OVERVIEW.md`
- **Issues:** GitHub Issues (future)
- **Code comments:** Read inline comments in source
- **Git history:** `git log` to see evolution

### Common Issues

**Voice proxy not routing correctly:**
1. Check `current_profile` state
2. Verify `classify_request()` logic
3. Test individual tiers in isolation

**Dashboard not loading data:**
1. Check API proxy is running (port 3200)
2. Verify HA connection
3. Check browser console for errors

**Setup wizard not completing:**
1. Check setup API logs
2. Verify all API keys are valid
3. Ensure write permissions for config/

---

## Next Steps

**After reading this:**
1. Set up dev environment
2. Make a small change (add a print statement)
3. Test the change
4. Commit with proper message
5. Try adding a new feature

**Good first features to add:**
- New voice command (simple)
- Dashboard widget (medium)
- Agent personality template (medium)
- API endpoint (complex)

---

## Contact

**Original Developer:** Yoda (OpenClaw) 🐸  
**Client:** Snehal Bhawan  
**Repository:** https://github.com/yodabhawan-cyber/homenest-dashboard

---

**Remember:** HomeNest is a living system. Your improvements make it better for every family using it!
