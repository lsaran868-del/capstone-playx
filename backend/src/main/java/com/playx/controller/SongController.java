package com.playx.controller;

import com.playx.model.*;
import com.playx.repository.*;
import com.playx.service.FileStorageService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.time.LocalDate;
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

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private GenreRepository genreRepository;

    @Autowired
    private PlaylistSongRepository playlistSongRepository;

    @Autowired
    private FileStorageService fileStorageService;

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

    /**
     * Upload song endpoint: accepts audio file, optional cover, and metadata.
     * Accessible by Admin users.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> uploadSong(
            @RequestParam("audioFile") MultipartFile audioFile,
            @RequestParam(value = "coverFile", required = false) MultipartFile coverFile,
            @RequestParam("title") String title,
            @RequestParam(value = "artist", required = false) String artistParam,
            @RequestParam(value = "album", required = false) String albumParam,
            @RequestParam(value = "genre", required = false) String genreParam,
            @RequestParam(value = "duration", required = false) Integer durationParam
    ) {
        try {
            if (audioFile == null || audioFile.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Audio file is required"));
            }

            if (title == null || title.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Song title is required"));
            }

            // 1. Store audio file securely
            String storedAudioPath = fileStorageService.storeAudioFile(audioFile);

            // 2. Store optional cover image
            String storedCoverUrl = null;
            if (coverFile != null && !coverFile.isEmpty()) {
                storedCoverUrl = fileStorageService.storeCoverImage(coverFile);
            }

            // 3. Resolve or create Artist
            String artistName = (artistParam != null && !artistParam.isBlank()) ? artistParam.trim() : "Unknown Artist";
            Artist artist = null;

            // Check if artistParam is an existing artist ID
            Optional<Artist> artistById = artistRepository.findById(artistName);
            if (artistById.isPresent()) {
                artist = artistById.get();
            } else {
                List<Artist> existingArtists = artistRepository.findByNameContainingIgnoreCase(artistName);
                if (!existingArtists.isEmpty()) {
                    artist = existingArtists.get(0);
                } else {
                    artist = Artist.builder()
                            .id("art_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                            .name(artistName)
                            .bio("Artist on PLAYX")
                            .image(storedCoverUrl != null ? storedCoverUrl : "https://api.dicebear.com/7.x/avataaars/svg?seed=" + artistName)
                            .isVerified(true)
                            .monthlyListeners(0)
                            .createdAt(LocalDateTime.now())
                            .build();
                    artist = artistRepository.save(artist);
                }
            }

            // 4. Resolve or create Album if provided
            Album album = null;
            if (albumParam != null && !albumParam.isBlank()) {
                String albumName = albumParam.trim();
                Optional<Album> albumById = albumRepository.findById(albumName);
                if (albumById.isPresent()) {
                    album = albumById.get();
                } else {
                    List<Album> existingAlbums = albumRepository.findByTitleContainingIgnoreCase(albumName);
                    if (!existingAlbums.isEmpty()) {
                        album = existingAlbums.get(0);
                    } else {
                        album = Album.builder()
                                .id("alb_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                                .artistId(artist.getId())
                                .title(albumName)
                                .coverArt(storedCoverUrl != null ? storedCoverUrl : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80")
                                .releaseYear(LocalDate.now().getYear())
                                .genre(genreParam != null && !genreParam.isBlank() ? genreParam.trim() : "Pop")
                                .createdAt(LocalDateTime.now())
                                .build();
                        album = albumRepository.save(album);
                    }
                }
            }

            // 5. Resolve or create Genre if provided
            Genre genre = null;
            if (genreParam != null && !genreParam.isBlank()) {
                String gName = genreParam.trim();
                Optional<Genre> genreById = genreRepository.findById(gName);
                if (genreById.isPresent()) {
                    genre = genreById.get();
                } else {
                    String slug = gName.toLowerCase().replaceAll("[^a-z0-9]", "-");
                    Optional<Genre> genreBySlug = genreRepository.findByNameIgnoreCaseOrSlugIgnoreCase(gName, slug);
                    if (genreBySlug.isPresent()) {
                        genre = genreBySlug.get();
                    } else {
                        genre = Genre.builder()
                                .id("gnr_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10))
                                .name(gName)
                                .slug(slug)
                                .coverImage(storedCoverUrl != null ? storedCoverUrl : "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80")
                                .createdAt(LocalDateTime.now())
                                .build();
                        genre = genreRepository.save(genre);
                    }
                }
            }

            // 6. Calculate Duration
            int duration = (durationParam != null && durationParam > 0) ? durationParam : 180;

            // 7. Cover art selection
            String finalCoverArt = storedCoverUrl;
            if (finalCoverArt == null && album != null && album.getCoverArt() != null) {
                finalCoverArt = album.getCoverArt();
            }
            if (finalCoverArt == null) {
                finalCoverArt = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80";
            }

            // 8. Build and save Song
            String songId = "sng_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
            Song song = Song.builder()
                    .id(songId)
                    .title(title.trim())
                    .artistId(artist.getId())
                    .albumId(album != null ? album.getId() : null)
                    .genreId(genre != null ? genre.getId() : null)
                    .audioUrl("/api/songs/" + songId + "/stream")
                    .filePath(storedAudioPath)
                    .duration(duration)
                    .coverArt(finalCoverArt)
                    .playsCount(0)
                    .releaseDate(LocalDate.now())
                    .createdAt(LocalDateTime.now())
                    .build();

            song = songRepository.save(song);

            System.out.println("✅ Successfully uploaded and saved song: " + song.getTitle() + " (" + song.getId() + ")");
            return ResponseEntity.status(HttpStatus.CREATED).body(enrichSong(song));

        } catch (IllegalArgumentException | SecurityException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload song: " + e.getMessage()));
        }
    }

    /**
     * Streams audio with HTTP Range support for seeking.
     */
    @GetMapping("/{id}/stream")
    public ResponseEntity<ResourceRegion> streamAudio(
            @PathVariable String id,
            @RequestHeader HttpHeaders headers) {

        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Song song = songOpt.get();
        File audioFile = null;

        // 1. Resolve through stored filePath
        if (song.getFilePath() != null && !song.getFilePath().isBlank()) {
            audioFile = fileStorageService.resolveAudioFile(song.getFilePath());
        }

        // 2. Fallback to audioUrl if not found
        if (audioFile == null && song.getAudioUrl() != null) {
            String audioUrl = song.getAudioUrl();
            String fileName = audioUrl.substring(audioUrl.lastIndexOf('/') + 1);
            if (fileName.contains("?")) {
                fileName = fileName.substring(0, fileName.indexOf('?'));
            }
            audioFile = fileStorageService.resolveAudioFile(fileName);
        }

        // 3. Fallback to id.mp3
        if (audioFile == null) {
            audioFile = fileStorageService.resolveAudioFile(id + ".mp3");
        }

        if (audioFile == null || !audioFile.exists() || !audioFile.isFile()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource = new FileSystemResource(audioFile);
        long contentLength = audioFile.length();
        MediaType mediaType = determineMediaType(audioFile.getName());

        List<HttpRange> ranges = headers.getRange();
        if (ranges.isEmpty()) {
            // Default progressive buffer chunk (e.g. 2MB)
            long rangeLength = Math.min(2 * 1024 * 1024L, contentLength);
            ResourceRegion region = new ResourceRegion(resource, 0, rangeLength);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(region);
        } else {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(2 * 1024 * 1024L, end - start + 1);
            ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .contentType(mediaType)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(region);
        }
    }

    /**
     * Delete song endpoint: deletes physical files and database record.
     * Accessible by Admin users.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('admin')")
    public ResponseEntity<?> deleteSong(@PathVariable String id) {
        Optional<Song> songOpt = songRepository.findById(id);
        if (songOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Song not found"));
        }

        Song song = songOpt.get();

        // 1. Delete physical audio file
        if (song.getFilePath() != null) {
            fileStorageService.deleteAudioFile(song.getFilePath());
        }

        // 2. Delete physical cover image if local upload
        if (song.getCoverArt() != null) {
            fileStorageService.deleteCoverImage(song.getCoverArt());
        }

        // 3. Delete foreign key references
        playlistSongRepository.deleteBySongId(id);
        favoriteRepository.deleteBySongId(id);
        listeningHistoryRepository.deleteBySongId(id);

        // 4. Delete song entity
        songRepository.delete(song);

        return ResponseEntity.ok(Map.of(
                "message", "Song and associated files deleted successfully",
                "id", id
        ));
    }

    private MediaType determineMediaType(String fileName) {
        if (fileName == null) {
            return MediaType.parseMediaType("audio/mpeg");
        }
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".mp3")) {
            return MediaType.parseMediaType("audio/mpeg");
        } else if (lower.endsWith(".wav")) {
            return MediaType.parseMediaType("audio/wav");
        } else if (lower.endsWith(".ogg")) {
            return MediaType.parseMediaType("audio/ogg");
        } else if (lower.endsWith(".m4a")) {
            return MediaType.parseMediaType("audio/mp4");
        } else if (lower.endsWith(".flac")) {
            return MediaType.parseMediaType("audio/flac");
        } else if (lower.endsWith(".aac")) {
            return MediaType.parseMediaType("audio/aac");
        }
        return MediaType.parseMediaType("audio/mpeg");
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
        map.put("file_path", s.getFilePath());
        map.put("duration", s.getDuration());
        map.put("cover_art", s.getCoverArt());
        map.put("lyrics", s.getLyrics());
        map.put("plays_count", s.getPlaysCount());
        map.put("release_date", s.getReleaseDate());
        map.put("created_at", s.getCreatedAt());

        // Join Artist Info
        if (s.getArtistId() != null) {
            artistRepository.findById(s.getArtistId()).ifPresent(art -> {
                map.put("artist_name", art.getName());
                map.put("artist_image", art.getImage());
            });
        }
        if (!map.containsKey("artist_name")) {
            map.put("artist_name", "Artist");
        }

        // Join Album Info
        if (s.getAlbumId() != null) {
            albumRepository.findById(s.getAlbumId()).ifPresent(alb -> {
                map.put("album_title", alb.getTitle());
                map.put("album_cover", alb.getCoverArt());
            });
        }

        // Join Genre Info
        if (s.getGenreId() != null) {
            genreRepository.findById(s.getGenreId()).ifPresent(gnr -> {
                map.put("genre_name", gnr.getName());
            });
        }

        return map;
    }
}
