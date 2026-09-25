package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "listening_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListeningHistory {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "song_id", nullable = false, length = 50)
    private String songId;

    @Builder.Default
    @Column(name = "played_at")
    private LocalDateTime playedAt = LocalDateTime.now();
}
