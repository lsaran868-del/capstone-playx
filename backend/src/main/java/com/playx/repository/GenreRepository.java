package com.playx.repository;

import com.playx.model.Genre;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GenreRepository extends JpaRepository<Genre, String> {
    Optional<Genre> findByNameIgnoreCaseOrSlugIgnoreCase(String name, String slug);
}
