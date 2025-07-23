package org.example.repository;

import org.example.entity.Subscription;
import org.example.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    
    // Получение подписки пользователя
    Optional<Subscription> findByUser(User user);
    
    // Получение активной подписки пользователя
    @Query("SELECT s FROM Subscription s WHERE s.user = :user AND s.status = 'ACTIVE' AND s.endDate > :now")
    Optional<Subscription> findActiveSubscriptionByUser(@Param("user") User user, @Param("now") LocalDateTime now);
    
    // Проверка есть ли активная подписка у пользователя
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM Subscription s WHERE s.user = :user AND s.status = 'ACTIVE' AND s.endDate > :now")
    boolean hasActiveSubscription(@Param("user") User user, @Param("now") LocalDateTime now);
    
    // Получение всех подписок пользователя
    List<Subscription> findByUserOrderByCreatedAtDesc(User user);
    
    // Получение подписок по статусу
    List<Subscription> findByStatus(Subscription.SubscriptionStatus status);
    
    // Получение истекающих подписок (для уведомлений)
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate BETWEEN :now AND :sevenDaysLater")
    List<Subscription> findExpiringSoon(@Param("now") LocalDateTime now, @Param("sevenDaysLater") LocalDateTime sevenDaysLater);
    
    // Получение истекших подписок для обновления статуса
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate < :now")
    List<Subscription> findExpiredSubscriptions(@Param("now") LocalDateTime now);
    
    // Получение подписок с автопродлением
    @Query("SELECT s FROM Subscription s WHERE s.autoRenew = true AND s.status = 'ACTIVE' AND s.endDate BETWEEN :now AND :threeDaysLater")
    List<Subscription> findSubscriptionsForAutoRenewal(@Param("now") LocalDateTime now, @Param("threeDaysLater") LocalDateTime threeDaysLater);
    
    // Статистика по подпискам
    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE'")
    long countActiveSubscriptions();
    
    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.user = :user")
    long countSubscriptionsByUser(@Param("user") User user);
    
    // Получение подписок по типу плана
    List<Subscription> findByPlanType(Subscription.PlanType planType);
    
    // Получение подписок по методу оплаты
    List<Subscription> findByPaymentMethod(String paymentMethod);
    
    // Получение подписок за период
    @Query("SELECT s FROM Subscription s WHERE s.createdAt BETWEEN :startDate AND :endDate")
    List<Subscription> findSubscriptionsByDateRange(@Param("startDate") LocalDateTime startDate, 
                                                   @Param("endDate") LocalDateTime endDate);
    
    // Получение дохода за период
    @Query("SELECT SUM(s.price) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.createdAt BETWEEN :startDate AND :endDate")
    java.math.BigDecimal getTotalRevenueByDateRange(@Param("startDate") LocalDateTime startDate, 
                                                   @Param("endDate") LocalDateTime endDate);
} 