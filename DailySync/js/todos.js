// To-Do List Module
const Todos = {
    todos: [],
    filter: 'all',
    unsubscribe: null,

    init() {
        this.bindEvents();
        this.setupRealtimeListener();
    },

    setupRealtimeListener() {
        if (this.unsubscribe) this.unsubscribe();

        this.unsubscribe = Database.onValue('todos', (data) => {
            this.todos = Database.toArray(data).sort((a, b) => (a.order || 0) - (b.order || 0));
            this.render();
            // Update dashboard when todos change
            if (App.currentModule === 'dashboard') {
                App.renderDashboardTasks();
                App.renderDashboardSummary();
            }
        });
    },

    bindEvents() {
        // Add task form
        const addTaskForm = document.getElementById('addTaskForm');
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        }

        // Filter buttons
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filter = e.target.dataset.filter;
                document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.render();
            });
        });

        // Quick add input
        const quickAddInput = document.getElementById('quickAddTask');
        if (quickAddInput) {
            quickAddInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.addTask({ title: e.target.value.trim() });
                    e.target.value = '';
                }
            });
        }
    },

    async handleAddTask(e) {
        e.preventDefault();
        const form = e.target;
        const title = form.querySelector('[name="title"]').value.trim();
        const priority = form.querySelector('[name="priority"]').value;
        const dueDate = form.querySelector('[name="dueDate"]').value;
        const category = form.querySelector('[name="category"]').value;

        if (!title) {
            Toast.show('Please enter a task title', 'error');
            return;
        }

        await this.addTask({ title, priority, dueDate, category });
        form.reset();
        Modal.close('addTaskModal');
        Toast.show('Task added!', 'success');
    },

    async addTask(data) {
        const task = {
            title: data.title,
            completed: false,
            priority: data.priority || 'medium',
            dueDate: data.dueDate || null,
            category: data.category || 'default',
            order: this.todos.length
        };

        await Database.create('todos', task);
    },

    async toggleComplete(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            await Database.update(`todos/${id}`, { completed: !todo.completed });
        }
    },

    async deleteTodo(id) {
        await Database.delete(`todos/${id}`);
        Toast.show('Task deleted', 'success');
    },

    async updateOrder(orderedIds) {
        const updates = {};
        orderedIds.forEach((id, index) => {
            updates[`todos/${id}/order`] = index;
        });

        const user = auth.currentUser;
        if (user) {
            await database.ref(`users/${user.uid}`).update(updates);
        }
    },

    getFilteredTodos() {
        switch (this.filter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    },

    getPriorityClass(priority) {
        return {
            high: 'badge-red',
            medium: 'badge-orange',
            low: 'badge-green'
        }[priority] || 'badge-orange';
    },

    render() {
        const container = document.getElementById('todosList');
        if (!container) return;

        const filtered = this.getFilteredTodos();

        if (filtered.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <h3>No tasks yet</h3>
          <p>Add your first task to get started!</p>
        </div>
      `;
            return;
        }

        container.innerHTML = filtered.map(todo => `
      <div class="todo-item stagger-item ${todo.completed ? 'completed' : ''}" 
           data-id="${todo.id}" draggable="true">
        <label class="checkbox">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                 onchange="Todos.toggleComplete('${todo.id}')">
          <span class="checkbox-mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </span>
        </label>
        <div class="todo-content">
          <span class="todo-title ${todo.completed ? 'line-through' : ''}">${todo.title}</span>
          <div class="todo-meta">
            <span class="badge ${this.getPriorityClass(todo.priority)}">${todo.priority}</span>
            ${todo.dueDate ? `<span class="todo-due">${this.formatDate(todo.dueDate)}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-ghost btn-icon" onclick="Todos.deleteTodo('${todo.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `).join('');

        this.setupDragAndDrop();
    },

    setupDragAndDrop() {
        const items = document.querySelectorAll('.todo-item');
        let draggedItem = null;

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                draggedItem = null;

                const newOrder = Array.from(document.querySelectorAll('.todo-item'))
                    .map(el => el.dataset.id);
                this.updateOrder(newOrder);
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(item.parentElement, e.clientY);
                if (draggedItem && afterElement !== draggedItem) {
                    item.parentElement.insertBefore(draggedItem, afterElement);
                }
            });
        });
    },

    getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.todo-item:not(.dragging)')];

        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    getStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;
        return { total, completed, pending };
    }
};

// Export
window.Todos = Todos;
