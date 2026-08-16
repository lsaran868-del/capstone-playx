package com.playx.controller;

import com.playx.model.ListeningHistory;
import com.playx.model.Song;
import com.playx.repository.ArtistRepository;
import com.playx.repository.FavoriteRepository;
import com.playx.repository.ListeningHistoryRepository;
import com.playx.repository.SongRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private ListeningHistoryRepository listeningHistoryRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @GetMapping
    public ResponseEntity<?> getAllSongs(
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String album,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "50") int limit) {

        String genreParam = genre != null ? "%" + genre + "%" : null;
        String artistParam = artist != null ? "%" + artist + "%" : null;
        String albumParam = album != null ? "%" + album + "%" : null;
        String searchParam = search != null ? "%" + search + "%" : null;

        List<Song> songs = songRepository.searchSongs(genreParam, artistParam, albumParam, searchParam, limit);
        List<Map<String, Object>> response = enrichSongList(songs);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/recommended")
    public ResponseEntity<?> getRecommended() {
        List<Song> songs = songRepository.findRecommended(10);
        return ResponseEntity.ok(enrichSongList(songs));
    }

    @GetMapping("/popular")
    public ResponseEntity<?> getPopular() {
        List<Song> songs = songRepository.findPopular(10);
        return ResponseEntity.ok(enrichSongList(songs));
    }

    @GetMapping("/new-releases")
    public ResponseEntity<?> getNewReleases() {
        List<Song> songs = songRepository.findNewReleases(10);
        return ResponseEntity.ok(enrichSongList(songs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getSongById(@PathVariable String id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        Song song = songOpt.get();
        Map<String, Object> enrich = enrichSong(song);

        // Check if favorite
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Claims) {
            String userId = ((Claims) auth.getPrincipal()).getSubject();
            enrich.put("is_favorite", favoriteRepository.existsByUserIdAndSongId(userId, id));
        }

        return ResponseEntity.ok(enrich);
    }

    @PostMapping("/{id}/play")
    public ResponseEntity<?> recordPlay(@PathVariable String id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        Song song = songOpt.get();
        song.setPlaysCount(song.getPlaysCount() + 1);
        songRepository.save(song);

        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Claims) {
            String userId = ((Claims) auth.getPrincipal()).getSubject();
            String historyId = "hist_" + UUID.randomUUID().toString().substring(0, 8);
            listeningHistoryRepository.save(ListeningHistory.builder()
                    .id(historyId)
                    .userId(userId)
                    .songId(id)
                    .playedAt(LocalDateTime.now())
                    .build());
        }

        return ResponseEntity.ok(Map.of("message", "Play recorded successfully"));
    }

    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> streamAudio(@PathVariable String id, @RequestHeader HttpHeaders headers) {
        // Look in ../public/audio/ relative to the run location (or backend/public/audio)
        File audioDir = new File("backend/public/audio");
        if (!audioDir.exists()) {
            audioDir = new File("../backend/public/audio");
        }
        if (!audioDir.exists()) {
            audioDir = new File("public/audio");
        }

        File audioFile = new File(audioDir, id + ".mp3");

        if (!audioFile.exists()) {
            // Find any demo file
            if (audioDir.exists() && audioDir.isDirectory()) {
                File[] list = audioDir.listFiles();
                if (list != null && list.length > 0) {
                    audioFile = list[0];
                }
            }
        }

        if (!audioFile.exists() || !audioFile.isFile()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }

        Resource resource = new FileSystemResource(audioFile);
        
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.setContentType(MediaType.parseMediaType("audio/mpeg"));
        responseHeaders.set("Accept-Ranges", "bytes");

        return ResponseEntity.ok()
                .headers(responseHeaders)
                .body(resource);
    }

    private List<Map<String, Object>> enrichSongList(List<Song> songs) {
        List<Map<String, Object>> result = new ArrayList<>();
        var auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = null;
        if (auth != null && auth.getPrincipal() instanceof Claims) {
            userId = ((Claims) auth.getPrincipal()).getSubject();
        }

        for (Song s : songs) {
            Map<String, Object> map = enrichSong(s);
            if (userId != null) {
                map.put("is_favorite", favoriteRepository.existsByUserIdAndSongId(userId, s.getId()));
            }
            result.add(map);
        }
        return result;
    }

    private Map<String, Object> enrichSong(Song s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", s.getId());
        map.put("title", s.getTitle());
        map.put("artist_id", s.getArtistId());
        map.put("album_id", s.getAlbumId());
        map.put("genre_id", s.getGenreId());
        map.put("audio_url", s.getAudioUrl());
        map.put("duration", s.getDuration());
        map.put("cover_art", s.getCoverArt());
        map.put("plays_count", s.getPlaysCount());
        map.put("release_date", s.getReleaseDate());
        map.put("created_at", s.getCreatedAt());

        // Simple mock info joins to match Express queries
        var artistOpt = artistRepository.findById(s.getArtistId());
        if (artistOpt.isPresent()) {
            map.put("artist_name", artistOpt.get().getName());
            map.put("artist_image", artistOpt.get().getImage());
        } else {
            map.put("artist_name", "Artist");
        }

        return map;
    }
}
