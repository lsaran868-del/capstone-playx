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

    @Autowired
    private com.playx.service.EmailService emailService;

    private boolean isValidEmail(String email) {
        if (email == null) return false;
        String clean = email.trim();
        return clean.contains("@") && clean.indexOf('@') > 0 && clean.indexOf('@') < clean.length() - 1;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String password = body.get("password");
        String requestedRole = body.getOrDefault("role", "user").toLowerCase(Locale.ROOT);

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        String emailLower = email.toLowerCase().trim();
        if (!isValidEmail(emailLower)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter a valid email address."));
        }

        String finalName = (name != null && !name.trim().isEmpty())
                ? name.trim()
                : (emailLower.contains("@") ? emailLower.substring(0, emailLower.indexOf('@')) : "PlayX User");
        if (!finalName.isEmpty() && finalName.length() > 0) {
            finalName = Character.toUpperCase(finalName.charAt(0)) + (finalName.length() > 1 ? finalName.substring(1) : "");
        }

        String role = requestedRole.equals("artist") ? "artist" : "user";
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(emailLower);
        if (existingUser.isPresent()) {
            User existing = existingUser.get();
            if (Boolean.TRUE.equals(existing.getEmailVerified())) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email is already registered."));
            }

            // Existing unverified account: enforce 60-second resend cooldown
            if (existing.getLastVerificationSentAt() != null) {
                long secondsSinceLast = java.time.Duration.between(existing.getLastVerificationSentAt(), java.time.LocalDateTime.now()).getSeconds();
                if (secondsSinceLast < 60) {
                    return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                            "error", "A verification email was recently sent. Please wait " + (60 - secondsSinceLast) + " seconds before requesting another.",
                            "retryAfterSeconds", 60 - secondsSinceLast
                    ));
                }
            }

            String rawToken = emailService.generateVerificationToken();
            String hashedToken = emailService.hashToken(rawToken);
            existing.setName(finalName);
            existing.setPassword(passwordEncoder.encode(password));
            existing.setRole(role);
            existing.setVerificationTokenHash(hashedToken);
            existing.setVerificationTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
            existing.setLastVerificationSentAt(java.time.LocalDateTime.now());
            userRepository.save(existing);

            emailService.sendVerificationEmail(emailLower, finalName, rawToken);

            return ResponseEntity.ok(Map.of(
                    "message", "A verification link has been sent to your email address. Please verify your email to complete registration.",
                    "email", emailLower,
                    "emailVerified", false
            ));
        }

        String userId = "usr_" + UUID.randomUUID().toString().substring(0, 8);
        String avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + finalName;
        String rawToken = emailService.generateVerificationToken();
        String hashedToken = emailService.hashToken(rawToken);

        User user = User.builder()
                .id(userId)
                .name(finalName)
                .email(emailLower)
                .password(passwordEncoder.encode(password))
                .role(role)
                .avatar(avatar)
                .emailVerified(false)
                .verificationTokenHash(hashedToken)
                .verificationTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15))
                .lastVerificationSentAt(java.time.LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Save default free subscription
        String userSubId = "usub_" + UUID.randomUUID().toString().substring(0, 8);
        userSubscriptionRepository.save(UserSubscription.builder()
                .id(userSubId)
                .userId(userId)
                .subscriptionId("sub_free")
                .status("active")
                .build());

        // Create artist profile automatically if role is artist
        if ("artist".equals(role)) {
            String artistId = "art_" + UUID.randomUUID().toString().substring(0, 8);
            artistRepository.save(Artist.builder()
                    .id(artistId)
                    .userId(userId)
                    .name(finalName)
                    .bio("Official artist profile for " + finalName)
                    .image(avatar)
                    .isVerified(true)
                    .monthlyListeners(0)
                    .build());
        }

        emailService.sendVerificationEmail(emailLower, finalName, rawToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "A verification link has been sent to your email address. Please verify your email to complete registration.");
        response.put("email", emailLower);
        response.put("emailVerified", false);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam(name = "token", required = false) String token) {
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Verification token is required."));
        }

        String hashedToken = emailService.hashToken(token.trim());
        Optional<User> userOpt = userRepository.findByVerificationTokenHash(hashedToken);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid or already-used verification link.",
                    "valid", false
            ));
        }

        User user = userOpt.get();
        if (user.getVerificationTokenExpiry() == null || user.getVerificationTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of(
                    "error", "Verification link has expired. Please request a new verification email.",
                    "expired", true,
                    "email", user.getEmail()
            ));
        }

        user.setEmailVerified(true);
        user.setVerificationTokenHash(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        Optional<UserSubscription> userSubOpt = userSubscriptionRepository.findByUserId(user.getId());
        String planName = "Free";
        if (userSubOpt.isPresent()) {
            String subId = userSubOpt.get().getSubscriptionId();
            planName = "sub_premium".equals(subId) ? "Premium" : "Free";
        }

        String authToken = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Email verified successfully! Welcome to PLAYX.");
        response.put("verified", true);
        response.put("token", authToken);
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

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resendVerification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required."));
        }

        String emailLower = email.toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(emailLower);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "No account found with this email address."));
        }

        User user = userOpt.get();
        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return ResponseEntity.badRequest().body(Map.of("error", "This email address is already verified. Please log in."));
        }

        // Rate limiting: 60s cooldown
        if (user.getLastVerificationSentAt() != null) {
            long secondsSinceLast = java.time.Duration.between(user.getLastVerificationSentAt(), java.time.LocalDateTime.now()).getSeconds();
            if (secondsSinceLast < 60) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                        "error", "Please wait " + (60 - secondsSinceLast) + " seconds before requesting another verification email.",
                        "retryAfterSeconds", 60 - secondsSinceLast
                ));
            }
        }

        String rawToken = emailService.generateVerificationToken();
        String hashedToken = emailService.hashToken(rawToken);

        user.setVerificationTokenHash(hashedToken);
        user.setVerificationTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        user.setLastVerificationSentAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getName(), rawToken);

        return ResponseEntity.ok(Map.of(
                "message", "A new verification link has been sent to your email address.",
                "email", user.getEmail()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter both email and password."));
        }

        String emailLower = email.toLowerCase().trim();
        if (!isValidEmail(emailLower)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please enter a valid email address."));
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(emailLower);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        User user = userOpt.get();
        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid email or password."));
        }

        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Please verify your email address to log in.",
                    "emailVerified", false,
                    "email", user.getEmail()
            ));
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

    @PostMapping("/social-login")
    public ResponseEntity<?> socialLogin(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "guest@playx.music");
        String name = body.getOrDefault("name", "PlayX Listener");
        String emailLower = email.toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(emailLower).orElseGet(() -> {
            String userId = "usr_" + UUID.randomUUID().toString().substring(0, 8);
            String avatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=" + name;
            User newUser = User.builder()
                    .id(userId)
                    .name(name)
                    .email(emailLower)
                    .password(passwordEncoder.encode("SocialPass123"))
                    .role("user")
                    .avatar(avatar)
                    .build();
            userRepository.save(newUser);

            userSubscriptionRepository.save(UserSubscription.builder()
                    .id("usub_" + UUID.randomUUID().toString().substring(0, 8))
                    .userId(userId)
                    .subscriptionId("sub_free")
                    .status("active")
                    .build());
            return newUser;
        });

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName());
        return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "token", token,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "avatar", user.getAvatar(),
                        "subscription", "Free"
                )
        ));
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
        String bio = body.get("bio");

        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }
        if (avatar != null && !avatar.trim().isEmpty()) {
            user.setAvatar(avatar.trim());
        }
        if (password != null && !password.trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }

        userRepository.save(user);

        // Sync artist profile if user is an artist
        Optional<Artist> artistOpt = artistRepository.findByUserId(userId);
        if (artistOpt.isPresent()) {
            Artist artist = artistOpt.get();
            if (name != null && !name.trim().isEmpty()) {
                artist.setName(name.trim());
            }
            if (avatar != null && !avatar.trim().isEmpty()) {
                artist.setImage(avatar.trim());
            }
            if (bio != null) {
                artist.setBio(bio.trim());
            }
            artistRepository.save(artist);
        }

        Optional<UserSubscription> userSubOpt = userSubscriptionRepository.findByUserId(user.getId());
        String planName = "Free";
        if (userSubOpt.isPresent()) {
            String subId = userSubOpt.get().getSubscriptionId();
            planName = "sub_premium".equals(subId) ? "Premium" : "Free";
        }

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getName());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile updated successfully");
        response.put("token", token);
        response.put("user", Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole(),
                "avatar", user.getAvatar() != null ? user.getAvatar() : "",
                "subscription", planName
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
