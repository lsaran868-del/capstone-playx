package com.playx.controller;

import com.playx.model.Album;
import com.playx.model.Artist;
import com.playx.model.Playlist;
import com.playx.model.Song;
import com.playx.model.User;
import com.playx.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('admin')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private ListeningHistoryRepository listeningHistoryRepository;

    @Autowired
    private com.playx.service.FileStorageService fileStorageService;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long usersCount = userRepository.count();
        long artistsCount = artistRepository.count();
        long songsCount = songRepository.count();
        long playlistsCount = playlistRepository.count();
        
        Long totalPlays = songRepository.getTotalPlays();
        if (totalPlays == null) {
            totalPlays = 0L;
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", usersCount);
        response.put("totalArtists", artistsCount);
        response.put("totalSongs", songsCount);
        response.put("totalPlaylists", playlistsCount);
        response.put("totalPlays", totalPlays);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (User u : users) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("avatar", u.getAvatar());
            map.put("createdAt", u.getCreatedAt());
            map.put("created_at", u.getCreatedAt());
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        String role = body.get("role");
        if (role == null || (!"user".equals(role) && !"artist".equals(role) && !"admin".equals(role))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }

        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        user.setRole(role);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User role updated successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    @GetMapping("/songs")
    public ResponseEntity<?> getAllSongs() {
        List<Song> songs = songRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Song s : songs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", s.getId());
            map.put("title", s.getTitle());
            map.put("artist_id", s.getArtistId());
            map.put("album_id", s.getAlbumId());
            map.put("plays_count", s.getPlaysCount());
            map.put("created_at", s.getCreatedAt());
            map.put("duration", s.getDuration());
            map.put("cover_art", s.getCoverArt());

            if (s.getArtistId() != null && !s.getArtistId().isBlank()) {
                artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                    map.put("artist_name", art.getName());
                });
            }

            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/songs/{id}")
    public ResponseEntity<?> deleteSong(@PathVariable String id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        Song song = songOpt.get();

        // 1. Delete physical audio file if exists
        if (song.getFilePath() != null) {
            fileStorageService.deleteAudioFile(song.getFilePath());
        }

        // 2. Delete physical cover image if local
        if (song.getCoverArt() != null) {
            fileStorageService.deleteCoverImage(song.getCoverArt());
        }

        // 3. Remove dependent records
        playlistSongRepository.deleteBySongId(id);
        favoriteRepository.deleteBySongId(id);
        listeningHistoryRepository.deleteBySongId(id);

        // 4. Delete song entity
        songRepository.delete(song);
        return ResponseEntity.ok(Map.of("message", "Song and physical files deleted successfully by admin"));
    }

    @GetMapping("/artists")
    public ResponseEntity<?> getAllArtists() {
        List<Artist> artists = artistRepository.findAllByOrderByMonthlyListenersDesc();
        return ResponseEntity.ok(artists);
    }

    @PutMapping(value = "/artists/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateArtistImageMultipart(
            @PathVariable String id,
            @RequestParam("imageFile") MultipartFile imageFile) {
        Optional<Artist> artistOpt = artistRepository.findById(id);
        if (artistOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Artist not found"));
        }

        if (imageFile == null || imageFile.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image file is required"));
        }

        try {
            String imageUrl = fileStorageService.storeArtistImage(imageFile);
            Artist artist = artistOpt.get();

            // Clean up old local image if applicable
            if (artist.getImage() != null && artist.getImage().contains("uploads/covers")) {
                fileStorageService.deleteCoverImage(artist.getImage());
            }

            artist.setImage(imageUrl);
            artist = artistRepository.save(artist);

            return ResponseEntity.ok(Map.of(
                    "message", "Artist image updated successfully",
                    "imageUrl", imageUrl,
                    "artist", artist
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload artist image: " + e.getMessage()));
        }
    }

    @PutMapping(value = "/artists/{id}/image", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateArtistImageUrl(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        Optional<Artist> artistOpt = artistRepository.findById(id);
        if (artistOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Artist not found"));
        }

        String imageUrl = body.get("imageUrl");
        if (imageUrl == null || imageUrl.isBlank()) {
            imageUrl = body.get("image");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Image URL is required"));
        }

        Artist artist = artistOpt.get();
        artist.setImage(imageUrl.trim());
        artist = artistRepository.save(artist);

        return ResponseEntity.ok(Map.of(
                "message", "Artist image updated successfully",
                "imageUrl", imageUrl,
                "artist", artist
        ));
    }

    @GetMapping("/albums")
    public ResponseEntity<?> getAllAlbums() {
        List<Album> albums = albumRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Album a : albums) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("title", a.getTitle());
            map.put("artist_id", a.getArtistId());
            map.put("release_year", a.getReleaseYear());
            map.put("genre", a.getGenre());
            map.put("cover_art", a.getCoverArt());
            map.put("created_at", a.getCreatedAt());

            if (a.getArtistId() != null && !a.getArtistId().isBlank()) {
                artistRepository.findById(a.getArtistId()).ifPresent(art -> {
                    map.put("artist_name", art.getName());
                });
            }

            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/playlists")
    public ResponseEntity<?> getAllPlaylists() {
        List<Playlist> playlists = playlistRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Playlist p : playlists) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("description", p.getDescription());
            map.put("cover_art", p.getCoverArt());
            map.put("is_public", p.getIsPublic());
            map.put("user_id", p.getUserId());
            map.put("created_at", p.getCreatedAt());

            if (p.getUserId() != null && !p.getUserId().isBlank()) {
                userRepository.findById(p.getUserId()).ifPresent(u -> {
                    map.put("user_name", u.getName());
                });
            }

            long songCount = playlistSongRepository.findByPlaylistIdOrderByPositionAscAddedAtAsc(p.getId()).size();
            map.put("song_count", songCount);

            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/playlists/{id}")
    public ResponseEntity<?> deletePlaylist(@PathVariable String id) {
        if (!playlistRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Playlist not found"));
        }

        playlistRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Playlist deleted successfully by admin"));
    }
}
