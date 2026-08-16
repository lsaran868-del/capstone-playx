package com.playx.controller;

import com.playx.model.ListeningHistory;
import com.playx.repository.ArtistRepository;
import com.playx.repository.ListeningHistoryRepository;
import com.playx.repository.SongRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/history")
public class HistoryController {

    @Autowired
    private ListeningHistoryRepository listeningHistoryRepository;

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @GetMapping
    public ResponseEntity<?> getHistory() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();

        List<ListeningHistory> history = listeningHistoryRepository.findByUserIdOrderByPlayedAtDesc(userId);
        List<Map<String, Object>> response = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        for (ListeningHistory h : history) {
            if (!seen.contains(h.getSongId())) {
                seen.add(h.getSongId());
                songRepository.findById(h.getSongId()).ifPresent(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("history_id", h.getId());
                    map.put("played_at", h.getPlayedAt());
                    map.put("id", s.getId());
                    map.put("title", s.getTitle());
                    map.put("artist_id", s.getArtistId());
                    map.put("album_id", s.getAlbumId());
                    map.put("genre_id", s.getGenreId());
                    map.put("audio_url", s.getAudioUrl());
                    map.put("duration", s.getDuration());
                    map.put("cover_art", s.getCoverArt());
                    map.put("plays_count", s.getPlaysCount());

                    artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                        map.put("artist_name", art.getName());
                        map.put("artist_image", art.getImage());
                    });

                    response.add(map);
                });
            }
        }

        return ResponseEntity.ok(response);
    }
}
