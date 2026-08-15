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
- **Backend**: Node.js, Express, TypeScript, JWT (`jsonwebtoken`), `bcryptjs`, RESTful APIs
- **Database**: PostgreSQL (`pg` driver) with fallback data engine for instant zero-dependency execution
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

## 📦 Project Structure

```
PlayX/
├── package.json               # Root scripts to run monorepo concurrently
├── .env.example               # Environment variables template
├── README.md                  # Project documentation
├── database/
│   └── schema.sql             # PostgreSQL Database Schema definition
├── backend/
│   ├── package.json           # Express server dependencies
│   ├── tsconfig.json          # Backend TypeScript configuration
│   └── src/
│       ├── index.ts           # Express server entry point & static file hosting
│       ├── config/            # Environment configurations
│       ├── db/                # PostgreSQL connection pool & migration runner
│       ├── middleware/        # JWT Authentication & error handling
│       ├── routes/            # API Endpoints (auth, songs, artists, albums, playlists, etc.)
│       └── seed/              # Database seeder with demo music tracks
└── frontend/
    ├── package.json           # Vite React dependencies
    ├── vite.config.ts         # Vite server configuration & API proxy
    ├── tailwind.config.js     # Tailwind CSS theme customization
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
- PostgreSQL (Optional; if PostgreSQL is not running locally, PLAYX automatically switches to its fallback engine so it works immediately out of the box!)

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
2. If using Replit Database (Postgres), set `DATABASE_URL` in **Secrets (Environment Variables)**.
3. Click **Run**. Replit will execute `npm run dev`, launching both the Express backend API and the Vite frontend web server automatically.

---

## 📜 Database Schema (PostgreSQL)

The database includes 11 tables:
- `subscriptions`
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

Migration queries and seed data are stored in `database/schema.sql` and `backend/src/seed/seedData.ts`.
