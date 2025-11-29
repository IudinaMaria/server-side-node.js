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
        todos.push({
            id: idCounter++,
            title,
            completed: false,
        });
    },

    toggle(id) {
        const task = todos.find(t => t.id === id);
        if (task) task.completed = !task.completed;
    },

    delete(id) {
        todos = todos.filter(t => t.id !== id);
    }
};
