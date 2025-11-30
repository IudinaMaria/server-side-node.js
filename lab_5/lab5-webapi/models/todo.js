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
