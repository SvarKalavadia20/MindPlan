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
        if (!this.container) {
            console.error(`Date picker container ${containerId} not found`);
            return;
        }
        
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
        if (this.dateText) {
            this.dateText.textContent = this.options.placeholder;
        }
    }
    
    bindEvents() {
        if (!this.trigger) return;
        
        // Toggle calendar with proper event handling for mobile
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });
        
        // Add touch events for mobile
        this.trigger.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });
        
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.previousMonth();
            });
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextMonth();
            });
        }
        
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
        
        // Close on outside click - improved for mobile
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.close();
            }
        });
        
        document.addEventListener('touchstart', (e) => {
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
        document.querySelectorAll('.calendar-dropdown.show, .edit-calendar-dropdown.show').forEach(cal => {
            if (cal !== this.calendar) {
                cal.classList.remove('show');
                const container = cal.closest('.custom-date-picker, .edit-custom-date-picker');
                if (container) {
                    const arrow = container.querySelector('.dropdown-arrow, .edit-dropdown-arrow');
                    if (arrow) arrow.classList.remove('open');
                }
            }
        });
        
        this.isOpen = true;
        if (this.calendar) {
            this.calendar.classList.add('show');
        }
        if (this.dropdownArrow) {
            this.dropdownArrow.classList.add('open');
        }
        this.render();
        
        // Prevent body scroll on mobile when calendar is open
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }
    }
    
    close() {
        this.isOpen = false;
        if (this.calendar) {
            this.calendar.classList.remove('show');
        }
        if (this.dropdownArrow) {
            this.dropdownArrow.classList.remove('open');
        }
        
        // Restore body scroll
        if (window.innerWidth <= 768) {
            document.body.style.overflow = '';
        }
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
        
        // Dispatch custom event with proper detail
        const event = new CustomEvent('dateselect', {
            detail: { date: new Date(date) },
            bubbles: true
        });
        this.container.dispatchEvent(event);
    }
    
    clearDate() {
        this.selectedDate = null;
        this.updateDisplay();
        this.close();
        
        // Dispatch custom event
        const event = new CustomEvent('dateclear', {
            bubbles: true
        });
        this.container.dispatchEvent(event);
    }
    
    updateDisplay() {
        if (!this.dateText) return;
        
        if (this.selectedDate) {
            this.dateText.textContent = this.formatDate(this.selectedDate);
            this.dateText.classList.remove('placeholder');
            if (this.trigger) this.trigger.classList.add('has-date');
        } else {
            this.dateText.textContent = this.options.placeholder;
            this.dateText.classList.add('placeholder');
            if (this.trigger) this.trigger.classList.remove('has-date');
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
        if (!this.monthYear || !this.daysGrid) return;
        
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
                // Add both click and touch events for better mobile support
                const selectHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectDate(currentDate);
                };
                
                dayElement.addEventListener('click', selectHandler);
                dayElement.addEventListener('touchstart', selectHandler);
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
    
    destroy() {
        // Cleanup method for edit date pickers
        if (this.calendar) {
            this.calendar.classList.remove('show');
        }
        // Remove event listeners would go here in a production app
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
        
        // Track edit date pickers to clean them up
        this.editDatePickers = new Map();

        this.initializeElements();
        this.bindEvents();
        this.render();
        this.initCustomDatePickers();
        this.setupAuth();
    }

    setupAuth() {
        const loginBtn = document.getElementById("loginBtn");
        const logoutBtn = document.getElementById("logoutBtn");

        if (loginBtn) {
            loginBtn.onclick = async () => {
                try {
                    const provider = new GoogleAuthProvider();
                    await signInWithPopup(auth, provider);
                } catch (error) {
                    console.error('Login error:', error);
                }
            };
        }

        if (logoutBtn) {
            logoutBtn.onclick = () => {
                try {
                    signOut(auth);
                } catch (error) {
                    console.error('Logout error:', error);
                }
            };
        }

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.user = user;
                if (loginBtn) loginBtn.style.display = "none";
                if (logoutBtn) logoutBtn.style.display = "inline-block";
                await this.loadUserData(user.uid);
            } else {
                this.user = null;
                if (loginBtn) loginBtn.style.display = "inline-block";
                if (logoutBtn) logoutBtn.style.display = "none";
                this.todos = [];
                this.reminders = [];
                this.render();
            }
        });
    }

    /* ----- Firestore save/load ----- */
    async saveData() {
        if (!this.user) return;
        try {
            const userRef = doc(db, "users", this.user.uid);
            await setDoc(userRef, {
                todos: this.todos,
                reminders: this.reminders
            }, { merge: true });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    async loadUserData(uid) {
        try {
            const docRef = doc(db, "users", uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                this.todos = data.todos || [];
                this.reminders = data.reminders || [];
                this.render();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
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
        // Initialize custom date pickers with error handling
        try {
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
        } catch (error) {
            console.error('Error initializing date pickers:', error);
        }
        
        // Event listeners for date selection
        const taskDateContainer = document.getElementById('taskDatePicker');
        if (taskDateContainer) {
            taskDateContainer.addEventListener('dateselect', (e) => {
                this.selectedTaskDate = e.detail.date.toISOString().split('T')[0];
            });
            
            taskDateContainer.addEventListener('dateclear', () => {
                this.selectedTaskDate = null;
            });
        }
        
        const reminderDateContainer = document.getElementById('reminderDatePicker');
        if (reminderDateContainer) {
            reminderDateContainer.addEventListener('dateselect', (e) => {
                this.selectedReminderDate = e.detail.date.toISOString().split('T')[0];
            });
            
            reminderDateContainer.addEventListener('dateclear', () => {
                this.selectedReminderDate = null;
            });
        }
    }

    initEditDatePicker(containerId, currentDate = null) {
        // Clean up existing picker first
        if (this.editDatePickers.has(containerId)) {
            const existingPicker = this.editDatePickers.get(containerId);
            existingPicker.destroy();
            this.editDatePickers.delete(containerId);
        }
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`Edit date picker container ${containerId} not found`);
                return;
            }

            try {
                const editPicker = new CustomDatePicker(containerId, {
                    allowPast: false,
                    placeholder: 'No deadline',
                    required: false
                });

                // Store reference for cleanup
                this.editDatePickers.set(containerId, editPicker);

                if (currentDate) {
                    editPicker.setValue(currentDate);
                }

                // Store reference for saving
                container.addEventListener('dateselect', (e) => {
                    const todoItem = container.closest('.todo-item');
                    if (!todoItem) return;
                    
                    const id = parseInt(todoItem.dataset.id);
                    if (this.editingType === 'task') {
                        const todo = this.todos.find(t => t.id === id);
                        if (todo) {
                            todo.deadline = e.detail.date.toISOString().split('T')[0];
                            // Immediately update display without waiting for save
                            this.updateStats();
                        }
                    } else if (this.editingType === 'reminder') {
                        const reminder = this.reminders.find(r => r.id === id);
                        if (reminder) {
                            reminder.date = e.detail.date.toISOString().split('T')[0];
                        }
                    }
                });

                container.addEventListener('dateclear', () => {
                    const todoItem = container.closest('.todo-item');
                    if (!todoItem) return;
                    
                    const id = parseInt(todoItem.dataset.id);
                    if (this.editingType === 'task') {
                        const todo = this.todos.find(t => t.id === id);
                        if (todo) {
                            todo.deadline = null;
                            // Immediately update display
                            this.updateStats();
                        }
                    }
                });
            } catch (error) {
                console.error('Error creating edit date picker:', error);
            }
        }, 50); // Reduced timeout for faster response
    }

    formatDateForDisplay(dateString) {
        try {
            const date = new Date(dateString + 'T00:00:00');
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return dateString;
        }
    }

    bindEvents() {
        // Add null checks for all event bindings
        if (this.addTaskBtn) {
            this.addTaskBtn.addEventListener('click', () => this.addTodo());
        }
        
        if (this.addReminderBtn) {
            this.addReminderBtn.addEventListener('click', () => this.addReminder());
        }
        
        if (this.taskInput) {
            this.taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTodo();
            });
        }
        
        if (this.reminderInput) {
            this.reminderInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addReminder();
            });
        }
        
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

        if (this.tasksContainer) {
            this.tasksContainer.addEventListener('click', (e) => this.handleTaskAction(e));
            
            this.tasksContainer.addEventListener('change', (e) => {
                if (e.target.type === 'checkbox') {
                    const todoItem = e.target.closest('.todo-item');
                    if (todoItem) {
                        const id = parseInt(todoItem.dataset.id);
                        this.toggleTodo(id);
                    }
                }
            });

            this.tasksContainer.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.matches('.edit-input')) {
                    const todoItem = e.target.closest('.todo-item');
                    if (todoItem) {
                        const id = parseInt(todoItem.dataset.id);
                        this.saveTodo(id);
                    }
                }
            });
        }
        
        if (this.remindersContainer) {
            this.remindersContainer.addEventListener('click', (e) => this.handleReminderAction(e));
            
            this.remindersContainer.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.matches('.edit-input')) {
                    const reminderItem = e.target.closest('.todo-item');
                    if (reminderItem) {
                        const id = parseInt(reminderItem.dataset.id);
                        this.saveReminder(id);
                    }
                }
            });
        }
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
        try {
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
        } catch (error) {
            console.error('Error formatting datetime:', error);
            return { text: dateString, status: 'normal' };
        }
    }

    addTodo() {
        if (!this.taskInput) return;
        
        const text = this.taskInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now() + Math.random(), // Better unique ID
            text: text,
            completed: false,
            deadline: this.selectedTaskDate || null,
            createdAt: new Date().toISOString(),
            type: 'task'
        };

        this.todos.push(todo);
        this.taskInput.value = '';
        
        // Clear date picker safely
        if (this.taskDatePicker) {
            this.taskDatePicker.clearDate();
        }
        this.selectedTaskDate = null;
        
        // Immediate UI update
        this.render();
        
        // Save to Firebase
        this.saveData().catch(error => {
            console.error('Error saving todo:', error);
        });
    }

    addReminder() {
        if (!this.reminderInput) return;
        
        const text = this.reminderInput.value.trim();
        const date = this.selectedReminderDate;
        
        if (!text || !date) return;

        const reminder = {
            id: Date.now() + Math.random(), // Better unique ID
            text: text,
            date: date,
            createdAt: new Date().toISOString(),
            type: 'reminder'
        };

        this.reminders.push(reminder);
        this.reminderInput.value = '';
        
        // Clear date picker safely
        if (this.reminderDatePicker) {
            this.reminderDatePicker.clearDate();
        }
        this.selectedReminderDate = null;
        
        // Immediate UI update
        this.render();
        
        // Save to Firebase
        this.saveData().catch(error => {
            console.error('Error saving reminder:', error);
        });
    }

    handleTaskAction(e) {
        const todoItem = e.target.closest('.todo-item');
        if (!todoItem) return;
        
        const id = parseInt(todoItem.dataset.id);
        
        if (e.target.matches('.delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.deleteTodo(id);
        } else if (e.target.matches('.edit-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.editTodo(id, 'task');
        } else if (e.target.matches('.save-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.saveTodo(id);
        } else if (e.target.matches('.cancel-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.cancelEdit();
        }
    }

    handleReminderAction(e) {
        const reminderItem = e.target.closest('.todo-item');
        if (!reminderItem) return;
        
        const id = parseInt(reminderItem.dataset.id);
        
        if (e.target.matches('.delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.deleteReminder(id);
        } else if (e.target.matches('.edit-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.editReminder(id);
        } else if (e.target.matches('.save-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.saveReminder(id);
        } else if (e.target.matches('.cancel-btn')) {
            e.preventDefault();
            e.stopPropagation();
            this.cancelEdit();
        }
    }

    deleteTodo(id) {
        const todoElement = this.tasksContainer ? this.tasksContainer.querySelector(`[data-id="${id}"]`) : null;
        if (todoElement) {
            todoElement.style.transform = 'translateX(-100%)';
            todoElement.style.opacity = '0';
            
            setTimeout(() => {
                this.todos = this.todos.filter(todo => todo.id !== id);
                this.render();
                this.saveData().catch(error => {
                    console.error('Error deleting todo:', error);
                });
            }, 300);
        } else {
            // Fallback if element not found
            this.todos = this.todos.filter(todo => todo.id !== id);
            this.render();
            this.saveData().catch(error => {
                console.error('Error deleting todo:', error);
            });
        }
    }

    deleteReminder(id) {
        const reminderElement = this.remindersContainer ? this.remindersContainer.querySelector(`[data-id="${id}"]`) : null;
        if (reminderElement) {
            reminderElement.style.transform = 'translateX(-100%)';
            reminderElement.style.opacity = '0';
            
            setTimeout(() => {
                this.reminders = this.reminders.filter(reminder => reminder.id !== id);
                this.render();
                this.saveData().catch(error => {
                    console.error('Error deleting reminder:', error);
                });
            }, 300);
        } else {
            // Fallback if element not found
            this.reminders = this.reminders.filter(reminder => reminder.id !== id);
            this.render();
            this.saveData().catch(error => {
                console.error('Error deleting reminder:', error);
            });
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
        if (!this.tasksContainer) return;
        
        const todoItem = this.tasksContainer.querySelector(`[data-id="${id}"]`);
        if (!todoItem) return;
        
        const editInput = todoItem.querySelector('.edit-input');
        if (!editInput) return;
        
        const newText = editInput.value.trim();
        if (!newText) return;

        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            // deadline is already updated by the edit date picker event
            this.editingId = null;
            this.editingType = null;
            
            // Cleanup edit date picker
            const editPickerId = `editTaskDatePicker-${id}`;
            if (this.editDatePickers.has(editPickerId)) {
                this.editDatePickers.get(editPickerId).destroy();
                this.editDatePickers.delete(editPickerId);
            }
            
            this.render();
            this.saveData().catch(error => {
                console.error('Error saving todo:', error);
            });
        }
    }

    saveReminder(id) {
        if (!this.remindersContainer) return;
        
        const reminderItem = this.remindersContainer.querySelector(`[data-id="${id}"]`);
        if (!reminderItem) return;
        
        const editInput = reminderItem.querySelector('.edit-input');
        if (!editInput) return;
        
        const newText = editInput.value.trim();
        if (!newText) return;

        const reminder = this.reminders.find(r => r.id === id);
        if (reminder) {
            reminder.text = newText;
            // date is already updated by the edit date picker event
            this.editingId = null;
            this.editingType = null;
            
            // Cleanup edit date picker
            const editPickerId = `editReminderDatePicker-${id}`;
            if (this.editDatePickers.has(editPickerId)) {
                this.editDatePickers.get(editPickerId).destroy();
                this.editDatePickers.delete(editPickerId);
            }
            
            this.render();
            this.saveData().catch(error => {
                console.error('Error saving reminder:', error);
            });
        }
    }

    cancelEdit() {
        // Cleanup any edit date pickers
        this.editDatePickers.forEach((picker, id) => {
            picker.destroy();
        });
        this.editDatePickers.clear();
        
        this.editingId = null;
        this.editingType = null;
        this.render();
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            // Immediate UI update
            this.updateStats();
            this.render();
            // Save to Firebase
            this.saveData().catch(error => {
                console.error('Error toggling todo:', error);
            });
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

        if (this.stats.total) this.stats.total.textContent = total;
        if (this.stats.completed) this.stats.completed.textContent = completed;
        if (this.stats.pending) this.stats.pending.textContent = pending;
        if (this.stats.rate) this.stats.rate.textContent = `${rate}%`;

        // Add animation to stat numbers
        [this.stats.total, this.stats.completed, this.stats.pending, this.stats.rate].forEach(stat => {
            if (stat) {
                stat.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    stat.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }

    renderTasks() {
        if (!this.tasksContainer) return;
        
        const filteredTodos = this.getFilteredTodos();
        
        if (filteredTodos.length === 0) {
            if (this.tasksEmptyState) {
                this.tasksEmptyState.style.display = 'block';
                this.tasksContainer.innerHTML = '';
                this.tasksContainer.appendChild(this.tasksEmptyState);
            }
            return;
        }

        if (this.tasksEmptyState) {
            this.tasksEmptyState.style.display = 'none';
        }
        
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
                            <input type="text" class="edit-input" value="${todo.text.replace(/"/g, '&quot;')}" maxlength="200">
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
        if (!this.remindersContainer) return;
        
        const sortedReminders = this.getSortedReminders();
        
        if (sortedReminders.length === 0) {
            if (this.remindersEmptyState) {
                this.remindersEmptyState.style.display = 'block';
                this.remindersContainer.innerHTML = '';
                this.remindersContainer.appendChild(this.remindersEmptyState);
            }
            return;
        }

        if (this.remindersEmptyState) {
            this.remindersEmptyState.style.display = 'none';
        }
        
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
                            <input type="text" class="edit-input" value="${reminder.text.replace(/"/g, '&quot;')}" maxlength="200">
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
        try {
            this.updateStats();
            this.renderTasks();
            this.renderReminders();
        } catch (error) {
            console.error('Error rendering:', error);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.app = new TodoApp();
    } catch (error) {
        console.error('Error initializing TodoApp:', error);
    }
});

// Add some visual enhancements with better mobile support
let cursorElement = null;
let lastMouseMove = 0;

document.addEventListener('mousemove', (e) => {
    // Only create cursor on desktop
    if (window.innerWidth <= 768) return;
    
    const now = Date.now();
    if (now - lastMouseMove < 16) return; // Throttle to 60fps
    lastMouseMove = now;
    
    if (!cursorElement) {
        cursorElement = document.createElement('div');
        cursorElement.className = 'cursor';
        cursorElement.style.cssText = `
            position: fixed;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.1s ease;
        `;
        document.body.appendChild(cursorElement);
    }
    
    cursorElement.style.left = e.clientX - 10 + 'px';
    cursorElement.style.top = e.clientY - 10 + 'px';
});

// Clean up cursor on mobile
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && cursorElement) {
        cursorElement.remove();
        cursorElement = null;
    }
});

// ===== Scroll Spy =====
const progressBar = document.querySelector('.spy-progress');

if (progressBar) {
    let ticking = false;
    
    const updateScrollProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
        progressBar.style.height = scrollPercent + "%";
        ticking = false;
    };
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateScrollProgress);
            ticking = true;
        }
    });
}
