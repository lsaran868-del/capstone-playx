package com.playx.repository;

import com.playx.model.Playlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlaylistRepository extends JpaRepository<Playlist, String> {
    List<Playlist> findByUserIdOrIsPublicOrderByCreatedAtDesc(String userId, Boolean isPublic);
    List<Playlist> findByIsPublicOrderByCreatedAtDesc(Boolean isPublic);
    List<Playlist> findByNameContainingIgnoreCaseAndIsPublicTrue(String name);
    List<Playlist> findByNameContainingIgnoreCase(String name);
    List<Playlist> findAllByOrderByCreatedAtDesc();
    long count();
}
