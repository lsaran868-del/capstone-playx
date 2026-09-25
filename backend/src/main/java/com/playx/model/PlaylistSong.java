package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "playlist_songs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"playlist_id", "song_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistSong {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "playlist_id", nullable = false, length = 50)
    private String playlistId;

    @Column(name = "song_id", nullable = false, length = 50)
    private String songId;

    @Column(name = "`position`", nullable = false)
    private Integer position;

    @Column(name = "added_at")
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        if (this.position == null) {
            this.position = 1;
        }
        if (this.addedAt == null) {
            this.addedAt = LocalDateTime.now();
        }
    }
}
