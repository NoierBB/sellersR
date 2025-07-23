package org.example.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "subscriptions")
public class Subscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false)
    private PlanType planType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SubscriptionStatus status;
    
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;
    
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;
    
    @Column(name = "auto_renew", nullable = false)
    private Boolean autoRenew = false;
    
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
    
    @Column(name = "payment_transaction_id", length = 255)
    private String paymentTransactionId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Енумы для типов подписки
    public enum PlanType {
        PLAN_30_DAYS("30 дней", 30, new BigDecimal("1499.00")),
        PLAN_60_DAYS("60 дней", 60, new BigDecimal("2799.00")),
        PLAN_90_DAYS("90 дней", 90, new BigDecimal("3999.00"));
        
        private final String displayName;
        private final int days;
        private final BigDecimal price;
        
        PlanType(String displayName, int days, BigDecimal price) {
            this.displayName = displayName;
            this.days = days;
            this.price = price;
        }
        
        public String getDisplayName() { return displayName; }
        public int getDays() { return days; }
        public BigDecimal getPrice() { return price; }
    }
    
    public enum SubscriptionStatus {
        ACTIVE("Активна"),
        EXPIRED("Истекла"),
        CANCELLED("Отменена"),
        PENDING("Ожидает оплаты");
        
        private final String displayName;
        
        SubscriptionStatus(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() { return displayName; }
    }
    
    // Конструкторы
    public Subscription() {
        this.createdAt = LocalDateTime.now();
        this.status = SubscriptionStatus.PENDING;
    }
    
    public Subscription(User user, PlanType planType) {
        this();
        this.user = user;
        this.planType = planType;
        this.price = planType.getPrice();
        this.startDate = LocalDateTime.now();
        this.endDate = this.startDate.plusDays(planType.getDays());
    }
    
    // Геттеры и сеттеры
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public PlanType getPlanType() { return planType; }
    public void setPlanType(PlanType planType) { this.planType = planType; }
    
    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { this.status = status; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    
    public Boolean getAutoRenew() { return autoRenew; }
    public void setAutoRenew(Boolean autoRenew) { this.autoRenew = autoRenew; }
    
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    
    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Бизнес-логика
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE && 
               LocalDateTime.now().isBefore(endDate);
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(endDate);
    }
    
    public boolean isExpiringSoon() {
        return LocalDateTime.now().isAfter(endDate.minusDays(7));
    }
    
    public long getDaysLeft() {
        if (isExpired()) return 0;
        return java.time.Duration.between(LocalDateTime.now(), endDate).toDays();
    }
    
    public void activate() {
        this.status = SubscriptionStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void expire() {
        this.status = SubscriptionStatus.EXPIRED;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void cancel() {
        this.status = SubscriptionStatus.CANCELLED;
        this.updatedAt = LocalDateTime.now();
    }
    
    public void extend(PlanType newPlanType) {
        if (isActive()) {
            // Если подписка активна, добавляем дни к текущему периоду
            this.endDate = this.endDate.plusDays(newPlanType.getDays());
        } else {
            // Если подписка истекла, начинаем новый период
            this.startDate = LocalDateTime.now();
            this.endDate = this.startDate.plusDays(newPlanType.getDays());
        }
        this.planType = newPlanType;
        this.price = newPlanType.getPrice();
        this.status = SubscriptionStatus.ACTIVE;
        this.updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    @Override
    public String toString() {
        return "Subscription{" +
                "id=" + id +
                ", planType=" + planType +
                ", status=" + status +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", daysLeft=" + getDaysLeft() +
                '}';
    }
} 