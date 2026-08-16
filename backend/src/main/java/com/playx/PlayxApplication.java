package com.playx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PlayxApplication {
    public static void main(String[] args) {
        SpringApplication.run(PlayxApplication.class, args);
        System.out.println("\n🎧 ===============================================\n" +
                           "   PLAYX Music Streaming Spring Boot API Server\n" +
                           "   Running on: http://localhost:5000\n" +
                           "   H2 Console: http://localhost:5000/h2-console\n" +
                           "===============================================🎧\n");
    }
}
