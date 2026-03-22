# Family Management Skill

Manages family chores, rewards, bedtime reminders, and family-related voice queries for HomeNest.

## Data Files
- **Chores config:** `../../config/chores.json`
- **Profiles:** `../../config/profiles.json`
- **Daily log:** `../../config/daily_log.json` (auto-created)

## Voice Commands This Skill Handles

### Chore Management
- "Did [name] finish [chore]?" → Check/mark chore complete
- "Mark [name]'s [chore] as done" → Complete a chore, award stars
- "What chores does [name] have today?" → List today's chores
- "What chores are left?" → List incomplete chores for all kids
- "Whose turn is it to [chore]?" → Check alternating chore assignment

### Rewards
- "How many stars does [name] have?" → Check star balance
- "What can [name] redeem?" → List available rewards
- "[Name] wants to redeem [reward]" → Deduct stars, grant reward

### Family Status
- "Is it [name]'s bedtime?" → Check against profile bedtime
- "How much screen time does [name] have left?" → Check remaining
- "Family report" → Daily summary of chores completed, stars earned

## Implementation
Use the `family_manager.py` script in this directory for all operations.
All state changes write back to the JSON files so the dashboard stays in sync.
