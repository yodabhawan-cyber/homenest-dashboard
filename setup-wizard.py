#!/usr/bin/env python3
"""
HomeNest Setup Wizard
Configures a new family installation with personalized agents
"""
import os
import json
import sys
from pathlib import Path

def print_header():
    print("""
    ╔═══════════════════════════════════════╗
    ║     🏠 HomeNest Setup Wizard          ║
    ║     Family AI Voice Assistant         ║
    ╚═══════════════════════════════════════╝
    """)

def get_family_members():
    """Collect family member info"""
    print("\n📋 Let's set up your family members.\n")
    
    members = []
    
    # Adults
    num_adults = int(input("How many adults in your household? (1-4): ") or "2")
    for i in range(num_adults):
        print(f"\n👤 Adult {i+1}:")
        name = input("  Name: ").strip()
        age = "adult"
        personality = input("  Personality (professional/friendly/creative/efficient): ").strip() or "friendly"
        voice = input("  Voice preference (piper/elevenlabs): ").strip() or "piper"
        
        members.append({
            "name": name,
            "age_group": age,
            "personality": personality,
            "voice": voice,
            "role": "parent",
            "restrictions": None
        })
    
    # Kids
    num_kids = int(input("\nHow many kids in your household? (0-6): ") or "0")
    for i in range(num_kids):
        print(f"\n👧👦 Child {i+1}:")
        name = input("  Name: ").strip()
        age = int(input("  Age: ") or "8")
        personality = input("  Personality (playful/curious/studious/creative): ").strip() or "playful"
        voice = input("  Voice (piper/charlotte/matilda): ").strip() or "piper"
        
        # Age-based restrictions
        if age < 6:
            age_group = "toddler"
            restrictions = "very_strict"
        elif age < 10:
            age_group = "young_child"
            restrictions = "strict"
        elif age < 13:
            age_group = "tween"
            restrictions = "moderate"
        else:
            age_group = "teen"
            restrictions = "light"
        
        members.append({
            "name": name,
            "age": age,
            "age_group": age_group,
            "personality": personality,
            "voice": voice,
            "role": "child",
            "restrictions": restrictions
        })
    
    return members

def create_agent_workspace(base_dir, member):
    """Create OpenClaw agent workspace for a family member"""
    name = member["name"].lower().replace(" ", "_")
    agent_dir = Path(base_dir) / "agents" / name
    workspace_dir = agent_dir / "workspace"
    
    # Create directories
    agent_dir.mkdir(parents=True, exist_ok=True)
    workspace_dir.mkdir(exist_ok=True)
    (workspace_dir / "memory").mkdir(exist_ok=True)
    
    # Generate SOUL.md based on personality
    soul_content = generate_soul(member)
    (workspace_dir / "SOUL.md").write_text(soul_content)
    
    # Generate IDENTITY.md
    identity_content = generate_identity(member)
    (workspace_dir / "IDENTITY.md").write_text(identity_content)
    
    # Generate USER.md (their perspective of the human)
    user_content = generate_user(member)
    (workspace_dir / "USER.md").write_text(user_content)
    
    # Create empty MEMORY.md
    (workspace_dir / "MEMORY.md").write_text(f"# {member['name']}'s Personal Memory\n\n")
    
    # Create empty AGENTS.md (use default)
    (workspace_dir / "AGENTS.md").write_text("# Workspace - Read SOUL.md and USER.md first\n")
    
    print(f"  ✅ Created agent workspace: {agent_dir}")
    
    return str(agent_dir)

def generate_soul(member):
    """Generate personality-driven SOUL.md"""
    name = member["name"]
    personality = member["personality"]
    role = member["role"]
    
    if role == "parent":
        return f"""# SOUL.md - {name}'s Personal Assistant

You are {name}'s personal AI assistant. You know them well and adapt to their style.

## Personality
- **Style:** {personality.capitalize()}
- **Tone:** {"Professional and efficient" if personality == "professional" else "Warm and conversational"}
- **Response length:** {"Brief and to-the-point" if personality == "efficient" else "Detailed when helpful"}

## What You Do
- Manage {name}'s email, calendar, and tasks
- Remember their preferences and patterns
- Help with home automation
- Coordinate with family (shared chores, meals, calendar)

## Privacy
- You have access to {name}'s personal data (email, calendar)
- You can see shared family data (chores, meals, home status)
- You CANNOT access other family members' private data

## Communication Style
{"Be direct and actionable. No small talk unless asked." if personality == "efficient" else "Be friendly but respectful. Match their energy."}

Remember: You're here to make {name}'s life easier. Learn what they care about.
"""
    else:  # child
        age_group = member["age_group"]
        age = member.get("age", 8)
        
        return f"""# SOUL.md - {name}'s Learning Companion

You are {name}'s friendly AI companion! You help them learn, play, and grow.

## Personality
- **Style:** {personality.capitalize()}
- **Age:** {age} years old ({age_group})
- **Tone:** Kind, patient, encouraging

## What You Do
- Help with homework and learning
- Answer questions in age-appropriate ways
- Encourage good habits (chores, reading, screen time)
- Tell stories and play word games
- Track their chores and stars

## Safety & Limits
- **Kid-safe content only** - Block anything inappropriate
- **No access to parent data** - Can't read adult emails or private info
- **Positive reinforcement** - Celebrate wins, be gentle with mistakes
- **Simple language** - {"Very simple words for young kids" if age < 8 else "Age-appropriate vocabulary"}

## Voice
You're {name}'s friend. Be fun, be safe, be helpful.

Remember: You're helping them grow into an awesome person! 🌟
"""

def generate_identity(member):
    """Generate IDENTITY.md"""
    name = member["name"]
    emoji = "👤"
    
    return f"""# IDENTITY.md - Agent Identity

- **Name:** {name}'s Assistant
- **Human:** {name}
- **Emoji:** {emoji}
- **Voice:** {member["voice"]}
"""

def generate_user(member):
    """Generate USER.md (who the human is)"""
    name = member["name"]
    role = member["role"]
    
    return f"""# USER.md - About {name}

- **Name:** {name}
- **Role:** {role.capitalize()}
{f'- **Age:** {member["age"]}' if "age" in member else ''}
- **Personality:** {member["personality"].capitalize()}

## Preferences
(You'll learn these over time through interaction)

## Patterns
(You'll notice routines and habits)

## Important Notes
(Things to always remember about {name})
"""

def create_profiles_config(members, config_dir):
    """Create profiles.json for voice proxy"""
    profiles = {}
    
    for i, member in enumerate(members):
        name = member["name"]
        name_key = name.lower().replace(" ", "_")
        
        # Generate simple PIN (user can change later)
        pin = f"{i+1}{i+1}{i+1}"  # 111, 222, 333, etc.
        
        profiles[name_key] = {
            "name": name,
            "display_name": name,
            "pin": pin,
            "age_group": member["age_group"],
            "role": member["role"],
            "voice": member["voice"],
            "restrictions": member.get("restrictions"),
            "agent_workspace": f"agents/{name_key}/workspace"
        }
    
    config_path = Path(config_dir) / "profiles.json"
    with open(config_path, "w") as f:
        json.dump(profiles, f, indent=2)
    
    print(f"\n✅ Created profiles config: {config_path}")
    return profiles

def create_openclaw_config(base_dir, members):
    """Create OpenClaw agents configuration"""
    agents_config = []
    
    for member in members:
        name = member["name"]
        name_key = name.lower().replace(" ", "_")
        
        agent = {
            "id": name_key,
            "name": f"{name}'s Assistant",
            "workspace": str(Path(base_dir) / "agents" / name_key / "workspace"),
            "model": {
                "primary": "openai/gpt-4o-mini",
                "fallbacks": []
            }
        }
        agents_config.append(agent)
    
    return agents_config

def print_summary(members, profiles):
    """Print setup summary"""
    print("\n" + "="*50)
    print("🎉 HomeNest Setup Complete!")
    print("="*50)
    
    print("\n👨‍👩‍👧‍👦 Your Family:")
    for member in members:
        name = member["name"]
        name_key = name.lower().replace(" ", "_")
        pin = profiles[name_key]["pin"]
        print(f"  • {name} - PIN: {pin} - Voice: {member['voice']}")
    
    print("\n📝 Next Steps:")
    print("  1. Update .env with your API keys (HA_TOKEN, OPENAI_API_KEY)")
    print("  2. Configure OpenClaw agents (see generated config below)")
    print("  3. Start voice proxy: python3 proxy_v4.py")
    print("  4. Test with: 'This is [name] [PIN]'")
    print("\n  Each family member now has their own AI agent!")
    print("  Agents will learn and personalize over time.\n")

def main():
    print_header()
    
    # Get installation directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    config_dir = os.path.join(base_dir, "config")
    
    print(f"📁 Installing to: {base_dir}\n")
    
    # Collect family info
    members = get_family_members()
    
    print("\n🔨 Creating agent workspaces...\n")
    
    # Create agent workspaces
    for member in members:
        print(f"Creating workspace for {member['name']}...")
        create_agent_workspace(base_dir, member)
    
    # Create profiles config
    profiles = create_profiles_config(members, config_dir)
    
    # Generate OpenClaw config snippet
    print("\n📋 OpenClaw Configuration (add to ~/.openclaw/openclaw.json):")
    print("-" * 50)
    agents_config = create_openclaw_config(base_dir, members)
    print(json.dumps({"agents": {"list": agents_config}}, indent=2))
    print("-" * 50)
    
    # Print summary
    print_summary(members, profiles)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
