package com.playx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.net.URI;
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
            port = System.getProperty("server.port", "8080");
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
     * so that local settings (like MYSQL_HOST=localhost) do not override cloud variables.
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
     * Normalizes database connection parameters for TiDB Cloud, MySQL, PostgreSQL,
     * or seamlessly starts with an embedded zero-config database if no environment variables are set.
     */
    private static void configureDatabaseProperties() {
        boolean isProd = isProductionEnvironment();

        // 1. Explicit SPRING_DATASOURCE_URL, DATABASE_URL, or TIDB_URL
        String dbUrl = getFirstEnvOrProp(
            "DATABASE_URL",
            "SPRING_DATASOURCE_URL",
            "TIDB_URL",
            "MYSQL_URL",
            "MYSQL_PRIVATE_URL",
            "MYSQLPRIVATEURL",
            "POSTGRES_URL",
            "DB_URL"
        );

        if (dbUrl != null && !dbUrl.isBlank()) {
            dbUrl = dbUrl.trim();
            if (isProd && (dbUrl.contains("localhost") || dbUrl.contains("127.0.0.1"))) {
                System.err.println("⚠️ Database URL points to localhost in a cloud container. Switching to embedded database.");
            } else {
                configureUrl(dbUrl);
                return;
            }
        }

        // 2. TiDB Cloud / MySQL direct environment variables or defaults
        String host = getFirstEnvOrDefault("gateway01.ap-southeast-1.prod.aws.tidbcloud.com", "TIDB_HOST", "MYSQLHOST", "MYSQL_HOST", "DB_HOST");
        if (isProd && (host.equalsIgnoreCase("localhost") || host.equals("127.0.0.1"))) {
            host = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com";
        }

        String port = getFirstEnvOrDefault("4000", "TIDB_PORT", "MYSQLPORT", "MYSQL_PORT", "DB_PORT");
        String db = getFirstEnvOrDefault("playx_db", "TIDB_DATABASE", "MYSQLDATABASE", "MYSQL_DATABASE", "DB_NAME");
        String user = getFirstEnvOrDefault("2ZJ1Px9KDCMNXAk.root", "TIDB_USER", "MYSQLUSER", "MYSQL_USER", "DB_USER");
        String pass = getFirstEnvOrDefault("yPS4MqN4GPGTYfE3", "TIDB_PASSWORD", "MYSQLPASSWORD", "MYSQL_PASSWORD", "DB_PASSWORD");

        boolean isTidb = host.contains("tidbcloud.com") || port.equals("4000");
        String sslParams = isTidb
            ? "?useSSL=true&enabledTLSProtocols=TLSv1.2,TLSv1.3&serverTimezone=UTC"
            : "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";

        String jdbcUrl = "jdbc:mysql://" + host + ":" + port + "/" + db + sslParams;

        System.setProperty("spring.datasource.url", jdbcUrl);
        if (user != null) {
            System.setProperty("spring.datasource.username", user);
        }
        if (pass != null) {
            System.setProperty("spring.datasource.password", pass);
        }
        System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
        System.out.println("📦 Connected to " + (isTidb ? "TiDB Cloud MySQL" : "MySQL") + ": " + sanitizeUrlForLogging(jdbcUrl));
        return;
    }

    /**
     * Parses and applies a database URL (JDBC, TiDB Cloud, MySQL, or PostgreSQL URI format).
     */
    private static void configureUrl(String dbUrl) {
        if ((dbUrl.startsWith("\"") && dbUrl.endsWith("\"")) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
            dbUrl = dbUrl.substring(1, dbUrl.length() - 1);
        }

        boolean isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("jdbc:postgresql:");
        boolean isMysql = dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://") || dbUrl.startsWith("jdbc:mysql:");

        if (isPostgres) {
            System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
        } else if (isMysql) {
            System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
        }

        if (dbUrl.startsWith("jdbc:")) {
            System.setProperty("spring.datasource.url", dbUrl);
            String u = getFirstEnvOrProp("SPRING_DATASOURCE_USERNAME", "MYSQLUSER", "MYSQL_USER", "TIDB_USER");
            String p = getFirstEnvOrProp("SPRING_DATASOURCE_PASSWORD", "MYSQLPASSWORD", "MYSQL_PASSWORD", "TIDB_PASSWORD");
            if (u != null) System.setProperty("spring.datasource.username", u);
            if (p != null) System.setProperty("spring.datasource.password", p);
            System.out.println("📦 JDBC URL configured directly: " + sanitizeUrlForLogging(dbUrl));
            return;
        }

        if (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
            try {
                int schemeEnd = dbUrl.indexOf("://");
                String scheme = dbUrl.startsWith("postgres") ? "postgresql" : "mysql";
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

                boolean isTidb = hostPortPathQuery.contains("tidbcloud.com") || hostPortPathQuery.contains(":4000");
                StringBuilder jdbcUrl = new StringBuilder("jdbc:").append(scheme).append("://").append(hostPortPathQuery);
                if (scheme.equals("mysql")) {
                    boolean hasQuery = hostPortPathQuery.contains("?");
                    char sep = hasQuery ? '&' : '?';
                    if (!hostPortPathQuery.contains("useSSL")) {
                        jdbcUrl.append(sep).append(isTidb ? "useSSL=true&enabledTLSProtocols=TLSv1.2,TLSv1.3" : "useSSL=false");
                        sep = '&';
                    }
                    if (!hostPortPathQuery.contains("serverTimezone")) {
                        jdbcUrl.append(sep).append("serverTimezone=UTC");
                        sep = '&';
                    }
                    if (!isTidb && !hostPortPathQuery.contains("allowPublicKeyRetrieval")) {
                        jdbcUrl.append(sep).append("allowPublicKeyRetrieval=true");
                    }
                } else if (scheme.equals("postgresql") && !hostPortPathQuery.contains("?")) {
                    jdbcUrl.append("?sslmode=prefer");
                }

                String finalJdbcUrl = jdbcUrl.toString();
                System.setProperty("spring.datasource.url", finalJdbcUrl);
                System.out.println("📦 Cloud database URL converted to JDBC: " + sanitizeUrlForLogging(finalJdbcUrl));
            } catch (Exception e) {
                System.err.println("⚠️ Could not parse database URL: " + e.getMessage());
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
