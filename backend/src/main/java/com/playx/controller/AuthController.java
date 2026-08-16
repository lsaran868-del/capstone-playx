package com.playx.controller;

import com.playx.model.Artist;
import com.playx.model.User;
import com.playx.model.UserSubscription;
import com.playx.repository.ArtistRepository;
import com.playx.repository.FavoriteRepository;
import com.playx.repository.PlaylistRepository;
import com.playx.repository.UserRepository;
import com.playx.repository.UserSubscriptionRepository;
import com.playx.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSubscriptionRepository userSubscriptionRepository;

    @Autowired
    private ArtistRepository artistRepository;

    @Autowired
    private PlaylistRepository playlistRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String requestedRole = body.getOrDefault("role", "user").toLowerCase(Locale.ROOT);

        if (name == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and password are required"));
        }

        // Registration must never be able to create an administrator account.
        // Admin roles are assigned through the protected admin endpoint.
        if (!requestedRole.equals("user") && !requestedRole.equals("artist")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role must be user or artist"));
        }

        String emailLower = email.toLowerCase().trim();

        if (userRepository.findByEmailIgnoreCase(emailLower).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already registered"));
        }

        String userId = "usr_" + UUID.randomUUID().toString().substring(0, 8);
        String avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name;

        User newUser = User.builder()
                .id(userId)
                .name(name)
                .email(emailLower)
                .password(passwordEncoder.encode(password))
                .role(requestedRole)
                .avatar(avatar)
                .build();

        userRepository.save(newUser);

        // Save default free subscription
        String userSubId = "usub_" + UUID.randomUUID().toString().substring(0, 8);
        userSubscriptionRepository.save(UserSubscription.builder()
                .id(userSubId)
                .userId(userId)
                .subscriptionId("sub_free")
                .status("active")
                .build());

        // Create artist profile automatically if role is artist
        if ("artist".equals(requestedRole)) {
            String artistId = "art_" + UUID.randomUUID().toString().substring(0, 8);
            artistRepository.save(Artist.builder()
                    .id(artistId)
                    .userId(userId)
                    .name(name)
                    .bio("Official artist profile for " + name)
                    .image(avatar)
                    .isVerified(true)
                    .monthlyListeners(0)
                    .build());
        }

        String token = jwtTokenProvider.generateToken(userId, emailLower, requestedRole, name);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration successful");
        response.put("token", token);
        response.put("user", Map.of(
                "id", userId,
                "name", name,
                "email", emailLower,
                "role", requestedRole,
                "avatar", avatar,
                "subscription", "Free"
        ));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        String emailLower = email.toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(emailLower);

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        User user = userOpt.get();
        boolean matches = passwordEncoder.matches(password, user.getPassword());
        
        if (!matches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password"));
        }

        Optional<UserSubscription> userSubOpt = userSubscriptionRepository.findByUserId(user.getId());
        String planName = "Free";
        if (userSubOpt.isPresent()) {
            String subId = userSubOpt.get().getSubscriptionId();
            planName = "sub_premium".equals(subId) ? "Premium" : "Free";
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Login successful");
        response.put("token", token);
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "avatar", user.getAvatar(),
                "subscription", planName
        ));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) authentication.getPrincipal();
        String userId = claims.getSubject();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        Optional<UserSubscription> userSubOpt = userSubscriptionRepository.findByUserId(user.getId());
        String planName = "Free";
        if (userSubOpt.isPresent()) {
            String subId = userSubOpt.get().getSubscriptionId();
            planName = "sub_premium".equals(subId) ? "Premium" : "Free";
        }

        long favCount = favoriteRepository.countByUserId(userId);
        // We'll count user playlists in playlistRepository
        long playlistCount = playlistRepository.findByUserIdOrIsPublicOrderByCreatedAtDesc(userId, true).stream()
                .filter(p -> p.getUserId().equals(userId))
                .count();

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("avatar", user.getAvatar());
        response.put("subscription", planName);
        response.put("stats", Map.of(
                "favoritesCount", favCount,
                "playlistsCount", playlistCount
        ));

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> body) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Claims claims = (Claims) authentication.getPrincipal();
        String userId = claims.getSubject();

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }

        User user = userOpt.get();
        String name = body.get("name");
        String avatar = body.get("avatar");
        String password = body.get("password");

        if (name != null) user.setName(name);
        if (avatar != null) user.setAvatar(avatar);
        if (password != null) user.setPassword(passwordEncoder.encode(password));

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
