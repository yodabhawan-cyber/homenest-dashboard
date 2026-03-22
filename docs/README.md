# HomeNest Documentation

Complete technical documentation for developers and AI agents.

## 📚 Documentation Map

Start here, then read in order:

| Document | Purpose | Read When |
|----------|---------|-----------|
| **[OVERVIEW.md](OVERVIEW.md)** | System architecture, high-level design | **Start here** - Understanding what HomeNest is |
| **[FILE_STRUCTURE.md](FILE_STRUCTURE.md)** | Complete file tree, what each file does | Finding where specific code lives |
| **[COMPONENTS.md](COMPONENTS.md)** | Detailed component breakdown | Understanding how pieces work |
| **[API_REFERENCE.md](API_REFERENCE.md)** | All API endpoints, request/response formats | Building integrations, debugging |
| **[DEVELOPMENT.md](DEVELOPMENT.md)** | How to continue development, add features | **Adding features** - Before writing code |

## Quick Navigation

### I want to...

**...understand the system architecture**
→ Read [OVERVIEW.md](OVERVIEW.md)

**...find a specific file**
→ Check [FILE_STRUCTURE.md](FILE_STRUCTURE.md)

**...know what a component does**
→ Look up in [COMPONENTS.md](COMPONENTS.md)

**...call an API endpoint**
→ See [API_REFERENCE.md](API_REFERENCE.md)

**...add a new feature**
→ Follow [DEVELOPMENT.md](DEVELOPMENT.md)

**...understand voice routing**
→ Read OVERVIEW.md → "5-Tier Smart Routing" section

**...modify agent personalities**
→ FILE_STRUCTURE.md → `agents/*/workspace/SOUL.md` section

**...debug an issue**
→ DEVELOPMENT.md → "Debugging" section

**...deploy to production**
→ DEVELOPMENT.md → "Deployment" section

## Documentation Philosophy

These docs are written for:
- **Future developers** (you!)
- **AI agents** continuing development
- **Other teams** implementing similar systems

**We prioritize:**
- ✅ Specificity over generality
- ✅ Examples over abstract descriptions
- ✅ Current state over future plans
- ✅ What/Why/How over just What

## Document Status

| Document | Status | Last Updated | Completeness |
|----------|--------|--------------|--------------|
| OVERVIEW.md | ✅ Current | 2026-03-22 | 100% |
| FILE_STRUCTURE.md | ✅ Current | 2026-03-22 | 100% |
| COMPONENTS.md | ✅ Current | 2026-03-22 | 100% |
| API_REFERENCE.md | ✅ Current | 2026-03-22 | 100% |
| DEVELOPMENT.md | ✅ Current | 2026-03-22 | 100% |

## AI Agent Quick Start

If you're an AI agent picking up this codebase:

1. **Read OVERVIEW.md first** - Get the big picture
2. **Skim FILE_STRUCTURE.md** - Know where things are
3. **When coding:**
   - Check COMPONENTS.md for component details
   - Reference API_REFERENCE.md for endpoints
   - Follow DEVELOPMENT.md for patterns

4. **When stuck:**
   - Search docs for keywords
   - Check git history: `git log --grep="feature name"`
   - Read inline code comments

## For Humans

### First Time Here?

**If you're a developer:**
1. Read OVERVIEW.md (15 min)
2. Skim FILE_STRUCTURE.md (5 min)
3. Set up dev environment (DEVELOPMENT.md)
4. Make a small change to test workflow

**If you're a PM/stakeholder:**
1. Read OVERVIEW.md → "What Is HomeNest?" section
2. Review README.md in root (user-facing docs)
3. Check DISTRIBUTION.md for go-to-market

**If you're setting up for a client:**
1. Follow INSTALL.md (in root)
2. Use setup wizard (/setup)
3. Reference DISTRIBUTION.md for customization

### Contributing to Docs

When you change code:
1. **Update relevant doc** in same commit
2. **Add examples** if adding features
3. **Keep it current** - no stale info
4. **Test accuracy** - verify examples work

Example commit:
```bash
git commit -m "feat: Add weather page
- Created dashboard/src/pages/Weather.jsx
- Added /weather route
- Updated docs/COMPONENTS.md
- Updated docs/FILE_STRUCTURE.md"
```

## Document Templates

### Adding a New Component

In COMPONENTS.md:
```markdown
## X. Component Name

**File:** `path/to/file.ext`
**Language:** Python/JavaScript/etc
**Port:** 1234 (if applicable)
**Purpose:** What it does in one sentence

### Responsibilities
- Bullet list of what it does

### Key Functions
**`functionName(param: type) -> returnType`**
```
Description and example
```

### Configuration
- Reads from: config files
- Writes to: output files
```

### Adding a New API Endpoint

In API_REFERENCE.md:
```markdown
#### METHOD `/api/path`

Description of what it does.

**Request:**
```json
{
  "field": "value"
}
```

**Response:**
```json
{
  "result": "value"
}
```

**Errors:**
- 400: Bad request (explain)
- 404: Not found (explain)
```

## Document Maintenance

### When to Update

**OVERVIEW.md:**
- Architecture changes
- New components added
- Core concepts change

**FILE_STRUCTURE.md:**
- New files/directories
- File renames
- Directory restructure

**COMPONENTS.md:**
- New components
- Component responsibilities change
- Key functions added/changed

**API_REFERENCE.md:**
- New endpoints
- Endpoint changes
- Request/response format changes

**DEVELOPMENT.md:**
- Workflow changes
- New development tools
- Testing approach changes

### Keeping Docs Fresh

Run this checklist monthly:
- [ ] All code examples still work
- [ ] File paths still accurate
- [ ] API endpoints still correct
- [ ] Screenshots current (if any)
- [ ] Links not broken
- [ ] Version numbers updated

## Versioning

Docs follow semantic versioning with code:
- **v1.0.0** - Initial release (current)
- **v1.1.0** - Minor features added → Update affected docs
- **v2.0.0** - Major changes → Rewrite OVERVIEW.md

## External Resources

**Related Documentation:**
- [Root README.md](../README.md) - User-facing product docs
- [INSTALL.md](../INSTALL.md) - Installation guide
- [DISTRIBUTION.md](../DISTRIBUTION.md) - Distributor guide

**External References:**
- [OpenClaw Docs](https://docs.openclaw.ai)
- [Home Assistant Docs](https://www.home-assistant.io/docs/)
- [React Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)

## Getting Help with Docs

**Found an error?**
1. Check if it's recent code change
2. Update the doc
3. Commit with fix

**Missing information?**
1. Search codebase for answer
2. Add to relevant doc
3. Commit with addition

**Unclear explanation?**
1. Re-read from fresh perspective
2. Rewrite more clearly
3. Add example
4. Commit with improvement

## Document History

**2026-03-22:** Initial documentation created
- Complete system coverage
- All 5 core docs written
- Ready for handoff to new developers/agents

---

## 🎯 Start Reading

**New to HomeNest?** → [OVERVIEW.md](OVERVIEW.md)

**Ready to code?** → [DEVELOPMENT.md](DEVELOPMENT.md)

**Need API info?** → [API_REFERENCE.md](API_REFERENCE.md)

---

**These docs exist so HomeNest can outlive any single developer. Keep them accurate, keep them current, keep them helpful.** 📚
