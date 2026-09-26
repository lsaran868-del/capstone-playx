# PLAYX 🎵 — Spotify-Inspired Music Streaming Web Application

**PLAYX** is a complete, full-stack, Spotify-inspired music streaming web application designed for a CSE Capstone Project. It features a modern dark-themed responsive UI, JWT-based user authentication, a persistent

 global audio player, song search, playlists, favorites, listening history, artist studio dashboard, admin
  control panel, and a subscription simulation system.

---

## 🚀 Key Features

1. **User Authentication & Authorization**
   - User Registration, Login, Logout, Profile updates.
   - Role-based Access Control (`user`, `artist`, `admin`).
   - Secure password hashing using **bcrypt**.

2. **Home Dashboard**
   - Recommended songs, Popular tracks, Recently played history, and New releases.

3. **Global Persistent Music Player**
   - Seamless music playback that stays active while navigating across pages.
   - Controls: Play, Pause, Next, Previous, Shuffle, Repeat.
   - Real-time progress seek bar, song duration display, volume controller, and liked song toggling.

4. **Music Library & Search**
   - Unified search across Songs, Artists, and Albums.
   - Filter by music genres (Synthwave, Electronic, Lo-Fi, Classical, etc.).

5. **Playlists & Favorites**
   - Create, rename, and delete custom playlists.
   - Add and remove songs from playlists.
   - Liked Songs library with one-click favoriting.

6. **Artist Creator Dashboard**
   - Add new songs with audio links and artwork.
   - Edit & delete existing tracks.
   - Create and organize albums.
   - View streaming statistics (Total streams, song count, album catalog).

7. **Admin Control Panel**
   - Manage users, update user roles (user / artist / admin), or remove accounts.
   - Manage songs, artists, albums, and playlists across the platform.
   - System analytics overview (Total streams, registered users, track catalog).

8. **Subscription System**
   - Free vs. Premium plan comparison.
   - One-click demo subscription upgrade simulation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, Axios
- **Backend**: Java 17+, Spring Boot 3, Spring Security, Spring Data JPA, JWT (`jjwt`), Maven
- **Database**: Supabase PostgreSQL cloud relational database (12 tables with Row Level Security)
- **Audio Streaming**: Local high-fidelity MP3 music tracks bundled in `public/audio/`, HTTP byte-range audio streaming
- **Styling**: Modern dark mode with Glassmorphism backdrop filters and custom responsive layout

---

## 🔑 Demo Accounts

For fast testing and demo evaluation, use these pre-seeded accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `AdminPass123` | Full administrative control & platform analytics |
| **Artist** | `artist@example.com` | `ArtistPass123` | Publish tracks, create albums, creator analytics |
| **Premium User** | `premium@example.com` | `PremiumPass123` | Ad-free listening & premium features |
| **Free User** | `user@example.com` | `UserPass123` | Standard music listener account |

---

## 🎵 Pre-Loaded Audio Catalog

PLAYX comes bundled with offline-ready, high-quality royalty-free MP3 music audios spanning all 6 genres:
- **Synthwave**: *Midnight Neon Drive*, *Retro Sunset Boulevard*, *Miami Nights Outrun*
- **Pop**: *Summer Breeze Vibes*, *Party Lights & City Glow*, *Golden Hour Melody*
- **Rock**: *Thunder Strike*, *Rebel Road Blaze*, *High Octane Anthem*
- **Lo-Fi Beats**: *Rainy Night Study Session*, *Cozy Corner Cafe*, *Morning Dew Drops*
- **Classical**: *Starlight Odyssey*, *The Ragtime Classic*, *Baroque Little Fugue*
- **Electronic**: *Cybernetic Pulse*, *Electric Dreams*, *Deep Space Nebula*, *8-Bit Pixel Arena*

All audio tracks are stored locally in `frontend/public/audio/` and `backend/public/audio/`, providing instant playback without network delays or external dependency timeouts.

---

## 📦 Project Structure

```
PlayX/
├── package.json               # Root scripts to run monorepo concurrently
├── .env.example               # Environment variables template
├── README.md                  # Project documentation
├── database/
│   └── schema.sql             # MySQL Database Schema definition
├── backend/                   # Spring Boot 3 Backend
│   ├── pom.xml                # Maven dependencies & build configuration
│   ├── mvnw.cmd               # Maven wrapper executable
│   ├── public/audio/          # Bundled MP3 audio files for backend streaming
│   └── src/main/
│       ├── java/com/playx/
│       │   ├── config/        # Spring MVC static resource handlers
│       │   ├── controller/    # REST API Controllers (Songs, Artists, Playlists, etc.)
│       │   ├── model/         # JPA Entities
│       │   ├── repository/    # Spring Data Repositories
│       │   ├── security/      # JWT Filter & Spring Security configuration
│       │   └── service/       # SeedDataService with pre-loaded music catalog
│       └── resources/
│           └── application.properties # Server port & H2 database configuration
└── frontend/                  # Vite + React 18 Frontend
    ├── package.json           # Vite React dependencies
    ├── vite.config.ts         # Vite server configuration & API proxy
    ├── tailwind.config.js     # Tailwind CSS theme customization
    ├── public/audio/          # Bundled MP3 audio files for direct frontend playback
    └── src/
        ├── App.tsx            # Main layout router with persistent player
        ├── context/           # AuthContext & PlayerContext state management
        ├── components/        # Sidebar, Navbar, Player, SongRow, Card, Modals
        └── pages/             # Home, Search, Library, Dashboards, Auth pages
```

---

## ⚙️ Quick Start (Local Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase Project (`lsaran868-playx` on PostgreSQL 17)

### Installation Steps

1. **Clone the repository and install dependencies:**
   ```bash
   cmd /c "npm run install:all"
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```

3. **Build TypeScript backend and frontend:**
   ```bash
   cmd /c "npm run build"
   ```

4. **Start the application:**
   ```bash
   cmd /c "npm run dev"
   ```
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)

---

## 🌐 Running on Replit

PLAYX is pre-configured to run on Replit:

1. Import the repository into Replit.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in **Secrets (Environment Variables)**.
3. Click **Run**. Replit will execute `npm run dev`, launching both the Express backend API and the Vite frontend web server automatically.

---

## 📜 Database Schema (Supabase PostgreSQL)

The database includes 12 relational tables managed via Supabase:
- `subscriptions`
- `subscription_features`
- `users`
- `user_subscriptions`
- `artists`
- `albums`
- `genres`
- `songs`
- `playlists`
- `playlist_songs`
- `favorites`
- `listening_history`

Data persistence and Row Level Security (RLS) are enforced directly through Supabase PostgreSQL.
