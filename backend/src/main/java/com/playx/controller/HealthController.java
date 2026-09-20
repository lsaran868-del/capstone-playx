package com.playx.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping({"/", "/api/health"})
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "UP");
        response.put("message", "PlayX Backend API is running");
        response.put("timestamp", Instant.now().toString());

        boolean dbConnected = false;
        String dbType = "Unknown";
        if (dataSource != null) {
            try (Connection conn = dataSource.getConnection()) {
                if (conn.isValid(3)) {
                    dbConnected = true;
                    dbType = conn.getMetaData().getDatabaseProductName();
                }
            } catch (Exception e) {
                // Keep credentials confidential, do not expose internal details
                dbType = "Error connecting: " + e.getClass().getSimpleName();
            }
        }

        response.put("database", dbConnected ? "CONNECTED" : "DISCONNECTED");
        response.put("database_engine", dbType);

        return ResponseEntity.ok(response);
    }
}

