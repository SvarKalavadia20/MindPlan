
        class TodoApp {
            constructor() {
                this.todos = [];
                this.reminders = [];
                this.filter = 'all';
                this.editingId = null;
                this.editingType = null;
                this.activeTab = 'task';
                
                this.initializeElements();
                this.bindEvents();
                this.render();
                this.setMinDate();
            }

            initializeElements() {
                this.taskInput = document.getElementById('taskInput');
                this.reminderInput = document.getElementById('reminderInput');
                this.taskDeadline = document.getElementById('taskDeadline');
                this.reminderDate = document.getElementById('reminderDate');
                this.taskDateBtn = document.getElementById('taskDateBtn');
                this.reminderDateBtn = document.getElementById('reminderDateBtn');
                this.taskSelectedDate = document.getElementById('taskSelectedDate');
                this.reminderSelectedDate = document.getElementById('reminderSelectedDate');
                this.addTaskBtn = document.getElementById('addTaskBtn');
                this.addReminderBtn = document.getElementById('addReminderBtn');
                this.tasksContainer = document.getElementById('tasksContainer');
                this.remindersContainer = document.getElementById('remindersContainer');
                this.tasksEmptyState = document.getElementById('tasksEmptyState');
                this.remindersEmptyState = document.getElementById('remindersEmptyState');
                this.filterBtns = document.querySelectorAll('.filter-btn');
                this.tabBtns = document.querySelectorAll('.tab-btn');
                this.inputForms = document.querySelectorAll('.input-form');
                this.stats = {
                    total: document.getElementById('totalTasks'),
                    completed: document.getElementById('completedTasks'),
                    pending: document.getElementById('pendingTasks'),
                    rate: document.getElementById('completionRate')
                };
            }

            setMinDate() {
                const today = new Date().toISOString().split('T')[0];
                this.taskDeadline.min = today;
                this.reminderDate.min = today;
            }

            bindEvents() {
                this.addTaskBtn.addEventListener('click', () => this.addTodo());
                this.addReminderBtn.addEventListener('click', () => this.addReminder());
                
                this.taskInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addTodo();
                });
                
                this.reminderInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addReminder();
                });
                
                // Date picker button events
                this.taskDateBtn.addEventListener('click', () => this.taskDeadline.showPicker());
                this.reminderDateBtn.addEventListener('click', () => this.reminderDate.showPicker());
                
                // Date input change events
                this.taskDeadline.addEventListener('change', () => this.updateSelectedDate('task'));
                this.reminderDate.addEventListener('change', () => this.updateSelectedDate('reminder'));
                
                this.tabBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setActiveTab(e.target.dataset.tab);
                    });
                });
                
                this.filterBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFilter(e.target.dataset.filter);
                    });
                });

                this.tasksContainer.addEventListener('click', (e) => this.handleTaskAction(e));
                this.remindersContainer.addEventListener('click', (e) => this.handleReminderAction(e));
                
                this.tasksContainer.addEventListener('change', (e) => {
                    if (e.target.type === 'checkbox') {
                        const id = parseInt(e.target.closest('.todo-item').dataset.id);
                        this.toggleTodo(id);
                    }
                });

                this.tasksContainer.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.matches('.edit-input')) {
                        const id = parseInt(e.target.closest('.todo-item').dataset.id);
                        this.saveTodo(id);
                    }
                });
                
                this.remindersContainer.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && e.target.matches('.edit-input')) {
                        const id = parseInt(e.target.closest('.todo-item').dataset.id);
                        this.saveReminder(id);
                    }
                });
            }

            updateSelectedDate(type) {
                if (type === 'task') {
                    const value = this.taskDeadline.value;
                    if (value) {
                        this.taskSelectedDate.textContent = this.formatDateDisplay(value);
                        this.taskSelectedDate.classList.add('has-date');
                        this.taskDateBtn.classList.add('has-date');
                    } else {
                        this.taskSelectedDate.textContent = 'No deadline';
                        this.taskSelectedDate.classList.remove('has-date');
                        this.taskDateBtn.classList.remove('has-date');
                    }
                } else if (type === 'reminder') {
                    const value = this.reminderDate.value;
                    if (value) {
                        this.reminderSelectedDate.textContent = this.formatDateDisplay(value);
                        this.reminderSelectedDate.classList.add('has-date');
                        this.reminderDateBtn.classList.add('has-date');
                    } else {
                        this.reminderSelectedDate.textContent = 'Select date';
                        this.reminderSelectedDate.classList.remove('has-date');
                        this.reminderDateBtn.classList.remove('has-date');
                    }
                }
            }

            formatDateDisplay(dateString) {
                const date = new Date(dateString + 'T00:00:00');
                return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            setActiveTab(tab) {
                this.activeTab = tab;
                this.tabBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tab === tab);
                });
                this.inputForms.forEach(form => {
                    form.classList.toggle('active', form.id === `${tab}Form`);
                });
            }

            formatDateTime(dateString) {
                const date = new Date(dateString + 'T00:00:00');
                const now = new Date();
                now.setHours(0, 0, 0, 0); // Reset time for date comparison
                const diffTime = date - now;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const formatted = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                
                if (diffDays < 0) {
                    return { text: `${formatted} (Overdue)`, status: 'overdue' };
                } else if (diffDays === 0) {
                    return { text: `${formatted} (Today)`, status: 'due-today' };
                } else if (diffDays <= 3) {
                    return { text: `${formatted} (Due soon)`, status: 'due-soon' };
                } else {
                    return { text: formatted, status: 'normal' };
                }
            }

            addTodo() {
                const text = this.taskInput.value.trim();
                if (!text) return;

                const todo = {
                    id: Date.now(),
                    text: text,
                    completed: false,
                    deadline: this.taskDeadline.value || null,
                    createdAt: new Date().toISOString(),
                    type: 'task'
                };

                this.todos.push(todo);
                this.taskInput.value = '';
                this.taskDeadline.value = '';
                this.updateSelectedDate('task');
                this.render();
            }

            addReminder() {
                const text = this.reminderInput.value.trim();
                const date = this.reminderDate.value;
                
                if (!text || !date) return;

                const reminder = {
                    id: Date.now(),
                    text: text,
                    date: date,
                    createdAt: new Date().toISOString(),
                    type: 'reminder'
                };

                this.reminders.push(reminder);
                this.reminderInput.value = '';
                this.reminderDate.value = '';
                this.updateSelectedDate('reminder');
                this.render();
            }

            handleTaskAction(e) {
                const todoItem = e.target.closest('.todo-item');
                if (!todoItem) return;
                
                const id = parseInt(todoItem.dataset.id);
                
                if (e.target.matches('.delete-btn')) {
                    this.deleteTodo(id);
                } else if (e.target.matches('.edit-btn')) {
                    this.editTodo(id, 'task');
                } else if (e.target.matches('.save-btn')) {
                    this.saveTodo(id);
                } else if (e.target.matches('.cancel-btn')) {
                    this.cancelEdit();
                }
            }

            handleReminderAction(e) {
                const reminderItem = e.target.closest('.todo-item');
                if (!reminderItem) return;
                
                const id = parseInt(reminderItem.dataset.id);
                
                if (e.target.matches('.delete-btn')) {
                    this.deleteReminder(id);
                } else if (e.target.matches('.edit-btn')) {
                    this.editReminder(id);
                } else if (e.target.matches('.save-btn')) {
                    this.saveReminder(id);
                } else if (e.target.matches('.cancel-btn')) {
                    this.cancelEdit();
                }
            }

            deleteTodo(id) {
                const todoElement = this.tasksContainer.querySelector(`[data-id="${id}"]`);
                if (todoElement) {
                    todoElement.style.transform = 'translateX(-100%)';
                    todoElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        this.todos = this.todos.filter(todo => todo.id !== id);
                        this.render();
                    }, 300);
                }
            }

            deleteReminder(id) {
                const reminderElement = this.remindersContainer.querySelector(`[data-id="${id}"]`);
                if (reminderElement) {
                    reminderElement.style.transform = 'translateX(-100%)';
                    reminderElement.style.opacity = '0';
                    
                    setTimeout(() => {
                        this.reminders = this.reminders.filter(reminder => reminder.id !== id);
                        this.render();
                    }, 300);
                }
            }

            editTodo(id, type) {
                this.cancelEdit();
                this.editingId = id;
                this.editingType = type;
                this.render();
            }

            editReminder(id) {
                this.cancelEdit();
                this.editingId = id;
                this.editingType = 'reminder';
                this.render();
            }

            saveTodo(id) {
                const todoItem = this.tasksContainer.querySelector(`[data-id="${id}"]`);
                const editInput = todoItem.querySelector('.edit-input');
                const editDeadline = todoItem.querySelector('.edit-date-input');
                const newText = editInput.value.trim();
                
                if (!newText) return;

                const todo = this.todos.find(t => t.id === id);
                if (todo) {
                    todo.text = newText;
                    todo.deadline = editDeadline ? editDeadline.value || null : todo.deadline;
                    this.editingId = null;
                    this.editingType = null;
                    this.render();
                }
            }

            saveReminder(id) {
                const reminderItem = this.remindersContainer.querySelector(`[data-id="${id}"]`);
                const editInput = reminderItem.querySelector('.edit-input');
                const editDate = reminderItem.querySelector('.edit-date-input');
                const newText = editInput.value.trim();
                const newDate = editDate.value;
                
                if (!newText || !newDate) return;

                const reminder = this.reminders.find(r => r.id === id);
                if (reminder) {
                    reminder.text = newText;
                    reminder.date = newDate;
                    this.editingId = null;
                    this.editingType = null;
                    this.render();
                }
            }

            cancelEdit() {
                this.editingId = null;
                this.editingType = null;
                this.render();
            }

            toggleTodo(id) {
                const todo = this.todos.find(t => t.id === id);
                if (todo) {
                    todo.completed = !todo.completed;
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
                let filtered = [...this.todos];
                
                switch (this.filter) {
                    case 'completed':
                        filtered = filtered.filter(todo => todo.completed);
                        break;
                    case 'pending':
                        filtered = filtered.filter(todo => !todo.completed);
                        break;
                    default:
                        break;
                }
                
                // Sort by deadline (closest first), then by creation date
                return filtered.sort((a, b) => {
                    if (a.deadline && b.deadline) {
                        return new Date(a.deadline) - new Date(b.deadline);
                    } else if (a.deadline) {
                        return -1;
                    } else if (b.deadline) {
                        return 1;
                    } else {
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    }
                });
            }

            getSortedReminders() {
                // Sort reminders by date (closest first)
                return [...this.reminders].sort((a, b) => {
                    return new Date(a.date) - new Date(b.date);
                });
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

                // Add animation to stat numbers
                [this.stats.total, this.stats.completed, this.stats.pending, this.stats.rate].forEach(stat => {
                    stat.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        stat.style.transform = 'scale(1)';
                    }, 200);
                });
            }

            renderTasks() {
                const filteredTodos = this.getFilteredTodos();
                
                if (filteredTodos.length === 0) {
                    this.tasksEmptyState.style.display = 'block';
                    this.tasksContainer.innerHTML = '';
                    this.tasksContainer.appendChild(this.tasksEmptyState);
                    return;
                }

                this.tasksEmptyState.style.display = 'none';
                
                this.tasksContainer.innerHTML = filteredTodos.map(todo => {
                    const isEditing = this.editingId === todo.id && this.editingType === 'task';
                    let deadlineInfo = null;
                    let itemClasses = 'todo-item';
                    
                    if (todo.deadline) {
                        deadlineInfo = this.formatDateTime(todo.deadline);
                        if (deadlineInfo.status === 'overdue') itemClasses += ' overdue';
                        else if (deadlineInfo.status === 'due-today') itemClasses += ' due-today';
                    }
                    
                    if (todo.completed) itemClasses += ' completed';
                    
                    return `
                        <div class="${itemClasses}" data-id="${todo.id}">
                            <label class="custom-checkbox">
                                <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                                <span class="checkmark"></span>
                            </label>
                            
                            ${isEditing ? `
                                <div class="todo-content">
                                    <input type="text" class="edit-input" value="${todo.text}" maxlength="200">
                                    <div class="edit-date-picker">
                                        <input type="date" class="edit-date-input" value="${todo.deadline || ''}" min="${new Date().toISOString().split('T')[0]}">
                                    </div>
                                </div>
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
                                    ${deadlineInfo ? `
                                        <div class="todo-deadline ${deadlineInfo.status}">
                                            <i class="fas fa-clock"></i>
                                            ${deadlineInfo.text}
                                        </div>
                                    ` : ''}
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

                // Focus on edit input if editing
                if (this.editingId && this.editingType === 'task') {
                    const editInput = this.tasksContainer.querySelector('.edit-input');
                    if (editInput) {
                        editInput.focus();
                        editInput.select();
                    }
                }
            }

            renderReminders() {
                const sortedReminders = this.getSortedReminders();
                
                if (sortedReminders.length === 0) {
                    this.remindersEmptyState.style.display = 'block';
                    this.remindersContainer.innerHTML = '';
                    this.remindersContainer.appendChild(this.remindersEmptyState);
                    return;
                }

                this.remindersEmptyState.style.display = 'none';
                
                this.remindersContainer.innerHTML = sortedReminders.map(reminder => {
                    const isEditing = this.editingId === reminder.id && this.editingType === 'reminder';
                    const dateInfo = this.formatDateTime(reminder.date);
                    let itemClasses = 'todo-item reminder-item';
                    
                    if (dateInfo.status === 'overdue') itemClasses += ' overdue';
                    else if (dateInfo.status === 'due-today') itemClasses += ' due-today';
                    
                    return `
                        <div class="${itemClasses}" data-id="${reminder.id}">
                            <i class="fas fa-bell" style="color: #28a745; font-size: 1.2rem;"></i>
                            
                            ${isEditing ? `
                                <div class="todo-content">
                                    <input type="text" class="edit-input" value="${reminder.text}" maxlength="200">
                                    <div class="edit-date-picker">
                                        <input type="date" class="edit-date-input" value="${reminder.date}" min="${new Date().toISOString().split('T')[0]}" required>
                                    </div>
                                </div>
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
                                    <span class="todo-text">${reminder.text}</span>
                                    <div class="todo-deadline ${dateInfo.status}">
                                        <i class="fas fa-calendar"></i>
                                        ${dateInfo.text}
                                    </div>
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

                // Focus on edit input if editing
                if (this.editingId && this.editingType === 'reminder') {
                    const editInput = this.remindersContainer.querySelector('.edit-input');
                    if (editInput) {
                        editInput.focus();
                        editInput.select();
                    }
                }
            }

            render() {
                this.updateStats();
                this.renderTasks();
                this.renderReminders();
            }
        }

        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new TodoApp();
        });

        // Add some visual enhancements
        document.addEventListener('mousemove', (e) => {
            const cursor = document.querySelector('.cursor');
            if (!cursor) {
                const newCursor = document.createElement('div');
                newCursor.className = 'cursor';
                newCursor.style.cssText = `
                    position: fixed;
                    width: 20px;
                    height: 20px;
                    background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    transition: transform 0.1s ease;
                `;
                document.body.appendChild(newCursor);
            }
            
            const cursorElement = document.querySelector('.cursor');
            cursorElement.style.left = e.clientX - 10 + 'px';
            cursorElement.style.top = e.clientY - 10 + 'px';
        });

// ===== Scroll Spy (About, Skills, Projects, Achievements) =====
// Select the progress bar
const progressBar = document.querySelector('.spy-progress');

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = (scrollTop / docHeight) * 100;

  progressBar.style.height = scrollPercent + "%";
});

const circle = document.getElementById("cursorCircle");

let mouseX = 0, mouseY = 0;
let circleX = 0, circleY = 0;

// This matches your dot.png hotspot (8,8)
const hotspotX = 16;
const hotspotY = 16;

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX + hotspotX;
  mouseY = e.clientY + hotspotY;
});

function animate() {
  // Smooth interpolation
  circleX += (mouseX - circleX) * 0.1;
  circleY += (mouseY - circleY) * 0.1;

  circle.style.left = circleX + "px";
  circle.style.top = circleY + "px";

  requestAnimationFrame(animate);
}
animate();
    