package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.auth.*;
import org.example.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3002"})
public class AuthController {
    
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            String verificationCode = authService.getVerificationCode(request.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Регистрация успешна",
                "token", response.getToken(),
                "user", response,
                "verificationCode", verificationCode,
                "telegramBot", "@SellersWilberis_bot"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.authenticate(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Авторизация успешна",
                "token", response.getToken(),
                "user", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerificationRequest request) {
        try {
            boolean verified = authService.verifyUser(request.getVerificationCode());
            if (verified) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Верификация прошла успешно"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Неверный код верификации"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }

    // ВРЕМЕННЫЙ эндпоинт для отладки - сброс пароля
    @PostMapping("/debug/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String newPassword = request.get("password");
            
            boolean result = authService.resetPassword(email, newPassword);
            
            if (result) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Пароль успешно обновлен"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Пользователь не найден"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
} 