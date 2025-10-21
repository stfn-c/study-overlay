# Study Overlay - System Redesign Plan

## Overview
This document outlines the comprehensive redesign of the Study Overlay system to support both legacy overlays (v1) and a new, improved overlay system (v2).

## Goals
1. **Backward Compatibility**: All existing overlay links must continue to work
2. **Enhanced Customization**: Users should be able to customize colors, fonts, layouts, and animations
3. **More Overlay Types**: Expand beyond Pomodoro, Spotify, and Time
4. **Better UX**: Improved link generation, preview system, and user dashboard
5. **Modern Architecture**: Leverage App Router, Server Components, and modern React patterns

---

## Architecture

### Route Structure
```
/                          → Home page (link generator)
/dashboard                 → User dashboard (manage saved overlays)
/preview/[id]              → Preview overlay before using

# Legacy Routes (v1) - Backward Compatible
/pomodoro                  → Pomodoro timer (existing)
/spotify                   → Spotify tracker (existing)
/localTime                 → Local time display (existing)
/time/flip                 → Flip clock (existing)

# New Routes (v2)
/v2/overlay/[id]          → New overlay system (dynamic)
/v2/builder               → Visual overlay builder

# API Routes
/api/overlays             → CRUD operations for overlays
/api/themes               → Theme management
/api/analytics            → Usage analytics
```

---

## New Features

### 1. Overlay Builder
- **Visual Editor**: Drag-and-drop interface to build custom overlays
- **Real-time Preview**: See changes instantly
- **Component Library**: Pre-built widgets (timer, clock, progress bar, text, etc.)
- **Layout System**: Grid-based positioning with snap-to-grid
- **Export/Import**: Share overlay configurations

### 2. Theme System
```typescript
interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
  };
  spacing: {
    padding: string;
    margin: string;
    gap: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}
```

### 3. New Overlay Types

#### Study Goals Tracker
- Display daily/weekly study goals
- Progress bars for each goal
- Completion animations

#### Task List
- Show current tasks/todos
- Check off completed items
- Priority indicators

#### Motivational Quotes
- Rotating inspirational quotes
- Customizable quote sources
- Fade-in/out animations

#### Study Stats
- Total study time today
- Streak counter
- Focus sessions completed

#### Calendar/Schedule
- Show upcoming events
- Current class/study block
- Time until next break

#### Weather Widget
- Current weather display
- Minimalist design
- Location-based

#### GitHub Contributions
- Live contribution graph
- Commit streak
- Current project status

### 4. Customization Options

#### For All Overlays:
- **Colors**: Background, text, accent colors
- **Fonts**: Google Fonts integration
- **Size**: Adjustable dimensions
- **Position**: Anchor points (top-left, top-right, etc.)
- **Opacity**: Background transparency
- **Animations**: Entrance/exit effects, transitions
- **Borders**: Style, width, radius, color

#### Overlay-Specific:
- **Pomodoro**: Custom work/break durations, sound alerts, visual themes
- **Spotify**: Album art styles (square, circle, vinyl), progress bar styles
- **Clock**: 12/24 hour, date format, timezone display

### 5. User Dashboard Features
- **Saved Overlays**: Library of all created overlays
- **Quick Actions**: Duplicate, edit, delete, share
- **Analytics**: View count, usage time, popular overlays
- **Templates**: Pre-made overlay templates
- **Collections**: Organize overlays into folders
- **Search & Filter**: Find overlays quickly
- **Version History**: Restore previous configurations

### 6. Advanced Features

#### URL Parameters System
```
# Legacy (still works)
/pomodoro?workingTime=25&restTime=5

# New system (more powerful)
/v2/overlay/[id]?theme=dark&scale=1.2&position=top-right
```

#### Overlay Configuration Storage
- Use database (Vercel KV or PostgreSQL) to store configurations
- Generate short IDs for sharing
- Support for public/private overlays

#### Real-time Sync
- WebSocket support for live updates
- Multiple device sync
- Collaborative overlay editing

---

## Database Schema

### Overlays Table
```sql
CREATE TABLE overlays (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pomodoro', 'spotify', 'clock', 'custom', etc.
  version TEXT DEFAULT 'v2',
  config JSONB NOT NULL,
  theme_id TEXT,
  is_public BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Themes Table
```sql
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  is_preset BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Analytics Table
```sql
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  overlay_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'view', 'copy', 'share'
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [x] Migrate to App Router
- [ ] Set up database (Vercel KV or Supabase)
- [ ] Create theme system
- [ ] Build component library

### Phase 2: New Overlay Types (Week 2)
- [ ] Implement Study Goals Tracker
- [ ] Implement Task List overlay
- [ ] Implement Motivational Quotes
- [ ] Implement Study Stats

### Phase 3: Builder & Customization (Week 3)
- [ ] Create visual overlay builder
- [ ] Implement theme editor
- [ ] Add customization controls
- [ ] Build preview system

### Phase 4: Dashboard & Management (Week 4)
- [ ] Create user dashboard
- [ ] Implement overlay library
- [ ] Add analytics tracking
- [ ] Build sharing features

### Phase 5: Advanced Features (Week 5)
- [ ] Add real-time sync
- [ ] Implement collections
- [ ] Create template marketplace
- [ ] Add export/import

### Phase 6: Polish & Launch (Week 6)
- [ ] Testing and bug fixes
- [ ] Documentation
- [ ] Marketing materials
- [ ] Launch v2

---

## Technical Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + HeadlessUI
- **State Management**: Zustand or Jotai
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **API**: Next.js Route Handlers
- **Database**: Vercel KV / Supabase / PlanetScale
- **ORM**: Prisma
- **Auth**: NextAuth.js (optional for user accounts)
- **File Storage**: Vercel Blob (for assets)

### DevOps
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics + Custom analytics
- **Monitoring**: Sentry
- **CI/CD**: Vercel automatic deployments

---

## Migration Strategy

### Backward Compatibility
1. Keep all `/pomodoro`, `/spotify`, `/localTime`, `/time/flip` routes working
2. No changes to existing URL structure
3. Add version detection: if URL doesn't have overlay ID, use legacy renderer

### Gradual Rollout
1. **Phase 1**: Deploy v2 alongside v1 (both systems active)
2. **Phase 2**: Add banner on v1 pages suggesting v2 upgrade
3. **Phase 3**: Provide migration tool to convert v1 links to v2
4. **Phase 4**: Eventually make v1 read-only (no new creations, only playback)

---

## Success Metrics

1. **Usage**: 80% of new overlays use v2 system within 3 months
2. **Retention**: Users create average of 3+ overlays
3. **Customization**: 60%+ of overlays have custom themes
4. **Performance**: < 2s initial load time for all overlays
5. **Reliability**: 99.9% uptime

---

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create database schema and migrations
4. Start Phase 1 implementation
5. Weekly progress reviews

---

*Last updated: 2025-10-21*
