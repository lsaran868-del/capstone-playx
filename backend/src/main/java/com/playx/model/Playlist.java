package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playlists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Playlist {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_art", columnDefinition = "TEXT")
    private String coverArt;

    @Builder.Default
    @Column(name = "is_public")
    private Boolean isPublic = true;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
