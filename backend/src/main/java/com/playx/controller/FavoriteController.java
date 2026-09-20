package com.playx.controller;

import com.playx.model.Favorite;
import com.playx.repository.ArtistRepository;
import com.playx.repository.FavoriteRepository;
import com.playx.repository.SongRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping({"/api/favorites", "/api/likes"})
public class FavoriteController {

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @GetMapping
    public ResponseEntity<?> getFavorites() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();

        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Map<String, Object>> response = new ArrayList<>();

        for (Favorite f : favorites) {
            if (f.getSongId() != null && !f.getSongId().isBlank()) {
                songRepository.findById(f.getSongId()).ifPresent(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("favorite_id", f.getId());
                    map.put("favorited_at", f.getCreatedAt());
                    map.put("id", s.getId());
                    map.put("title", s.getTitle());
                    map.put("artist_id", s.getArtistId());
                    map.put("album_id", s.getAlbumId());
                    map.put("genre_id", s.getGenreId());
                    map.put("audio_url", s.getAudioUrl());
                    map.put("duration", s.getDuration());
                    map.put("cover_art", s.getCoverArt());
                    map.put("cover_image", s.getCoverArt());
                    map.put("plays_count", s.getPlaysCount());
                    map.put("is_favorite", true);

                    if (s.getArtistId() != null && !s.getArtistId().isBlank()) {
                        artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                            map.put("artist_name", art.getName());
                        });
                    }

                    response.add(map);
                });
            }
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{songId}")
    public ResponseEntity<?> addToFavorites(@PathVariable String songId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();

        if (!favoriteRepository.existsByUserIdAndSongId(userId, songId)) {
            String favId = "fav_" + UUID.randomUUID().toString().substring(0, 8);
            favoriteRepository.save(Favorite.builder()
                    .id(favId)
                    .userId(userId)
                    .songId(songId)
                    .createdAt(LocalDateTime.now())
                    .build());
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "Added to favorites", "is_favorite", true));
    }

    @DeleteMapping("/{songId}")
    public ResponseEntity<?> removeFromFavorites(@PathVariable String songId) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();

        favoriteRepository.deleteByUserIdAndSongId(userId, songId);

        return ResponseEntity.ok(Map.of("message", "Removed from favorites", "is_favorite", false));
    }
}
