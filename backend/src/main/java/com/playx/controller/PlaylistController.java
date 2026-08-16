package com.playx.controller;

import com.playx.model.Playlist;
import com.playx.model.PlaylistSong;
import com.playx.repository.PlaylistRepository;
import com.playx.repository.PlaylistSongRepository;
import com.playx.repository.SongRepository;
import com.playx.repository.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getPlaylists() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = null;
        if (auth != null && auth.getPrincipal() instanceof Claims) {
            userId = ((Claims) auth.getPrincipal()).getSubject();
        }

        List<Playlist> playlists;
        if (userId != null) {
            playlists = playlistRepository.findByUserIdOrIsPublicOrderByCreatedAtDesc(userId, true);
        } else {
            playlists = playlistRepository.findByIsPublicOrderByCreatedAtDesc(true);
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Playlist p : playlists) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("userId", p.getUserId());
            map.put("user_id", p.getUserId());
            map.put("name", p.getName());
            map.put("description", p.getDescription());
            map.put("coverArt", p.getCoverArt());
            map.put("cover_art", p.getCoverArt());
            map.put("isPublic", p.getIsPublic());
            map.put("is_public", p.getIsPublic());
            map.put("createdAt", p.getCreatedAt());

            userRepository.findById(p.getUserId()).ifPresent(user -> {
                map.put("user_name", user.getName());
            });
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPlaylistById(@PathVariable String id) {
        Optional<Playlist> playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Playlist not found"));
        }

        Playlist p = playlistOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", p.getId());
        response.put("userId", p.getUserId());
        response.put("user_id", p.getUserId());
        response.put("name", p.getName());
        response.put("description", p.getDescription());
        response.put("coverArt", p.getCoverArt());
        response.put("cover_art", p.getCoverArt());
        response.put("isPublic", p.getIsPublic());
        response.put("is_public", p.getIsPublic());
        response.put("createdAt", p.getCreatedAt());

        userRepository.findById(p.getUserId()).ifPresent(user -> {
            response.put("user_name", user.getName());
            response.put("user_avatar", user.getAvatar());
        });

        // Get playlist songs
        List<PlaylistSong> psList = playlistSongRepository.findByPlaylistIdOrderByPositionAscAddedAtAsc(id);
        List<Map<String, Object>> songsResponse = new ArrayList<>();

        for (PlaylistSong ps : psList) {
            songRepository.findById(ps.getSongId()).ifPresent(s -> {
                Map<String, Object> smap = new HashMap<>();
                smap.put("id", s.getId());
                smap.put("title", s.getTitle());
                smap.put("artist_id", s.getArtistId());
                smap.put("album_id", s.getAlbumId());
                smap.put("genre_id", s.getGenreId());
                smap.put("audio_url", s.getAudioUrl());
                smap.put("duration", s.getDuration());
                smap.put("cover_art", s.getCoverArt());
                smap.put("plays_count", s.getPlaysCount());
                smap.put("added_at", ps.getAddedAt());
                smap.put("position", ps.getPosition());
                
                // Add artist name
                userRepository.findById(s.getArtistId()).ifPresent(artistUser -> {
                    smap.put("artist_name", artistUser.getName());
                });
                songsResponse.add(smap);
            });
        }

        response.put("songs", songsResponse);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createPlaylist(@RequestBody Map<String, Object> body) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        String coverArt = (String) body.get("cover_art");
        Boolean isPublic = body.containsKey("is_public") ? (Boolean) body.get("is_public") : true;

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Playlist name is required"));
        }

        String playlistId = "pl_" + UUID.randomUUID().toString().substring(0, 8);
        String defaultCover = coverArt != null ? coverArt : "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80";

        Playlist playlist = Playlist.builder()
                .id(playlistId)
                .userId(userId)
                .name(name)
                .description(description != null ? description : "")
                .coverArt(defaultCover)
                .isPublic(isPublic)
                .createdAt(LocalDateTime.now())
                .build();

        playlistRepository.save(playlist);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Playlist created successfully");
        response.put("playlist", playlist);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePlaylist(@PathVariable String id, @RequestBody Map<String, Object> body) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();
        String role = claims.get("role", String.class);

        Optional<Playlist> playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Playlist not found"));
        }

        Playlist playlist = playlistOpt.get();
        if (!playlist.getUserId().equals(userId) && !"admin".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        if (body.containsKey("name")) playlist.setName((String) body.get("name"));
        if (body.containsKey("description")) playlist.setDescription((String) body.get("description"));
        if (body.containsKey("cover_art")) playlist.setCoverArt((String) body.get("cover_art"));
        if (body.containsKey("is_public")) playlist.setIsPublic((Boolean) body.get("is_public"));

        playlistRepository.save(playlist);

        return ResponseEntity.ok(Map.of("message", "Playlist updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePlaylist(@PathVariable String id) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();
        String role = claims.get("role", String.class);

        Optional<Playlist> playlistOpt = playlistRepository.findById(id);
        if (playlistOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Playlist not found"));
        }

        Playlist playlist = playlistOpt.get();
        if (!playlist.getUserId().equals(userId) && !"admin".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        playlistRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Playlist deleted successfully"));
    }

    @PostMapping("/{id}/songs")
    public ResponseEntity<?> addSongToPlaylist(@PathVariable String id, @RequestBody Map<String, String> body) {
        String songId = body.get("song_id");
        if (songId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Song ID is required"));
        }

        Optional<PlaylistSong> psOpt = playlistSongRepository.findByPlaylistIdAndSongId(id, songId);
        if (psOpt.isEmpty()) {
            String psId = "ps_" + UUID.randomUUID().toString().substring(0, 8);
            playlistSongRepository.save(PlaylistSong.builder()
                    .id(psId)
                    .playlistId(id)
                    .songId(songId)
                    .position(1)
                    .addedAt(LocalDateTime.now())
                    .build());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Song added to playlist"));
    }

    @DeleteMapping("/{id}/songs/{songId}")
    public ResponseEntity<?> removeSongFromPlaylist(@PathVariable String id, @PathVariable String songId) {
        playlistSongRepository.deleteByPlaylistIdAndSongId(id, songId);
        return ResponseEntity.ok(Map.of("message", "Song removed from playlist"));
    }
}
