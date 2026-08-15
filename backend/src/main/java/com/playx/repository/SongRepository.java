package com.playx.repository;

import com.playx.model.Song;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SongRepository extends JpaRepository<Song, String> {
    
    @Query(value = "SELECT s.* FROM songs s ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Song> findRecommended(@Param("limit") int limit);

    @Query(value = "SELECT s.* FROM songs s ORDER BY s.plays_count DESC LIMIT :limit", nativeQuery = true)
    List<Song> findPopular(@Param("limit") int limit);

    @Query(value = "SELECT s.* FROM songs s ORDER BY s.release_date DESC, s.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Song> findNewReleases(@Param("limit") int limit);

    @Query(value = "SELECT s.* FROM songs s " +
            "LEFT JOIN artists a ON s.artist_id = a.id " +
            "LEFT JOIN albums al ON s.album_id = al.id " +
            "LEFT JOIN genres g ON s.genre_id = g.id " +
            "WHERE (:genre IS NULL OR LOWER(g.name) LIKE LOWER(:genre) OR LOWER(g.slug) LIKE LOWER(:genre)) " +
            "AND (:artist IS NULL OR a.id = :artist OR LOWER(a.name) LIKE LOWER(:artist)) " +
            "AND (:album IS NULL OR al.id = :album OR LOWER(al.title) LIKE LOWER(:album)) " +
            "AND (:search IS NULL OR LOWER(s.title) LIKE LOWER(:search) OR LOWER(a.name) LIKE LOWER(:search) OR LOWER(al.title) LIKE LOWER(:search)) " +
            "ORDER BY s.created_at DESC LIMIT :limit", nativeQuery = true)
    List<Song> searchSongs(
            @Param("genre") String genre,
            @Param("artist") String artist,
            @Param("album") String album,
            @Param("search") String search,
            @Param("limit") int limit
    );

    List<Song> findByArtistId(String artistId);

    @Query(value = "SELECT SUM(plays_count) FROM songs", nativeQuery = true)
    Long getTotalPlays();
}
