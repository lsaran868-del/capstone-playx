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
                           "   Database: MySQL (localhost:3306/PlayX_db)\n" +
                           "===============================================🎧\n");
    }
}
