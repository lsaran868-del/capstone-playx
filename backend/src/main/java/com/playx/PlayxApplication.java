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
     * provided by Render, Railway, or cloud database addons into valid JDBC URLs,
     * and dynamically sets the corresponding Hibernate dialect and JDBC driver.
     */
    private static void configureDatabaseProperties() {
        String dbUrl = getFirstEnvOrProp(
            "SPRING_DATASOURCE_URL",
            "DATABASE_URL",
            "MYSQL_URL",
            "JAWSDB_URL",
            "CLEARDB_DATABASE_URL",
            "POSTGRES_URL",
            "DB_URL"
        );

        if (dbUrl != null && !dbUrl.isBlank()) {
            dbUrl = dbUrl.trim();
            if ((dbUrl.startsWith("\"") && dbUrl.endsWith("\"")) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
                dbUrl = dbUrl.substring(1, dbUrl.length() - 1);
            }

            boolean isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("jdbc:postgresql:");
            boolean isMysql = dbUrl.startsWith("mysql://") || dbUrl.startsWith("jdbc:mysql:");

            if (isPostgres) {
                System.setProperty("spring.datasource.driver-class-name", "org.postgresql.Driver");
                System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");
                System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
            } else if (isMysql) {
                System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
                System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.MySQLDialect");
                System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
            }

            if (dbUrl.startsWith("jdbc:")) {
                System.setProperty("spring.datasource.url", dbUrl);
                return;
            }

            if (dbUrl.startsWith("mysql://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
                try {
                    int schemeEnd = dbUrl.indexOf("://");
                    String scheme = dbUrl.substring(0, schemeEnd).equals("mysql") ? "mysql" : "postgresql";
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
                        if (System.getProperty("spring.datasource.username") == null && System.getenv("SPRING_DATASOURCE_USERNAME") == null) {
                            System.setProperty("spring.datasource.username", user);
                        }
                        if (System.getProperty("spring.datasource.password") == null && System.getenv("SPRING_DATASOURCE_PASSWORD") == null) {
                            System.setProperty("spring.datasource.password", pass);
                        }
                    }

                    StringBuilder jdbcUrl = new StringBuilder("jdbc:").append(scheme).append("://").append(hostPortPathQuery);
                    if (scheme.equals("mysql") && !hostPortPathQuery.contains("?")) {
                        jdbcUrl.append("?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true");
                    } else if (scheme.equals("postgresql") && !hostPortPathQuery.contains("?")) {
                        jdbcUrl.append("?sslmode=prefer");
                    }

                    System.setProperty("spring.datasource.url", jdbcUrl.toString());
                } catch (Exception e) {
                    System.err.println("⚠️ Could not parse database URL: " + e.getMessage());
                }
            }
        }

        // Cloud deployment diagnostic check: notify if running on Render/Cloud without external database
        String configuredUrl = System.getProperty("spring.datasource.url", "");
        if (configuredUrl.isEmpty() && (System.getenv("RENDER") != null || System.getenv("PORT") != null)) {
            String hostEnv = System.getenv("MYSQL_HOST");
            if (hostEnv == null || hostEnv.equalsIgnoreCase("localhost")) {
                System.err.println("\n⚠️ [DEPLOYMENT NOTICE]: No cloud database environment variable detected.");
                System.err.println("   The application is running in a cloud container (Render/Railway) but falling back to localhost:3306.");
                System.err.println("   Please set DATABASE_URL (or MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD) in your cloud dashboard Environment settings.\n");
            }
        }
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
}
