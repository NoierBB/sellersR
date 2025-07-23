# API Документация - WilberisProject Backend

## Обзор

WilberisProject Backend предоставляет RESTful API для управления аналитикой Wildberries, системой пользователей и подписок.

**Базовый URL:** `http://localhost:8080/api`

## Аутентификация

Система использует JWT токены для аутентификации. Все защищенные эндпоинты требуют заголовок:

```
Authorization: Bearer <JWT_TOKEN>
```

## Эндпоинты

### 1. Аутентификация (`/api/auth`)

#### POST `/api/auth/register`
Регистрация нового пользователя

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",
  "lastName": "Петров",
  "phoneNumber": "+7 (999) 123-45-67"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Регистрация успешна",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Петров",
    "verified": false
  },
  "verificationCode": "123456",
  "telegramBot": "@SellersWilberis_bot"
}
```

#### POST `/api/auth/login`
Авторизация пользователя

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Авторизация успешна",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Петров",
    "verified": true
  }
}
```

#### POST `/api/auth/verify`
Верификация пользователя через код

**Тело запроса:**
```json
{
  "verificationCode": "123456"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Верификация прошла успешно"
}
```

#### POST `/api/auth/set-api-key`
Установка API ключа Wildberries (🔒 требует подписку)

**Тело запроса:**
```json
{
  "apiKey": "your_wildberries_api_key_here"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "API ключ Wildberries успешно установлен"
}
```

**Ответ без подписки:**
```json
{
  "success": false,
  "message": "Для установки API ключа требуется активная подписка",
  "requiresSubscription": true
}
```

#### GET `/api/auth/api-key`
Получение информации о текущем API ключе (🔒 требует подписку)

**Ответ:**
```json
{
  "success": true,
  "hasApiKey": true,
  "apiKey": "your_wildbe..."
}
```

#### DELETE `/api/auth/api-key`
Удаление API ключа

**Ответ:**
```json
{
  "success": true,
  "message": "API ключ удален"
}
```

### 2. Подписки (`/api/subscription`)

#### GET `/api/subscription/info`
Получение информации о подписке пользователя

**Ответ:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "planName": "30 дней",
    "status": "Активна",
    "startDate": "2024-01-01T00:00:00",
    "endDate": "2024-01-31T00:00:00",
    "daysLeft": 15,
    "autoRenew": false,
    "expiringSoon": false,
    "isActive": true
  }
}
```

#### GET `/api/subscription/plans`
Получение всех доступных планов подписки

**Ответ:**
```json
{
  "success": true,
  "plans": [
    {
      "planType": "PLAN_30_DAYS",
      "displayName": "30 дней",
      "days": 30,
      "price": 1499.00
    },
    {
      "planType": "PLAN_60_DAYS",
      "displayName": "60 дней",
      "days": 60,
      "price": 2799.00
    },
    {
      "planType": "PLAN_90_DAYS",
      "displayName": "90 дней",
      "days": 90,
      "price": 3999.00
    }
  ]
}
```

#### POST `/api/subscription/create`
Создание новой подписки

**Тело запроса:**
```json
{
  "planType": "PLAN_30_DAYS",
  "paymentMethod": "card"
}
```

**Ответ:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "planType": "30 дней",
    "price": 1499.00,
    "status": "Ожидает оплаты",
    "paymentTransactionId": "TXN_uuid-here"
  },
  "message": "Подписка создана. Перейдите к оплате."
}
```

#### POST `/api/subscription/activate`
Активация подписки после оплаты

**Тело запроса:**
```json
{
  "subscriptionId": 1,
  "transactionId": "TXN_uuid-here"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Подписка успешно активирована!"
}
```

#### POST `/api/subscription/extend`
Продление подписки

**Тело запроса:**
```json
{
  "planType": "PLAN_60_DAYS",
  "paymentMethod": "card"
}
```

**Ответ:**
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "daysLeft": 90,
    "endDate": "2024-03-31T00:00:00"
  },
  "message": "Подписка продлена на 60 дней"
}
```

#### POST `/api/subscription/auto-renew`
Включение/выключение автопродления

**Тело запроса:**
```json
{
  "autoRenew": true
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Автопродление включено"
}
```

#### GET `/api/subscription/check-access`
Проверка доступа к API

**Ответ:**
```json
{
  "success": true,
  "hasAccess": true,
  "message": "Доступ разрешен"
}
```

### 3. Аналитика Excel (`/api/excel-analytics`)

Все эндпоинты аналитики требуют активную подписку и установленный API ключ.

#### GET `/api/excel-analytics/financial-table`
Финансовая таблица (аналог Excel листа "Фин таблица")

**Параметры:**
- `days` (опционально) - количество дней для анализа (по умолчанию 30)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "wbArticle": "123456",
      "supplierArticle": "SUP123",
      "orders": 150,
      "sales": 120,
      "payment": 85000.00,
      "logistics": 12000.00,
      "netProfit": 45000.00,
      "profitMargin": 52.94,
      "roi": 0.65
    }
  ],
  "summary": {
    "totalOrders": 150,
    "totalSales": 120,
    "totalPayment": 85000.00,
    "totalLogistics": 12000.00,
    "totalNetProfit": 45000.00,
    "averageMargin": 52.94,
    "averageRoi": 0.65
  }
}
```

#### GET `/api/excel-analytics/abc-analysis-enhanced`
ABC анализ с формулами СУММЕСЛИ

**Параметры:**
- `days` (опционально) - количество дней для анализа (по умолчанию 30)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "cluster": "Группа А",
      "revenue": 500000.00,
      "revenuePercent": 60.00,
      "cumulativePercent": 60.00,
      "abcCategory": "A",
      "deviationCoeff": 2.5,
      "products": [
        {
          "wbArticle": "123456",
          "supplierArticle": "SUP123",
          "revenue": 150000.00,
          "revenuePercent": 30.00
        }
      ]
    }
  ],
  "summary": {
    "totalRevenue": 833333.33,
    "categoryA": {
      "revenue": 500000.00,
      "percent": 60.00,
      "productsCount": 5
    },
    "categoryB": {
      "revenue": 250000.00,
      "percent": 30.00,
      "productsCount": 8
    },
    "categoryC": {
      "revenue": 83333.33,
      "percent": 10.00,
      "productsCount": 12
    }
  }
}
```

#### GET `/api/excel-analytics/supply-planning`
План поставок с расчетами

**Параметры:**
- `days` (опционально) - количество дней для анализа (по умолчанию 30)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "wbArticle": "123456",
      "supplierArticle": "SUP123",
      "productName": "Тестовый товар",
      "currentStock": 100,
      "ordersPerDay": 3.5,
      "daysLeft": 28,
      "planDays": 30,
      "orderNeed": 5,
      "seasonalityCoeff": 1.2,
      "status": "NORMAL"
    }
  ],
  "summary": {
    "totalProducts": 25,
    "criticalStock": 3,
    "lowStock": 7,
    "normalStock": 15,
    "totalOrderNeed": 125
  }
}
```

#### GET `/api/excel-analytics/promotions-tracking`
Учет акций

**Параметры:**
- `days` (опционально) - количество дней для анализа (по умолчанию 30)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "wbArticle": "123456",
      "supplierArticle": "SUP123",
      "grouping": "Группа 1",
      "abcAnalysis": "A",
      "currentPrice": 1200.00,
      "grossProfit": 300.00,
      "action": "Скидка 20%",
      "promotionPrice": 960.00,
      "promotionProfit": 240.00,
      "turnoverDays": 15,
      "wbStock": 50
    }
  ],
  "summary": {
    "totalPromotions": 15,
    "averageDiscount": 18.5,
    "totalProfit": 4500.00,
    "totalPromotionProfit": 3600.00
  }
}
```

### 4. Административные функции (`/api/admin`)

#### GET `/api/admin/stats`
Общая статистика системы

**Ответ:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "activeUsers": 120,
    "verifiedUsers": 100,
    "totalSubscriptions": 85,
    "activeSubscriptions": 75,
    "totalRevenue": 125000.00,
    "monthlyRevenue": 25000.00
  }
}
```

#### GET `/api/admin/subscriptions`
Список всех подписок

**Параметры:**
- `page` (опционально) - номер страницы (по умолчанию 0)
- `size` (опционально) - размер страницы (по умолчанию 20)
- `status` (опционально) - фильтр по статусу

**Ответ:**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": 1,
      "userId": 1,
      "userEmail": "user@example.com",
      "planType": "PLAN_30_DAYS",
      "status": "ACTIVE",
      "startDate": "2024-01-01T00:00:00",
      "endDate": "2024-01-31T00:00:00",
      "price": 1499.00,
      "paymentMethod": "card"
    }
  ],
  "pagination": {
    "page": 0,
    "size": 20,
    "totalElements": 85,
    "totalPages": 5
  }
}
```

## Коды ошибок

- **200** - Успешный запрос
- **400** - Неверные данные запроса
- **401** - Не авторизован
- **403** - Доступ запрещен (требуется подписка)
- **404** - Ресурс не найден
- **500** - Внутренняя ошибка сервера

## Общие ответы на ошибки

```json
{
  "success": false,
  "message": "Описание ошибки",
  "requiresSubscription": true // если нужна подписка
}
```

## Заголовки запросов

Для всех запросов рекомендуется использовать:

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

## Примеры использования

### Полный процесс работы с подпиской

1. **Регистрация пользователя:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123","firstName":"Иван","lastName":"Петров"}'
   ```

2. **Авторизация:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   ```

3. **Создание подписки:**
   ```bash
   curl -X POST http://localhost:8080/api/subscription/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{"planType":"PLAN_30_DAYS","paymentMethod":"card"}'
   ```

4. **Активация подписки:**
   ```bash
   curl -X POST http://localhost:8080/api/subscription/activate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{"subscriptionId":1,"transactionId":"TXN_uuid-here"}'
   ```

5. **Установка API ключа:**
   ```bash
   curl -X POST http://localhost:8080/api/auth/set-api-key \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <JWT_TOKEN>" \
     -d '{"apiKey":"your_wildberries_api_key"}'
   ```

6. **Получение аналитики:**
   ```bash
   curl -X GET http://localhost:8080/api/excel-analytics/financial-table?days=30 \
     -H "Authorization: Bearer <JWT_TOKEN>"
   ```

## Автоматические процессы

Система автоматически выполняет следующие задачи:

1. **Проверка истекших подписок** - каждый час
2. **Отправка уведомлений об истечении** - каждый день
3. **Автопродление подписок** - каждый день
4. **Синхронизация данных с Wildberries API** - по запросу

## Telegram интеграция

Система интегрирована с Telegram ботом `@SellersWilberis_bot` для:
- Верификации пользователей
- Уведомлений о подписках
- Уведомлений об истечении подписок

## Поддержка

Для получения поддержки или сообщения об ошибках используйте:
- Email: support@wilberisproject.com
- Telegram: @SellersWilberis_bot

---

*Документация обновлена: 2024-01-15*
*Версия API: 1.0.0* 