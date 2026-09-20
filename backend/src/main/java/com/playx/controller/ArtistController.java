package com.playx.controller;

import com.playx.model.Album;
import com.playx.model.Artist;
import com.playx.model.Song;
import com.playx.repository.AlbumRepository;
import com.playx.repository.ArtistRepository;
import com.playx.repository.FavoriteRepository;
import com.playx.repository.SongRepository;
import com.playx.repository.GenreRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private GenreRepository genreRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @GetMapping
    public ResponseEntity<?> getAllArtists() {
        List<Artist> artists = artistRepository.findAllByOrderByMonthlyListenersDesc();
        return ResponseEntity.ok(artists);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getArtistDetails(@PathVariable String id) {
        Optional<Artist> artistOpt = artistRepository.findById(id);
        if (artistOpt.isEmpty()) {
            // 1. Try normalized name or direct name match
            String normalized = id.replace("-", " ").replace("_", " ").trim();
            List<Artist> byName = artistRepository.findByNameContainingIgnoreCase(normalized);
            if (!byName.isEmpty()) {
                artistOpt = Optional.of(byName.get(0));
            } else {
                List<Artist> byRaw = artistRepository.findByNameContainingIgnoreCase(id);
                if (!byRaw.isEmpty()) {
                    artistOpt = Optional.of(byRaw.get(0));
                }
            }

            // 2. Try normalized alphanumeric matching and fuzzy typo tolerance
            if (artistOpt.isEmpty()) {
                List<Artist> all = artistRepository.findAll();
                String cleanQuery = id.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();

                // Exact alphanumeric or containment match
                for (Artist a : all) {
                    String cleanName = a.getName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                    if (cleanName.equals(cleanQuery) || cleanName.contains(cleanQuery) || cleanQuery.contains(cleanName)) {
                        artistOpt = Optional.of(a);
                        break;
                    }
                }

                // Token matching (e.g., words like "rahman")
                if (artistOpt.isEmpty()) {
                    String[] tokens = id.toLowerCase().split("[^a-zA-Z0-9]+");
                    for (String t : tokens) {
                        if (t.length() >= 3) {
                            for (Artist a : all) {
                                String cleanName = a.getName().toLowerCase();
                                if (cleanName.contains(t)) {
                                    artistOpt = Optional.of(a);
                                    break;
                                }
                            }
                        }
                        if (artistOpt.isPresent()) break;
                    }
                }

                // Typo / phonetic tolerance (e.g. "ranuman" -> "rahman")
                if (artistOpt.isEmpty() && cleanQuery.length() >= 4) {
                    int bestDist = Integer.MAX_VALUE;
                    Artist bestMatch = null;
                    for (Artist a : all) {
                        String cleanName = a.getName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                        int dist = computeLevenshtein(cleanQuery, cleanName);
                        if (dist < bestDist && (dist <= 3 || dist <= cleanQuery.length() / 2)) {
                            bestDist = dist;
                            bestMatch = a;
                        }
                    }
                    if (bestMatch != null) {
                        artistOpt = Optional.of(bestMatch);
                    }
                }
            }
        }

        if (artistOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Artist not found"));
        }

        Artist artist = artistOpt.get();
        String artistId = artist.getId();
        List<Song> songs = songRepository.findByArtistId(artistId);
        List<Album> albums = albumRepository.findByArtistId(artistId);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = null;
        if (auth != null && auth.getPrincipal() instanceof Claims) {
            currentUserId = ((Claims) auth.getPrincipal()).getSubject();
        }

        List<Map<String, Object>> enrichedSongs = new ArrayList<>();
        for (Song s : songs) {
            Map<String, Object> smap = new HashMap<>();
            smap.put("id", s.getId());
            smap.put("title", s.getTitle());
            smap.put("artist_id", s.getArtistId());
            smap.put("artist_name", artist.getName());
            smap.put("artist_image", artist.getImage());
            smap.put("album_id", s.getAlbumId());
            smap.put("genre_id", s.getGenreId());
            smap.put("audio_url", s.getAudioUrl());
            smap.put("duration", s.getDuration());
            smap.put("cover_art", s.getCoverArt());
            smap.put("plays_count", s.getPlaysCount());
            smap.put("release_date", s.getReleaseDate());
            smap.put("file_path", s.getFilePath());
            smap.put("lyrics", s.getLyrics());

            if (currentUserId != null) {
                smap.put("is_favorite", favoriteRepository.existsByUserIdAndSongId(currentUserId, s.getId()));
            } else {
                smap.put("is_favorite", false);
            }

            if (s.getAlbumId() != null && !s.getAlbumId().isBlank()) {
                albumRepository.findById(s.getAlbumId()).ifPresent(alb -> {
                    smap.put("album_title", alb.getTitle());
                    smap.put("album_cover", alb.getCoverArt());
                });
            }

            if (s.getGenreId() != null && !s.getGenreId().isBlank()) {
                genreRepository.findById(s.getGenreId()).ifPresent(gnr -> {
                    smap.put("genre_name", gnr.getName());
                });
            }

            enrichedSongs.add(smap);
        }

        List<Map<String, Object>> enrichedAlbums = new ArrayList<>();
        for (Album a : albums) {
            Map<String, Object> amap = new HashMap<>();
            amap.put("id", a.getId());
            amap.put("title", a.getTitle());
            amap.put("artist_id", a.getArtistId());
            amap.put("artist_name", artist.getName());
            amap.put("cover_art", a.getCoverArt());
            amap.put("release_year", a.getReleaseYear());
            amap.put("genre", a.getGenre());
            enrichedAlbums.add(amap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("id", artist.getId());
        response.put("userId", artist.getUserId());
        response.put("user_id", artist.getUserId());
        response.put("name", artist.getName());
        response.put("bio", artist.getBio());
        response.put("image", artist.getImage());
        response.put("isVerified", artist.getIsVerified());
        response.put("is_verified", artist.getIsVerified());
        response.put("monthlyListeners", artist.getMonthlyListeners());
        response.put("monthly_listeners", artist.getMonthlyListeners());
        response.put("songs", enrichedSongs);
        response.put("albums", enrichedAlbums);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/dashboard/songs")
    public ResponseEntity<?> addSong(@RequestBody Map<String, Object> body) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();
        String role = claims.get("role", String.class);
        String name = claims.get("name", String.class);

        String title = (String) body.get("title");
        String audioUrl = (String) body.get("audio_url");
        String albumId = (String) body.get("album_id");
        String genreId = (String) body.get("genre_id");
        String coverArt = (String) body.get("cover_art");
        Integer duration = body.get("duration") != null ? ((Number) body.get("duration")).intValue() : 180;

        if (title == null || audioUrl == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Song title and audio URL are required"));
        }

        Optional<Artist> artistOpt = artistRepository.findByUserId(userId);
        String artistId;

        if (artistOpt.isEmpty() && "admin".equalsIgnoreCase(role)) {
            List<Artist> allArtists = artistRepository.findAll();
            artistId = allArtists.isEmpty() ? "art_admin" : allArtists.get(0).getId();
        } else if (artistOpt.isPresent()) {
            artistId = artistOpt.get().getId();
        } else {
            artistId = "art_" + UUID.randomUUID().toString().substring(0, 8);
            artistRepository.save(Artist.builder()
                    .id(artistId)
                    .userId(userId)
                    .name(name)
                    .bio("Official artist profile for " + name)
                    .image("https://api.dicebear.com/7.x/avataaars/svg?seed=" + name)
                    .isVerified(true)
                    .monthlyListeners(0)
                    .build());
        }

        String songId = "sng_" + UUID.randomUUID().toString().substring(0, 8);
        String songCover = coverArt != null ? coverArt : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80";

        Song newSong = Song.builder()
                .id(songId)
                .title(title)
                .artistId(artistId)
                .albumId(albumId)
                .genreId(genreId)
                .audioUrl(audioUrl)
                .duration(duration)
                .coverArt(songCover)
                .playsCount(0)
                .releaseDate(LocalDate.now())
                .createdAt(LocalDateTime.now())
                .build();

        songRepository.save(newSong);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Song added successfully", "song", newSong));
    }

    @PutMapping("/dashboard/songs/{id}")
    public ResponseEntity<?> editSong(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        Song song = songOpt.get();

        if (body.containsKey("title")) song.setTitle((String) body.get("title"));
        if (body.containsKey("audio_url")) song.setAudioUrl((String) body.get("audio_url"));
        if (body.containsKey("album_id")) song.setAlbumId((String) body.get("album_id"));
        if (body.containsKey("genre_id")) song.setGenreId((String) body.get("genre_id"));
        if (body.containsKey("cover_art")) song.setCoverArt((String) body.get("cover_art"));
        if (body.containsKey("duration")) song.setDuration(((Number) body.get("duration")).intValue());

        songRepository.save(song);

        return ResponseEntity.ok(Map.of("message", "Song updated successfully"));
    }

    @DeleteMapping("/dashboard/songs/{id}")
    public ResponseEntity<?> deleteSong(@PathVariable String id) {
        if (!songRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        songRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Song deleted successfully"));
    }

    @PostMapping("/dashboard/albums")
    public ResponseEntity<?> createAlbum(@RequestBody Map<String, Object> body) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();

        String title = (String) body.get("title");
        String coverArt = (String) body.get("cover_art");
        Integer releaseYear = body.get("release_year") != null ? ((Number) body.get("release_year")).intValue() : 2024;
        String genre = (String) body.getOrDefault("genre", "Pop");

        if (title == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Album title is required"));
        }

        Optional<Artist> artistOpt = artistRepository.findByUserId(userId);
        String artistId = artistOpt.isPresent() ? artistOpt.get().getId() : "art_admin";

        String albumId = "alb_" + UUID.randomUUID().toString().substring(0, 8);
        String albumCover = coverArt != null ? coverArt : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80";

        Album newAlbum = Album.builder()
                .id(albumId)
                .artistId(artistId)
                .title(title)
                .coverArt(albumCover)
                .releaseYear(releaseYear)
                .genre(genre)
                .createdAt(LocalDateTime.now())
                .build();

        albumRepository.save(newAlbum);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Album created successfully", "album", newAlbum));
    }

    private int computeLevenshtein(String s1, String s2) {
        int[] prev = new int[s2.length() + 1];
        int[] curr = new int[s2.length() + 1];
        for (int j = 0; j <= s2.length(); j++) prev[j] = j;
        for (int i = 1; i <= s1.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            System.arraycopy(curr, 0, prev, 0, prev.length);
        }
        return prev[s2.length()];
    }
}
