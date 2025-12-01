# Лабораторная работа №5. Архитектурные стили и протоколы взаимодействия Web-API

## Цель работы

- Изучить альтернативные архитектурные стили Web-API (GraphQL, WebSockets, WebHooks, SOAP).
- Реализовать новый тип API, дополняющий существующий REST-сервис.
- Освоить интеграцию real-time взаимодействия в Node.js-приложение.
- Получить практический опыт проектирования backend-архитектуры, близкой к продакшен-решениям.

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

**Запуск PostgreSQL через Docker**
```bash
docker --version
docker compose up -d
docker ps
```

**Запуск сервера Node.js**
```bash
node app.js
```

### Анализ архитектурных стилей Web-API

**GraphQL**
- Клиент сам формирует структуру ответа.
- Единая точка входа `/graphql`.
- Хорошо подходит для сложных и вложенных данных.

**WebSockets**
- Двусторонняя постоянная связь клиент ↔ сервер.
- Сервер может отправлять данные без запросов (push-сообщения).
- Идеален для real-time: чаты, уведомления, обновления задач.

**WebHooks**
- Позволяют отправлять POST-уведомления на внешние сервисы при событиях.
- Используются для интеграций (GitHub → deployment, Stripe → оплаты).

**SOAP**
- XML-ориентированный протокол.
- Используется в банковских и государственных системах.
- Жёсткая схема, высокая надёжность, но слабая гибкость.

### Выбор типа Web-API и обоснование

*Для расширения существующего REST API ToDo был выбран WebSocket API (socket.io).*
**Основная проблема REST:**
REST не умеет отправлять данные клиенту сам — только в ответ на запрос.
Поэтому обновления задач видны только после ручного обновления браузера.
**Что решает WebSocket:**
- мгновенная передача событий без перезагрузки страницы;
- сервер сам уведомляет клиентов о создании/обновлении задачи;
- снижает нагрузку на REST API (нет постоянных запросов типа polling).
**Почему выбран WebSocket под нашу задачу:**
- идеально подходит для ToDo-приложения: уведомления “задача создана / задача обновлена”;
- не ломает текущую архитектуру;
- легко интегрируется через socket.io;
- даёт новую функциональность, а не дублирует REST.

### Проектирование новой функциональности

*Выбран вариант B: WebSockets.*
**Реализован следующий функционал:**
**1. WebSocket-сервер на socket.io**
- создаётся при запуске приложения;
- обрабатывает подключения клиентов;
- выполняет JWT-проверку при подключении.
**2. Реал-тайм события**
- `todo_created` — отправляется при создании новой задачи;
- `todo_updated` — отправляется при обновлении задачи.
**3. Интеграция REST → WebSocket**
*Контроллеры REST вызывают:*
```javascript
req.app.get("io").emit("todo_created", todo)
req.app.get("io").emit("todo_updated", todo)
```
*То есть WebSocket расширяет функциональность REST-логики.*

### Модель ToDo

**Реализовано:**
- хранение данных в памяти (без БД);
- авто-генерация ID.
`models/todo.js`
```javascript
models/todo.js
let todos = [];
let id = 1;

module.exports = {
    findAll() {
        return todos;
    },
    create(data) {
        const newTodo = { id: id++, ...data };
        todos.push(newTodo);
        return newTodo;
    },
    update(id, data) {
        const idx = todos.findIndex(t => t.id === id);
        if (idx === -1) return null;
        todos[idx] = { ...todos[idx], ...data };
        return todos[idx];
    }
};
```

### JWT-авторизация

**Реализовано:**
- извлечение токена из заголовка;
- верификация JWT;
- защита маршрутов REST.
`middleware/auth.js`
```javascript
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(403).json({ error: "Invalid token" });
    }
};
```

### REST API: контроллеры ToDo

**Реализовано:**
- получение всех задач;
- создание задачи;
- обновление задачи;
- генерация WebSocket-событий.
`controllers/todoController.js`
```javascript
exports.getTodos = (req, res) => {
    res.json(Todo.findAll());
};

exports.createTodo = (req, res) => {
    const todo = Todo.create({
        title: req.body.title,
        user: req.user.id
    });

    req.app.get("io").emit("todo_created", todo);
    res.status(201).json(todo);
};

exports.updateTodo = (req, res) => {
    const todo = Todo.update(Number(req.params.id), req.body);
    if (!todo) return res.status(404).json({ error: "Not found" });

    req.app.get("io").emit("todo_updated", todo);
    res.json(todo);
};
```

### Маршруты REST API

`routes/todoRoutes.js`
```javascript
router.get("/", auth, ctrl.getTodos);
router.post("/", auth, ctrl.createTodo);
router.put("/:id", auth, ctrl.updateTodo);
```

### WebSocket-сервер

**Реализовано:**
- запуск socket.io;
- JWT-проверка через handshake;
- логирование подключения.
`socket.js`
```javascript
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));

    try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = user;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
});
```

### Интеграция WebSocket в Express

**server.js**
Создаёт HTTP-сервер + WebSocket-сервер.
**app.js**
Передаёт io внутрь Express через:
```javascript
app.set("io", io);
```

### Тестирование API (Postman)

**Генерация JWT:**
```php
node
> require("jsonwebtoken").sign({ id: 1 }, "supersecret")
```
**Добавлено в запрос:**
```bash
Authorization: Bearer <token>
```
**Протестировано:**

- `GET /api/todos` — работает
- `POST /api/todos` — создаёт задачу
- `PUT /api/todos/:id` — обновляет задачу

*После каждого REST-операции WebSocket рассылает события.*

**Тестирование WebSocket**
*Код клиента:*
```javascript
const socket = io("http://localhost:3000", {
    auth: { token: "<JWT>" }
});

socket.on("todo_created", console.log);
socket.on("todo_updated", console.log);
```
**Результаты:**
- подключение успешно;
- события приходят мгновенно;
- данные корректные и соответствуют изменениям REST.

## Контрольные вопросы

**1. В чём основные отличия REST от выбранного вами типа Web-API (GraphQL / WebSockets / WebHooks / SOAP)**<br>
**REST**
- Работает по схеме запрос → ответ.
- Соединение не сохраняется (stateless).
- Клиент всегда инициирует запрос.
- Не подходит для мгновенных обновлений.
**WebSockets**
- Постоянное двустороннее соединение клиент ↔ сервер.
- Сервер может отправлять данные сам, без запроса.
- Идеален для real-time (уведомления, чаты, обновления статуса).
- Состояние соединения сохраняется.
**Главное отличие:**
**REST** — синхронный запрос-ответ.
**WebSocket** — асинхронный обмен в реальном времени.<br>

**2. В каких случаях использование вашего типа API даёт преимущество по сравнению с REST (по производительности, удобству, гибкости и т.д.)?**<br>
**WebSockets лучше REST, когда нужно:**
- Мгновенно передавать обновления (например, "новая задача создана").
- Сократить количество запросов (нет polling каждые 2 секунды).
- Поддерживать взаимодействие нескольких клиентов одновременно.
- Реализовать real-time приложения: чат, доска задач, мониторинг данных.
**В проекте WebSockets дают преимущество, потому что:**
- Клиент моментально получает событие "todo_created" или "todo_updated".
- Без перезагрузки страницы и без повторных запросов.<br>

**3. Какие ограничения или недостатки имеет выбранный вами архитектурный стиль?**<br>
- Сложнее масштабировать (нужен sticky session / Redis adapter).
- Соединение постоянно открыто → выше нагрузка при большом количестве клиентов.
- Отладка сложнее, чем HTTP.
- Нельзя кэшировать так же легко, как REST.
- Требует дополнительной логики авторизации (JWT в handshake).

**4. Как вы интегрировали новый тип API с уже существующей архитектурой приложения (REST + БД + аутентификация)?**<br>
**Было реализовано:**
1. REST API остаётся основным каналом CRUD-операций
- `POST /api/todos`
- `PUT /api/todos/:id`
- `GET /api/todos`
2. WebSocket работает как надстройка над REST, добавляя real-time уведомления.
3. JWT-авторизация интегрирована в WebSockets через:
```javascript
socket.handshake.auth.token
```
Сервер проверяет токен так же, как и в REST middleware.
4. Контроллеры REST вызывают события WebSocket:
```javascript
req.app.get("io").emit("todo_created", todo);
req.app.get("io").emit("todo_updated", todo);
```
5.База данных остается общей (в этой лабораторной — in-memory модель).
6. REST + WebSockets работают на одном сервере
- WebSocket-сервер создаётся поверх HTTP-сервера Express.