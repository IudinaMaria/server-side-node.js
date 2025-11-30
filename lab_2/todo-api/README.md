# Лабораторная работа №2. Работа с базой данных

## Цель работы

- Освоить создание REST API на Node.js + Express.
- Научиться проектировать и реализовывать реляционную базу данных PostgreSQL.
- Научиться использовать ORM Sequelize.
- Реализовать CRUD-операции для связанных сущностей.
- Освоить фильтрацию, поиск, сортировку и пагинацию.
- Освоить принципы связей один-ко-многим (1:N).
- Научиться работать с миграциями БД.
- Научиться запускать и безопасно останавливать систему.

## Инициализация проекта

```bash
mkdir todo-api
cd todo-api
npm init -y
npm install express cors dotenv sequelize pg pg-hstore
npm install --save-dev sequelize-cli nodemon
npx sequelize-cli init
```
`.env`:
```ini
DB_HOST=localhost
DB_USER=postgres
DB_PASS=1234
DB_NAME=postgres
DB_PORT=5432
PORT=3000
```
**Запуск PostgreSQL (Docker)**
```bash
docker run --name pg-todo -e POSTGRES_PASSWORD=1234 -p 5432:5432 -d postgres:17
```

**Проверка:**
```bash
docker ps
```

**Запуск БД**
```bash
docker start pg-todo
```

**Запуск сервера**
```bash
npm run dev
```

**Остановить PostgreSQL:**
```bash
docker stop pg-todo
```

## Создание миграций

### Категории
`npx sequelize-cli migration:generate --name create-categories`
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("categories", {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("categories");
  }
};
```

### Todos
`npx sequelize-cli migration:generate --name create-todos`
```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("todos", {
      id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
      title: { type: Sequelize.STRING(120), allowNull: false },
      completed: { type: Sequelize.BOOLEAN, defaultValue: false },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "categories", key: "id" }
      },
      due_date: Sequelize.DATE,
      created_at: Sequelize.DATE,
      updated_at: Sequelize.DATE
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable("todos");
  }
};
```

## Модели Sequelize

### Category
`models/category.js`
```javascript
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define("Category", {
    name: DataTypes.STRING
  }, {
    tableName: "categories",
    timestamps: true,
    underscored: true
  });

  Category.associate = (models) => {
    Category.hasMany(models.Todo, { foreignKey: "category_id", as: "todos" });
  };

  return Category;
};
```

### Todo
`models/todo.js`
```javascript
module.exports = (sequelize, DataTypes) => {
  const Todo = sequelize.define("Todo", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(120), allowNull: false },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    category_id: DataTypes.INTEGER,
    due_date: DataTypes.DATE
  }, {
    tableName: "todos",
    timestamps: true,
    underscored: true
  });

  Todo.associate = (models) => {
    Todo.belongsTo(models.Category, { foreignKey: "category_id", as: "category" });
  };

  return Todo;
};
```

## REST API

### Category Routes
`routes/categoryRoutes.js`
```javascript
const router = require("express").Router();
const { Category } = require("../models");

// GET all
router.get("/", async (req, res) => {
  res.json(await Category.findAll());
});

// GET by ID
router.get("/:id", async (req, res) => {
  const c = await Category.findByPk(req.params.id);
  c ? res.json(c) : res.status(404).json({ error: "Not found" });
});

// CREATE
router.post("/", async (req, res) => {
  const c = await Category.create({ name: req.body.name });
  res.status(201).json(c);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const c = await Category.findByPk(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  await c.update({ name: req.body.name });
  res.json(c);
});

// DELETE
router.delete("/:id", async (req, res) => {
  const c = await Category.findByPk(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  await c.destroy();
  res.status(204).send();
});

module.exports = router;
```

### Todo Routes (с фильтрацией, поиском, сортировкой, пагинацией)
`routes/todoRoutes.js`
```javascript
const router = require("express").Router();
const { Todo, Category } = require("../models");
const { Op } = require("sequelize");

// GET /api/todos (фильтрация + поиск + сортировка + пагинация)
router.get("/", async (req, res) => {
  const { category, search, sort = "created_at:desc", page = 1, limit = 10 } = req.query;
  const [field, direction] = sort.split(":");

  const where = {};
  if (category) where.category_id = category;
  if (search) where.title = { [Op.iLike]: `%${search}%` };

  const offset = (page - 1) * limit;

  const { rows, count } = await Todo.findAndCountAll({
    where,
    include: [{ model: Category, as: "category" }],
    order: [[field, direction.toUpperCase()]],
    limit: +limit,
    offset
  });

  res.json({
    data: rows,
    meta: {
      total: count,
      count: rows.length,
      limit: +limit,
      pages: Math.ceil(count / limit),
      currentPage: +page
    }
  });
});

// GET by ID
router.get("/:id", async (req, res) => {
  const t = await Todo.findByPk(req.params.id, {
    include: { model: Category, as: "category" }
  });
  t ? res.json(t) : res.status(404).json({ error: "Not found" });
});

// CREATE
router.post("/", async (req, res) => {
  const t = await Todo.create(req.body);
  res.status(201).json(t);
});

// UPDATE
router.put("/:id", async (req, res) => {
  const t = await Todo.findByPk(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  await t.update(req.body);
  res.json(t);
});

// TOGGLE
router.patch("/:id/toggle", async (req, res) => {
  const t = await Todo.findByPk(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  t.completed = !t.completed;
  await t.save();
  res.json(t);
});

// DELETE
router.delete("/:id", async (req, res) => {
  const t = await Todo.findByPk(req.params.id);
  if (!t) return res.status(404).json({ error: "Not found" });
  await t.destroy();
  res.status(204).send();
});

module.exports = router;
```

## app.js
```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

const categoryRoutes = require("./routes/categoryRoutes");
const todoRoutes = require("./routes/todoRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/categories", categoryRoutes);
app.use("/api/todos", todoRoutes);

app.get("/", (req, res) => res.json({ status: "API working" }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  await sequelize.authenticate();
  console.log("DB connected");
});
```

## Проверка API (Postman)

### Создание категории:
```bash
POST /api/categories
{
  "name": "Work"
}
```
### Создание задачи:
```bash
POST /api/todos
{
  "title": "Buy milk",
  "category_id": 1
}
```

### Список задач:
```bash
GET /api/todos?search=milk&category=1&sort=title:asc&page=1&limit=5
```

## Вывод
В ходе работы реализовано:
- Миграции PostgreSQL
- Модели Category и Todo
- Ассоциация 1:N
- REST API категории (CRUD)
- REST API задачи (CRUD + toggle)
- Фильтрация
- Поиск
- Сортировка
- Пагинация
- Работа через Docker
- Подключение Sequelize

## Контрольные вопросы
**1. Что такое реляционная база данных и какие преимущества она предоставляет?**<br>
**Реляционная база данных (RDBMS)** — это база данных, в которой данные хранятся в виде таблиц, связанных между собой через первичные и внешние ключи.
**Преимущества:**
- Целостность данных (ограничения: PK, FK, UNIQUE).
- Строгая структура (схема таблиц).
- Транзакции (ACID).
- Мощный язык SQL.
- Связи между таблицами (1:1, 1:N, N:M).
- Высокая надёжность и предсказуемость.<br>
**2. Какие типы связей между таблицами существуют в реляционных базах данных?**<br>
**1. Один к одному (1:1)**
Одна запись соответствует одной записи.
**2. Один ко многим (1:N)**
Одна категория → много задач.
Именно это реализовано в лабораторной работе.
**3. Многие ко многим (N:M)**
Через промежуточную таблицу.<br>
**3. Что такое RESTful API и для чего он используется?**<br>
**RESTful API** — это архитектурный стиль, в котором сервер предоставляет данные через стандартные HTTP-методы:
- **GET** — получить данные
- **POST** — создать
- **PUT/PATCH** — изменить
- **DELETE** — удалить

**Используется для:**
- построения backend-сервисов,
- обмена данными между клиентом и сервером,
- взаимодействия фронтенда и мобильных приложений с сервером,
- работы микросервисов.<br>
**4. Что такое SQL-инъекция и как защититься от неё?** <br>
**SQL-инъекция** — это атака, при которой злоумышленник вставляет SQL-код в пользовательский ввод, изменяя запрос к базе.

**Пример атаки:**
```ini
email = 'anything' OR 1=1
```

**Защита:**
- Использование ORM (Sequelize) — параметризованные запросы.
- Использование параметров вместо строковых шаблонов.
- Валидация данных на сервере.
- Ограничения в БД (тип, длина).<br>
**5. В чем разница между ORM и сырыми SQL-запросами? Какие преимущества и недостатки у каждого подхода?**<br>
**ORM (Object-Relational Mapping) — пример: Sequelize**
**Преимущества:**
- Автоматическая генерация SQL.
- Миграции.
- Ассоциации между моделями.
- Встроенная валидация.
- Защита от SQL-инъекций.
- Код пишется на JS, а не на SQL.

**Недостатки:**
- Иногда ниже производительность.
- Не всегда позволяет написать оптимальный SQL.
- Более сложная отладка.

**Сырые SQL-запросы (raw queries)**
**Преимущества:**
- Максимальная производительность.
- Полный контроль над SQL.
- Можно оптимизировать запросы вручную.

**Недостатки:**
- Больше кода.
- Нет 
- Требует глубоких знаний SQL.
- Повышенный риск SQL-инъекций при неправильной реализации.

**Краткое сравнение ORM vs SQL**
| Характеристика     | ORM          | SQL                  |
| ------------------ | ------------ | -------------------- |
| Простота           | легче писать | сложнее              |
| Производительность | ниже         | выше                 |
| Контроль           | ограничен    | максимальный         |
| Миграции           | есть         | нет                  |
| SQL-инъекции       | защищает     | нужно писать вручную |
| Подходит для ЛР2   | ✔            | можно, но сложнее    |
