package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "albums")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Album {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "artist_id", nullable = false, length = 50)
    private String artistId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "cover_art", columnDefinition = "TEXT")
    private String coverArt;

    @Column(name = "release_year")
    private Integer releaseYear = 2024;

    @Column(length = 50)
    private String genre = "Pop";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
