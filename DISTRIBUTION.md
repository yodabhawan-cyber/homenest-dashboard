# 🚀 HomeNest Distribution Guide

Complete guide for packaging and distributing HomeNest to customers.

## Package Contents

Your HomeNest distribution should include:

```
homenest/
├── setup-wizard.py          # CLI setup (optional, for advanced users)
├── proxy_v4.py              # Voice proxy server
├── dashboard/               # Web dashboard
│   ├── setup-api.js        # Setup API server
│   └── src/pages/Setup.jsx # Web-based setup wizard
├── config/                  # Will be created during setup
├── agents/                  # Will be created during setup
├── INSTALL.md              # Installation instructions
├── .env.example            # Environment template
└── README.md               # Product overview
```

## Installation Flow for End Users

### Method 1: Web-Based Setup (Recommended)

1. **Download & Extract**
   ```bash
   git clone https://github.com/yodabhawan-cyber/homenest-dashboard.git
   cd homenest-dashboard
   ```

2. **Install Dependencies**
   ```bash
   # Dashboard
   cd dashboard
   npm install
   cd ..
   ```

3. **Start Setup Servers**
   ```bash
   # Terminal 1: Setup API
   node dashboard/setup-api.js
   
   # Terminal 2: Dashboard
   cd dashboard && npm run dev
   ```

4. **Open Browser**
   - Navigate to http://localhost:3100/setup
   - Follow the setup wizard

5. **Setup Wizard Steps**
   - **Step 1:** Enter API keys (OpenAI, Home Assistant, OpenClaw, ElevenLabs)
   - **Step 2:** Test all connections
   - **Step 3:** Add family members (names, ages, personalities, PINs)
   - **Step 4:** Complete setup

6. **Post-Setup Configuration**
   - Setup wizard generates `openclaw-agents-config.json`
   - User adds this to `~/.openclaw/openclaw.json` under `agents.list`
   - Restart OpenClaw Gateway: `openclaw gateway restart`

7. **Start Services**
   ```bash
   # Voice Proxy
   python3 proxy_v4.py
   
   # Dashboard (already running from step 3)
   ```

### Method 2: CLI Setup (Advanced Users)

```bash
python3 setup-wizard.py
# Follow interactive prompts
```

## Configuration Files Generated

After setup completes:

- `.env` - Environment variables (API keys, URLs)
- `config/profiles.json` - Family member profiles
- `config/setup-status.json` - Setup completion status
- `agents/[name]/workspace/` - Personal agent workspaces (SOUL.md, MEMORY.md, etc.)
- `openclaw-agents-config.json` - OpenClaw agent configuration

## Distribution Checklist

Before shipping to a customer:

- [ ] Remove any personal data from config files
- [ ] Clear `config/setup-status.json` (force fresh setup)
- [ ] Remove `.env` file (user will create during setup)
- [ ] Clear `agents/` directory (will be created during setup)
- [ ] Test fresh install on clean machine
- [ ] Verify all connection tests work
- [ ] Confirm agent workspaces are created correctly
- [ ] Test voice profile switching

## System Requirements

**Hardware:**
- Mac mini / Linux server / Raspberry Pi 4+ (4GB+ RAM)
- Voice satellite speaker (Voice PE or compatible)
- Optional: Home Assistant Green/server

**Software:**
- Python 3.9+
- Node.js 18+
- OpenClaw Gateway (included in package or separate install)

**Network:**
- Home Assistant accessible (local or cloud)
- Internet for cloud AI (OpenAI)
- Local network for voice

**Accounts Needed:**
- OpenAI API key (https://platform.openai.com)
- Home Assistant long-lived token
- OpenClaw Gateway (self-hosted)
- Optional: ElevenLabs API key (https://elevenlabs.io)

## Pricing Model (Suggested)

**One-Time Purchase:**
- $299 - HomeNest software license
- Includes: Setup wizard, dashboard, voice proxy, 1 year updates

**Subscription (Optional):**
- $15/month - Cloud features, premium voices, updates

**Free Trial:**
- 30 days full access
- Limited to 3 family members

## Support & Updates

**Updates:**
- Delivered via git pull or auto-update feature
- Semantic versioning (v1.0.0)
- Changelog included

**Support Channels:**
- Documentation: In-product help pages
- Email: support@homenest.ai
- Community: Discord/forum
- Enterprise: Dedicated support

## Customization for Resellers

**White Labeling:**
- Replace "The Digital Hearth" branding
- Custom logo in dashboard/src/App.jsx
- Custom colors in dashboard/src/index.css
- Update README and INSTALL docs

**Custom Features:**
- Add to proxy_v4.py for voice features
- Add pages to dashboard/src/pages/
- Extend setup wizard with custom steps

## Security Considerations

**API Keys:**
- Stored in `.env` file (not in git)
- Never committed to version control
- Encrypted at rest (optional: add encryption layer)

**Data Privacy:**
- All data stays local (except cloud AI calls)
- Family data isolated per agent
- Activity logs can be disabled

**Access Control:**
- PIN protection for voice profiles
- Dashboard password protection (add if needed)
- Guest mode for limited access

## Deployment Options

### Option 1: Docker (Coming Soon)
```bash
docker-compose up
# Opens setup wizard automatically
```

### Option 2: NPM Package (Coming Soon)
```bash
npm install -g homenest
homenest setup
```

### Option 3: Native Apps (Future)
- macOS .app bundle
- Windows installer
- Raspberry Pi image

## Testing Checklist

Before shipping version X.Y.Z:

- [ ] Fresh install on macOS
- [ ] Fresh install on Linux
- [ ] Fresh install on Raspberry Pi
- [ ] Setup wizard completes successfully
- [ ] All connection tests pass
- [ ] Agent workspaces created correctly
- [ ] Voice profile switching works
- [ ] Dashboard loads and displays data
- [ ] Home Assistant integration functional
- [ ] Voice commands route to correct agents
- [ ] Memory persists across restarts

## Versioning

Current version: **1.0.0** (Initial release)

**Major version (X.0.0):** Breaking changes, new architecture  
**Minor version (0.X.0):** New features, backward compatible  
**Patch version (0.0.X):** Bug fixes, small improvements

## License

Recommended: MIT or Commercial

Include LICENSE file in distribution.

---

## Quick Start for Distributors

1. Clone repo
2. Test on clean machine
3. Document any system-specific quirks
4. Package (zip/tarball/installer)
5. Write customer-facing quick start guide
6. Set up support channels
7. Ship!

**Remember:** First impression matters. Make setup smooth and delightful. 🏠
