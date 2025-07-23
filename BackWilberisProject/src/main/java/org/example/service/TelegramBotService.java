package org.example.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.telegram.telegrambots.bots.TelegramLongPollingBot;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.api.objects.Update;
import org.telegram.telegrambots.meta.exceptions.TelegramApiException;

import java.util.concurrent.ConcurrentHashMap;

@Service
public class TelegramBotService extends TelegramLongPollingBot {
    
    @Value("${telegram.bot.token}")
    private String botToken;
    
    @Value("${telegram.bot.username}")
    private String botUsername;
    
    // Включаем Telegram бота для полной функциональности
    private boolean botEnabled = true;
    
    private final ConcurrentHashMap<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final AuthService authService;
    
    public TelegramBotService(AuthService authService) {
        this.authService = authService;
        System.out.println("🚀 TelegramBotService активирован и готов к работе!");
    }
    
    @Override
    public void onUpdateReceived(Update update) {
        if (!botEnabled) {
            System.out.println("⚠️ Telegram бот временно отключен");
            return;
        }
        
        if (update.hasMessage() && update.getMessage().hasText()) {
            String messageText = update.getMessage().getText();
            String chatId = update.getMessage().getChatId().toString();
            
            System.out.println("Received message: " + messageText + " from chat: " + chatId);
            
            // Проверяем, является ли сообщение кодом верификации (6 цифр)
            if (messageText.matches("\\d{6}")) {
                handleVerificationCode(chatId, messageText);
            } else {
                sendWelcomeMessage(chatId);
            }
        }
    }
    
    private void handleVerificationCode(String chatId, String code) {
        if (!botEnabled) return;
        
        System.out.println("Processing verification code: " + code);
        
        try {
            boolean verified = authService.verifyUser(code);
            
            if (verified) {
                sendMessage(chatId, "✅ Верификация успешно завершена! Теперь вы можете войти в систему аналитики Wildberries.");
            } else {
                sendMessage(chatId, "❌ Неверный код верификации или код истек. Попробуйте зарегистрироваться заново.");
            }
        } catch (Exception e) {
            System.err.println("Error during verification: " + e.getMessage());
            sendMessage(chatId, "⚠️ Произошла ошибка при верификации. Попробуйте позже или обратитесь в поддержку.");
        }
    }
    
    private void sendWelcomeMessage(String chatId) {
        if (!botEnabled) return;
        
        String welcomeText = """
                👋 Добро пожаловать в бота Wildberries Analytics!
                
                🔐 Этот бот используется для верификации аккаунта.
                
                📝 Чтобы завершить регистрацию:
                1. Зарегистрируйтесь на сайте
                2. Получите 6-значный код верификации
                3. Отправьте код этому боту
                
                ❓ Если у вас есть код верификации, просто отправьте его мне.
                """;
        
        sendMessage(chatId, welcomeText);
    }
    
    public void sendMessage(String chatId, String text) {
        if (!botEnabled) return;
        
        SendMessage message = new SendMessage();
        message.setChatId(chatId);
        message.setText(text);
        
        try {
            execute(message);
            System.out.println("Message sent successfully to chat: " + chatId);
        } catch (TelegramApiException e) {
            System.err.println("Error sending message: " + e.getMessage());
        }
    }
    
    @Override
    public String getBotUsername() {
        return botUsername != null ? botUsername : "SellersWilberis_bot";
    }
    
    @Override
    public String getBotToken() {
        return botToken != null ? botToken : "dummy-token";
    }
} 