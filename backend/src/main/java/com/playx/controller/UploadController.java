package com.playx.controller;

import io.jsonwebtoken.Claims;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "image/svg+xml"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "svg"
    );

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    private Path getAvatarUploadDir() throws IOException {
        // Try both possible working directory structures (root vs backend directory)
        Path dirPath = Paths.get("public", "uploads", "avatars");
        if (!Files.exists(Paths.get("public")) && Files.exists(Paths.get("backend", "public"))) {
            dirPath = Paths.get("backend", "public", "uploads", "avatars");
        } else if (!Files.exists(dirPath)) {
            // Also ensure backend/public exists if running from root
            if (Files.exists(Paths.get("backend"))) {
                dirPath = Paths.get("backend", "public", "uploads", "avatars");
            }
        }

        if (!Files.exists(dirPath)) {
            Files.createDirectories(dirPath);
        }
        return dirPath;
    }

    @PostMapping({"/image", "/avatar"})
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Claims)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Authentication required to upload images."));
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please select a file to upload."));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 10MB limit."));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid image format. Allowed formats: JPG, PNG, WEBP, GIF, SVG."));
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "png";
        if (originalFilename != null && originalFilename.contains(".")) {
            String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
            if (ALLOWED_EXTENSIONS.contains(ext)) {
                extension = ext;
            }
        }

        try {
            Path uploadDir = getAvatarUploadDir();
            String uniqueName = "avatar_" + UUID.randomUUID().toString().substring(0, 8) + "_" + System.currentTimeMillis() + "." + extension;
            Path targetFile = uploadDir.resolve(uniqueName);

            Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

            String publicUrl = "/uploads/avatars/" + uniqueName;
            return ResponseEntity.ok(Map.of(
                    "message", "Image uploaded successfully",
                    "url", publicUrl,
                    "filename", uniqueName
            ));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to save uploaded image: " + e.getMessage()));
        }
    }
}
