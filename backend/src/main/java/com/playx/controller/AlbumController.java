package com.playx.controller;

import com.playx.model.Album;
import com.playx.model.Song;
import com.playx.repository.AlbumRepository;
import com.playx.repository.ArtistRepository;
import com.playx.repository.SongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/albums")
public class AlbumController {

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private SongRepository songRepository;

    @GetMapping
    public ResponseEntity<?> getAllAlbums() {
        List<Album> albums = albumRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        for (Album a : albums) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", a.getId());
            map.put("artistId", a.getArtistId());
            map.put("title", a.getTitle());
            map.put("coverArt", a.getCoverArt());
            map.put("cover_art", a.getCoverArt());
            map.put("releaseYear", a.getReleaseYear());
            map.put("genre", a.getGenre());
            map.put("createdAt", a.getCreatedAt());

            if (a.getArtistId() != null && !a.getArtistId().isBlank()) {
                artistRepository.findById(a.getArtistId()).ifPresent(art -> {
                    map.put("artist_name", art.getName());
                });
            }
            response.add(map);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAlbumById(@PathVariable String id) {
        Optional<Album> albumOpt = albumRepository.findById(id);
        if (albumOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Album not found"));
        }

        Album a = albumOpt.get();
        Map<String, Object> map = new HashMap<>();
        map.put("id", a.getId());
        map.put("artistId", a.getArtistId());
        map.put("title", a.getTitle());
        map.put("coverArt", a.getCoverArt());
        map.put("cover_art", a.getCoverArt());
        map.put("releaseYear", a.getReleaseYear());
        map.put("genre", a.getGenre());
        map.put("createdAt", a.getCreatedAt());

        if (a.getArtistId() != null && !a.getArtistId().isBlank()) {
            artistRepository.findById(a.getArtistId()).ifPresent(art -> {
                map.put("artist_name", art.getName());
                map.put("artist_image", art.getImage());
            });
        }

        // Add songs belonging to this album
        List<Song> allSongs = songRepository.findAll();
        List<Song> albumSongs = new ArrayList<>();
        for (Song s : allSongs) {
            if (id.equals(s.getAlbumId())) {
                albumSongs.add(s);
            }
        }
        map.put("songs", albumSongs);

        return ResponseEntity.ok(map);
    }
}
