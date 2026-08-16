package com.playx.controller;

import com.playx.model.Album;
import com.playx.model.Artist;
import com.playx.model.Song;
import com.playx.repository.AlbumRepository;
import com.playx.repository.ArtistRepository;
import com.playx.repository.SongRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SongRepository songRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(defaultValue = "") String q) {
        String term = q.trim();
        if (term.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "songs", Collections.emptyList(),
                    "artists", Collections.emptyList(),
                    "albums", Collections.emptyList()
            ));
        }

        String searchPattern = "%" + term + "%";

        // 1. Search Songs
        List<Song> songs = songRepository.searchSongs(null, null, null, searchPattern, 15);
        List<Map<String, Object>> enrichedSongs = new ArrayList<>();
        for (Song s : songs) {
            Map<String, Object> smap = new HashMap<>();
            smap.put("id", s.getId());
            smap.put("title", s.getTitle());
            smap.put("artist_id", s.getArtistId());
            smap.put("album_id", s.getAlbumId());
            smap.put("cover_art", s.getCoverArt());
            smap.put("audio_url", s.getAudioUrl());
            smap.put("duration", s.getDuration());

            artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                smap.put("artist_name", art.getName());
            });
            albumRepository.findById(s.getAlbumId()).ifPresent(alb -> {
                smap.put("album_title", alb.getTitle());
            });

            enrichedSongs.add(smap);
        }

        // 2. Search Artists
        List<Artist> artists = artistRepository.findByNameContainingIgnoreCase(term);
        if (artists.size() > 10) {
            artists = artists.subList(0, 10);
        }

        // 3. Search Albums
        List<Album> albums = albumRepository.findByTitleContainingIgnoreCase(term);
        if (albums.size() > 10) {
            albums = albums.subList(0, 10);
        }
        List<Map<String, Object>> enrichedAlbums = new ArrayList<>();
        for (Album a : albums) {
            Map<String, Object> amap = new HashMap<>();
            amap.put("id", a.getId());
            amap.put("title", a.getTitle());
            amap.put("artistId", a.getArtistId());
            amap.put("coverArt", a.getCoverArt());
            amap.put("cover_art", a.getCoverArt());

            artistRepository.findById(a.getArtistId()).ifPresent(art -> {
                amap.put("artist_name", art.getName());
            });

            enrichedAlbums.add(amap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("songs", enrichedSongs);
        response.put("artists", artists);
        response.put("albums", enrichedAlbums);

        return ResponseEntity.ok(response);
    }
}
