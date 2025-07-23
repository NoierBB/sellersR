package org.example.service;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    
    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsServiceImpl userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }
    
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String requestURI = request.getRequestURI();
        final String method = request.getMethod();
        logger.info("🔍 JWT Filter: {} {}", method, requestURI);
        
        // Пропускаем auth, test, debug эндпоинты
        if (requestURI.startsWith("/api/auth/") || requestURI.startsWith("/api/test/") || 
            requestURI.startsWith("/api/debug/")) {
            logger.info("🔓 BYPASSING JWT for: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }
        
        final String authHeader = request.getHeader("Authorization");
        logger.info("🔑 Authorization header: {}", authHeader != null ? "PRESENT" : "MISSING");
        
        if (authHeader != null) {
            logger.info("🔑 Header value: {}", authHeader.substring(0, Math.min(authHeader.length(), 50)) + "...");
        }
        
        final String jwt;
        final String userEmail;
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("❌ NO VALID BEARER TOKEN for: {} {}", method, requestURI);
            filterChain.doFilter(request, response);
            return;
        }
        
        try {
            jwt = authHeader.substring(7);
            logger.info("🔑 Extracted JWT token: {}...", jwt.substring(0, Math.min(jwt.length(), 30)));
            
            userEmail = jwtService.extractUsername(jwt);
            logger.info("📧 Extracted email from token: {}", userEmail);
            
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                logger.info("👤 Loading user details for: {}", userEmail);
                
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                logger.info("✅ User details loaded successfully");
                
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    logger.info("🎯 TOKEN IS VALID - Setting authentication");
                    
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    
                    logger.info("✅ AUTHENTICATION SET SUCCESSFULLY for: {}", userEmail);
                } else {
                    logger.error("❌ TOKEN IS INVALID for user: {}", userEmail);
                }
            } else {
                if (userEmail == null) {
                    logger.error("❌ User email is NULL from token");
                }
                if (SecurityContextHolder.getContext().getAuthentication() != null) {
                    logger.info("ℹ️ Authentication already exists in context");
                }
            }
        } catch (Exception e) {
            logger.error("❌ CRITICAL ERROR processing JWT token: {}", e.getMessage(), e);
        }
        
        // Проверяем финальное состояние аутентификации
        boolean isAuthenticated = SecurityContextHolder.getContext().getAuthentication() != null;
        logger.info("🏁 Final authentication status for {}: {}", requestURI, isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED");
        
        filterChain.doFilter(request, response);
    }
} 
 
 