package com.playx.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.*;

@Service
public class FileStorageService {

    @Value("${music.storage.path:uploads/music}")
    private String musicStoragePath;

    @Value("${music.covers.path:uploads/covers}")
    private String musicCoversPath;

    private static final Set<String> ALLOWED_AUDIO_EXTENSIONS = new HashSet<>(
            Arrays.asList("mp3", "wav", "m4a", "ogg", "flac")
    );

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = new HashSet<>(
            Arrays.asList("jpg", "jpeg", "png", "webp")
    );

    private static final long MAX_AUDIO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
    private static final long MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

    private Path musicStorageLocation;
    private Path coverStorageLocation;

    @PostConstruct
    public void init() {
        try {
            this.musicStorageLocation = Paths.get(musicStoragePath).toAbsolutePath().normalize();
            Files.createDirectories(this.musicStorageLocation);

            this.coverStorageLocation = Paths.get(musicCoversPath).toAbsolutePath().normalize();
            Files.createDirectories(this.coverStorageLocation);

            System.out.println("📁 Music storage initialized at: " + this.musicStorageLocation);
            System.out.println("📁 Cover storage initialized at: " + this.coverStorageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize local storage folders: " + e.getMessage(), e);
        }
    }

    /**
     * Stores an uploaded audio file securely after strict validation.
     *
     * @param file The audio multipart file
     * @return The stored relative file path
     */
    public String storeAudioFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Audio file cannot be empty");
        }

        if (file.getSize() > MAX_AUDIO_SIZE_BYTES) {
            throw new IllegalArgumentException("Audio file exceeds maximum allowed size of 50MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Invalid file name");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_AUDIO_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported audio format ." + extension + ". Allowed formats: MP3, WAV, M4A, OGG");
        }

        String mimeType = file.getContentType();
        if (mimeType != null && !isValidAudioMimeType(mimeType, extension)) {
            throw new IllegalArgumentException("Invalid MIME type for audio file: " + mimeType);
        }

        // Sanitize filename to prevent directory traversal
        String sanitizedBase = sanitizeFileName(originalFilename);
        String uniqueFileName = UUID.randomUUID().toString().replace("-", "") + "_" + sanitizedBase;

        try {
            Path destination = this.musicStorageLocation.resolve(uniqueFileName).normalize();
            // Verify path traversal prevention
            if (!destination.toFile().getCanonicalPath().startsWith(this.musicStorageLocation.toFile().getCanonicalPath())) {
                throw new SecurityException("Cannot store file outside current storage directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            // Return relative path for database storage
            return "uploads/music/" + uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store audio file: " + e.getMessage(), e);
        }
    }

    /**
     * Stores an uploaded cover image securely.
     *
     * @param file The image multipart file
     * @return Web accessible path for frontend display (e.g. /uploads/covers/xxx.jpg)
     */
    public String storeCoverImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        if (file.getSize() > MAX_COVER_SIZE_BYTES) {
            throw new IllegalArgumentException("Cover image exceeds maximum allowed size of 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Invalid image file name");
        }

        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported image format ." + extension + ". Allowed formats: JPG, JPEG, PNG, WEBP");
        }

        String sanitizedBase = sanitizeFileName(originalFilename);
        String uniqueFileName = UUID.randomUUID().toString().replace("-", "") + "_" + sanitizedBase;

        try {
            Path destination = this.coverStorageLocation.resolve(uniqueFileName).normalize();
            if (!destination.toFile().getCanonicalPath().startsWith(this.coverStorageLocation.toFile().getCanonicalPath())) {
                throw new SecurityException("Cannot store image outside cover storage directory");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            return "/uploads/covers/" + uniqueFileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store cover image: " + e.getMessage(), e);
        }
    }

    /**
     * Stores an uploaded artist image securely.
     */
    public String storeArtistImage(MultipartFile file) {
        return storeCoverImage(file);
    }

    /**
     * Resolves the physical audio file from a stored file path or fallback names.
     */
    public File resolveAudioFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return null;
        }

        // 1. Check relative to musicStorageLocation
        String fileName = storedPath.contains("/") ? storedPath.substring(storedPath.lastIndexOf('/') + 1) : storedPath;
        if (fileName.contains("\\")) {
            fileName = fileName.substring(fileName.lastIndexOf('\\') + 1);
        }

        File directInStorage = this.musicStorageLocation.resolve(fileName).toFile();
        if (directInStorage.exists() && directInStorage.isFile()) {
            return directInStorage;
        }

        // 2. Check full direct path
        File directFile = new File(storedPath);
        if (directFile.exists() && directFile.isFile()) {
            return directFile;
        }

        // 3. Check common workspace candidate directories
        String[] candidateDirs = new String[]{
                "uploads/music",
                "backend/uploads/music",
                "../uploads/music",
                "public/audio",
                "backend/public/audio",
                "../backend/public/audio",
                "frontend/public/audio",
                "../frontend/public/audio"
        };

        for (String cDir : candidateDirs) {
            File cFile = new File(cDir, fileName);
            if (cFile.exists() && cFile.isFile()) {
                return cFile;
            }
        }

        return null;
    }

    /**
     * Deletes an audio file from local storage safely.
     */
    public boolean deleteAudioFile(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return false;
        }

        File file = resolveAudioFile(storedPath);
        if (file != null && file.exists() && file.isFile()) {
            boolean deleted = file.delete();
            if (deleted) {
                System.out.println("🗑️ Deleted audio file: " + file.getAbsolutePath());
            }
            return deleted;
        }
        return false;
    }

    /**
     * Deletes a local cover image from storage safely.
     */
    public boolean deleteCoverImage(String coverArtUrlOrPath) {
        if (coverArtUrlOrPath == null || coverArtUrlOrPath.isBlank()) {
            return false;
        }

        // Only delete local uploads, do not touch external URLs (e.g. Unsplash)
        if (!coverArtUrlOrPath.contains("uploads/covers")) {
            return false;
        }

        String fileName = coverArtUrlOrPath.substring(coverArtUrlOrPath.lastIndexOf('/') + 1);
        File file = this.coverStorageLocation.resolve(fileName).toFile();
        if (file.exists() && file.isFile()) {
            boolean deleted = file.delete();
            if (deleted) {
                System.out.println("🗑️ Deleted cover image: " + file.getAbsolutePath());
            }
            return deleted;
        }
        return false;
    }

    public Path getMusicStorageLocation() {
        return musicStorageLocation;
    }

    public Path getCoverStorageLocation() {
        return coverStorageLocation;
    }

    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex == -1 || dotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIndex + 1);
    }

    private String sanitizeFileName(String originalFilename) {
        String clean = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (clean.length() > 60) {
            clean = clean.substring(clean.length() - 60);
        }
        return clean;
    }

    private boolean isValidAudioMimeType(String mimeType, String extension) {
        String lower = mimeType.toLowerCase();
        return lower.contains("audio") ||
                lower.contains("mpeg") ||
                lower.contains("mp3") ||
                lower.contains("wav") ||
                lower.contains("ogg") ||
                lower.contains("mp4") ||
                lower.contains("octet-stream"); // Some systems tag local audio as octet-stream
    }
}
