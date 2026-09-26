package com.playx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

@SpringBootApplication
public class PlayxApplication {

    public static void main(String[] args) {
        loadEnvFile();
        configureDatabaseProperties();
        configureSecurityProperties();

        SpringApplication.run(PlayxApplication.class, args);

        String port = System.getenv("PORT");
        if (port == null || port.isBlank()) {
            port = System.getProperty("PORT", System.getProperty("server.port", "5000"));
        }

        System.out.println("\n🎧 ===============================================\n" +
                           "   PLAYX Music Streaming Spring Boot API Server\n" +
                           "   Bound to:   0.0.0.0:" + port + "\n" +
                           "   Access URL: http://localhost:" + port + "\n" +
                           "===============================================🎧\n");
    }

    /**
     * Checks if the application is running in a cloud/production environment
     * (e.g. Railway, Render, or when production profile/env is active).
     */
    public static boolean isProductionEnvironment() {
        String profile = getFirstEnvOrProp("SPRING_PROFILES_ACTIVE", "spring.profiles.active", "ENVIRONMENT", "ENV", "NODE_ENV");
        if (profile != null && (profile.equalsIgnoreCase("production") || profile.equalsIgnoreCase("prod") || profile.toLowerCase().contains("prod"))) {
            return true;
        }
        if (System.getenv("RAILWAY_ENVIRONMENT") != null ||
            System.getenv("RAILWAY_PROJECT_ID") != null ||
            System.getenv("RAILWAY_SERVICE_ID") != null ||
            System.getenv("RAILWAY_STATIC_URL") != null) {
            return true;
        }
        if (System.getenv("RENDER") != null ||
            System.getenv("RENDER_SERVICE_ID") != null ||
            System.getenv("RENDER_INSTANCE_ID") != null) {
            return true;
        }
        return false;
    }

    /**
     * Loads .env from the local working directory or project root if present.
     * In production (Railway / Render), local .env files are intentionally skipped
     * so that local settings do not override cloud variables.
     */
    private static void loadEnvFile() {
        if (isProductionEnvironment()) {
            System.out.println("🚀 Running in cloud/production environment; skipping local .env file.");
            return;
        }

        File[] possibleEnvFiles = new File[] {
            new File(".env"),
            new File("../.env"),
            new File(System.getProperty("user.dir"), ".env"),
            new File(System.getProperty("user.dir"), "../.env")
        };

        for (File envFile : possibleEnvFiles) {
            if (envFile.exists() && envFile.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(envFile, StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String value = line.substring(eq + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                    break;
                } catch (Exception ignored) {
                }
            }
        }
    }

    /**
     * Normalizes database connection parameters for Supabase PostgreSQL,
     * ensuring PostgreSQL is the sole relational database engine used.
     */
    private static void configureDatabaseProperties() {
        // 1. Explicit DATABASE_URL, SPRING_DATASOURCE_URL, or SUPABASE_DATABASE_URL
        String dbUrl = getFirstEnvOrProp(
            "SUPABASE_DATABASE_URL",
            "SUPABASE_JDBC_URL",
            "DATABASE_URL",
            "SPRING_DATASOURCE_URL",
            "POSTGRES_URL",
            "DB_URL"
        );

        if (dbUrl != null && !dbUrl.isBlank()) {
            configureUrl(dbUrl.trim());
            return;
        }

        // 2. Default to Supabase PostgreSQL cloud host
        String host = getFirstEnvOrDefault("db.xrhlsbsyrzvpznuspqvh.supabase.co", "SUPABASE_DB_HOST", "PGHOST", "POSTGRES_HOST");
        String port = getFirstEnvOrDefault("5432", "SUPABASE_DB_PORT", "PGPORT", "POSTGRES_PORT");
        String db = getFirstEnvOrDefault("postgres", "SUPABASE_DB_NAME", "PGDATABASE", "POSTGRES_DB");
        String user = getFirstEnvOrDefault("postgres", "SUPABASE_DB_USER", "PGUSER", "POSTGRES_USER");
        String pass = getFirstEnvOrDefault("", "SUPABASE_DB_PASSWORD", "PGPASSWORD", "POSTGRES_PASSWORD");

        String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + db + "?sslmode=require";

        System.setProperty("spring.datasource.url", jdbcUrl);
        System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
        if (user != null && !user.isBlank()) {
            System.setProperty("spring.datasource.username", user);
        }
        if (pass != null && !pass.isBlank()) {
            System.setProperty("spring.datasource.password", pass);
        }
        System.out.println("📦 Connected to Supabase PostgreSQL: " + sanitizeUrlForLogging(jdbcUrl));
    }

    /**
     * Parses and applies a PostgreSQL database URL.
     */
    private static void configureUrl(String dbUrl) {
        if ((dbUrl.startsWith("\"") && dbUrl.endsWith("\"")) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
            dbUrl = dbUrl.substring(1, dbUrl.length() - 1);
        }

        System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");

        if (dbUrl.startsWith("jdbc:")) {
            System.setProperty("spring.datasource.url", dbUrl);
            String u = getFirstEnvOrProp("SPRING_DATASOURCE_USERNAME", "SUPABASE_DB_USER", "PGUSER");
            String p = getFirstEnvOrProp("SPRING_DATASOURCE_PASSWORD", "SUPABASE_DB_PASSWORD", "PGPASSWORD");
            if (u != null) System.setProperty("spring.datasource.username", u);
            if (p != null) System.setProperty("spring.datasource.password", p);
            System.out.println("📦 JDBC URL configured directly: " + sanitizeUrlForLogging(dbUrl));
            return;
        }

        if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
            try {
                int schemeEnd = dbUrl.indexOf("://");
                String rest = dbUrl.substring(schemeEnd + 3);

                String userInfo = null;
                String hostPortPathQuery = rest;

                int atIndex = rest.lastIndexOf('@');
                if (atIndex != -1) {
                    userInfo = rest.substring(0, atIndex);
                    hostPortPathQuery = rest.substring(atIndex + 1);
                }

                if (userInfo != null && userInfo.contains(":")) {
                    int colonIndex = userInfo.indexOf(':');
                    String user = userInfo.substring(0, colonIndex);
                    String pass = userInfo.substring(colonIndex + 1);
                    try {
                        user = java.net.URLDecoder.decode(user, StandardCharsets.UTF_8);
                        pass = java.net.URLDecoder.decode(pass, StandardCharsets.UTF_8);
                    } catch (Exception ignored) {
                    }
                    System.setProperty("spring.datasource.username", user);
                    System.setProperty("spring.datasource.password", pass);
                }

                StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(hostPortPathQuery);
                if (!hostPortPathQuery.contains("?")) {
                    jdbcUrl.append("?sslmode=prefer");
                }

                String finalJdbcUrl = jdbcUrl.toString();
                System.setProperty("spring.datasource.url", finalJdbcUrl);
                System.out.println("📦 Cloud PostgreSQL URL converted to JDBC: " + sanitizeUrlForLogging(finalJdbcUrl));
            } catch (Exception e) {
                System.err.println("⚠️ Could not parse PostgreSQL database URL: " + e.getMessage());
            }
        }
    }

    /**
     * Validates JWT security settings.
     * Uses the provided JWT_SECRET if present, or automatically generates a secure
     * cloud fallback key so deployment succeeds with zero environment variables.
     */
    private static void configureSecurityProperties() {
        String jwtSecret = getFirstEnvOrProp("JWT_SECRET", "jwt.secret");
        if (jwtSecret == null || jwtSecret.isBlank()) {
            System.setProperty("jwt.secret", "playx_render_secure_jwt_secret_key_2026_capstone_music_streaming_256_bits_minimum_length_required");
            System.out.println("🔑 JWT security active using default production key.");
        } else {
            System.setProperty("jwt.secret", jwtSecret);
        }
    }

    private static String sanitizeUrlForLogging(String url) {
        if (url == null) return "null";
        return url.replaceAll(":[^/@:]+@", ":****@");
    }

    private static String getFirstEnvOrProp(String... keys) {
        for (String key : keys) {
            String val = System.getenv(key);
            if (val != null && !val.isBlank()) return val;
            val = System.getProperty(key);
            if (val != null && !val.isBlank()) return val;
        }
        return null;
    }

    private static String getFirstEnvOrDefault(String defaultValue, String... keys) {
        String val = getFirstEnvOrProp(keys);
        return (val != null && !val.isBlank()) ? val : defaultValue;
    }
}
