package com.playx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

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

        File backendUploadsDir = new File("backend/public/uploads");
        File rootUploadsDir = new File("public/uploads");
        File parentBackendUploadsDir = new File("../backend/public/uploads");
        File localUploadsDir = new File("uploads");
        File parentLocalUploadsDir = new File("../uploads");
        File backendLocalUploadsDir = new File("backend/uploads");

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                        "file:" + localUploadsDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + parentLocalUploadsDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + backendLocalUploadsDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + backendUploadsDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + rootUploadsDir.getAbsolutePath().replace("\\", "/") + "/",
                        "file:" + parentBackendUploadsDir.getAbsolutePath().replace("\\", "/") + "/",
                        "classpath:/static/uploads/"
                );
    }
}
