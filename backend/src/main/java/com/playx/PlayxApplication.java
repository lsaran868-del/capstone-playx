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
     * provided by Railway, Render, or cloud database addons into valid JDBC URLs,
     * and dynamically sets the corresponding Hibernate dialect and JDBC driver.
     */
    private static void configureDatabaseProperties() {
        String dbUrl = getFirstEnvOrProp(
            "SPRING_DATASOURCE_URL",
            "DATABASE_URL",
            "MYSQL_PRIVATE_URL",
            "MYSQLPRIVATEURL",
            "MYSQL_URL",
            "MYSQLURL",
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
            boolean isMysql = dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysql2://") || dbUrl.startsWith("jdbc:mysql:");

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

                    StringBuilder jdbcUrl = new StringBuilder("jdbc:").append(scheme).append("://").append(hostPortPathQuery);
                    if (scheme.equals("mysql")) {
                        boolean hasQuery = hostPortPathQuery.contains("?");
                        char sep = hasQuery ? '&' : '?';
                        if (!hostPortPathQuery.contains("useSSL")) {
                            jdbcUrl.append(sep).append("useSSL=false");
                            sep = '&';
                        }
                        if (!hostPortPathQuery.contains("serverTimezone")) {
                            jdbcUrl.append(sep).append("serverTimezone=UTC");
                            sep = '&';
                        }
                        if (!hostPortPathQuery.contains("allowPublicKeyRetrieval")) {
                            jdbcUrl.append(sep).append("allowPublicKeyRetrieval=true");
                        }
                    } else if (scheme.equals("postgresql") && !hostPortPathQuery.contains("?")) {
                        jdbcUrl.append("?sslmode=prefer");
                    }

                    String finalJdbcUrl = jdbcUrl.toString();
                    System.setProperty("spring.datasource.url", finalJdbcUrl);
                    System.out.println("📦 Railway/Cloud database converted to JDBC: " + sanitizeUrlForLogging(finalJdbcUrl));
                    return;
                } catch (Exception e) {
                    System.err.println("⚠️ Could not parse database URL: " + e.getMessage());
                }
            }
        }

        // Fallback: Check Railway direct environment variables (e.g. MYSQLHOST, MYSQLPORT)
        String mysqlHost = getFirstEnvOrProp("MYSQL_HOST", "MYSQLHOST");
        if (mysqlHost != null && !mysqlHost.isBlank() && !mysqlHost.equalsIgnoreCase("localhost")) {
            String port = getFirstEnvOrProp("MYSQL_PORT", "MYSQLPORT", "3306");
            String db = getFirstEnvOrProp("MYSQL_DATABASE", "MYSQLDATABASE", "railway");
            String user = getFirstEnvOrProp("MYSQL_USER", "MYSQLUSER", "root");
            String pass = getFirstEnvOrProp("MYSQL_PASSWORD", "MYSQLPASSWORD", "");

            String jdbcUrl = "jdbc:mysql://" + mysqlHost + ":" + port + "/" + db + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
            System.setProperty("spring.datasource.url", jdbcUrl);
            System.setProperty("spring.datasource.username", user);
            System.setProperty("spring.datasource.password", pass);
            System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.MySQLDialect");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
            System.out.println("📦 Railway direct MySQL host configured: " + sanitizeUrlForLogging(jdbcUrl));
            return;
        }

        // Cloud deployment diagnostic check: notify if running on Railway/Cloud without external database
        String configuredUrl = System.getProperty("spring.datasource.url", "");
        if (configuredUrl.isEmpty() && (System.getenv("RAILWAY_ENVIRONMENT") != null || System.getenv("RENDER") != null || System.getenv("PORT") != null)) {
            String hostEnv = getFirstEnvOrProp("MYSQL_HOST", "MYSQLHOST");
            if (hostEnv == null || hostEnv.equalsIgnoreCase("localhost")) {
                System.err.println("\n⚠️ [DEPLOYMENT NOTICE]: No cloud database environment variable detected.");
                System.err.println("   The application is running in a cloud container (Railway/Render) but falling back to localhost:3306.");
                System.err.println("   Please set DATABASE_URL (e.g. ${{ MySQL.MYSQL_PRIVATE_URL }}) in your Railway Environment variables.\n");
            }
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
}
