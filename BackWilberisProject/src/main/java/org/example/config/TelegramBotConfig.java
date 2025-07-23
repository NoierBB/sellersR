package org.example.config;

import org.example.service.TelegramBotService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.telegram.telegrambots.meta.TelegramBotsApi;
import org.telegram.telegrambots.updatesreceivers.DefaultBotSession;

@Configuration
public class TelegramBotConfig {
    
    // Включаем регистрацию Telegram бота для полной функциональности
    @Bean
    public TelegramBotsApi telegramBotsApi(TelegramBotService telegramBotService) {
        try {
            TelegramBotsApi botsApi = new TelegramBotsApi(DefaultBotSession.class);
            botsApi.registerBot(telegramBotService);
            System.out.println("🚀 Telegram бот успешно зарегистрирован и запущен!");
            return botsApi;
        } catch (Exception e) {
            System.err.println("❌ Ошибка регистрации Telegram бота: " + e.getMessage());
            throw new RuntimeException("Failed to register Telegram bot", e);
        }
    }
    
    public TelegramBotConfig() {
        System.out.println("🔧 TelegramBotConfig загружен - бот будет активирован");
    }
} 