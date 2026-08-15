package com.playx.repository;

import com.playx.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Favorite> findByUserIdAndSongId(String userId, String songId);
    boolean existsByUserIdAndSongId(String userId, String songId);
    long countByUserId(String userId);

    @Transactional
    void deleteByUserIdAndSongId(String userId, String songId);
}
