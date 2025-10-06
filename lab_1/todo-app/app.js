import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { listTodos, createTodo, toggleTodo, deleteTodo } from './controllers/todoController.js';
import { renderAbout } from './controllers/aboutController.js';
import { notFound, errorHandler } from './controllers/errorController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.appName = process.env.APP_NAME || 'TodoApp';
  next();
});

app.get('/', listTodos);                   
app.get('/new', (req, res) => res.render('new'));
app.post('/new', createTodo);

app.post('/:id/toggle', toggleTodo);
app.post('/:id/delete', deleteTodo);

app.get('/about', renderAbout);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[${process.env.APP_NAME}] listening on http://localhost:${PORT}`);
});
