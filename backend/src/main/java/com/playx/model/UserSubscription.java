package com.playx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {
    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "user_id", nullable = false, unique = true, length = 50)
    private String userId;

    @Column(name = "subscription_id", nullable = false, length = 50)
    private String subscriptionId;

    @Column(nullable = false, length = 20)
    private String status; // 'active', 'canceled', 'expired'

    @Column(name = "starts_at")
    private LocalDateTime startsAt = LocalDateTime.now();

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
}
