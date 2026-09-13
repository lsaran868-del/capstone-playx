package com.playx.repository;

import com.playx.model.PlaylistSong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface PlaylistSongRepository extends JpaRepository<PlaylistSong, String> {
    List<PlaylistSong> findByPlaylistIdOrderByPositionAscAddedAtAsc(String playlistId);
    Optional<PlaylistSong> findByPlaylistIdAndSongId(String playlistId, String songId);

    @Transactional
    void deleteByPlaylistIdAndSongId(String playlistId, String songId);

    @Transactional
    void deleteBySongId(String songId);
}
