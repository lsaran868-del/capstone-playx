package com.playx.controller;

import com.playx.model.Album;
import com.playx.model.Artist;
import com.playx.model.Playlist;
import com.playx.model.Song;
import com.playx.repository.*;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @GetMapping
    public ResponseEntity<?> search(@RequestParam(defaultValue = "") String q) {
        String term = q.trim();
        if (term.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "songs", Collections.emptyList(),
                    "artists", Collections.emptyList(),
                    "albums", Collections.emptyList(),
                    "playlists", Collections.emptyList()
            ));
        }

        var auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = null;
        if (auth != null && auth.getPrincipal() instanceof Claims) {
            userId = ((Claims) auth.getPrincipal()).getSubject();
        }

        String searchPattern = "%" + term + "%";

        // 1. Search Songs
        List<Song> songs = songRepository.searchSongs(null, null, null, searchPattern, 20);
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
            smap.put("plays_count", s.getPlaysCount());

            if (userId != null) {
                smap.put("is_favorite", favoriteRepository.existsByUserIdAndSongId(userId, s.getId()));
            } else {
                smap.put("is_favorite", false);
            }

            artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                smap.put("artist_name", art.getName());
                smap.put("artist_image", art.getImage());
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
            amap.put("artist_id", a.getArtistId());
            amap.put("coverArt", a.getCoverArt());
            amap.put("cover_art", a.getCoverArt());
            amap.put("releaseYear", a.getReleaseYear());
            amap.put("release_year", a.getReleaseYear());

            artistRepository.findById(a.getArtistId()).ifPresent(art -> {
                amap.put("artist_name", art.getName());
            });

            enrichedAlbums.add(amap);
        }

        // 4. Search Playlists
        List<Playlist> matchedPlaylists = playlistRepository.findByNameContainingIgnoreCaseAndIsPublicTrue(term);
        if (userId != null) {
            List<Playlist> userPlaylists = playlistRepository.findByNameContainingIgnoreCase(term);
            Set<String> seenIds = new HashSet<>();
            for (Playlist p : matchedPlaylists) {
                seenIds.add(p.getId());
            }
            for (Playlist p : userPlaylists) {
                if (userId.equals(p.getUserId()) && !seenIds.contains(p.getId())) {
                    matchedPlaylists.add(p);
                    seenIds.add(p.getId());
                }
            }
        }
        if (matchedPlaylists.size() > 10) {
            matchedPlaylists = matchedPlaylists.subList(0, 10);
        }

        List<Map<String, Object>> enrichedPlaylists = new ArrayList<>();
        for (Playlist p : matchedPlaylists) {
            Map<String, Object> pmap = new HashMap<>();
            pmap.put("id", p.getId());
            pmap.put("name", p.getName());
            pmap.put("description", p.getDescription());
            pmap.put("coverArt", p.getCoverArt());
            pmap.put("cover_art", p.getCoverArt());
            pmap.put("isPublic", p.getIsPublic());
            pmap.put("is_public", p.getIsPublic());
            pmap.put("userId", p.getUserId());
            pmap.put("user_id", p.getUserId());
            pmap.put("createdAt", p.getCreatedAt());

            userRepository.findById(p.getUserId()).ifPresent(u -> {
                pmap.put("user_name", u.getName());
            });

            long songCount = playlistSongRepository.findByPlaylistIdOrderByPositionAscAddedAtAsc(p.getId()).size();
            pmap.put("song_count", songCount);

            enrichedPlaylists.add(pmap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("songs", enrichedSongs);
        response.put("artists", artists);
        response.put("albums", enrichedAlbums);
        response.put("playlists", enrichedPlaylists);

        return ResponseEntity.ok(response);
    }
}
