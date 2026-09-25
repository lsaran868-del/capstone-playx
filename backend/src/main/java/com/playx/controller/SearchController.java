package com.playx.controller;

import com.playx.model.Album;
import com.playx.model.Artist;
import com.playx.model.Playlist;
import com.playx.model.PlaylistSong;
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

            if (s.getArtistId() != null && !s.getArtistId().isBlank()) {
                artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                    smap.put("artist_name", art.getName());
                    smap.put("artist_image", art.getImage());
                });
            }
            if (s.getAlbumId() != null && !s.getAlbumId().isBlank()) {
                albumRepository.findById(s.getAlbumId()).ifPresent(alb -> {
                    smap.put("album_title", alb.getTitle());
                    smap.put("album_cover", alb.getCoverArt());
                });
            }

            enrichedSongs.add(smap);
        }

        // 2. Search Artists
        List<Artist> artists = new ArrayList<>(artistRepository.findByNameContainingIgnoreCase(term));
        if (artists.isEmpty()) {
            List<Artist> all = artistRepository.findAll();
            String cleanTerm = term.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            for (Artist a : all) {
                String cleanName = a.getName().replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
                boolean matched = cleanName.contains(cleanTerm) || cleanTerm.contains(cleanName)
                        || (cleanTerm.length() >= 4 && computeLevenshtein(cleanTerm, cleanName) <= 3);

                if (!matched) {
                    // Check against individual words in artist name (e.g. "rahman" matching "ranuman")
                    String[] words = a.getName().toLowerCase().split("[^a-zA-Z0-9]+");
                    for (String w : words) {
                        if (w.length() >= 4 && (computeLevenshtein(cleanTerm, w) <= 2 || w.contains(cleanTerm) || cleanTerm.contains(w))) {
                            matched = true;
                            break;
                        }
                    }
                }

                if (matched && !artists.contains(a)) {
                    artists.add(a);
                }
            }
        }
        if (artists.size() > 10) {
            artists = artists.subList(0, 10);
        }

        // Also include songs by matched artists if not already in songs list
        Set<String> existingSongIds = new HashSet<>();
        for (Map<String, Object> sm : enrichedSongs) {
            existingSongIds.add((String) sm.get("id"));
        }
        for (Artist matchedArt : artists) {
            List<Song> artSongs = songRepository.findByArtistId(matchedArt.getId());
            for (Song s : artSongs) {
                if (!existingSongIds.contains(s.getId())) {
                    existingSongIds.add(s.getId());
                    Map<String, Object> smap = new HashMap<>();
                    smap.put("id", s.getId());
                    smap.put("title", s.getTitle());
                    smap.put("artist_id", s.getArtistId());
                    smap.put("artist_name", matchedArt.getName());
                    smap.put("artist_image", matchedArt.getImage());
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
                    if (s.getAlbumId() != null && !s.getAlbumId().isBlank()) {
                        albumRepository.findById(s.getAlbumId()).ifPresent(alb -> {
                            smap.put("album_title", alb.getTitle());
                            smap.put("album_cover", alb.getCoverArt());
                        });
                    }
                    enrichedSongs.add(smap);
                }
            }
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

            if (a.getArtistId() != null && !a.getArtistId().isBlank()) {
                artistRepository.findById(a.getArtistId()).ifPresent(art -> {
                    amap.put("artist_name", art.getName());
                });
            }

            enrichedAlbums.add(amap);
        }

        // 4. Search Playlists
        List<Playlist> matchedPlaylists = playlistRepository.findByNameContainingIgnoreCaseAndIsPublicTrue(term);
        if (userId != null) {
            List<Playlist> userPlaylists = playlistRepository.findByNameContainingIgnoreCase(term);
            for (Playlist up : userPlaylists) {
                if (userId.equals(up.getUserId()) && !matchedPlaylists.contains(up)) {
                    matchedPlaylists.add(up);
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

            if (p.getUserId() != null && !p.getUserId().isBlank()) {
                userRepository.findById(p.getUserId()).ifPresent(u -> {
                    pmap.put("user_name", u.getName());
                });
            }

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
