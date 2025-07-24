package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.auth.*;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.example.service.AuthService;
import org.example.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3002", "http://localhost:5173"})
public class AuthController {
    
    private final AuthService authService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private SubscriptionService subscriptionService;
    
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
    public ResponseEntity<?> verify(@RequestBody Map<String, String> request) {
        try {
            String verificationCode = request.get("verificationCode");
            
            if (verificationCode == null || verificationCode.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Код верификации не может быть пустым"
                ));
            }
            
            boolean verified = authService.verifyUser(verificationCode);
            
            if (verified) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Верификация прошла успешно"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Неверный или устаревший код верификации"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    /**
     * Получение информации о текущем API ключе
     */
    @GetMapping("/api-key")
    public ResponseEntity<?> getApiKey(Authentication auth) {
        try {
            String userEmail = auth.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            // Проверяем наличие активной подписки
            boolean hasSubscription = subscriptionService.hasActiveSubscription(user);
            if (!hasSubscription) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Для доступа к API ключу требуется активная подписка",
                    "requiresSubscription", true
                ));
            }
            
            boolean hasApiKey = user.getWildberriesApiKey() != null && !user.getWildberriesApiKey().trim().isEmpty();
            String apiKey = hasApiKey ? user.getWildberriesApiKey() : "";
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "hasApiKey", hasApiKey,
                "apiKey", apiKey
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка получения API ключа: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Установка API ключа Wildberries
     */
    @PostMapping("/set-api-key")
    public ResponseEntity<?> setApiKey(Authentication auth, @RequestBody Map<String, String> request) {
        try {
            String userEmail = auth.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            // Проверяем наличие активной подписки
            boolean hasSubscription = subscriptionService.hasActiveSubscription(user);
            if (!hasSubscription) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Для установки API ключа требуется активная подписка",
                    "requiresSubscription", true
                ));
            }
            
            String apiKey = request.get("apiKey");
            if (apiKey == null || apiKey.trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "API ключ не может быть пустым"
                ));
            }
            
            user.setWildberriesApiKey(apiKey.trim());
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "API ключ Wildberries успешно установлен"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка установки API ключа: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Удаление API ключа
     */
    @DeleteMapping("/api-key")
    public ResponseEntity<?> deleteApiKey(Authentication auth) {
        try {
            String userEmail = auth.getName();
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            user.setWildberriesApiKey(null);
            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "API ключ удален"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка удаления API ключа: " + e.getMessage()
            ));
        }
    }
} 