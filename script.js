/* ========= FIREBASE SETUP ========= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAwqm8uN7M9BViNTZgsaaIVLunCMgScCUw",
  authDomain: "mindplan-d7ace.firebaseapp.com",
  projectId: "mindplan-d7ace",
  storageBucket: "mindplan-d7ace.firebasestorage.app",
  messagingSenderId: "1000253184481",
  appId: "1:1000253184481:web:0a5024adccd65f757e9aa0"
};

const appFB = initializeApp(firebaseConfig);
const auth = getAuth(appFB);
const db = getFirestore(appFB);

/* ========= CUSTOM DATE PICKER CLASS ========= */

class CustomDatePicker {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            allowPast: options.allowPast || false,
            placeholder: options.placeholder || 'Select date',
            required: options.required || false,
            ...options
        };
        
        this.selectedDate = null;
        this.currentDate = new Date();
        this.viewDate = new Date();
        this.isOpen = false;
        
        this.initializeElements();
        this.bindEvents();
        this.render();
    }
    
    initializeElements() {
        this.trigger = this.container.querySelector('.date-trigger');
        this.dateText = this.container.querySelector('.date-text');
        this.dropdownArrow = this.container.querySelector('.dropdown-arrow');
        this.calendar = this.container.querySelector('.calendar-dropdown');
        this.monthYear = this.container.querySelector('.month-year');
        this.prevBtn = this.container.querySelector('.nav-btn:first-child');
        this.nextBtn = this.container.querySelector('.nav-btn:last-child');
        this.daysGrid = this.container.querySelector('.days-grid');
        this.quickBtns = this.container.querySelectorAll('.quick-btn');
        
        // Set placeholder text
        this.dateText.textContent = this.options.placeholder;
    }
    
    bindEvents() {
        // Toggle calendar
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });
        
        // Navigation
        this.prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.previousMonth();
        });
        this.nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.nextMonth();
        });
        
        // Quick select buttons
        this.quickBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.dataset.clear) {
                    this.clearDate();
                } else {
                    const days = parseInt(btn.dataset.days);
                    const date = new Date();
                    date.setDate(date.getDate() + days);
                    this.selectDate(date);
                }
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        });
    }
    
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        // Close any other open calendars
        document.querySelectorAll('.calendar-dropdown.show').forEach(cal => {
            if (cal !== this.calendar) {
                cal.classList.remove('show');
                const arrow = cal.parentElement.querySelector('.dropdown-arrow');
                if (arrow) arrow.classList.remove('open');
            }
        });
        
        this.isOpen = true;
        this.calendar.classList.add('show');
        this.dropdownArrow.classList.add('open');
        this.render();
    }
    
    close() {
        this.isOpen = false;
        this.calendar.classList.remove('show');
        this.dropdownArrow.classList.remove('open');
    }
    
    previousMonth() {
        this.viewDate.setMonth(this.viewDate.getMonth() - 1);
        this.render();
    }
    
    nextMonth() {
        this.viewDate.setMonth(this.viewDate.getMonth() + 1);
        this.render();
    }
    
    selectDate(date) {
        this.selectedDate = new Date(date);
        this.updateDisplay();
        this.close();
        
        // Dispatch custom event
        this.container.dispatchEvent(new CustomEvent('dateselect', {
            detail: { date: new Date(date) }
        }));
    }
    
    clearDate() {
        this.selectedDate = null;
        this.updateDisplay();
        this.close();
        
        // Dispatch custom event
        this.container.dispatchEvent(new CustomEvent('dateclear'));
    }
    
    updateDisplay() {
        if (this.selectedDate) {
            this.dateText.textContent = this.formatDate(this.selectedDate);
            this.dateText.classList.remove('placeholder');
            this.trigger.classList.add('has-date');
        } else {
            this.dateText.textContent = this.options.placeholder;
            this.dateText.classList.add('placeholder');
            this.trigger.classList.remove('has-date');
        }
    }
    
    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    render() {
        // Update month/year display
        this.monthYear.textContent = this.viewDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
        
        // Clear days grid
        this.daysGrid.innerHTML = '';
        
        // Get first day of month and number of days
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.classList.add('day');
            dayElement.textContent = currentDate.getDate();
            
            // Add classes
            if (currentDate.getMonth() !== month) {
                dayElement.classList.add('other-month');
            }
            
            if (currentDate.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            if (this.selectedDate && currentDate.getTime() === this.selectedDate.getTime()) {
                dayElement.classList.add('selected');
            }
            
            // Disable past dates if not allowed
            if (!this.options.allowPast && currentDate < today) {
                dayElement.classList.add('disabled');
            } else {
                // Fixed: Properly bind click events to day elements
                dayElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectDate(currentDate);
                });
            }
            
            this.daysGrid.appendChild(dayElement);
        }
    }
    
    // Public API
    getValue() {
        return this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : null;
    }
    
    setValue(dateString) {
        if (dateString) {
            this.selectedDate = new Date(dateString + 'T00:00:00');
            this.viewDate = new Date(this.selectedDate);
        } else {
            this.selectedDate = null;
        }
        this.updateDisplay();
        this.render();
    }
}

/* ========= MAIN TODO APP ========= */

class TodoApp {
    constructor() {
        this.todos = [];
        this.reminders = [];
        this.filter = 'all';
        this.editingId = null;
        this.editingType = null;
        this.activeTab = 'task';
        this.user = null; //logged-in user 
        
        // Custom date picker properties
        this.selectedTaskDate = null;
        this.selectedReminderDate = null;
        this.taskDatePicker = null;
        this.reminderDatePicker = null;

        this.initializeElements();
        this.bindEvents();
        this.render();
        this.initCustomDatePickers();
        this.setupAuth();
    }

    setupAuth() {
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");

        loginBtn.onclick = async () => {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        };

        logoutBtn.onclick = () => signOut(auth);

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.user = user;
                loginBtn.style.display = "none";
                logoutBtn.style.display = "inline-block";
                await this.loadUserData(user.uid);
            } else {
                this.user = null;
                loginBtn.style.display = "inline-block";
                logoutBtn.style.display = "none";
                this.todos = [];
                this.reminders = [];
                this.render();
            }
        });
    }

    /* ----- Firestore save/load ----- */
    async saveData() {
        if (!this.user) return;
        const userRef = doc(db, "users", this.user.uid);
        await setDoc(userRef, {
            todos: this.todos,
            reminders: this.reminders
        }, { merge: true });
    }

    async loadUserData(uid) {
        const docRef = doc(db, "users", uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            this.todos = data.todos || [];
            this.reminders = data.reminders || [];
            this.render();
        }
    }

    initializeElements() {
        this.taskInput = document.getElementById('taskInput');
        this.reminderInput = document.getElementById('reminderInput');
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

    initCustomDatePickers() {
        // Initialize custom date pickers
        this.taskDatePicker = new CustomDatePicker('taskDatePicker', {
            allowPast: false,
            placeholder: 'Select deadline (optional)',
            required: false
        });
        
        this.reminderDatePicker = new CustomDatePicker('reminderDatePicker', {
            allowPast: false,
            placeholder: 'Select reminder date',
            required: true
        });
        
        // Event listeners for date selection
        document.getElementById('taskDatePicker').addEventListener('dateselect', (e) => {
            this.selectedTaskDate = e.detail.date.toISOString().split('T')[0];
        });
        
        document.getElementById('taskDatePicker').addEventListener('dateclear', () => {
            this.selectedTaskDate = null;
        });
        
        document.getElementById('reminderDatePicker').addEventListener('dateselect', (e) => {
            this.selectedReminderDate = e.detail.date.toISOString().split('T')[0];
        });
        
        document.getElementById('reminderDatePicker').addEventListener('dateclear', () => {
            this.selectedReminderDate = null;
        });
    }

    initEditDatePicker(containerId, currentDate = null) {
        setTimeout(() => {
            const container = document.getElementById(containerId);
            if (!container) return;

            const editPicker = new CustomDatePicker(containerId, {
                allowPast: false,
                placeholder: 'No deadline',
                required: false
            });

            if (currentDate) {
                editPicker.setValue(currentDate);
            }

            // Store reference for saving
            container.addEventListener('dateselect', (e) => {
                const id = parseInt(container.closest('.todo-item').dataset.id);
                if (this.editingType === 'task') {
                    const todo = this.todos.find(t => t.id === id);
                    if (todo) todo.deadline = e.detail.date.toISOString().split('T')[0];
                } else if (this.editingType === 'reminder') {
                    const reminder = this.reminders.find(r => r.id === id);
                    if (reminder) reminder.date = e.detail.date.toISOString().split('T')[0];
                }
            });

            container.addEventListener('dateclear', () => {
                const id = parseInt(container.closest('.todo-item').dataset.id);
                if (this.editingType === 'task') {
                    const todo = this.todos.find(t => t.id === id);
                    if (todo) todo.deadline = null;
                }
            });
        }, 100);
    }

    formatDateForDisplay(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
            deadline: this.selectedTaskDate || null,
            createdAt: new Date().toISOString(),
            type: 'task'
        };

        this.todos.push(todo);
        this.taskInput.value = '';
        this.taskDatePicker.clearDate();
        this.selectedTaskDate = null;
        this.render();
        this.saveData();
    }

    addReminder() {
        const text = this.reminderInput.value.trim();
        const date = this.selectedReminderDate;
        
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
        this.reminderDatePicker.clearDate();
        this.selectedReminderDate = null;
        this.render();
        this.saveData();
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
                this.saveData();
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
                this.saveData();
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
        const newText = editInput.value.trim();
        
        if (!newText) return;

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            // deadline is already updated by the edit date picker event
            this.editingId = null;
            this.editingType = null;
            this.render();
            this.saveData();
        }
    }

    saveReminder(id) {
        const reminderItem = this.remindersContainer.querySelector(`[data-id="${id}"]`);
        const editInput = reminderItem.querySelector('.edit-input');
        const newText = editInput.value.trim();
        
        if (!newText) return;

        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.text = newText;
            // date is already updated by the edit date picker event
            this.editingId = null;
            this.editingType = null;
            this.render();
            this.saveData();
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
            this.saveData();
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
                                <div class="edit-custom-date-picker" id="editTaskDatePicker-${todo.id}">
                                    <div class="edit-date-trigger">
                                        <i class="fas fa-calendar-alt date-icon"></i>
                                        <span class="edit-date-text ${todo.deadline ? '' : 'placeholder'}">${todo.deadline ? this.formatDateForDisplay(todo.deadline) : 'No deadline'}</span>
                                        <i class="fas fa-chevron-down edit-dropdown-arrow"></i>
                                    </div>
                                    <div class="edit-calendar-dropdown">
                                        <div class="calendar-header">
                                            <button class="nav-btn edit-prev-btn"><i class="fas fa-chevron-left"></i></button>
                                            <span class="month-year edit-month-year"></span>
                                            <button class="nav-btn edit-next-btn"><i class="fas fa-chevron-right"></i></button>
                                        </div>
                                        <div class="calendar-grid">
                                            <div class="weekdays">
                                                <div class="weekday">Sun</div>
                                                <div class="weekday">Mon</div>
                                                <div class="weekday">Tue</div>
                                                <div class="weekday">Wed</div>
                                                <div class="weekday">Thu</div>
                                                <div class="weekday">Fri</div>
                                                <div class="weekday">Sat</div>
                                            </div>
                                            <div class="days-grid edit-days-grid"></div>
                                        </div>
                                        <div class="quick-select">
                                            <button class="quick-btn" data-days="0">Today</button>
                                            <button class="quick-btn" data-days="1">Tomorrow</button>
                                            <button class="quick-btn" data-days="7">Week</button>
                                            <button class="quick-btn" data-clear="true">Clear</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="todo-actions">
                            <button class="action-btn save-btn" title="Save">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="action-btn cancel-btn" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="action-btn delete-btn" title="Delete">
                                <i class="fas fa-trash"></i>
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

        // Initialize edit date picker if editing
        if (this.editingId && this.editingType === 'task') {
            const editInput = this.tasksContainer.querySelector('.edit-input');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
            
            const todo = this.todos.find(t => t.id === this.editingId);
            if (todo) {
                this.initEditDatePicker(`editTaskDatePicker-${todo.id}`, todo.deadline);
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
                                <div class="edit-custom-date-picker" id="editReminderDatePicker-${reminder.id}">
                                    <div class="edit-date-trigger">
                                        <i class="fas fa-bell date-icon"></i>
                                        <span class="edit-date-text">${this.formatDateForDisplay(reminder.date)}</span>
                                        <i class="fas fa-chevron-down edit-dropdown-arrow"></i>
                                    </div>
                                    <div class="edit-calendar-dropdown">
                                        <div class="calendar-header">
                                            <button class="nav-btn"><i class="fas fa-chevron-left"></i></button>
                                            <span class="month-year"></span>
                                            <button class="nav-btn"><i class="fas fa-chevron-right"></i></button>
                                        </div>
                                        <div class="calendar-grid">
                                            <div class="weekdays">
                                                <div class="weekday">Sun</div>
                                                <div class="weekday">Mon</div>
                                                <div class="weekday">Tue</div>
                                                <div class="weekday">Wed</div>
                                                <div class="weekday">Thu</div>
                                                <div class="weekday">Fri</div>
                                                <div class="weekday">Sat</div>
                                            </div>
                                            <div class="days-grid"></div>
                                        </div>
                                        <div class="quick-select">
                                            <button class="quick-btn" data-days="0">Today</button>
                                            <button class="quick-btn" data-days="1">Tomorrow</button>
                                            <button class="quick-btn" data-days="7">Week</button>
                                            <button class="quick-btn" data-clear="true">Clear</button>
                                        </div>
                                    </div>
                                </div>
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

        // Initialize edit date picker if editing
        if (this.editingId && this.editingType === 'reminder') {
            const editInput = this.remindersContainer.querySelector('.edit-input');
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
            
            const reminder = this.reminders.find(r => r.id === this.editingId);
            if (reminder) {
                this.initEditDatePicker(`editReminderDatePicker-${reminder.id}`, reminder.date);
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
    window.app = new TodoApp();
});

// Add some visual enhancements
document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.cursor');
    if (!cursor && window.innerWidth > 768) {
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
    if (cursorElement) {
        cursorElement.style.left = e.clientX - 10 + 'px';
        cursorElement.style.top = e.clientY - 10 + 'px';
    }
});

// ===== Scroll Spy =====
const progressBar = document.querySelector('.spy-progress');

if (progressBar) {
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.height = scrollPercent + "%";
    });
}
