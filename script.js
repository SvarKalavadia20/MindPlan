
class TodoApp {
    constructor() {
        this.todos = JSON.parse(localStorage.getItem('todos')) || [];
        this.filter = 'all';
        this.editingId = null;

        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.deadlineInput = document.getElementById('deadlineInput');
        this.addBtn = document.getElementById('addBtn');
        this.todosContainer = document.getElementById('todosContainer');
        this.emptyState = document.getElementById('emptyState');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.stats = {
            total: document.getElementById('totalTasks'),
            completed: document.getElementById('completedTasks'),
            pending: document.getElementById('pendingTasks'),
            rate: document.getElementById('completionRate')
        };
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        this.todosContainer.addEventListener('click', (e) => {
            const todoItem = e.target.closest('.todo-item');
            if (!todoItem) return;

            const id = parseInt(todoItem.dataset.id);

            if (e.target.matches('.delete-btn')) {
                this.deleteTodo(id);
            } else if (e.target.matches('.edit-btn')) {
                this.editTodo(id);
            } else if (e.target.matches('.save-btn')) {
                this.saveTodo(id);
            } else if (e.target.matches('.cancel-btn')) {
                this.cancelEdit();
            }
        });

        this.todosContainer.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.toggleTodo(id);
            }
        });

        this.todosContainer.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.matches('.edit-input')) {
                const id = parseInt(e.target.closest('.todo-item').dataset.id);
                this.saveTodo(id);
            }
        });
    }

    addTodo() {
        const text = this.taskInput.value.trim();
        const deadline = this.deadlineInput.value;
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            deadline: deadline || null,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.taskInput.value = '';
        this.deadlineInput.value = '';
        this.saveTodos();
        this.render();

        setTimeout(() => {
            const newItem = this.todosContainer.querySelector(`[data-id="${todo.id}"]`);
            if (newItem) {
                newItem.style.animation = 'slideInUp 0.5s ease-out';
            }
        }, 50);
    }

    deleteTodo(id) {
        const todoElement = this.todosContainer.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.style.transform = 'translateX(-100%)';
            todoElement.style.opacity = '0';

            setTimeout(() => {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.saveTodos();
                this.render();
            }, 300);
        }
    }

    editTodo(id) {
        this.cancelEdit();
        this.editingId = id;
        this.render();
    }

    saveTodo(id) {
        const todoItem = this.todosContainer.querySelector(`[data-id="${id}"]`);
        const editInput = todoItem.querySelector('.edit-input');
        const newText = editInput.value.trim();
        if (!newText) return;

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            this.editingId = null;
            this.saveTodos();
            this.render();
        }
    }

    cancelEdit() {
        this.editingId = null;
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    setFilter(filter) {
        this.filter = filter;
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        this.render();
    }

    getFilteredTodos() {
        switch (this.filter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            default:
                return this.todos;
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        this.stats.total.textContent = total;
        this.stats.completed.textContent = completed;
        this.stats.pending.textContent = pending;
        this.stats.rate.textContent = `${rate}%`;

        [this.stats.total, this.stats.completed, this.stats.pending, this.stats.rate].forEach(stat => {
            stat.style.transform = 'scale(1.1)';
            setTimeout(() => {
                stat.style.transform = 'scale(1)';
            }, 200);
        });
    }

    renderTodos() {
        const filteredTodos = this.getFilteredTodos();

        if (filteredTodos.length === 0) {
            this.emptyState.style.display = 'block';
            this.todosContainer.innerHTML = '';
            this.todosContainer.appendChild(this.emptyState);
            return;
        }

        this.emptyState.style.display = 'none';

        this.todosContainer.innerHTML = filteredTodos.map(todo => {
            const isEditing = this.editingId === todo.id;

            return `
                <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
                    <label class="custom-checkbox">
                        <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                        <span class="checkmark"></span>
                    </label>

                    ${isEditing ? `
                        <input type="text" class="edit-input" value="${todo.text}" maxlength="200">
                        <div class="todo-actions">
                            <button class="action-btn save-btn" title="Save">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn cancel-btn" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : `
                        <div class="todo-content">
                            <span class="todo-text">${todo.text}</span>
                            ${todo.deadline ? `<span class="todo-deadline"><i class="fas fa-calendar-alt"></i> ${todo.deadline}</span>` : ''}
                        </div>
                        <div class="todo-actions">
                            <button class="action-btn edit-btn" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `}
                </div>
            `;
        }).join('');

        if (this.editingId) {
            const editInput = this.todosContainer.querySelector('.edit-input');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        }
    }

    render() {
        this.updateStats();
        this.renderTodos();
    }

    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
