package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "artists")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Artist {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", length = 50)
    private String userId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String image;

    @Builder.Default
    @Column(name = "is_verified")
    private Boolean isVerified = true;

    @Builder.Default
    @Column(name = "monthly_listeners")
    private Integer monthlyListeners = 0;

    @Builder.Default
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
