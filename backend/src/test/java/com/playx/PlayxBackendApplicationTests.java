package com.playx;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class PlayxBackendApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @org.junit.jupiter.api.BeforeEach
    public void setup() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setOutputStreaming(false);
        restTemplate.getRestTemplate().setRequestFactory(factory);
    }

    @Test
    @DisplayName("1. Verify GET /api/health and /health report UP and CONNECTED")
    public void testHealthEndpoints() {
        ResponseEntity<Map> healthResp = restTemplate.getForEntity(getBaseUrl() + "/health", Map.class);
        assertEquals(HttpStatus.OK, healthResp.getStatusCode());
        assertNotNull(healthResp.getBody());
        assertEquals("UP", healthResp.getBody().get("status"));
        assertEquals("CONNECTED", healthResp.getBody().get("database"));

        ResponseEntity<Map> apiHealthResp = restTemplate.getForEntity(getBaseUrl() + "/api/health", Map.class);
        assertEquals(HttpStatus.OK, apiHealthResp.getStatusCode());
        assertNotNull(apiHealthResp.getBody());
        assertEquals("UP", apiHealthResp.getBody().get("status"));
        assertEquals("CONNECTED", apiHealthResp.getBody().get("database"));
    }

    @Test
    @DisplayName("2. Verify POST /api/auth/login succeeds with valid credentials")
    public void testValidLogin() {
        Map<String, String> creds = Map.of("email", "user@example.com", "password", "UserPass123");
        ResponseEntity<Map> response = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", creds, Map.class);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Login successful", response.getBody().get("message"));
        assertNotNull(response.getBody().get("token"));
        assertTrue(response.getBody().get("token").toString().length() > 20);

        Map user = (Map) response.getBody().get("user");
        assertNotNull(user);
        assertEquals("user@example.com", user.get("email"));
    }

    @Test
    @DisplayName("3. Verify POST /api/auth/login fails with invalid credentials (401)")
    public void testInvalidLogin() {
        Map<String, String> creds = Map.of("email", "user@example.com", "password", "IncorrectPassword999");
        ResponseEntity<Map> response = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", creds, Map.class);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Invalid email or password.", response.getBody().get("error"));
    }

    @Test
    @DisplayName("4. Verify POST /api/auth/login validates missing credentials (400)")
    public void testMissingCredentialsLogin() {
        Map<String, String> creds = Map.of("email", "user@example.com");
        ResponseEntity<Map> response = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", creds, Map.class);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Please enter both email and password.", response.getBody().get("error"));
    }

    @Autowired
    private com.playx.repository.UserRepository testUserRepository;

    @Autowired
    private com.playx.service.EmailService testEmailService;

    @Test
    @DisplayName("5. Verify user registration, email verification, and unverified login prevention")
    public void testRegistrationAndVerificationFlow() {
        String uniqueEmail = "reg_test_" + System.currentTimeMillis() + "@example.com";
        Map<String, String> newUserData = Map.of(
                "name", "Integration Tester",
                "email", uniqueEmail,
                "password", "SecurePass2026!"
        );

        // 1. Register new account - returns 201 Created with emailVerified = false
        ResponseEntity<Map> regResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/register", newUserData, Map.class);
        assertEquals(HttpStatus.CREATED, regResp.getStatusCode());
        assertNotNull(regResp.getBody());
        assertTrue(regResp.getBody().get("message").toString().contains("verification link has been sent"));
        assertEquals(false, regResp.getBody().get("emailVerified"));

        // 2. Try logging in before verification - rejected with 403 Forbidden
        Map<String, String> unverifiedCreds = Map.of("email", uniqueEmail, "password", "SecurePass2026!");
        ResponseEntity<Map> unverifiedLogin = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", unverifiedCreds, Map.class);
        assertEquals(HttpStatus.FORBIDDEN, unverifiedLogin.getStatusCode());
        assertNotNull(unverifiedLogin.getBody());
        assertEquals(false, unverifiedLogin.getBody().get("emailVerified"));

        // 3. Test resend cooldown rate limit (must return 429 Too Many Requests within 60s)
        ResponseEntity<Map> resendResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/resend-verification", Map.of("email", uniqueEmail), Map.class);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS, resendResp.getStatusCode());

        // 4. Test invalid token
        ResponseEntity<Map> invalidTokenResp = restTemplate.getForEntity(getBaseUrl() + "/api/auth/verify-email?token=invalid_dummy_token_999", Map.class);
        assertEquals(HttpStatus.BAD_REQUEST, invalidTokenResp.getStatusCode());

        // 5. Verify the user using their token
        com.playx.model.User savedUser = testUserRepository.findByEmailIgnoreCase(uniqueEmail).orElseThrow();
        assertFalse(savedUser.getEmailVerified());
        assertNotNull(savedUser.getVerificationTokenHash());

        // Set a known token hash so we can verify via HTTP GET
        String rawTestToken = "test_verification_token_secret_12345";
        savedUser.setVerificationTokenHash(testEmailService.hashToken(rawTestToken));
        savedUser.setVerificationTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        testUserRepository.save(savedUser);

        ResponseEntity<Map> verifyResp = restTemplate.getForEntity(getBaseUrl() + "/api/auth/verify-email?token=" + rawTestToken, Map.class);
        assertEquals(HttpStatus.OK, verifyResp.getStatusCode());
        assertNotNull(verifyResp.getBody());
        assertEquals(true, verifyResp.getBody().get("verified"));
        assertNotNull(verifyResp.getBody().get("token"));

        // 6. Test token single-use: verifying the same token again should be rejected
        ResponseEntity<Map> reuseResp = restTemplate.getForEntity(getBaseUrl() + "/api/auth/verify-email?token=" + rawTestToken, Map.class);
        assertEquals(HttpStatus.BAD_REQUEST, reuseResp.getStatusCode());

        // 7. Login now succeeds with 200 OK
        ResponseEntity<Map> verifiedLogin = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", unverifiedCreds, Map.class);
        assertEquals(HttpStatus.OK, verifiedLogin.getStatusCode());
        assertEquals("Login successful", verifiedLogin.getBody().get("message"));

        // 8. Duplicate registration attempt on verified account returns 409 Conflict
        ResponseEntity<Map> dupResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/register", newUserData, Map.class);
        assertEquals(HttpStatus.CONFLICT, dupResp.getStatusCode());
    }

    @Test
    @DisplayName("6. Verify protected endpoints enforce JWT authentication")
    public void testProtectedEndpoints() {
        // Unauthenticated request to protected endpoint should be rejected (403 Forbidden or 401)
        ResponseEntity<Map> unauthResp = restTemplate.getForEntity(getBaseUrl() + "/api/auth/me", Map.class);
        assertTrue(unauthResp.getStatusCode() == HttpStatus.FORBIDDEN || unauthResp.getStatusCode() == HttpStatus.UNAUTHORIZED);

        // Authenticated request with Bearer token
        Map<String, String> creds = Map.of("email", "user@example.com", "password", "UserPass123");
        ResponseEntity<Map> loginResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", creds, Map.class);
        String token = (String) loginResp.getBody().get("token");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<Map> authResp = restTemplate.exchange(getBaseUrl() + "/api/auth/me", HttpMethod.GET, entity, Map.class);
        assertEquals(HttpStatus.OK, authResp.getStatusCode());
        assertNotNull(authResp.getBody());
        assertEquals("user@example.com", authResp.getBody().get("email"));
    }

    @Test
    @DisplayName("7. Verify unknown endpoint returns 404")
    public void testUnknownEndpoint() {
        Map<String, String> creds = Map.of("email", "user@example.com", "password", "UserPass123");
        ResponseEntity<Map> loginResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", creds, Map.class);
        String token = (String) loginResp.getBody().get("token");

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(getBaseUrl() + "/api/nonexistent-endpoint-xyz-99", HttpMethod.GET, entity, String.class);
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }
}
