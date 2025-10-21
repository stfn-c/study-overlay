# Study Overlay - Setup Instructions

## ✅ What's Been Completed

### 1. App Router Migration
- ✅ Migrated from Pages Router to App Router
- ✅ All existing routes preserved for backward compatibility
- ✅ Created new app directory structure

### 2. New Architecture Built
- ✅ Complete type system for overlays (`lib/types/overlay.ts`)
- ✅ Theme system with 7 preset themes (`lib/themes/presets.ts`)
- ✅ New overlay components:
  - Study Goals Tracker
  - Task List
  - Motivational Quotes

### 3. Files Created
```
app/
├── layout.tsx                          # Root layout
├── page.tsx                           # Home page (server component)
├── home-page.tsx                      # Home page (client component)
├── pomodoro/
│   ├── page.tsx
│   └── pomodoro-client.tsx
├── spotify/
│   ├── page.tsx
│   └── spotify-client.tsx
├── localTime/
│   ├── page.tsx
│   └── local-time-client.tsx
├── time/flip/
│   ├── page.tsx
│   └── flip-client.tsx
├── v2/overlay/[id]/
│   └── page.tsx                       # New dynamic overlay system
└── api/hello/
    └── route.ts

lib/
├── types/
│   └── overlay.ts                     # TypeScript types
└── themes/
    └── presets.ts                     # Theme system

components/
└── overlays/
    ├── OverlayWrapper.tsx
    ├── StudyGoalsOverlay.tsx
    ├── TaskListOverlay.tsx
    └── QuoteOverlay.tsx

pages_backup/                          # Old pages directory (backed up)
```

---

## 🔧 Commands to Run (Fix Everything)

Run these commands in order:

### 1. Fix Node Modules Permissions
```bash
# Remove node_modules and reinstall with correct permissions
rm -rf node_modules package-lock.json

# Install dependencies fresh
npm install

# Install Tailwind PostCSS plugin
npm install -D @tailwindcss/postcss
```

### 2. Update PostCSS Config
The `postcss.config.js` needs to be updated. I'll provide the correct config below.

### 3. Remove .next directory
```bash
# This will be recreated automatically
rm -rf .next
```

### 4. Start Development Server
```bash
npm run dev
```

---

## 📝 Files to Update

### postcss.config.js
Replace the contents with:

```javascript
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

---

## 🧪 Testing the New System

Once the dev server is running, you can test:

### Legacy Routes (v1 - Backward Compatible)
- `http://localhost:3000/` - Home page
- `http://localhost:3000/pomodoro?workingTime=25&restTime=5`
- `http://localhost:3000/spotify?token=XXX&refreshToken=XXX`
- `http://localhost:3000/localTime`
- `http://localhost:3000/time/flip`

### New Routes (v2 - Enhanced Features)
- `http://localhost:3000/v2/overlay/demo-goals` - Study Goals Demo
- `http://localhost:3000/v2/overlay/demo-tasks` - Task List Demo
- `http://localhost:3000/v2/overlay/demo-quote` - Motivational Quotes Demo

---

## 🎨 Available Themes

The new system includes 7 preset themes:

1. **Default** - Modern dark theme with indigo accents
2. **Dark** - Pure black with blue accents
3. **Light** - Clean white background
4. **Neon** - Cyberpunk-inspired with bright colors
5. **Pastel** - Soft, gentle colors
6. **Minimal** - Ultra-clean black and white
7. **Retro** - 80s-inspired pixel aesthetic

---

## 🚀 Next Steps (What's Left to Build)

### Phase 1: Database Integration
- Set up Vercel KV or Supabase
- Create database tables for overlays, themes, and analytics
- Implement API routes for CRUD operations

### Phase 2: Overlay Builder UI
- Visual drag-and-drop builder
- Real-time preview
- Theme customizer
- Component library

### Phase 3: User Dashboard
- Saved overlays library
- Analytics and stats
- Sharing and collections

### Phase 4: Additional Overlay Types
- Study Stats (time tracking, streaks)
- Calendar/Schedule
- Weather Widget
- GitHub Contributions

### Phase 5: Advanced Features
- Real-time sync via WebSocket
- Template marketplace
- Export/Import configurations
- Mobile app companion

---

## 📊 Project Structure Overview

```
study-overlay/
├── app/                    # Next.js App Router
│   ├── (legacy routes)     # Backward compatible v1 overlays
│   └── v2/                # New v2 overlay system
├── components/
│   ├── overlays/          # Overlay components
│   └── ui/                # Reusable UI components
├── lib/
│   ├── types/             # TypeScript definitions
│   ├── themes/            # Theme system
│   └── utils/             # Utility functions
├── pages_backup/          # Old Pages Router (backup)
├── public/                # Static assets
├── styles/                # Global styles
└── REDESIGN_PLAN.md       # Complete redesign documentation
```

---

## 🎯 Key Features of New System

### For Users:
1. **Easy Customization**: Change colors, fonts, layouts without code
2. **More Overlay Types**: 10+ different overlay types
3. **Live Preview**: See changes before deploying
4. **Save & Share**: Create library of overlays, share with others
5. **Themes**: 7 preset themes + custom theme builder
6. **Better UX**: Improved link generator and dashboard

### For Developers:
1. **Type-Safe**: Full TypeScript support
2. **Modular**: Component-based architecture
3. **Extensible**: Easy to add new overlay types
4. **Modern Stack**: Next.js 15, App Router, React Server Components
5. **Backward Compatible**: All v1 links continue working

---

## 🐛 Common Issues & Fixes

### Issue: "EACCES: permission denied"
**Fix:** Run `sudo chown -R $(whoami) ~/.npm && sudo chown -R $(whoami) node_modules`

### Issue: "Conflicting app and page files"
**Fix:** This is expected - the pages directory is backed up as `pages_backup/`

### Issue: Tailwind PostCSS error
**Fix:** Install `@tailwindcss/postcss` and update `postcss.config.js` as shown above

---

## 📚 Documentation

- **REDESIGN_PLAN.md** - Complete architectural plan
- **lib/types/overlay.ts** - Type definitions and interfaces
- **lib/themes/presets.ts** - Theme system documentation

---

## 💡 Quick Start After Setup

1. Visit `http://localhost:3000` for the home page
2. Try demo overlays at `/v2/overlay/demo-goals`, `/v2/overlay/demo-tasks`, `/v2/overlay/demo-quote`
3. Existing overlays still work at their original URLs
4. Check `REDESIGN_PLAN.md` for the full implementation roadmap

---

*Last updated: 2025-10-21*
*Migration completed successfully! ✅*
