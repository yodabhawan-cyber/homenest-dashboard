#!/usr/bin/env python3
"""
HomeNest Family Manager — CLI tool for chore/reward management.
Called by OpenClaw skill or directly from voice proxy.

Usage:
  python3 family_manager.py chores today [name]
  python3 family_manager.py chores complete <name> <chore_name>
  python3 family_manager.py chores remaining [name]
  python3 family_manager.py chores whose-turn <chore_name>
  python3 family_manager.py stars check <name>
  python3 family_manager.py stars redeem <name> <tier_index>
  python3 family_manager.py report [name]
  python3 family_manager.py bedtime check <name>
"""
import json
import sys
import os
from datetime import datetime, date

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(BASE_DIR, "..", "..", "config")
CHORES_FILE = os.path.join(CONFIG_DIR, "chores.json")
PROFILES_FILE = os.path.join(CONFIG_DIR, "profiles.json")

def load_chores():
    with open(CHORES_FILE) as f:
        return json.load(f)

def save_chores(data):
    with open(CHORES_FILE, "w") as f:
        json.dump(data, f, indent=2)

def load_profiles():
    with open(PROFILES_FILE) as f:
        return json.load(f)

def today_str():
    return date.today().isoformat()

def day_of_week():
    return date.today().strftime("%A").lower()

def is_weekday():
    return date.today().weekday() < 5

def get_todays_chores(data, name=None):
    """Get chores applicable for today, optionally filtered by name."""
    today = day_of_week()
    chores = []
    for c in data["chores"]:
        # Check frequency
        if c["frequency"] == "daily":
            pass  # always applicable
        elif c["frequency"] == "weekdays" and not is_weekday():
            continue
        elif c["frequency"] == "weekly" and today != c.get("day", ""):
            continue

        # Check assignment
        if name and name.lower() not in [a.lower() for a in c["assigned_to"]]:
            continue

        # Check alternating
        if c.get("alternating"):
            # Simple alternation based on day of year
            day_num = date.today().timetuple().tm_yday
            idx = day_num % len(c["assigned_to"])
            todays_person = c["assigned_to"][idx]
            if name and name.lower() != todays_person.lower():
                continue
            c = {**c, "_todays_turn": todays_person}

        chores.append(c)
    return chores

def is_chore_done_today(data, name, chore_id):
    """Check if a chore was completed today."""
    today = today_str()
    for comp in data.get("completions", []):
        if comp["date"] == today and comp["name"].lower() == name.lower() and comp["chore_id"] == chore_id:
            return True
    return False

def complete_chore(data, name, chore_name):
    """Mark a chore as complete, award stars. Returns (success, message)."""
    today = today_str()
    name_lower = name.lower()

    # Find matching chore
    matching = None
    for c in get_todays_chores(data, name):
        if chore_name.lower() in c["name"].lower():
            matching = c
            break

    if not matching:
        return False, f"Couldn't find a chore matching '{chore_name}' for {name} today."

    # Check if already done
    if is_chore_done_today(data, name, matching["id"]):
        return False, f"{name} already completed '{matching['name']}' today."

    # Record completion
    data.setdefault("completions", []).append({
        "date": today,
        "name": name_lower,
        "chore_id": matching["id"],
        "chore_name": matching["name"],
        "stars": matching["stars"],
        "completed_at": datetime.now().isoformat()
    })

    # Award stars
    if name_lower not in data.get("rewards", {}):
        data["rewards"][name_lower] = {"total_stars": 0, "weekly_stars": 0, "redeemed": 0}
    data["rewards"][name_lower]["total_stars"] += matching["stars"]
    data["rewards"][name_lower]["weekly_stars"] += matching["stars"]

    save_chores(data)
    stars = matching["stars"]
    total = data["rewards"][name_lower]["total_stars"]
    return True, f"Done! {name} completed '{matching['name']}' and earned {stars} star{'s' if stars > 1 else ''}. Total: {total} stars."

def check_stars(data, name):
    """Get star balance for a person."""
    name_lower = name.lower()
    rewards = data.get("rewards", {}).get(name_lower, {"total_stars": 0, "weekly_stars": 0})
    total = rewards.get("total_stars", 0)
    weekly = rewards.get("weekly_stars", 0)
    return f"{name} has {total} total stars ({weekly} this week)."

def list_redeemable(data, name):
    """List rewards the person can redeem from the reward shop."""
    name_lower = name.lower()
    total = data.get("rewards", {}).get(name_lower, {}).get("total_stars", 0)
    
    # Load reward shop
    rewards_file = os.path.join(CONFIG_DIR, "rewards.json")
    try:
        with open(rewards_file) as f:
            shop = json.load(f)
    except:
        # Fall back to old reward_tiers
        available = []
        for tier in data.get("reward_tiers", []):
            if total >= tier["stars"]:
                available.append(f"  • {tier['reward']} ({tier['stars']} stars)")
        if not available:
            return f"{name} has {total} stars. Keep earning!"
        return f"{name} has {total} stars and can redeem:\n" + "\n".join(available)
    
    available = []
    for r in shop.get("rewards", []):
        status = "✅" if total >= r["cost"] else "🔒"
        available.append(f"  {status} {r['emoji']} {r['name']} — {r['cost']} stars")
    
    return f"{name.capitalize()} has {total} stars. Reward shop:\n" + "\n".join(available)

def redeem_reward(data, name, reward_search):
    """Redeem a reward from the shop."""
    name_lower = name.lower()
    total = data.get("rewards", {}).get(name_lower, {}).get("total_stars", 0)
    
    rewards_file = os.path.join(CONFIG_DIR, "rewards.json")
    try:
        with open(rewards_file) as f:
            shop = json.load(f)
    except:
        return False, "Reward shop not set up yet."
    
    # Find matching reward
    matching = None
    for r in shop.get("rewards", []):
        if reward_search.lower() in r["name"].lower() or reward_search.lower() in r["id"]:
            matching = r
            break
    
    if not matching:
        return False, f"Couldn't find a reward matching '{reward_search}'."
    
    if total < matching["cost"]:
        return False, f"Not enough stars! {name.capitalize()} has {total} but needs {matching['cost']} for {matching['name']}."
    
    # Deduct stars
    data["rewards"][name_lower]["total_stars"] -= matching["cost"]
    save_chores(data)
    
    # Record redemption
    shop.setdefault("redemptions", []).append({
        "date": today_str(),
        "name": name_lower,
        "reward_id": matching["id"],
        "reward_name": matching["name"],
        "cost": matching["cost"],
        "redeemed_at": datetime.now().isoformat()
    })
    with open(rewards_file, "w") as f:
        json.dump(shop, f, indent=2)
    
    remaining = data["rewards"][name_lower]["total_stars"]
    return True, f"🎉 {name.capitalize()} redeemed '{matching['name']}' for {matching['cost']} stars! {remaining} stars remaining."

def whose_turn(data, chore_name):
    """Check whose turn it is for an alternating chore."""
    for c in data["chores"]:
        if chore_name.lower() in c["name"].lower() and c.get("alternating"):
            day_num = date.today().timetuple().tm_yday
            idx = day_num % len(c["assigned_to"])
            person = c["assigned_to"][idx]
            return f"It's {person.capitalize()}'s turn to {c['name'].lower()} today."
    return f"Couldn't find an alternating chore matching '{chore_name}'."

def check_bedtime(profiles, name):
    """Check if it's past someone's bedtime."""
    name_lower = name.lower()
    profile = profiles.get(name_lower, {})
    bedtime_str = profile.get("bedtime")
    if not bedtime_str:
        return f"No bedtime set for {name}."

    now = datetime.now()
    hour, minute = map(int, bedtime_str.split(":"))
    bedtime = now.replace(hour=hour, minute=minute, second=0)

    if now >= bedtime:
        mins_past = int((now - bedtime).total_seconds() / 60)
        return f"Yes, it's {mins_past} minutes past {name}'s bedtime ({bedtime_str})! Time for bed."
    else:
        mins_until = int((bedtime - now).total_seconds() / 60)
        return f"Not yet — {name} has {mins_until} minutes until bedtime ({bedtime_str})."

def daily_report(data, name=None):
    """Generate daily summary."""
    today = today_str()
    todays_completions = [c for c in data.get("completions", []) if c["date"] == today]

    if name:
        todays_completions = [c for c in todays_completions if c["name"].lower() == name.lower()]
        todays_chores = get_todays_chores(data, name)
        done_count = len(todays_completions)
        total_count = len(todays_chores)
        stars_today = sum(c["stars"] for c in todays_completions)
        remaining = [c for c in todays_chores if not is_chore_done_today(data, name, c["id"])]

        report = f"{name.capitalize()}: {done_count}/{total_count} chores done, {stars_today} stars earned today."
        if remaining:
            report += f" Still to do: {', '.join(c['name'] for c in remaining)}."
        else:
            report += " All done! Great job!"
        return report
    else:
        # Full family report
        lines = ["Family report for today:"]
        for kid in ["ayush", "ahana"]:
            kid_completions = [c for c in todays_completions if c["name"] == kid]
            kid_chores = get_todays_chores(data, kid)
            done = len(kid_completions)
            total = len(kid_chores)
            stars = sum(c["stars"] for c in kid_completions)
            lines.append(f"  {kid.capitalize()}: {done}/{total} chores, {stars} stars today")
        return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return

    data = load_chores()
    profiles = load_profiles()
    cmd = sys.argv[1]

    if cmd == "chores":
        sub = sys.argv[2] if len(sys.argv) > 2 else "today"
        name = sys.argv[3] if len(sys.argv) > 3 else None

        if sub == "today":
            chores = get_todays_chores(data, name)
            if not chores:
                print(f"No chores for {'everyone' if not name else name} today!")
                return
            for c in chores:
                done = "✅" if name and is_chore_done_today(data, name, c["id"]) else "⬜"
                turn = f" ({c['_todays_turn']}'s turn)" if "_todays_turn" in c else ""
                print(f"  {done} {c['name']} — {c['stars']} star{'s' if c['stars'] > 1 else ''}{turn}")

        elif sub == "complete":
            if not name or len(sys.argv) < 5:
                print("Usage: chores complete <name> <chore_name>")
                return
            chore_name = " ".join(sys.argv[4:])
            success, msg = complete_chore(data, name, chore_name)
            print(msg)

        elif sub == "remaining":
            chores = get_todays_chores(data, name)
            remaining = [c for c in chores if not (name and is_chore_done_today(data, name, c["id"]))]
            if not remaining:
                print(f"All chores done{' for ' + name if name else ''}! 🎉")
            else:
                for c in remaining:
                    print(f"  ⬜ {c['name']} — {c['stars']} star{'s' if c['stars'] > 1 else ''}")

        elif sub == "whose-turn":
            chore_name = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else ""
            print(whose_turn(data, chore_name))

    elif cmd == "stars":
        sub = sys.argv[2] if len(sys.argv) > 2 else "check"
        name = sys.argv[3] if len(sys.argv) > 3 else None
        if not name:
            print("Usage: stars check <name>")
            return
        if sub == "check":
            print(check_stars(data, name))
        elif sub == "shop":
            print(list_redeemable(data, name))
        elif sub == "redeem":
            if len(sys.argv) < 5:
                print(list_redeemable(data, name))
                return
            reward_name = " ".join(sys.argv[4:])
            success, msg = redeem_reward(data, name, reward_name)
            print(msg)

    elif cmd == "report":
        name = sys.argv[2] if len(sys.argv) > 2 else None
        print(daily_report(data, name))

    elif cmd == "bedtime":
        sub = sys.argv[2] if len(sys.argv) > 2 else "check"
        name = sys.argv[3] if len(sys.argv) > 3 else None
        if not name:
            print("Usage: bedtime check <name>")
            return
        print(check_bedtime(profiles, name))

    else:
        print(f"Unknown command: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()
