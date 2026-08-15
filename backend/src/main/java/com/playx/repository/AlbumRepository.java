package com.playx.repository;

import com.playx.model.Album;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AlbumRepository extends JpaRepository<Album, String> {
    List<Album> findByArtistId(String artistId);
    List<Album> findByTitleContainingIgnoreCase(String title);
}
