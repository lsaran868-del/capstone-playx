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

        SpringApplication.run(PlayxApplication.class, args);

        String port = System.getenv("PORT");
        if (port == null || port.isBlank()) {
            port = System.getProperty("server.port", "5000");
        }

        System.out.println("\n🎧 ===============================================\n" +
                           "   PLAYX Music Streaming Spring Boot API Server\n" +
                           "   Bound to:   0.0.0.0:" + port + "\n" +
                           "   Access URL: http://localhost:" + port + "\n" +
                           "===============================================🎧\n");
    }

    /**
     * Loads .env from the local working directory or project root if present.
     * Ensures local development works without manually exporting environment variables
     * and without committing secrets to source control.
     */
    private static void loadEnvFile() {
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
     * Normalizes cloud-native database connection URLs (e.g. mysql://... or postgresql://...)
     * provided by Render or cloud database addons into valid JDBC URLs.
     */
    private static void configureDatabaseProperties() {
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("DATABASE_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getenv("MYSQL_URL");
        }
        if (dbUrl == null || dbUrl.isBlank()) {
            dbUrl = System.getProperty("DATABASE_URL");
        }

        if (dbUrl != null && !dbUrl.isBlank()) {
            if (dbUrl.startsWith("mysql://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
                try {
                    String cleanUrl = dbUrl.replace("postgres://", "postgresql://");
                    URI uri = new URI(cleanUrl);
                    String scheme = uri.getScheme().equals("mysql") ? "mysql" : "postgresql";
                    String host = uri.getHost();
                    int port = uri.getPort();
                    String path = uri.getPath();
                    String query = uri.getQuery();

                    StringBuilder jdbcUrl = new StringBuilder("jdbc:").append(scheme).append("://").append(host);
                    if (port > 0) {
                        jdbcUrl.append(":").append(port);
                    }
                    if (path != null) {
                        jdbcUrl.append(path);
                    }
                    if (query != null && !query.isBlank()) {
                        jdbcUrl.append("?").append(query);
                    } else if (scheme.equals("mysql")) {
                        jdbcUrl.append("?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
                    }
                    System.setProperty("spring.datasource.url", jdbcUrl.toString());

                    String userInfo = uri.getUserInfo();
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        if (System.getProperty("spring.datasource.username") == null && System.getenv("SPRING_DATASOURCE_USERNAME") == null) {
                            System.setProperty("spring.datasource.username", parts[0]);
                        }
                        if (System.getProperty("spring.datasource.password") == null && System.getenv("SPRING_DATASOURCE_PASSWORD") == null) {
                            System.setProperty("spring.datasource.password", parts[1]);
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }
    }
}
