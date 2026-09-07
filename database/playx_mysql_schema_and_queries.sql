-- =====================================================================
-- PLAYX — MUSIC STREAMING COMMUNITY PLATFORM
-- MySQL 8.4 Database Implementation, DDL, DML, JOINs & Constraint Testing
-- Report Type: Database Practical / Project Documentation
-- =====================================================================

-- 1. DATABASE INITIALIZATION
DROP DATABASE IF EXISTS playx_db;
CREATE DATABASE playx_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE playx_db;

-- =====================================================================
-- 2. TABLE CREATION & KEY CONSTRAINTS (DDL)
-- =====================================================================

-- Table 1: Subscriptions
CREATE TABLE subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table 2: Users
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'artist', 'admin')),
    avatar TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table 3: User Subscriptions
CREATE TABLE user_subscriptions (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    subscription_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired')),
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 4: Genres
CREATE TABLE genres (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    cover_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table 5: Artists
CREATE TABLE artists (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NULL,
    name VARCHAR(150) NOT NULL,
    bio TEXT,
    image TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    monthly_listeners INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 6: Albums
CREATE TABLE albums (
    id VARCHAR(50) PRIMARY KEY,
    artist_id VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    cover_art TEXT,
    release_year INT DEFAULT 2024,
    genre VARCHAR(50) DEFAULT 'Pop',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 7: Songs
CREATE TABLE songs (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    artist_id VARCHAR(50) NOT NULL,
    album_id VARCHAR(50) NULL,
    genre_id VARCHAR(50) NULL,
    audio_url TEXT NOT NULL,
    duration INT NOT NULL DEFAULT 180,
    cover_art TEXT,
    plays_count INT DEFAULT 0,
    release_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Table 8: Playlists
CREATE TABLE playlists (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    cover_art TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 9: Playlist Songs (Composite Unique Key)
CREATE TABLE playlist_songs (
    id VARCHAR(50) PRIMARY KEY,
    playlist_id VARCHAR(50) NOT NULL,
    song_id VARCHAR(50) NOT NULL,
    position INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_playlist_song (playlist_id, song_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 10: Favorites (Composite Unique Key)
CREATE TABLE favorites (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    song_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_fav_song (user_id, song_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 11: Listening History
CREATE TABLE listening_history (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    song_id VARCHAR(50) NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================================
-- 3. SAMPLE DATA INSERTION (DML - In FK-Safe Order)
-- =====================================================================

-- 3.1 Subscriptions
INSERT INTO subscriptions (id, name, price, description) VALUES
('sub_free', 'Free', 0.00, 'Standard ad-supported listening'),
('sub_premium', 'Premium', 9.99, 'Unlimited ad-free music & HD streaming');

-- 3.2 Users
INSERT INTO users (id, name, email, password, role) VALUES
('usr_admin', 'Alex Admin', 'admin@example.com', '$2a$10$hashed_admin_pass', 'admin'),
('usr_artist', 'Synthwave Neo', 'artist@example.com', '$2a$10$hashed_artist_pass', 'artist'),
('usr_user', 'Chris Listener', 'user@example.com', '$2a$10$hashed_user_pass', 'user'),
('usr_premium', 'Sophia Premium', 'premium@example.com', '$2a$10$hashed_prem_pass', 'user'),
('usr_guest', 'Guest Explorer', 'guest@example.com', '$2a$10$hashed_guest_pass', 'user');

-- 3.3 User Subscriptions
INSERT INTO user_subscriptions (id, user_id, subscription_id, status) VALUES
('usub_1', 'usr_admin', 'sub_premium', 'active'),
('usub_2', 'usr_artist', 'sub_premium', 'active'),
('usub_3', 'usr_user', 'sub_free', 'active'),
('usub_4', 'usr_premium', 'sub_premium', 'active');

-- 3.4 Genres
INSERT INTO genres (id, name, slug) VALUES
('gnr_synthwave', 'Synthwave', 'synthwave'),
('gnr_pop', 'Pop', 'pop'),
('gnr_lofi', 'Lo-Fi Beats', 'lofi'),
('gnr_rock', 'Rock', 'rock'),
('gnr_electronic', 'Electronic', 'electronic'),
('gnr_classical', 'Classical', 'classical');

-- 3.5 Artists
INSERT INTO artists (id, user_id, name, bio, monthly_listeners) VALUES
('art_synth', 'usr_artist', 'Synthwave Neo', 'Pioneer of retro-futuristic electronic soundscapes.', 1420500),
('art_daft', NULL, 'Cyber Robots', 'Legendary French electronic duo crafting dance anthems.', 3250000),
('art_hans', NULL, 'Orchestral Dreams', 'World-renowned cinematic composer behind epic soundtracks.', 2890000),
('art_lofi', NULL, 'Midnight Chill', 'Cozy lo-fi beats for late night coding and study.', 980000),
('art_luna', NULL, 'Luna Eclipse', 'Dynamic pop sensation delivering infectious hooks.', 2150000),
('art_wolves', NULL, 'The Electric Wolves', 'Raw energy, anthemic rock riffs and overdrive.', 1840000),
('art_pixel', NULL, 'Pixel Pulse', 'Chiptune and 8-bit electronic synthesist.', 670000);

-- 3.6 Albums
INSERT INTO albums (id, artist_id, title, release_year, genre) VALUES
('alb_neon', 'art_synth', 'Neon Highway 1984', 2024, 'Synthwave'),
('alb_retro_horizon', 'art_synth', 'Laser Horizon 2088', 2025, 'Synthwave'),
('alb_cyber', 'art_daft', 'Digital World', 2023, 'Electronic'),
('alb_inter', 'art_hans', 'Cosmic Horizons', 2024, 'Classical'),
('alb_classics_reborn', 'art_hans', 'Timeless Symphonies', 2024, 'Classical'),
('alb_lofi', 'art_lofi', 'Late Night Coffee', 2025, 'Lo-Fi Beats'),
('alb_chill_cafe', 'art_lofi', 'Rainy City Beats', 2025, 'Lo-Fi Beats'),
('alb_pop_starlight', 'art_luna', 'Starlight Pop', 2025, 'Pop'),
('alb_rock_ignition', 'art_wolves', 'Ignition Overdrive', 2024, 'Rock');

-- 3.7 Songs
INSERT INTO songs (id, title, artist_id, album_id, genre_id, audio_url, duration, plays_count) VALUES
('sng_neon_drive', 'Midnight Neon Drive', 'art_synth', 'alb_neon', 'gnr_synthwave', '/audio/sng_neon_drive.mp3', 204, 48920),
('sng_retro_sunset', 'Retro Sunset Boulevard', 'art_synth', 'alb_neon', 'gnr_synthwave', '/audio/sng_retro_sunset.mp3', 268, 31200),
('sng_miami_nights', 'Miami Nights Outrun', 'art_synth', 'alb_retro_horizon', 'gnr_synthwave', '/audio/sng_miami_nights.mp3', 180, 54100),
('sng_summer_breeze', 'Summer Breeze Vibes', 'art_luna', 'alb_pop_starlight', 'gnr_pop', '/audio/sng_summer_breeze.mp3', 215, 89400),
('sng_party_lights', 'Party Lights & City Glow', 'art_luna', 'alb_pop_starlight', 'gnr_pop', '/audio/sng_party_lights.mp3', 245, 112000),
('sng_golden_hour', 'Golden Hour Melody', 'art_luna', 'alb_pop_starlight', 'gnr_pop', '/audio/sng_golden_hour.mp3', 212, 64800),
('sng_thunder_strike', 'Thunder Strike', 'art_wolves', 'alb_rock_ignition', 'gnr_rock', '/audio/sng_thunder_strike.mp3', 210, 78500),
('sng_rebel_blaze', 'Rebel Road Blaze', 'art_wolves', 'alb_rock_ignition', 'gnr_rock', '/audio/sng_rebel_blaze.mp3', 226, 62300),
('sng_sports_anthem', 'High Octane Anthem', 'art_wolves', 'alb_rock_ignition', 'gnr_rock', '/audio/sng_sports_anthem.mp3', 192, 43900),
('sng_lofi_rain', 'Rainy Night Study Session', 'art_lofi', 'alb_lofi', 'gnr_lofi', '/audio/sng_lofi_rain.mp3', 215, 125300),
('sng_cozy_coffee', 'Cozy Corner Cafe', 'art_lofi', 'alb_chill_cafe', 'gnr_lofi', '/audio/sng_cozy_coffee.mp3', 226, 88400),
('sng_morning_dew', 'Morning Dew Drops', 'art_lofi', 'alb_chill_cafe', 'gnr_lofi', '/audio/sng_morning_dew.mp3', 176, 95600),
('sng_starlight', 'Starlight Odyssey', 'art_hans', 'alb_inter', 'gnr_classical', '/audio/sng_starlight.mp3', 219, 67100),
('sng_the_entertainer', 'The Ragtime Classic', 'art_hans', 'alb_classics_reborn', 'gnr_classical', '/audio/sng_the_entertainer.mp3', 235, 51200),
('sng_tiny_fugue', 'Baroque Little Fugue', 'art_hans', 'alb_classics_reborn', 'gnr_classical', '/audio/sng_tiny_fugue.mp3', 102, 39800),
('sng_cyber_pulse', 'Cybernetic Pulse', 'art_daft', 'alb_cyber', 'gnr_electronic', '/audio/sng_cyber_pulse.mp3', 228, 98400),
('sng_electric_dream', 'Electric Dreams', 'art_daft', 'alb_cyber', 'gnr_electronic', '/audio/sng_electric_dream.mp3', 184, 73000),
('sng_science_beat', 'Deep Space Nebula', 'art_daft', 'alb_cyber', 'gnr_electronic', '/audio/sng_science_beat.mp3', 215, 81200),
('sng_pixel_arcade', '8-Bit Pixel Arena', 'art_pixel', 'alb_cyber', 'gnr_electronic', '/audio/sng_pixel_arcade.mp3', 198, 57600);

-- 3.8 Playlists
INSERT INTO playlists (id, user_id, name, description) VALUES
('pl_coding', 'usr_admin', 'Coding & Focus Essentials', 'The ultimate synthwave & lo-fi playlist.'),
('pl_retro', 'usr_user', '80s Neon Retro Hits', 'Synthwave, outrun, and cyberpunk melodies.'),
('pl_rock_energy', 'usr_admin', 'Rock & Energy Workout', 'High-voltage guitar anthems to power up workouts.'),
('pl_pop_hits', 'usr_premium', 'Pop Euphoria 2025', 'Top charting pop hits and upbeat melodies.'),
('pl_classical_harmony', 'usr_admin', 'Classical Masterpieces', 'Timeless piano and calming symphonies.');

-- 3.9 Playlist Songs
INSERT INTO playlist_songs (id, playlist_id, song_id, position) VALUES
('ps_1', 'pl_coding', 'sng_neon_drive', 1),
('ps_2', 'pl_coding', 'sng_lofi_rain', 2),
('ps_3', 'pl_coding', 'sng_cyber_pulse', 3),
('ps_4', 'pl_coding', 'sng_cozy_coffee', 4),
('ps_5', 'pl_retro', 'sng_neon_drive', 1),
('ps_6', 'pl_retro', 'sng_retro_sunset', 2),
('ps_7', 'pl_retro', 'sng_miami_nights', 3),
('ps_8', 'pl_rock_energy', 'sng_thunder_strike', 1),
('ps_9', 'pl_rock_energy', 'sng_rebel_blaze', 2),
('ps_10', 'pl_rock_energy', 'sng_sports_anthem', 3),
('ps_11', 'pl_pop_hits', 'sng_summer_breeze', 1),
('ps_12', 'pl_pop_hits', 'sng_party_lights', 2),
('ps_13', 'pl_pop_hits', 'sng_golden_hour', 3),
('ps_14', 'pl_classical_harmony', 'sng_starlight', 1),
('ps_15', 'pl_classical_harmony', 'sng_the_entertainer', 2),
('ps_16', 'pl_classical_harmony', 'sng_tiny_fugue', 3);

-- 3.10 Favorites
INSERT INTO favorites (id, user_id, song_id) VALUES
('fav_1', 'usr_user', 'sng_neon_drive'),
('fav_2', 'usr_user', 'sng_lofi_rain'),
('fav_3', 'usr_user', 'sng_summer_breeze'),
('fav_4', 'usr_user', 'sng_thunder_strike');

-- 3.11 Listening History
INSERT INTO listening_history (id, user_id, song_id) VALUES
('hist_1', 'usr_user', 'sng_neon_drive'),
('hist_2', 'usr_user', 'sng_party_lights'),
('hist_3', 'usr_user', 'sng_cozy_coffee');

-- =====================================================================
-- 4. VERIFICATION OF ROW COUNTS
-- =====================================================================
SELECT 'users' AS table_name, COUNT(*) AS records FROM users
UNION ALL
SELECT 'subscriptions', COUNT(*) FROM subscriptions
UNION ALL
SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL
SELECT 'genres', COUNT(*) FROM genres
UNION ALL
SELECT 'artists', COUNT(*) FROM artists
UNION ALL
SELECT 'albums', COUNT(*) FROM albums
UNION ALL
SELECT 'songs', COUNT(*) FROM songs
UNION ALL
SELECT 'playlists', COUNT(*) FROM playlists
UNION ALL
SELECT 'playlist_songs', COUNT(*) FROM playlist_songs
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'listening_history', COUNT(*) FROM listening_history;

-- =====================================================================
-- 5. JOIN OPERATIONS
-- =====================================================================

-- 5.1 INNER JOIN: Get user and their playlist names
SELECT 
    u.name AS user_name,
    p.name AS playlist_name,
    p.is_public
FROM users u
INNER JOIN playlists p ON u.id = p.user_id;

-- 5.2 LEFT JOIN: Get all users and their playlists (including users without playlists)
SELECT 
    u.name AS user_name,
    u.email,
    p.name AS playlist_name
FROM users u
LEFT JOIN playlists p ON u.id = p.user_id;

-- 5.3 RIGHT JOIN: Get artists and their associated songs (shows all songs and their artist)
SELECT 
    a.name AS artist_name,
    s.title AS song_title,
    s.duration
FROM artists a
RIGHT JOIN songs s ON a.id = s.artist_id;

-- 5.4 FULL JOIN (Emulated in MySQL via LEFT JOIN UNION RIGHT JOIN)
SELECT 
    u.name AS user_name,
    p.name AS playlist_name
FROM users u
LEFT JOIN playlists p ON u.id = p.user_id
UNION
SELECT 
    u.name AS user_name,
    p.name AS playlist_name
FROM users u
RIGHT JOIN playlists p ON u.id = p.user_id;

-- 5.5 NATURAL JOIN: Join songs and albums matching on common column names
SELECT 
    id,
    title,
    artist_id,
    release_year
FROM songs
NATURAL JOIN albums;

-- =====================================================================
-- 6. COMPOSITE KEY & INTEGRITY TESTING
-- =====================================================================

-- 6.1 Composite Unique Key Violation Test
-- Trying to add the same song to the same playlist twice should fail with Error 1062
-- INSERT INTO playlist_songs (id, playlist_id, song_id, position) VALUES ('ps_err1', 'pl_coding', 'sng_neon_drive', 5);

-- 6.2 Foreign Key Violation Test
-- Trying to insert a song with a non-existent artist_id should fail with Error 1452
-- INSERT INTO songs (id, title, artist_id, audio_url) VALUES ('sng_err', 'Ghost Song', 'art_non_existent', '/test.mp3');
