package com.playx.controller;

import com.playx.model.Song;
import com.playx.model.User;
import com.playx.repository.ArtistRepository;
import com.playx.repository.PlaylistRepository;
import com.playx.repository.SongRepository;
import com.playx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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

            artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                map.put("artist_name", art.getName());
            });

            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/songs/{id}")
    public ResponseEntity<?> deleteSong(@PathVariable String id) {
        if (!songRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        songRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Song deleted successfully by admin"));
    }
}
