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

    @Test
    @DisplayName("5. Verify user registration and duplicate prevention (409)")
    public void testRegistrationAndDuplicate() {
        String uniqueEmail = "reg_test_" + System.currentTimeMillis() + "@example.com";
        Map<String, String> newUserData = Map.of(
                "name", "Integration Tester",
                "email", uniqueEmail,
                "password", "SecurePass2026!"
        );

        ResponseEntity<Map> regResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/register", newUserData, Map.class);
        assertEquals(HttpStatus.CREATED, regResp.getStatusCode());
        assertNotNull(regResp.getBody());
        assertEquals("Registration successful", regResp.getBody().get("message"));
        assertNotNull(regResp.getBody().get("token"));

        // Duplicate registration attempt
        ResponseEntity<Map> dupResp = restTemplate.postForEntity(getBaseUrl() + "/api/auth/register", newUserData, Map.class);
        assertEquals(HttpStatus.CONFLICT, dupResp.getStatusCode());
        assertNotNull(dupResp.getBody());
        assertEquals("Email is already registered.", dupResp.getBody().get("error"));
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
