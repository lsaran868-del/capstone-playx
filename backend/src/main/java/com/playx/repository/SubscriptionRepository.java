package com.playx.repository;

import com.playx.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubscriptionRepository extends JpaRepository<Subscription, String> {
    List<Subscription> findAllByOrderByPriceAsc();
}
