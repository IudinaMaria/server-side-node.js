let seq = 3;

let store = [
  { id: 1, title: 'Купить хлеб', completed: false },
  { id: 2, title: 'Сделать ToDo App', completed: true },
  { id: 3, title: 'Позвонить врачу', completed: false }
];

export function list(status = 'all') {
  if (status === 'active') return store.filter(t => !t.completed);
  if (status === 'completed') return store.filter(t => t.completed);
  return [...store];
}

export function create(title) {
  store.push({ id: ++seq, title, completed: false });
}

export function toggle(id) {
  const idx = store.findIndex(t => t.id === id);
  if (idx >= 0) store[idx].completed = !store[idx].completed;
}

export function remove(id) {
  store = store.filter(t => t.id !== id);
}
