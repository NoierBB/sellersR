package org.example.controller;

import org.example.entity.Subscription;
import org.example.entity.User;
import org.example.repository.UserRepository;
import org.example.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscription")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002"})
public class SubscriptionController {
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Получение информации о подписке пользователя
     */
    @GetMapping("/info")
    public ResponseEntity<?> getSubscriptionInfo(Authentication auth) {
        try {
            User user = getUserFromAuth(auth);
            SubscriptionService.SubscriptionInfo info = subscriptionService.getSubscriptionInfo(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "subscription", info
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка получения информации о подписке: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Получение всех доступных планов подписки
     */
    @GetMapping("/plans")
    public ResponseEntity<?> getAvailablePlans() {
        try {
            List<SubscriptionService.PlanInfo> plans = subscriptionService.getAvailablePlans();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "plans", plans
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка получения планов: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Создание новой подписки
     */
    @PostMapping("/create")
    public ResponseEntity<?> createSubscription(
            Authentication auth,
            @RequestBody CreateSubscriptionRequest request) {
        try {
            User user = getUserFromAuth(auth);
            
            Subscription.PlanType planType = Subscription.PlanType.valueOf(request.getPlanType());
            Subscription subscription = subscriptionService.createSubscription(user, planType, request.getPaymentMethod());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "subscription", Map.of(
                    "id", subscription.getId(),
                    "planType", subscription.getPlanType().getDisplayName(),
                    "price", subscription.getPrice(),
                    "status", subscription.getStatus().getDisplayName(),
                    "paymentTransactionId", subscription.getPaymentTransactionId()
                ),
                "message", "Подписка создана. Перейдите к оплате."
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка создания подписки: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Активация подписки после успешной оплаты
     */
    @PostMapping("/activate")
    public ResponseEntity<?> activateSubscription(
            Authentication auth,
            @RequestBody ActivateSubscriptionRequest request) {
        try {
            subscriptionService.activateSubscription(request.getSubscriptionId(), request.getTransactionId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Подписка успешно активирована!"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка активации подписки: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Продление подписки
     */
    @PostMapping("/extend")
    public ResponseEntity<?> extendSubscription(
            Authentication auth,
            @RequestBody ExtendSubscriptionRequest request) {
        try {
            User user = getUserFromAuth(auth);
            
            Subscription.PlanType planType = Subscription.PlanType.valueOf(request.getPlanType());
            Subscription subscription = subscriptionService.extendSubscription(user, planType, request.getPaymentMethod());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "subscription", Map.of(
                    "id", subscription.getId(),
                    "daysLeft", subscription.getDaysLeft(),
                    "endDate", subscription.getEndDate()
                ),
                "message", "Подписка продлена на " + planType.getDays() + " дней"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка продления подписки: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Отмена подписки
     */
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(Authentication auth) {
        try {
            User user = getUserFromAuth(auth);
            subscriptionService.cancelSubscription(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Подписка отменена"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка отмены подписки: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Включение/выключение автопродления
     */
    @PostMapping("/auto-renew")
    public ResponseEntity<?> toggleAutoRenewal(
            Authentication auth,
            @RequestBody AutoRenewalRequest request) {
        try {
            User user = getUserFromAuth(auth);
            subscriptionService.toggleAutoRenewal(user, request.isAutoRenew());
            
            String message = request.isAutoRenew() ? "Автопродление включено" : "Автопродление выключено";
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", message
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка изменения настроек: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Получение истории подписок пользователя
     */
    @GetMapping("/history")
    public ResponseEntity<?> getSubscriptionHistory(Authentication auth) {
        try {
            User user = getUserFromAuth(auth);
            List<Subscription> subscriptions = subscriptionService.getUserSubscriptions(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "subscriptions", subscriptions
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка получения истории: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Проверка доступа к API (используется в других контроллерах)
     */
    @GetMapping("/check-access")
    public ResponseEntity<?> checkAccess(Authentication auth) {
        try {
            User user = getUserFromAuth(auth);
            boolean hasAccess = subscriptionService.hasActiveSubscription(user);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "hasAccess", hasAccess,
                "message", hasAccess ? "Доступ разрешен" : "Требуется активная подписка"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Ошибка проверки доступа: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Helper метод для получения пользователя из токена
     */
    private User getUserFromAuth(Authentication auth) {
        String userEmail = auth.getName();
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
    }
    
    // DTO классы для запросов
    public static class CreateSubscriptionRequest {
        private String planType;
        private String paymentMethod;
        
        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
    
    public static class ActivateSubscriptionRequest {
        private Long subscriptionId;
        private String transactionId;
        
        public Long getSubscriptionId() { return subscriptionId; }
        public void setSubscriptionId(Long subscriptionId) { this.subscriptionId = subscriptionId; }
        
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    }
    
    public static class ExtendSubscriptionRequest {
        private String planType;
        private String paymentMethod;
        
        public String getPlanType() { return planType; }
        public void setPlanType(String planType) { this.planType = planType; }
        
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }
    
    public static class AutoRenewalRequest {
        private boolean autoRenew;
        
        public boolean isAutoRenew() { return autoRenew; }
        public void setAutoRenew(boolean autoRenew) { this.autoRenew = autoRenew; }
    }
} 