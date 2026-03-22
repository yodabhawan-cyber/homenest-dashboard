# HomeNest Dashboard

A modern React + Vite dashboard for the HomeNest family AI assistant.

## 🎨 Features

- **Dark theme** smart home control panel design
- **5 main pages:**
  - **Home** — Family status overview, quick stats, recent activity
  - **Chores** — Interactive chore management with star rewards
  - **Profiles** — Family member profiles with device access controls
  - **Devices** — Smart home device controls grouped by room
  - **Settings** — Voice, safety, notification, and system settings
- **Responsive design** — Works on desktop, tablet, and mobile
- **Tailwind CSS** for modern styling
- **React Router** for navigation

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server (runs on port 3100)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📂 Project Structure

```
dashboard/
├── public/
│   └── config/          # JSON config files
│       ├── profiles.json
│       ├── chores.json
│       └── devices.json
├── src/
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── Chores.jsx
│   │   ├── Profiles.jsx
│   │   ├── Devices.jsx
│   │   └── Settings.jsx
│   ├── App.jsx          # Main app with routing & layout
│   ├── main.jsx
│   └── index.css        # Tailwind imports
├── index.html
├── vite.config.js       # Vite config (port 3100)
└── tailwind.config.js   # Tailwind config
```

## 👨‍👩‍👧‍👦 Family Context

- **Snehal** (👨) — Dad, full device access
- **Ayush** (👦) — Son, age 10-12, 120 min screen time, bedtime 21:00
- **Ahana** (👧) — Daughter, age 6-9, 90 min screen time, bedtime 20:00
- **Arlo** (🐕) — Family dog

## 🎯 Chore System

Kids earn stars ⭐ for completing chores:
- Daily chores (1-2 stars)
- Weekly chores (3 stars)
- Reward tiers at 10, 25, 50, and 100 stars

## 🔧 Configuration

Config files are in `../config/`:
- `profiles.json` — Family member profiles
- `chores.json` — Chore definitions and reward tracking
- `devices.json` — Home Assistant device list

## 🌐 Access

- Local: http://localhost:3100
- Network: http://192.168.4.52:3100

## 🛠️ Tech Stack

- React 19
- Vite 8
- Tailwind CSS 4
- React Router 7
