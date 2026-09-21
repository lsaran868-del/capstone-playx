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
     * Normalizes database connection parameters for Railway, Render, and local development.
     *
     * Precedence:
     * 1. SPRING_DATASOURCE_URL (explicit JDBC or cloud URI)
     * 2. DATABASE_URL / MYSQL_URL / MYSQL_PRIVATE_URL (provided by Railway / Render addons)
     * 3. Railway direct MySQL variables: MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
     * 4. Production fail-safe: Fail clearly with an actionable error if production DB variables are missing.
     * 5. Local development fallback: localhost:3306, PlayX_db, root
     */
    private static void configureDatabaseProperties() {
        boolean isProd = isProductionEnvironment();

        // 1. Explicit SPRING_DATASOURCE_URL
        String springDsUrl = getFirstEnvOrProp("SPRING_DATASOURCE_URL", "spring.datasource.url");
        if (springDsUrl != null && !springDsUrl.isBlank()) {
            configureUrl(springDsUrl.trim());
            return;
        }

        // 2. Railway / Render standard DATABASE_URL or MYSQL_URL
        String dbUrl = getFirstEnvOrProp(
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
            configureUrl(dbUrl.trim());
            return;
        }

        // 3. Railway direct MySQL variables: MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD
        // Priority to MYSQLHOST over MYSQL_HOST so cloud injected variables supersede local defaults
        String mysqlHost = getFirstEnvOrProp("MYSQLHOST", "MYSQL_HOST", "DB_HOST");
        boolean isLocalHost = mysqlHost == null || mysqlHost.isBlank() ||
                              mysqlHost.equalsIgnoreCase("localhost") ||
                              mysqlHost.equals("127.0.0.1");

        if (!isLocalHost) {
            String port = getFirstEnvOrProp("MYSQLPORT", "MYSQL_PORT", "DB_PORT", "3306");
            String db = getFirstEnvOrProp("MYSQLDATABASE", "MYSQL_DATABASE", "DB_NAME", "railway");
            String user = getFirstEnvOrProp("MYSQLUSER", "MYSQL_USER", "DB_USER", "root");
            String pass = getFirstEnvOrProp("MYSQLPASSWORD", "MYSQL_PASSWORD", "DB_PASSWORD", "");

            String jdbcUrl = "jdbc:mysql://" + mysqlHost + ":" + port + "/" + db +
                             "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";

            System.setProperty("spring.datasource.url", jdbcUrl);
            System.setProperty("spring.datasource.username", user);
            System.setProperty("spring.datasource.password", pass);
            System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
            System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.MySQLDialect");
            System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
            System.out.println("📦 Railway/Render MySQL configured via environment variables: " + sanitizeUrlForLogging(jdbcUrl));
            return;
        }

        // 4. Production Safety Check:
        // Production must NOT silently fall back to localhost if Railway/Render database variables are missing!
        if (isProd) {
            throw new IllegalStateException(
                "\n======================================================================\n" +
                "❌ [PLAYX PRODUCTION DATABASE CONFIGURATION ERROR]\n" +
                "   The backend is running in a cloud/production container (Railway / Render),\n" +
                "   but no valid external MySQL database configuration was detected!\n\n" +
                "   Attempting to connect to localhost:3306 in production will fail.\n\n" +
                "   REQUIRED ACTIONS IN YOUR RAILWAY / RENDER DASHBOARD:\n" +
                "     Option A (Railway MySQL Service Link):\n" +
                "       Ensure your MySQL service is linked and exports:\n" +
                "       - MYSQLHOST\n" +
                "       - MYSQLPORT (default: 3306)\n" +
                "       - MYSQLDATABASE (e.g. railway or PlayX_db)\n" +
                "       - MYSQLUSER (e.g. root)\n" +
                "       - MYSQLPASSWORD\n\n" +
                "     Option B (Database URL Variable):\n" +
                "       Set DATABASE_URL (e.g. ${{ MySQL.MYSQL_PRIVATE_URL }} or mysql://user:pass@host:port/dbname)\n" +
                "       or set SPRING_DATASOURCE_URL.\n" +
                "======================================================================\n"
            );
        }

        // 5. Local Development Fallback: localhost:3306, PlayX_db, root
        String localPort = getFirstEnvOrProp("MYSQLPORT", "MYSQL_PORT", "3306");
        String localDb = getFirstEnvOrProp("MYSQLDATABASE", "MYSQL_DATABASE", "PlayX_db");
        String localUser = getFirstEnvOrProp("MYSQLUSER", "MYSQL_USER", "root");
        String localPass = getFirstEnvOrProp("MYSQLPASSWORD", "MYSQL_PASSWORD", "");
        String localHost = (mysqlHost != null && !mysqlHost.isBlank()) ? mysqlHost : "localhost";

        String localJdbcUrl = "jdbc:mysql://" + localHost + ":" + localPort + "/" + localDb +
                              "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";

        if (System.getProperty("spring.datasource.url") == null) {
            System.setProperty("spring.datasource.url", localJdbcUrl);
        }
        if (System.getProperty("spring.datasource.username") == null) {
            System.setProperty("spring.datasource.username", localUser);
        }
        if (System.getProperty("spring.datasource.password") == null) {
            System.setProperty("spring.datasource.password", localPass);
        }
        System.setProperty("spring.datasource.driver-class-name", "com.mysql.cj.jdbc.Driver");
        System.setProperty("spring.jpa.database-platform", "org.hibernate.dialect.MySQLDialect");
        System.setProperty("spring.jpa.properties.hibernate.dialect", "org.hibernate.dialect.MySQLDialect");
        System.out.println("💻 Local development MySQL configured: " + sanitizeUrlForLogging(localJdbcUrl));
    }

    /**
     * Parses and applies a database URL (JDBC or cloud-native URI format).
     */
    private static void configureUrl(String dbUrl) {
        if ((dbUrl.startsWith("\"") && dbUrl.endsWith("\"")) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
            dbUrl = dbUrl.substring(1, dbUrl.length() - 1);
        }

        // Production guard: fail fast if cloud configuration accidentally specifies localhost
        if (isProductionEnvironment() && (dbUrl.contains("localhost") || dbUrl.contains("127.0.0.1"))) {
            throw new IllegalStateException(
                "\n======================================================================\n" +
                "❌ [PLAYX PRODUCTION DATABASE CONFIGURATION ERROR]\n" +
                "   The configured database URL is attempting to connect to 'localhost':\n" +
                "   " + sanitizeUrlForLogging(dbUrl) + "\n\n" +
                "   In Render / Railway cloud containers, 'localhost' refers to the container itself.\n" +
                "   Your MySQL database is NOT running inside this container.\n\n" +
                "   HOW TO FIX IN RENDER DASHBOARD:\n" +
                "   1. Go to your Render Web Service -> 'Environment' tab.\n" +
                "   2. Update 'DATABASE_URL' or 'SPRING_DATASOURCE_URL'.\n" +
                "   3. Replace 'localhost:3306' with your remote Railway MySQL public host and port:\n" +
                "      e.g. mysql://root:PASSWORD@roundhouse.proxy.rlwy.net:PORT/railway\n" +
                "   4. Or configure individual variables:\n" +
                "      MYSQLHOST, MYSQLPORT, MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD\n" +
                "======================================================================\n"
            );
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
            String u = getFirstEnvOrProp("SPRING_DATASOURCE_USERNAME", "MYSQLUSER", "MYSQL_USER");
            String p = getFirstEnvOrProp("SPRING_DATASOURCE_PASSWORD", "MYSQLPASSWORD", "MYSQL_PASSWORD");
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
                System.out.println("📦 Cloud database URL converted to JDBC: " + sanitizeUrlForLogging(finalJdbcUrl));
            } catch (Exception e) {
                System.err.println("⚠️ Could not parse database URL: " + e.getMessage());
            }
        }
    }

    /**
     * Validates JWT security settings.
     * In production, JWT_SECRET must be explicitly provided and never hardcoded.
     * In local development, an ephemeral fallback is provided for development convenience.
     */
    private static void configureSecurityProperties() {
        String jwtSecret = getFirstEnvOrProp("JWT_SECRET", "jwt.secret");
        if (jwtSecret == null || jwtSecret.isBlank()) {
            if (isProductionEnvironment()) {
                throw new IllegalStateException(
                    "\n======================================================================\n" +
                    "❌ [PLAYX PRODUCTION SECURITY CONFIGURATION ERROR]\n" +
                    "   Missing JWT_SECRET environment variable!\n" +
                    "   In production, a secure 256-bit JWT secret must be supplied via the JWT_SECRET variable.\n" +
                    "   Do not use hardcoded secret keys in production.\n" +
                    "======================================================================\n"
                );
            } else {
                System.setProperty("jwt.secret", "playx_local_development_jwt_secret_key_needs_to_be_32_bytes_long_min_2026");
            }
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
}
