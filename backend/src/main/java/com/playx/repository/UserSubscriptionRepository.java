package com.playx.repository;

import com.playx.model.UserSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, String> {
    Optional<UserSubscription> findByUserId(String userId);
}
