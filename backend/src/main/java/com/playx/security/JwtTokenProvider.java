package com.playx.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:604800000}")
    private String jwtExpirationStr;
    

    private long getExpirationMillis() {
        try {
            if (jwtExpirationStr == null || jwtExpirationStr.isBlank()) {
                return 604800000L; // 7 days
            }
            String clean = jwtExpirationStr.trim().toLowerCase();
            if (clean.endsWith("d")) {
                long days = Long.parseLong(clean.substring(0, clean.length() - 1));
                return days * 24 * 60 * 60 * 1000L;
            } else if (clean.endsWith("h")) {
                long hours = Long.parseLong(clean.substring(0, clean.length() - 1));
                return hours * 60 * 60 * 1000L;
            } else if (clean.endsWith("m")) {
                long minutes = Long.parseLong(clean.substring(0, clean.length() - 1));
                return minutes * 60 * 1000L;
            } else if (clean.endsWith("s")) {
                long seconds = Long.parseLong(clean.substring(0, clean.length() - 1));
                return seconds * 1000L;
            } else {
                return Long.parseLong(clean);
            }
        } catch (Exception e) {
            return 604800000L;
        }
    }

    private Key getSigningKey() {
        byte[] keyBytes = secret.getBytes();
        if (keyBytes.length < 32) {
            // Standard fallback if key is too short for HS256
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            return Keys.hmacShaKeyFor(padded);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String userId, String email, String role, String name) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", userId);
        claims.put("email", email);
        claims.put("role", role);
        claims.put("name", name);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userId)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + getExpirationMillis()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getUserIdFromToken(String token) {
        return extractAllClaims(token).getSubject();
    }
}
