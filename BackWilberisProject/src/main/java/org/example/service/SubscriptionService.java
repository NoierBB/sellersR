package org.example.service;

import org.example.entity.Subscription;
import org.example.entity.User;
import org.example.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class SubscriptionService {
    
    @Autowired
    private SubscriptionRepository subscriptionRepository;
    
    @Autowired
    private TelegramBotService telegramBotService; // Для уведомлений
    
    /**
     * Проверяет есть ли у пользователя активная подписка
     */
    public boolean hasActiveSubscription(User user) {
        if (user == null) return false;
        return subscriptionRepository.hasActiveSubscription(user, LocalDateTime.now());
    }
    
    /**
     * Получает активную подписку пользователя
     */
    public Optional<Subscription> getActiveSubscription(User user) {
        if (user == null) return Optional.empty();
        return subscriptionRepository.findActiveSubscriptionByUser(user, LocalDateTime.now());
    }
    
    /**
     * Получает все подписки пользователя
     */
    public List<Subscription> getUserSubscriptions(User user) {
        return subscriptionRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    /**
     * Создает новую подписку
     */
    public Subscription createSubscription(User user, Subscription.PlanType planType, String paymentMethod) {
        // Проверяем есть ли уже активная подписка
        Optional<Subscription> existingSubscription = getActiveSubscription(user);
        
        if (existingSubscription.isPresent()) {
            throw new RuntimeException("У пользователя уже есть активная подписка");
        }
        
        Subscription subscription = new Subscription(user, planType);
        subscription.setPaymentMethod(paymentMethod);
        subscription.setPaymentTransactionId("TXN_" + UUID.randomUUID().toString());
        
        return subscriptionRepository.save(subscription);
    }
    
    /**
     * Активирует подписку после оплаты
     */
    public void activateSubscription(Long subscriptionId, String transactionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Подписка не найдена"));
        
        if (subscription.getStatus() != Subscription.SubscriptionStatus.PENDING) {
            throw new RuntimeException("Подписка уже активирована или отменена");
        }
        
        subscription.activate();
        subscription.setPaymentTransactionId(transactionId);
        subscriptionRepository.save(subscription);
        
        // Отправляем уведомление пользователю
        sendSubscriptionNotification(subscription.getUser(), "Подписка активирована! Срок действия: " + subscription.getDaysLeft() + " дней");
    }
    
    /**
     * Продлевает подписку
     */
    public Subscription extendSubscription(User user, Subscription.PlanType planType, String paymentMethod) {
        Optional<Subscription> currentSubscription = getActiveSubscription(user);
        
        if (currentSubscription.isPresent()) {
            // Продлеваем существующую подписку
            Subscription subscription = currentSubscription.get();
            subscription.extend(planType);
            subscription.setPaymentMethod(paymentMethod);
            subscription.setPaymentTransactionId("EXT_" + UUID.randomUUID().toString());
            
            Subscription saved = subscriptionRepository.save(subscription);
            sendSubscriptionNotification(user, "Подписка продлена! Новый срок: " + saved.getDaysLeft() + " дней");
            return saved;
        } else {
            // Создаем новую подписку
            return createSubscription(user, planType, paymentMethod);
        }
    }
    
    /**
     * Отменяет подписку
     */
    public void cancelSubscription(User user) {
        Optional<Subscription> subscription = getActiveSubscription(user);
        
        if (subscription.isPresent()) {
            subscription.get().cancel();
            subscriptionRepository.save(subscription.get());
            sendSubscriptionNotification(user, "Подписка отменена");
        } else {
            throw new RuntimeException("Активная подписка не найдена");
        }
    }
    
    /**
     * Включает/выключает автопродление
     */
    public void toggleAutoRenewal(User user, boolean autoRenew) {
        Optional<Subscription> subscription = getActiveSubscription(user);
        
        if (subscription.isPresent()) {
            subscription.get().setAutoRenew(autoRenew);
            subscriptionRepository.save(subscription.get());
            
            String message = autoRenew ? "Автопродление включено" : "Автопродление выключено";
            sendSubscriptionNotification(user, message);
        } else {
            throw new RuntimeException("Активная подписка не найдена");
        }
    }
    
    /**
     * Получает информацию о подписке для отображения на фронтенде
     */
    public SubscriptionInfo getSubscriptionInfo(User user) {
        Optional<Subscription> subscription = getActiveSubscription(user);
        
        if (subscription.isPresent()) {
            Subscription sub = subscription.get();
            return new SubscriptionInfo(
                sub.getId(),
                sub.getPlanType().getDisplayName(),
                sub.getStatus().getDisplayName(),
                sub.getStartDate(),
                sub.getEndDate(),
                sub.getDaysLeft(),
                sub.getAutoRenew(),
                sub.isExpiringSoon(),
                true
            );
        } else {
            return new SubscriptionInfo(null, null, null, null, null, 0, false, false, false);
        }
    }
    
    /**
     * Получает все доступные планы подписки
     */
    public List<PlanInfo> getAvailablePlans() {
        return List.of(
            new PlanInfo(Subscription.PlanType.PLAN_30_DAYS.name(), 
                        Subscription.PlanType.PLAN_30_DAYS.getDisplayName(),
                        Subscription.PlanType.PLAN_30_DAYS.getDays(),
                        Subscription.PlanType.PLAN_30_DAYS.getPrice()),
            new PlanInfo(Subscription.PlanType.PLAN_60_DAYS.name(), 
                        Subscription.PlanType.PLAN_60_DAYS.getDisplayName(),
                        Subscription.PlanType.PLAN_60_DAYS.getDays(),
                        Subscription.PlanType.PLAN_60_DAYS.getPrice()),
            new PlanInfo(Subscription.PlanType.PLAN_90_DAYS.name(), 
                        Subscription.PlanType.PLAN_90_DAYS.getDisplayName(),
                        Subscription.PlanType.PLAN_90_DAYS.getDays(),
                        Subscription.PlanType.PLAN_90_DAYS.getPrice())
        );
    }
    
    /**
     * Проверяет и обновляет статус истекших подписок (запускается по расписанию)
     */
    @Scheduled(fixedRate = 3600000) // Каждый час
    public void checkExpiredSubscriptions() {
        List<Subscription> expiredSubscriptions = subscriptionRepository.findExpiredSubscriptions(LocalDateTime.now());
        
        for (Subscription subscription : expiredSubscriptions) {
            subscription.expire();
            subscriptionRepository.save(subscription);
            
            sendSubscriptionNotification(subscription.getUser(), "Ваша подписка истекла. Продлите для продолжения использования сервиса.");
        }
        
        if (!expiredSubscriptions.isEmpty()) {
            System.out.println("Обновлено " + expiredSubscriptions.size() + " истекших подписок");
        }
    }
    
    /**
     * Отправляет уведомления о скором истечении подписки
     */
    @Scheduled(fixedRate = 86400000) // Каждый день
    public void sendExpirationNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime sevenDaysLater = now.plusDays(7);
        
        List<Subscription> expiringSoon = subscriptionRepository.findExpiringSoon(now, sevenDaysLater);
        
        for (Subscription subscription : expiringSoon) {
            String message = "Ваша подписка истекает через " + subscription.getDaysLeft() + " дней. Не забудьте продлить!";
            sendSubscriptionNotification(subscription.getUser(), message);
        }
    }
    
    /**
     * Автоматическое продление подписок
     */
    @Scheduled(fixedRate = 86400000) // Каждый день
    public void processAutoRenewals() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threeDaysLater = now.plusDays(3);
        
        List<Subscription> subscriptionsForRenewal = subscriptionRepository.findSubscriptionsForAutoRenewal(now, threeDaysLater);
        
        for (Subscription subscription : subscriptionsForRenewal) {
            try {
                // Здесь должна быть логика автоматического списания средств
                // Пока просто продлеваем на тот же план
                subscription.extend(subscription.getPlanType());
                subscriptionRepository.save(subscription);
                
                sendSubscriptionNotification(subscription.getUser(), "Подписка автоматически продлена на " + subscription.getPlanType().getDays() + " дней");
            } catch (Exception e) {
                System.err.println("Ошибка автопродления для пользователя " + subscription.getUser().getEmail() + ": " + e.getMessage());
                sendSubscriptionNotification(subscription.getUser(), "Ошибка автопродления подписки. Проверьте способ оплаты.");
            }
        }
    }
    
    /**
     * Отправляет уведомление пользователю
     */
    private void sendSubscriptionNotification(User user, String message) {
        try {
            if (user.getTelegramChatId() != null) {
                telegramBotService.sendMessage(user.getTelegramChatId().toString(), "🔔 " + message);
            }
        } catch (Exception e) {
            System.err.println("Ошибка отправки уведомления: " + e.getMessage());
        }
    }
    
    // DTO классы для фронтенда
    public static class SubscriptionInfo {
        private Long id;
        private String planName;
        private String status;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private long daysLeft;
        private boolean autoRenew;
        private boolean expiringSoon;
        private boolean isActive;
        
        public SubscriptionInfo(Long id, String planName, String status, LocalDateTime startDate, 
                              LocalDateTime endDate, long daysLeft, boolean autoRenew, 
                              boolean expiringSoon, boolean isActive) {
            this.id = id;
            this.planName = planName;
            this.status = status;
            this.startDate = startDate;
            this.endDate = endDate;
            this.daysLeft = daysLeft;
            this.autoRenew = autoRenew;
            this.expiringSoon = expiringSoon;
            this.isActive = isActive;
        }
        
        // Геттеры
        public Long getId() { return id; }
        public String getPlanName() { return planName; }
        public String getStatus() { return status; }
        public LocalDateTime getStartDate() { return startDate; }
        public LocalDateTime getEndDate() { return endDate; }
        public long getDaysLeft() { return daysLeft; }
        public boolean isAutoRenew() { return autoRenew; }
        public boolean isExpiringSoon() { return expiringSoon; }
        public boolean isActive() { return isActive; }
    }
    
    public static class PlanInfo {
        private String planType;
        private String displayName;
        private int days;
        private java.math.BigDecimal price;
        
        public PlanInfo(String planType, String displayName, int days, java.math.BigDecimal price) {
            this.planType = planType;
            this.displayName = displayName;
            this.days = days;
            this.price = price;
        }
        
        // Геттеры
        public String getPlanType() { return planType; }
        public String getDisplayName() { return displayName; }
        public int getDays() { return days; }
        public java.math.BigDecimal getPrice() { return price; }
    }
} 