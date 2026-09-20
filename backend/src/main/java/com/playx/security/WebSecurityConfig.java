package com.playx.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

import java.util.Arrays;
import java.util.Collections;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .headers(headers -> headers.frameOptions(Customizer.withDefaults()).disable()) // Allow H2 Console frames
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Allow static resources, error endpoint & H2 console
                .requestMatchers(AntPathRequestMatcher.antMatcher("/error"), AntPathRequestMatcher.antMatcher("/h2-console/**"), AntPathRequestMatcher.antMatcher("/public/**"), AntPathRequestMatcher.antMatcher("/audio/**"), AntPathRequestMatcher.antMatcher("/uploads/**"), AntPathRequestMatcher.antMatcher("/uploads/covers/**"), AntPathRequestMatcher.antMatcher("/api/health")).permitAll()
                // Auth paths
                .requestMatchers(AntPathRequestMatcher.antMatcher("/api/auth/register"), AntPathRequestMatcher.antMatcher("/api/auth/login"), AntPathRequestMatcher.antMatcher("/api/auth/social-login"), AntPathRequestMatcher.antMatcher("/api/auth/logout")).permitAll()
                // Permissive GET routes
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/songs"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/songs/recommended"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/songs/popular"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/songs/new-releases"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/songs/{id}")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/songs/{id}/stream")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/artists"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/artists/{id}")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/albums"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/albums/{id}")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/genres")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/playlists"), AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/playlists/{id}")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/search")).permitAll()
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.GET, "/api/subscriptions/plans")).permitAll()
                // Song management (Admin only)
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.POST, "/api/songs/upload")).hasRole("admin")
                .requestMatchers(AntPathRequestMatcher.antMatcher(HttpMethod.DELETE, "/api/songs/{id}")).hasRole("admin")
                // Require Auth for writing/management
                .requestMatchers(AntPathRequestMatcher.antMatcher("/api/admin/**")).hasRole("admin")
                .requestMatchers(AntPathRequestMatcher.antMatcher("/api/artists/dashboard/**")).hasAnyRole("artist", "admin")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Collections.singletonList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Range"));
        configuration.setExposedHeaders(Arrays.asList("Content-Range", "Accept-Ranges", "Content-Length"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
