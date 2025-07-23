package org.example.service;

import org.example.dto.auth.AuthResponse;
import org.example.dto.auth.LoginRequest;
import org.example.dto.auth.RegisterRequest;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, 
                      JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }
    
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }
        
        // Создаем пользователя
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setIsVerified(false);
        
        // Генерируем код верификации
        String verificationCode = generateVerificationCode();
        user.setVerificationCode(verificationCode);
        user.setVerificationExpiresAt(LocalDateTime.now().plusHours(24)); // Код действует 24 часа
        
        user = userRepository.save(user);
        
        // Генерируем JWT токен
        String jwtToken = jwtService.generateToken(user);
        
        System.out.println("User registered: " + user.getEmail() + ", verification code: " + verificationCode);
        
        return new AuthResponse(
                jwtToken,
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getIsVerified(),
                user.getWbApiKey() != null
        );
    }
    
    public AuthResponse authenticate(LoginRequest request) {
        System.out.println("🔐 Попытка авторизации для: " + request.getEmail());
        
        try {
            // Проверяем есть ли пользователь в базе
            User user = userRepository.findByEmail(request.getEmail())
                    .orElse(null);
            
            if (user == null) {
                System.out.println("❌ Пользователь не найден: " + request.getEmail());
                throw new RuntimeException("Пользователь не найден");
            }
            
            System.out.println("✅ Пользователь найден: " + user.getEmail() + ", верифицирован: " + user.getIsVerified());
            
            // Проверяем пароль
            boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
            System.out.println("🔑 Проверка пароля: " + passwordMatches);
            
            if (!passwordMatches) {
                System.out.println("❌ Пароль не совпадает");
                throw new RuntimeException("Неверный пароль");
            }
            
            // Попытка аутентификации через AuthenticationManager
            System.out.println("🔒 Аутентификация через AuthenticationManager...");
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
            System.out.println("✅ Аутентификация успешна");
            
            String jwtToken = jwtService.generateToken(user);
            
            return new AuthResponse(
                    jwtToken,
                    user.getId(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getIsVerified(),
                    user.getWbApiKey() != null
            );
            
        } catch (Exception e) {
            System.out.println("❌ Ошибка аутентификации: " + e.getMessage());
            throw new RuntimeException("Неверный email или пароль");
        }
    }
    
    public boolean verifyUser(String verificationCode) {
        User user = userRepository.findByVerificationCode(verificationCode)
                .orElse(null);
        
        if (user == null) {
            return false;
        }
        
        if (user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            return false;
        }
        
        user.setIsVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiresAt(null);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        
        System.out.println("User " + user.getEmail() + " verified successfully");
        return true;
    }
    
    public String getVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
        
        return user.getVerificationCode();
    }
    
    // ВРЕМЕННЫЙ метод для отладки - сброс пароля
    public boolean resetPassword(String email, String newPassword) {
        try {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                System.out.println("❌ Пользователь не найден для сброса пароля: " + email);
                return false;
            }
            
            String hashedPassword = passwordEncoder.encode(newPassword);
            user.setPassword(hashedPassword);
            user.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(user);
            
            System.out.println("✅ Пароль успешно обновлен для пользователя: " + email);
            return true;
        } catch (Exception e) {
            System.err.println("❌ Ошибка сброса пароля: " + e.getMessage());
            return false;
        }
    }
    
    private String generateVerificationCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(999999));
    }
} 