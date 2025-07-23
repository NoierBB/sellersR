package org.example.entity;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @Column(nullable = false)
    private String password;
    
    @Column(name = "first_name", nullable = false)
    private String firstName;
    
    @Column(name = "last_name", nullable = false)
    private String lastName;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Column(name = "telegram_chat_id")
    private Long telegramChatId;
    
    @Column(name = "verification_code")
    private String verificationCode;
    
    @Column(name = "is_verified")
    private Boolean isVerified = false;
    
    @Column(name = "verification_expires_at")
    private LocalDateTime verificationExpiresAt;
    
    @Column(name = "wb_api_key", length = 1000)
    private String wbApiKey;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Конструкторы
    public User() {}
    
    public User(Long id, String email, String password, String firstName, String lastName, 
                String phoneNumber, Long telegramChatId, String verificationCode, Boolean isVerified,
                LocalDateTime verificationExpiresAt, String wbApiKey, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.telegramChatId = telegramChatId;
        this.verificationCode = verificationCode;
        this.isVerified = isVerified;
        this.verificationExpiresAt = verificationExpiresAt;
        this.wbApiKey = wbApiKey;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    // Геттеры
    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public Long getTelegramChatId() { return telegramChatId; }
    public String getVerificationCode() { return verificationCode; }
    public Boolean getIsVerified() { return isVerified; }
    public LocalDateTime getVerificationExpiresAt() { return verificationExpiresAt; }
    public String getWbApiKey() { return wbApiKey; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
    // Сеттеры
    public void setId(Long id) { this.id = id; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setTelegramChatId(Long telegramChatId) { this.telegramChatId = telegramChatId; }
    public void setVerificationCode(String verificationCode) { this.verificationCode = verificationCode; }
    public void setIsVerified(Boolean isVerified) { this.isVerified = isVerified; }
    public void setVerificationExpiresAt(LocalDateTime verificationExpiresAt) { this.verificationExpiresAt = verificationExpiresAt; }
    public void setWbApiKey(String wbApiKey) { this.wbApiKey = wbApiKey; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Дополнительные методы для совместимости с сервисом
    public String getWildberriesApiKey() { return wbApiKey; }
    public void setWildberriesApiKey(String wildberriesApiKey) { this.wbApiKey = wildberriesApiKey; }
    
    // Метод для проверки верификации
    public boolean isVerified() { 
        return isVerified != null && isVerified; 
    }
    
    // UserDetails methods
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }
    
    @Override
    public String getUsername() {
        return email;
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        // Временно отключаем проверку верификации для тестирования
        return true;
        // TODO: Вернуть проверку верификации: return isVerified != null && isVerified;
    }
} 