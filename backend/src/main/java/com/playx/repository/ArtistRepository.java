package com.playx.repository;

import com.playx.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ArtistRepository extends JpaRepository<Artist, String> {
    Optional<Artist> findByUserId(String userId);
    List<Artist> findAllByOrderByMonthlyListenersDesc();
    List<Artist> findByNameContainingIgnoreCase(String name);
}
