package com.playx.controller;

import com.playx.model.Subscription;
import com.playx.model.UserSubscription;
import com.playx.repository.SubscriptionRepository;
import com.playx.repository.UserSubscriptionRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @GetMapping("/plans")
    public ResponseEntity<List<Subscription>> getPlans() {
        List<Subscription> plans = subscriptionRepository.findAllByOrderByPriceAsc();
        return ResponseEntity.ok(plans);
    }

    @GetMapping("/my-subscription")
    public ResponseEntity<?> getMySubscription() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();

        Optional<UserSubscription> userSubOpt = userSubscriptionRepository.findByUserId(userId);
        if (userSubOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "userId", userId,
                    "subscriptionId", "sub_free",
                    "plan_name", "Free",
                    "price", 0.0,
                    "status", "active"
            ));
        }

        UserSubscription us = userSubOpt.get();
        Optional<Subscription> subOpt = subscriptionRepository.findById(us.getSubscriptionId());

        Map<String, Object> map = new HashMap<>();
        map.put("id", us.getId());
        map.put("userId", us.getUserId());
        map.put("subscriptionId", us.getSubscriptionId());
        map.put("status", us.getStatus());
        map.put("startsAt", us.getStartsAt());
        map.put("expiresAt", us.getExpiresAt());

        if (subOpt.isPresent()) {
            map.put("plan_name", subOpt.get().getName());
            map.put("price", subOpt.get().getPrice());
            map.put("description", subOpt.get().getDescription());
            map.put("features", subOpt.get().getFeatures());
        } else {
            map.put("plan_name", "Free");
            map.put("price", 0.0);
        }

        return ResponseEntity.ok(map);
    }

    @PostMapping("/upgrade")
    public ResponseEntity<?> upgradeSubscription(@RequestBody Map<String, String> body) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) auth.getPrincipal();
        String userId = claims.getSubject();
        String planId = body.getOrDefault("plan_id", "sub_premium");

        Optional<UserSubscription> existingSubOpt = userSubscriptionRepository.findByUserId(userId);
        if (existingSubOpt.isPresent()) {
            UserSubscription us = existingSubOpt.get();
            us.setSubscriptionId(planId);
            us.setStatus("active");
            userSubscriptionRepository.save(us);
        } else {
            String recordId = "usub_" + UUID.randomUUID().toString().substring(0, 8);
            userSubscriptionRepository.save(UserSubscription.builder()
                    .id(recordId)
                    .userId(userId)
                    .subscriptionId(planId)
                    .status("active")
                    .startsAt(LocalDateTime.now())
                    .build());
        }

        String displayPlan = "sub_premium".equals(planId) ? "Premium" : "Free";

        return ResponseEntity.ok(Map.of(
                "message", "Subscription upgraded successfully! You are now a Premium member.",
                "subscription", displayPlan
        ));
    }
}
