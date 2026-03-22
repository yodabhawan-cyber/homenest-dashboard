#!/usr/bin/env python3
"""
HomeNest School Email Parser
Scans Gmail for school-related emails and extracts:
- Permission slips / consent forms
- Homework assignments & due dates
- School events & excursions
- Payment requests
- Report cards / progress reports

Uses the existing Gmail integration from the workspace.
"""
import sys
import json
import os
import re
from datetime import datetime

# Add the Gmail package path
sys.path.insert(0, '/Users/openclaw/Library/Python/3.9/lib/python/site-packages')

TOKEN_FILE = os.path.expanduser("~/.openclaw/workspace/gmail/token.json")
CLIENT_SECRET = os.path.expanduser("~/.openclaw/workspace/gmail/client_secret.json")

SCHOOL_SENDERS = [
    "noreply@mail.schoolbytes.education",
    "melonbaps-p.school@det.nsw.edu.au",
    "contactus@heyguru.com.au",
    "no-reply-ShsocManage@notification.det.nsw.edu.au",
]

SCHOOL_KEYWORDS = [
    "consent", "permission", "excursion", "camp", "carnival",
    "homework", "assignment", "due date", "report card",
    "payment", "deposit", "school bytes", "melonba",
    "heyguru", "tutoring", "class", "lesson",
]

def get_gmail_service():
    """Initialize Gmail API service."""
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build

    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, ["https://www.googleapis.com/auth/gmail.readonly"])
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            return None
    return build("gmail", "v1", credentials=creds)

def scan_school_emails(days=7, max_results=20):
    """Scan recent emails for school-related content."""
    service = get_gmail_service()
    if not service:
        return {"error": "Gmail not authenticated"}

    # Build query for school senders
    sender_query = " OR ".join([f"from:{s}" for s in SCHOOL_SENDERS])
    query = f"({sender_query}) newer_than:{days}d"

    results = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    messages = results.get("messages", [])

    school_items = []
    for msg in messages:
        full = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
        headers = {h["name"]: h["value"] for h in full.get("payload", {}).get("headers", [])}

        subject = headers.get("Subject", "")
        sender = headers.get("From", "")
        date_str = headers.get("Date", "")
        snippet = full.get("snippet", "")

        # Classify the email
        category = classify_school_email(subject, snippet)
        urgency = assess_urgency(subject, snippet)

        # Extract dates from content
        due_dates = extract_dates(snippet)

        school_items.append({
            "subject": subject,
            "from": sender,
            "date": date_str,
            "category": category,
            "urgency": urgency,
            "due_dates": due_dates,
            "snippet": snippet[:200],
            "message_id": msg["id"],
        })

    return {"items": school_items, "count": len(school_items)}

def classify_school_email(subject, body):
    """Classify school email type."""
    text = (subject + " " + body).lower()
    if any(w in text for w in ["consent", "permission", "excursion", "camp", "carnival"]):
        return "consent_required"
    if any(w in text for w in ["homework", "assignment", "due"]):
        return "homework"
    if any(w in text for w in ["payment", "deposit", "invoice", "fee"]):
        return "payment"
    if any(w in text for w in ["report", "progress", "grade", "achievement"]):
        return "report"
    if any(w in text for w in ["event", "assembly", "sports", "concert"]):
        return "event"
    if any(w in text for w in ["class", "lesson", "schedule", "reschedule"]):
        return "schedule"
    return "general"

def assess_urgency(subject, body):
    """Assess email urgency (high/medium/low)."""
    text = (subject + " " + body).lower()
    if any(w in text for w in ["urgent", "asap", "immediately", "overdue", "today", "tomorrow"]):
        return "high"
    if any(w in text for w in ["due", "deadline", "by friday", "this week", "reminder"]):
        return "medium"
    return "low"

def extract_dates(text):
    """Extract date mentions from text."""
    dates = []
    # Match patterns like "20 Mar", "March 20", "20/03/2026"
    patterns = [
        r'\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4}',
        r'\d{1,2}/\d{1,2}/\d{4}',
        r'(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}\s+\w+',
    ]
    for p in patterns:
        matches = re.findall(p, text, re.IGNORECASE)
        dates.extend(matches)
    return dates[:3]  # Max 3 dates

def summarize_for_voice():
    """Generate a voice-friendly summary of school emails."""
    result = scan_school_emails(days=3)
    if "error" in result:
        return "I couldn't check school emails right now."
    if result["count"] == 0:
        return "No new school emails in the last few days."

    items = result["items"]
    consent = [i for i in items if i["category"] == "consent_required"]
    homework = [i for i in items if i["category"] == "homework"]
    payments = [i for i in items if i["category"] == "payment"]

    parts = [f"Found {result['count']} school emails."]
    if consent:
        parts.append(f"{len(consent)} need consent: {consent[0]['subject'][:50]}.")
    if homework:
        parts.append(f"{len(homework)} homework related.")
    if payments:
        parts.append(f"{len(payments)} payment requests.")

    high_urgency = [i for i in items if i["urgency"] == "high"]
    if high_urgency:
        parts.append(f"Urgent: {high_urgency[0]['subject'][:50]}!")

    return " ".join(parts)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "voice":
        print(summarize_for_voice())
    else:
        result = scan_school_emails()
        print(json.dumps(result, indent=2))
