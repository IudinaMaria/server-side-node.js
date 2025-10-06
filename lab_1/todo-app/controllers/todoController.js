import * as Todo from '../models/todo.js';

export function listTodos(req, res) {
  const { status } = req.query;
  const filtered = Todo.list(status);
  res.render('index', { todos: filtered, status: status || 'all' });
}

export function createTodo(req, res) {
  const title = (req.body.title || '').trim();
  if (!title) {
    return res.status(400).render('new', { error: 'Введите название задачи.' });
  }
  Todo.create(title);
  res.redirect('/');
}

export function toggleTodo(req, res) {
  const id = Number(req.params.id);
  Todo.toggle(id);
  res.redirect('back');
}

export function deleteTodo(req, res) {
  const id = Number(req.params.id);
  Todo.remove(id);
  res.redirect('back');
}
