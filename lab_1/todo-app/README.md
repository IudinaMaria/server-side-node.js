# Лабораторная работа №1. Введение в Express.js. Архитектура MVC

## Цель работы

1. Освоить базовую связку Express + MVC: маршруты, контроллеры, представления.
2. Научиться обрабатывать GET/POST формы, передавать данные в шаблоны.
3. Реализовать редиректы после успешной отправки форм.
4. Создать минимальное приложение без БД, используя хранилище в памяти процесса.

## Теоретические сведения

**Express.js**
Минималистичный фреймворк для создания веб-приложений в Node.js. Позволяет организовать маршрутизацию, контроллеры, middleware и отдачу шаблонов.
**MVC**
- **Model** — хранение данных (в данной лабе — массив задач).
- **View** — шаблоны Pug для отображения страниц.
- **Controller** — логика обработки запросов.

**Маршруты**
Определяют, какие URL обрабатывает приложение:
- `GET /` — список задач
- `GET /new` — форма
- `POST /new` — создание задачи
- `POST /:id/toggle` — изменение статуса
- `POST /:id/delete` — удаление
- `GET /about` — статическая страница
- 404 — страница ошибки

**express.urlencoded**
Middleware, который парсит HTML-формы и делает данные доступными через `req.body`.

## Ход выполнения работы

### Инициализация проекта

```bash
mkdir todo-app
cd todo-app
npm init -y
npm install express dotenv pug
```
**Создан .env:**
```bash
APP_NAME=TodoApp
PORT=3000
NODE_ENV=development
```
### Настройка Express (app.js)

Создан файл `app.js`.
Подключён Express, middleware, статические файлы, маршруты, 404.
```javascript
require("dotenv").config();
const express = require("express");
const path = require("path");

const todoRoutes = require("./routes/todoRoutes");
const { notFound } = require("./controllers/errorController");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", todoRoutes);

app.use(notFound);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```
### Реализация MVC-логики

**Модель todo.js**
```javascript
let todos = [];
let idCounter = 1;

module.exports = {
    getAll(status) {
        if (!status || status === "all") return todos;
        if (status === "active") return todos.filter(t => !t.completed);
        if (status === "completed") return todos.filter(t => t.completed);
        return todos;
    },

    create(title) {
        todos.push({ id: idCounter++, title, completed: false });
    },

    toggle(id) {
        const t = todos.find(x => x.id === id);
        if (t) t.completed = !t.completed;
    },

    delete(id) {
        todos = todos.filter(t => t.id !== id);
    }
};
```

**Контроллеры**
`todoController.js`
```javascript
const Todo = require("../models/todo");

exports.index = (req, res) => {
    const status = req.query.status || "all";
    const todos = Todo.getAll(status);
    res.render("index", { todos, status });
};

exports.newForm = (req, res) => res.render("new");

exports.create = (req, res) => {
    const { title } = req.body;
    if (title.trim().length > 0) Todo.create(title);
    res.redirect("/");
};

exports.toggle = (req, res) => {
    Todo.toggle(Number(req.params.id));
    res.redirect("/");
};

exports.delete = (req, res) => {
    Todo.delete(Number(req.params.id));
    res.redirect("/");
};
```

`aboutController.js`
```javascript
exports.about = (req, res) => {
    res.render("about");
};
```

`errorController.js`
```javascript
exports.notFound = (req, res) => {
    res.status(404).render("404");
};
```

**Роуты**
`routes/todoRoutes.js`
```javascript
const express = require("express");
const router = express.Router();

const todo = require("../controllers/todoController");
const about = require("../controllers/aboutController");

router.get("/", todo.index);
router.get("/new", todo.newForm);
router.post("/new", todo.create);
router.post("/:id/toggle", todo.toggle);
router.post("/:id/delete", todo.delete);
router.get("/about", about.about);

module.exports = router;
```

**Представления (Pug)**
`layout.pug`
```javascript
doctype html
html
  head
    title TodoApp
  body
    header
      h1 Todo List
      nav
        a(href="/") Список |
        a(href="/new") Новая задача |
        a(href="/about") О нас
    main
      block content
```

`index.pug`
```javascript
extends layout

block content
  h2 Список задач

  form(method="GET", action="/")
    select(name="status", onchange="this.form.submit()")
      option(value="all" selected=status=='all') Все
      option(value="active" selected=status=='active') Активные
      option(value="completed" selected=status=='completed') Выполненные

  ul
    each todo in todos
      li
        form(action=`/${todo.id}/toggle`, method="POST", style="display:inline")
          button(type="submit") #{todo.completed ? "✓" : "○"}

        span(style=`text-decoration:${todo.completed ? "line-through" : "none"}`)
          | #{todo.title}

        form(action=`/${todo.id}/delete`, method="POST", style="display:inline")
          button(type="submit") Удалить
```

`new.pug`
```javascript
extends layout

block content
  h2 Новая задача

  form(action="/new", method="POST")
    input(type="text", name="title", placeholder="Название задачи" required)
    button(type="submit") Создать
```

`about.pug`
```javascript
extends layout

block content
  h2 О приложении
  p Учебное приложение ToDo List на Express + MVC + Pug.
```

`404.pug`
```javascript
extends layout

block content
  h2 404 — страница не найдена
  p Запрашиваемая страница отсутствует.
```

## Тестирование
| Функция               | Результат                       |
| --------------------- | ------------------------------- |
| Просмотр списка задач | ✔ Работает                      |
| Создание новой задачи | ✔ Через POST, затем redirect    |
| Переключение статуса  | ✔ (поле completed меняется)     |
| Удаление задачи       | ✔ Задача удаляется              |
| Статическая страница  | ✔ Отображается                  |
| 404                   | ✔ Генерируется корректно        |
| Фильтрация по статусу | ✔ GET /?status=active completed |

## Контрольные вопросы
**1. Чем отличаются HTML-маршруты от REST API?**<br>
HTML-маршруты возвращают готовые страницы (`res.render`), REST API — данные в JSON (`res.json`).
HTML используется браузером, API — фронтендом/мобилкой.<br>
**2. Что такое res.render и res.json?**<br>
`res.render(view, data)` → отрисовывает шаблон и возвращает HTML.
`res.json(obj)` → возвращает JSON.
`render` — для страниц, `json` — для API.<br>
**3. Что такое middleware и для чего нужен express.urlencoded?**<br>
Middleware — промежуточная обработка запроса.
`express.urlencoded()` парсит данные HTML-форм и делает их доступными через `req.body`.