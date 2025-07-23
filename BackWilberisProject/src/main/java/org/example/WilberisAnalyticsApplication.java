package org.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WilberisAnalyticsApplication {

    public static void main(String[] args) {
        System.out.println("🚀 Запуск Wilberis Analytics Application...");
        SpringApplication.run(WilberisAnalyticsApplication.class, args);
        System.out.println("✅ Приложение успешно запущено!");
        
        // ВРЕМЕННО: отключена автоматическая регистрация Telegram бота
        // для избежания конфликтов и проблем с портом
        System.out.println("⚠️ Telegram бот временно отключен для тестирования");
    }
} 