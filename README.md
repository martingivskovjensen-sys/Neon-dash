# Neon Dash 🕹️

![Neon Dash Screenshot](screenshot.png) <!-- Add your screenshot here -->

Fast-paced arcade reaction game. Control cyan neon orb, dodge pink/purple obstacles, collect powerups (slow-mo 🐌, shield 🛡️, score boost ⭐). Score ramps quadratically, highscores saved locally.

## 🎮 How to Play
- **Controls**: Arrow keys / WASD / Mouse drag / Touch swipe
- **Objective**: Survive as long as possible, score = survival time x multipliers
- **Powerups**: Rare, 5s duration, glowing shapes sliding from edges
- **Audio**: Click to unlock, bg hum + SFX for actions
- Survives screen resize, mobile/desktop optimized

## 🚀 Quick Start
1. Open `index.html` in browser
2. Click START (unlocks audio)
3. Dodge! Restart after gameover

**Windows**: `start index.html`
**Live Demo**: Drag `index.html` to browser

## 🌐 Deploy Render.com (Static Site) - Step-by-Step
1. Create GitHub repo, upload `neon-dash/` folder (all 4 files)
2. render.com dashboard > "New +" > **Static Site** > Connect GitHub repo
3. **Build Command**: Leave **blank** (no build - pure HTML/JS)
4. **Publish directory**: Type `.` (dot) OR leave blank OR `/` - serves repo root files
5. "Create Static Site" → Instant live: `https://your-app-name.onrender.com`

**Publish directory `.` or blank**: Render finds `index.html` at repo root automatically.

Netlify: Drag `neon-dash` folder → Instant deploy.

Netlify/Vercel: Drag-drop folder or "Static site" → Root `/`.

Zero config - pure HTML/CSS/JS!

## 📁 Structure
```
neon-dash/
├── index.html     # Game canvas + UI overlay
├── style.css      # Neon glows, Orbitron font, pulsing bg
└── script.js      # Full logic (vanilla JS, Canvas 60fps, Web Audio)
```

## 🔧 Features
| Feature | Implemented |
|---------|-------------|
| Progressive Difficulty | Quadratic speed + faster spawns |
| Neon Visuals | Glow shadows, trails, particles, explosions |
| Powerups (3 types) | Visual shapes, effects, timers |
| Responsive/Mobile | Touch/swipe, viewport units |
| Audio | Web Audio SFX + BG hum |
| Persistent Highscore | localStorage |
| Polish | Screen shake, UI timers, 60fps cap |

**Pure Vanilla - 0 deps - ~500 LOC**

## 📈 Difficulty Curve
- Speed: `1 + (time*0.001)^1.2` (explosive late game)
- Spawns: `max(0.2s, 1.2 * 0.995^time)` (doubles density)
- Score: Time * multipliers from powerups

## 🎨 Customization
- Colors: Edit `#00ffff` (cyan), `#ff00ff`/ `#aa00ff` (obs), etc
- Difficulty: Tweak `updateGame()` ramps
- Add leaderboard: Replace localStorage w/ server

## 🔥 NEW: Leaderboard + Admin
**Access Admin**: `index.html?admin=neondash2024`
**Password**: `neondash_admin_2024`

**Firebase Setup (5min)**:
1. console.firebase.google.com → New project "neon-dash"
2. Firestore Database → Start in test mode
3. Project Settings (gear) → SDK setup → Config → Copy `firebaseConfig`
4. script.js `initFirebase()` → Paste config
5. Done! Scores submit realtime.

**Admin Features**:
- Timer: Pause/resume leaderboard updates
- View all scores, edit/delete (add doc ID for full CRUD)

## 🛠️ Development
- Edit `script.js` - hot reload in browser
- Debug: `window.neonDash` global game instance
- Admin test: ?admin=neondash2024

**Made with ❤️ using HTML5 Canvas + Firebase** 

⭐ Star on GitHub! Deploy & share highscores!
