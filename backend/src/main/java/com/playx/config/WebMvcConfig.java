package com.playx.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${music.storage.path:uploads/music}")
    private String musicStoragePath;

    @Value("${music.covers.path:uploads/covers}")
    private String musicCoversPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        File backendAudioDir = new File("backend/public/audio");
        File rootAudioDir = new File("public/audio");
        File frontendAudioDir = new File("frontend/public/audio");
        File parentBackendAudioDir = new File("../backend/public/audio");
        File parentFrontendAudioDir = new File("../frontend/public/audio");

        registry.addResourceHandler("/audio/**")
                .addResourceLocations(
                        "file:" + backendAudioDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + frontendAudioDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + parentBackendAudioDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + parentFrontendAudioDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + rootAudioDir.getAbsolutePath().replace("\\", "/") + "/",
                        "classpath:/static/audio/"
                );

        List<String> uploadLocations = new ArrayList<>();

        // Add dynamically configured storage locations (supports Railway Volumes)
        try {
            File configuredMusic = new File(musicStoragePath).getAbsoluteFile();
            File configuredMusicParent = configuredMusic.getParentFile();
            if (configuredMusicParent != null) {
                uploadLocations.add("file:" + configuredMusicParent.getAbsolutePath().replace("\\", "/") + "/");
            }
            uploadLocations.add("file:" + configuredMusic.getAbsolutePath().replace("\\", "/") + "/");

            File configuredCovers = new File(musicCoversPath).getAbsoluteFile();
            File configuredCoversParent = configuredCovers.getParentFile();
            if (configuredCoversParent != null) {
                uploadLocations.add("file:" + configuredCoversParent.getAbsolutePath().replace("\\", "/") + "/");
            }
            uploadLocations.add("file:" + configuredCovers.getAbsolutePath().replace("\\", "/") + "/");
        } catch (Exception ignored) {
        }

        // Standard relative locations
        File backendUploadsDir = new File("backend/public/uploads");
        File rootUploadsDir = new File("public/uploads");
        File parentBackendUploadsDir = new File("../backend/public/uploads");
        File localUploadsDir = new File("uploads");
        File parentLocalUploadsDir = new File("../uploads");
        File backendLocalUploadsDir = new File("backend/uploads");

        uploadLocations.add("file:" + localUploadsDir.getAbsolutePath().replace("\\", "/") + "/");
        uploadLocations.add("file:" + parentLocalUploadsDir.getAbsolutePath().replace("\\", "/") + "/");
        uploadLocations.add("file:" + backendLocalUploadsDir.getAbsolutePath().replace("\\", "/") + "/");
        uploadLocations.add("file:" + backendUploadsDir.getAbsolutePath().replace("\\", "/") + "/");
        uploadLocations.add("file:" + rootUploadsDir.getAbsolutePath().replace("\\", "/") + "/");
        uploadLocations.add("file:" + parentBackendUploadsDir.getAbsolutePath().replace("\\", "/") + "/");
        uploadLocations.add("classpath:/static/uploads/");

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadLocations.toArray(new String[0]));
    }
}
