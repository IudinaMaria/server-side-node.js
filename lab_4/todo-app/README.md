# Лабораторная работа №4. Обработка ошибок, валидация и логгирование

## Цель работы

- реализовывать централизованную обработку ошибок в Express;
- добавлять валидацию входящих данных;
- использовать логгирование (Winston + Morgan);
- интегрировать Sentry для удалённого отслеживания ошибок;
- разделять API ответы (JSON) и HTML-страницы.

## Ход выполнения работы

### Инициализация проекта

**Устанавливаем зависимости Node.js**
```bash
mkdir todo-app
cd todo-app
npm init -y
npm install express dotenv pug
```

**Создан .env:**
```bash
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=1234
DB_NAME=postgres
DB_PORT=5432

JWT_SECRET=mysecret123
PORT=3000
```

**УЗапуск PostgreSQL через Docker**
```bash
docker --version
docker compose up -d
docker ps
```

**Запуск сервера Node.js**
```bash
node app.js
```

### Обработка ошибок

**Централизованный обработчик ошибок**

Создан `middleware middleware/errorHandler.js`, который обрабатывает все ошибки, отправляет единый JSON:
```javascript
{
  "status": "error",
  "message": "Описание ошибки"
}
```
**Созданы пользовательские классы ошибок**
В папке `/errors/`:
- `NotFoundError.js`
- `ValidationError.js`
- `AuthError.js`
- `DatabaseError.js`

*Пример:*
```javascript
class NotFoundError extends Error {
    constructor(message = "Not found") {
        super(message);
        this.status = 404;
    }
}
```
**Обёртка для async-функций (asyncWrapper)**
Чтобы async/await не ломал сервер:
```javascript
module.exports = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```
Использование в маршрутах:
```javascript
router.get("/", auth, asyncWrapper(todo.getAll));
```
**Разделение 404 для API и HTML**
API возвращает JSON, HTML — Pug-страницу:
```javascript
app.use("/api", (req, res, next) => {
    next(new NotFoundError("API route not found"));
});
app.use(errorController.notFound); // HTML
```

### Валидация данных

**Использована библиотека: express-validator**
Созданы валидаторы:
```bash
validators/todoValidator.js
```
Пример:
```javascript
exports.createTodoValidator = [
    body("title").notEmpty().withMessage("Title is required"),
];
```
Middleware обработки ошибок валидации:
```javascript
const errors = validationResult(req);
if (!errors.isEmpty()) {
    return next(new ValidationError("Ошибка валидации", errors.array()));
}
```
Ответ при ошибке валидации:
```javascript
{
  "status": "error",
  "message": "Ошибка валидации",
  "errors": [
    { "msg": "Title is required", "path": "title" }
  ]
}
```

### Логгирование

**Morgan**
Логирует каждый HTTP-запрос и передаёт результаты в Winston:
```javascript
app.use(morgan("combined", {
    stream: { write: (msg) => logger.info(msg.trim()) }
}));
```
**Winston + DailyRotateFile**
Создан логгер (`/logger/index.js`):
- сохраняет логи в `/logs/`
- создаёт новый файл каждый день
- ограничивает размер файла
```javascript
new winston.transports.DailyRotateFile({
    filename: "logs/app-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "10m",
    maxFiles: "14d"
})
```
*Логи включают:*
- успешные запросы
- ошибки валидации
- server errors
- попытки доступа без токена

### Интеграция Sentry

**Инициализация в `app.js`**
```javascript
Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
});
```
**Middleware Sentry:**
```javascript
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```
**Отправка ошибок (кроме ValidationError)**
В `errorHandler`:
```javascript
if (!(err instanceof ValidationError)) {
    Sentry.captureException(err);
}
```

### Тестирование

**API возвращает JSON-ошибки:**
```bash
GET /api/unknown → { "status": "error", "message": "API route not found" }
```
**HTML возвращает PUG-страницу**
```bash
GET /unknown → HTML 404.pug
```
**Валидация:**
```bash
POST /api/todos { }
→ status: "error", errors: [...]
```
**Ошибки появляются в Sentry**
(кроме ValidationError)
**Логи создаются в папке `/logs/`**

## Контрольные вопросы

**1. Какие преимущества централизованной обработки ошибок в Express?**<br>
Преимущества централизованной обработки ошибок:
- один формат ошибок
- отсутствие try/catch в каждом роуте
- удобная интеграция логов и Sentry
- повышение стабильности<br>

**2. Какие категории логов вы решили вести в системе и чем обусловлен ваш выбор?**<br>
- запросы (info)
- ошибки сервера
- ошибки валидации
- попытки неавторизованного доступа
- системные события<br>

**3. Какие существуют подходы к валидации данных в Express и какие из них вы использовали?**<br>
- express-validator (использовано)
- Joi / Hapi Joi
- Zod / Yup
- Кастомная валидация






































































## Интерфейс (HTML + PUG)
**Добавлены страницы:**
- /login
- /register
- /new
- список задач с фильтром
- кнопки toggle и delete
- динамичное отображение:
     -  Войти / Выйти / Регистрация
     -  Показ задач только авторизованному пользователю

## Проверка ToDo API + JWT + RBAC в Postman
*Проведена проверка всех сценариев:*
**Регистрация пользователей (POST /api/auth/register)**
```bash
POST http://localhost:3000/api/auth/register
```
**Body → JSON**
```javascript
{
  "username": "testuser",
  "email": "user@example.com",
  "password": "123456"
}
```
**Ожидаемый ответ (201)**
```javascript
{
  "user": {
    "id": 2,
    "username": "testuser",
    "email": "user@example.com"
  }
}
```
**Регистрируем администратора**

После регистрации нужно вручную присвоить роль admin:
```bash
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
```
**Логин (POST /api/auth/login)**
```bash
POST http://localhost:3000/api/auth/login
```
**Body → JSON**
```javascript
{
  "email": "user@example.com",
  "password": "123456"
}
```
**Ожидаемый ответ**
```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- Скопировать токен
- Вставить его в Postman Authorization → Type = Bearer Token во все защищённые запросы
**Получить профиль текущего пользователя (GET /api/auth/profile)**
**Метод**
```bash
GET http://localhost:3000/api/auth/profile
```
**Headers**
```bash
Authorization: Bearer <your token>
```
**Ответ:**
```javascript
{
  "id": 2,
  "username": "testuser",
  "email": "user@example.com"
}
```
**Создание задачи (POST /api/todos)**
**Метод**
```bash
POST http://localhost:3000/api/todos
```
**Headers**
```bash
Authorization: Bearer <user token>
```
**Body**
```javascript
{
  "title": "Buy milk"
}
```
**Ответ (200)**
```javascript
{
  "id": 1,
  "title": "Buy milk",
  "completed": false,
  "user_id": 2
}
```
**Попытка удалить задачу обычным пользователем (DELETE)**
**Метод**
```bash
DELETE http://localhost:3000/api/todos/1
```
**Headers**
```bash
Authorization: Bearer <user token>
```
**Ожидаемый ответ (403)**
```javascript
{
  "error": "Permission denied"
}
```
**Это подтверждает:**
User → ❌ DELETE_TODO запрещён<br>
**Проверка admin прав** <br>
Теперь логинимся как admin:<br>
POST /api/auth/login<br>
Получаем админский токен.<br>
**Удаление задачи администратором (DELETE)**<br>
**Метод**
```bash
DELETE http://localhost:3000/api/todos/1
```
**Headers**
```bash
Authorization: Bearer <admin token>
```
**Ответ (204 / 200)**
(пусто — успешное удаление)
- Admin может удалять любые задачи
- Работает RBAC → DELETE_TODO разрешён роли admin<br>
**Дополнительные проверки**<br>
**Получение всех задач (GET /api/todos)**<br>
**user:**
```bash
GET http://localhost:3000/api/todos
Authorization: Bearer <user token>
```

**Ожидается:**
- Только свои задачи.

**admin:**
```bash
Authorization: Bearer <admin token>
```

**Ожидается:**
Все задачи всех пользователей (через RBAC → VIEW_ALL_TODOS)

**Обновление задачи (PUT /api/todos/:id)**
**user (владелец):**
```bash
PUT /api/todos/2
Authorization: Bearer <user token>
```
Работает

**user (НЕ владелец):**
```bash
403 Forbidden
```
**admin:**

Работает

## 7. Контрольные вопросы
**1. Что такое JWT и как он работает?**<br>
**JWT** — это JSON Web Token.
Он содержит закодированную информацию о пользователе и подпись сервера.
Сервер проверяет подпись и не хранит состояние сессий.<br>

**2. Как безопасно хранить пароли?**<br>
Использовать bcrypt (bcrypt.hash, bcrypt.compare).
Никогда не хранить пароль в виде текста.<br>

**3. Разница между аутентификацией и авторизацией**<br>
- **Аутентификация** — проверка личности (кто пользователь).
- **Авторизация** — проверка прав (что ему можно делать).<br>

**4. Преимущества Passport.js**<br>
- большое количество стратегий
- упрощает реализацию логина
− сложнее, чем ручная JWT-логика для маленьких проектов<br>

## 8. Вывод
**В лабораторной работе были успешно реализованы:**
- регистрация и вход пользователей;
- JWT-аутентификация;
- защита API через middleware;
- разграничение доступа согласно ролям;
- расширенная модель RBAC (дополнительное задание);
- UI на Pug с HTML-логином;
- проверка владельца задачи;
- dockerized PostgreSQL + миграции.