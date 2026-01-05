// Command Bar - Spotlight-like quick actions
const CommandBar = {
    isOpen: false,
    selectedIndex: 0,
    results: [],
    recentItems: [],

    // Quick actions available in command bar
    quickActions: [
        { id: 'new-task', icon: '✓', title: 'New Task', subtitle: 'Create a new task', action: () => Modal.open('addTaskModal'), category: 'Actions' },
        { id: 'new-event', icon: '📅', title: 'New Event', subtitle: 'Add calendar event', action: () => Modal.open('addEventModal'), category: 'Actions' },
        { id: 'new-note', icon: '📝', title: 'New Note', subtitle: 'Create a note', action: () => Notes.openEditor(), category: 'Actions' },
        { id: 'new-habit', icon: '🎯', title: 'New Habit', subtitle: 'Track a new habit', action: () => Modal.open('addHabitModal'), category: 'Actions' },
        { id: 'new-goal', icon: '🏆', title: 'New Goal', subtitle: 'Set a new goal', action: () => Modal.open('addGoalModal'), category: 'Actions' },
        { id: 'start-timer', icon: '⏱️', title: 'Start Focus Timer', subtitle: 'Begin a focus session', action: () => { App.showModule('timer'); Timer.start(); }, category: 'Actions' },

        { id: 'go-dashboard', icon: '📊', title: 'Dashboard', subtitle: 'Go to Dashboard', action: () => App.showModule('dashboard'), category: 'Navigation' },
        { id: 'go-tasks', icon: '✓', title: 'Tasks', subtitle: 'Go to To-Do List', action: () => App.showModule('todos'), category: 'Navigation' },
        { id: 'go-calendar', icon: '📅', title: 'Calendar', subtitle: 'Go to Calendar', action: () => App.showModule('calendar'), category: 'Navigation' },
        { id: 'go-notes', icon: '📝', title: 'Notes', subtitle: 'Go to Notes', action: () => App.showModule('notes'), category: 'Navigation' },
        { id: 'go-habits', icon: '🎯', title: 'Habits', subtitle: 'Go to Habit Tracker', action: () => App.showModule('habits'), category: 'Navigation' },
        { id: 'go-timer', icon: '⏱️', title: 'Focus Timer', subtitle: 'Go to Focus Timer', action: () => App.showModule('timer'), category: 'Navigation' },
        { id: 'go-goals', icon: '🏆', title: 'Goals', subtitle: 'Go to Goals', action: () => App.showModule('goals'), category: 'Navigation' },
        { id: 'go-routines', icon: '☀️', title: 'Routines', subtitle: 'Go to Routines', action: () => App.showModule('routines'), category: 'Navigation' },
        { id: 'go-settings', icon: '⚙️', title: 'Settings', subtitle: 'Go to Settings', action: () => App.showModule('settings'), category: 'Navigation' },

        { id: 'toggle-theme', icon: '🌓', title: 'Toggle Theme', subtitle: 'Switch dark/light mode', action: () => ThemeManager.toggle(), category: 'Appearance' },
        { id: 'shortcuts', icon: '⌨️', title: 'Keyboard Shortcuts', subtitle: 'Show all shortcuts', action: () => Shortcuts.showShortcutsModal(), category: 'Help' },
    ],

    init() {
        this.createModal();
        this.bindEvents();
        this.loadRecentItems();
    },

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'commandBarModal';
        modal.className = 'command-bar-overlay hidden';
        modal.innerHTML = `
            <div class="command-bar">
                <div class="command-bar-header">
                    <svg class="command-bar-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.3-4.3"/>
                    </svg>
                    <input type="text" id="commandBarInput" class="command-bar-input" placeholder="Type a command or search..." autocomplete="off" />
                    <kbd class="command-bar-hint">ESC</kbd>
                </div>
                <div class="command-bar-results" id="commandBarResults">
                    <!-- Results populated dynamically -->
                </div>
                <div class="command-bar-footer">
                    <div class="command-bar-tips">
                        <span><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
                        <span><kbd>Enter</kbd> to select</span>
                        <span><kbd>ESC</kbd> to close</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    bindEvents() {
        const overlay = document.getElementById('commandBarModal');
        const input = document.getElementById('commandBarInput');
        const results = document.getElementById('commandBarResults');

        // Close on overlay click
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });

        // Input handling
        input?.addEventListener('input', (e) => {
            this.search(e.target.value);
        });

        // Keyboard navigation
        input?.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.selectNext();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.selectPrevious();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.executeSelected();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.close();
                    break;
            }
        });

        // Result click handling
        results?.addEventListener('click', (e) => {
            const item = e.target.closest('.command-bar-item');
            if (item) {
                const index = parseInt(item.dataset.index);
                this.selectedIndex = index;
                this.executeSelected();
            }
        });
    },

    open() {
        const modal = document.getElementById('commandBarModal');
        const input = document.getElementById('commandBarInput');

        if (modal) {
            modal.classList.remove('hidden');
            this.isOpen = true;
            this.selectedIndex = 0;

            // Reset and focus input
            if (input) {
                input.value = '';
                input.focus();
            }

            // Show default results
            this.showDefaultResults();

            // Add body class to prevent scrolling
            document.body.style.overflow = 'hidden';
        }
    },

    close() {
        const modal = document.getElementById('commandBarModal');
        if (modal) {
            modal.classList.add('hidden');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    },

    showDefaultResults() {
        // Show recent items first, then quick actions
        let html = '';

        // Recent section
        if (this.recentItems.length > 0) {
            html += `<div class="command-bar-section"><span class="command-bar-section-title">Recent</span></div>`;
            this.recentItems.slice(0, 3).forEach((item, i) => {
                html += this.renderItem(item, i);
            });
        }

        // Actions section
        html += `<div class="command-bar-section"><span class="command-bar-section-title">Quick Actions</span></div>`;
        const actionItems = this.quickActions.filter(a => a.category === 'Actions');
        actionItems.forEach((item, i) => {
            html += this.renderItem(item, this.recentItems.length + i);
        });

        // Navigation section
        html += `<div class="command-bar-section"><span class="command-bar-section-title">Navigation</span></div>`;
        const navItems = this.quickActions.filter(a => a.category === 'Navigation');
        navItems.slice(0, 5).forEach((item, i) => {
            html += this.renderItem(item, this.recentItems.length + actionItems.length + i);
        });

        this.results = [...this.recentItems.slice(0, 3), ...actionItems, ...navItems.slice(0, 5)];
        this.updateResults(html);
    },

    search(query) {
        if (!query.trim()) {
            this.showDefaultResults();
            return;
        }

        const lowerQuery = query.toLowerCase();
        let results = [];

        // Search quick actions
        const matchingActions = this.quickActions.filter(action =>
            action.title.toLowerCase().includes(lowerQuery) ||
            action.subtitle.toLowerCase().includes(lowerQuery)
        );
        results.push(...matchingActions);

        // Search tasks
        if (typeof Todos !== 'undefined' && Todos.todos) {
            const matchingTasks = Todos.todos.filter(task =>
                task.title?.toLowerCase().includes(lowerQuery)
            ).slice(0, 5).map(task => ({
                id: `task-${task.id}`,
                icon: task.completed ? '✓' : '○',
                title: task.title,
                subtitle: `Task • ${task.completed ? 'Completed' : 'Active'}`,
                action: () => { App.showModule('todos'); },
                category: 'Tasks'
            }));
            results.push(...matchingTasks);
        }

        // Search notes
        if (typeof Notes !== 'undefined' && Notes.notes) {
            const matchingNotes = Notes.notes.filter(note =>
                note.title?.toLowerCase().includes(lowerQuery) ||
                note.content?.toLowerCase().includes(lowerQuery)
            ).slice(0, 5).map(note => ({
                id: `note-${note.id}`,
                icon: '📝',
                title: note.title || 'Untitled Note',
                subtitle: `Note • ${note.folder || 'General'}`,
                action: () => { App.showModule('notes'); Notes.openEditor(note); },
                category: 'Notes'
            }));
            results.push(...matchingNotes);
        }

        // Search events
        if (typeof Calendar !== 'undefined' && Calendar.events) {
            const matchingEvents = Calendar.events.filter(event =>
                event.title?.toLowerCase().includes(lowerQuery)
            ).slice(0, 5).map(event => ({
                id: `event-${event.id}`,
                icon: '📅',
                title: event.title,
                subtitle: `Event • ${event.date}`,
                action: () => { App.showModule('calendar'); },
                category: 'Events'
            }));
            results.push(...matchingEvents);
        }

        this.results = results;
        this.selectedIndex = 0;

        let html = '';
        if (results.length === 0) {
            html = `
                <div class="command-bar-empty">
                    <span class="command-bar-empty-icon">🔍</span>
                    <span>No results found for "${query}"</span>
                </div>
            `;
        } else {
            results.forEach((item, i) => {
                html += this.renderItem(item, i);
            });
        }

        this.updateResults(html);
    },

    renderItem(item, index) {
        const isSelected = index === this.selectedIndex;
        return `
            <div class="command-bar-item ${isSelected ? 'selected' : ''}" data-index="${index}">
                <span class="command-bar-item-icon">${item.icon}</span>
                <div class="command-bar-item-content">
                    <span class="command-bar-item-title">${item.title}</span>
                    <span class="command-bar-item-subtitle">${item.subtitle}</span>
                </div>
            </div>
        `;
    },

    updateResults(html) {
        const resultsContainer = document.getElementById('commandBarResults');
        if (resultsContainer) {
            resultsContainer.innerHTML = html;
        }
    },

    selectNext() {
        if (this.results.length === 0) return;
        this.selectedIndex = (this.selectedIndex + 1) % this.results.length;
        this.updateSelection();
    },

    selectPrevious() {
        if (this.results.length === 0) return;
        this.selectedIndex = (this.selectedIndex - 1 + this.results.length) % this.results.length;
        this.updateSelection();
    },

    updateSelection() {
        const items = document.querySelectorAll('.command-bar-item');
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === this.selectedIndex);
        });

        // Scroll selected item into view
        const selectedItem = document.querySelector('.command-bar-item.selected');
        selectedItem?.scrollIntoView({ block: 'nearest' });
    },

    executeSelected() {
        const selectedItem = this.results[this.selectedIndex];
        if (selectedItem && selectedItem.action) {
            // Add to recent items
            this.addToRecent(selectedItem);

            // Execute action
            selectedItem.action();

            // Close command bar
            this.close();
        }
    },

    addToRecent(item) {
        // Don't add navigation items to recent
        if (item.category === 'Navigation') return;

        // Remove if already exists
        this.recentItems = this.recentItems.filter(r => r.id !== item.id);

        // Add to beginning
        this.recentItems.unshift(item);

        // Keep only last 10
        this.recentItems = this.recentItems.slice(0, 10);

        // Save to localStorage
        this.saveRecentItems();
    },

    loadRecentItems() {
        try {
            const saved = localStorage.getItem('dailysync_recent_commands');
            if (saved) {
                // We only save IDs, need to reconstruct the items
                const ids = JSON.parse(saved);
                this.recentItems = ids.map(id =>
                    this.quickActions.find(a => a.id === id)
                ).filter(Boolean);
            }
        } catch (e) {
            console.error('Error loading recent items:', e);
        }
    },

    saveRecentItems() {
        try {
            const ids = this.recentItems.map(item => item.id);
            localStorage.setItem('dailysync_recent_commands', JSON.stringify(ids));
        } catch (e) {
            console.error('Error saving recent items:', e);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    CommandBar.init();
});

// Export
window.CommandBar = CommandBar;
