# Лабораторная работа №3. Введение в Express.js. Архитектура MVC

## Цель работы

- Изучить механизмы аутентификации пользователей в backend-приложениях.
- Научиться защищать REST API с помощью JWT-токенов.
- Реализовать авторизацию на основе ролей и прав.
- Освоить расширенную ролевую модель RBAC.
- Реализовать связь пользователей и задач в ToDo-сервисе.

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

### Структура базы данных

**Были добавлены таблицы:**
| Поле       | Тип          | Описание         |
| ---------- | ------------ | ---------------- |
| id         | SERIAL PK    | идентификатор    |
| username   | varchar(50)  | уникальное имя   |
| email      | varchar(100) | уникальный email |
| password   | text         | bcrypt-хэш       |
| role       | varchar(20)  | user / admin     |
| created_at | timestamp    | дата создания    |
| updated_at | timestamp    | дата изменения   |


### Аутентификация (JWT)
**Реализовано:**
**POST `/api/auth/register`**
- проверка уникальности email
- хэширование пароля `bcrypt`
- создание пользователя
- назначение роли user

**POST `/api/auth/login`**
- проверка email и пароля
- генерируется JWT с полями:
```javascript
{
  "id": <user_id>,
  "username": "<name>"
}
```
**GET `/api/auth/profile`**
- токен передается через `Authorization: Bearer <token>`
- возращаются данные текущего пользователя
**Middleware `auth`**
- проверяет JWT
- при успехе пишет пользователя в `req.user`
- при ошибке → `401 Unauthorized`

## Авторизация (RBAC / роли)
**Реализовано 2 уровня:**
1. Базовая ролевая модель (admin/user)
- Обычный пользователь:
      - может создавать задачи
      - может видеть только свои
- Администратор:
      - полное управление всеми задачами
      - доступ ко всем CRUD-операциям
2. Расширенная модель RBAC (выполнено сверх обязательного)
Созданы таблицы:
**roles**
- admin
- user
**permissions**
- CREATE_TODO
- UPDATE_TODO
- DELETE_TODO
- VIEW_ALL_TODOS
**role_permissions**
Связи ролей и разрешений.
**user_roles**
Многие-ко-многим:
пользователь → роли.

**Middleware `checkPermission("DELETE_TODO")`**
```javascript
router.delete("/:id",
  auth,
  checkPermission("DELETE_TODO"),
  todoController.delete
);
```

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