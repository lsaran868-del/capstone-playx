package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "songs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Song {
    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "artist_id", nullable = false, length = 50)
    private String artistId;

    @Column(name = "album_id", length = 50)
    private String albumId;

    @Column(name = "genre_id", length = 50)
    private String genreId;

    @Column(name = "audio_url", nullable = false, columnDefinition = "TEXT")
    private String audioUrl;

    @Builder.Default
    @Column(nullable = false)
    private Integer duration = 180; // in seconds

    @Column(name = "cover_art", columnDefinition = "TEXT")
    private String coverArt;

    @Column(name = "file_path", columnDefinition = "TEXT")
    private String filePath;

    @Builder.Default
    @Column(name = "plays_count")
    private Integer playsCount = 0;

    @Builder.Default
    @Column(name = "release_date")
    private LocalDate releaseDate = LocalDate.now();

    @Column(name = "lyrics", columnDefinition = "TEXT")
    private String lyrics;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
