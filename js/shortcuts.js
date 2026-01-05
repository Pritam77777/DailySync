// Keyboard Shortcuts System
const Shortcuts = {
    isEnabled: true,
    shortcuts: [],

    // Define all available shortcuts
    definitions: [
        // Global shortcuts
        { key: 'k', ctrl: true, meta: true, action: 'openCommandBar', description: 'Open Command Bar', category: 'Navigation' },
        { key: '/', ctrl: false, action: 'openCommandBar', description: 'Open Command Bar', category: 'Navigation' },
        { key: '?', ctrl: false, action: 'showShortcuts', description: 'Show Keyboard Shortcuts', category: 'Help' },
        { key: 'Escape', ctrl: false, action: 'closeModal', description: 'Close Modal/Command Bar', category: 'Navigation' },

        // Navigation shortcuts
        { key: '1', ctrl: true, action: 'goToDashboard', description: 'Go to Dashboard', category: 'Navigation' },
        { key: '2', ctrl: true, action: 'goToTasks', description: 'Go to Tasks', category: 'Navigation' },
        { key: '3', ctrl: true, action: 'goToCalendar', description: 'Go to Calendar', category: 'Navigation' },
        { key: '4', ctrl: true, action: 'goToNotes', description: 'Go to Notes', category: 'Navigation' },
        { key: '5', ctrl: true, action: 'goToHabits', description: 'Go to Habits', category: 'Navigation' },
        { key: '6', ctrl: true, action: 'goToTimer', description: 'Go to Focus Timer', category: 'Navigation' },
        { key: '7', ctrl: true, action: 'goToGoals', description: 'Go to Goals', category: 'Navigation' },
        { key: '8', ctrl: true, action: 'goToRoutines', description: 'Go to Routines', category: 'Navigation' },
        { key: '9', ctrl: true, action: 'goToReports', description: 'Go to Reports', category: 'Navigation' },

        // Action shortcuts
        { key: 'n', ctrl: true, action: 'newItem', description: 'New Item (Task/Note/Event)', category: 'Actions' },
        { key: 't', ctrl: true, shift: true, action: 'newTask', description: 'New Task', category: 'Actions' },
        { key: 'e', ctrl: true, shift: true, action: 'newEvent', description: 'New Event', category: 'Actions' },

        // Timer shortcuts
        { key: ' ', ctrl: false, action: 'toggleTimer', description: 'Start/Pause Timer', category: 'Focus Timer' },
        { key: 'r', ctrl: true, shift: true, action: 'resetTimer', description: 'Reset Timer', category: 'Focus Timer' },

        // Theme
        { key: 'd', ctrl: true, shift: true, action: 'toggleTheme', description: 'Toggle Dark/Light Mode', category: 'Appearance' },
    ],

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if (!this.isEnabled) return;

            // Don't trigger shortcuts when typing in input fields
            const activeElement = document.activeElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'INPUT' ||
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true'
            );

            // Allow Escape and Cmd+K even in inputs
            const alwaysAllowed = ['Escape', 'k'];
            if (isInputFocused && !alwaysAllowed.includes(e.key)) {
                return;
            }

            // Find matching shortcut
            const shortcut = this.definitions.find(s => {
                const keyMatch = s.key.toLowerCase() === e.key.toLowerCase();
                const ctrlMatch = s.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
                const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
                return keyMatch && ctrlMatch && shiftMatch;
            });

            if (shortcut) {
                e.preventDefault();
                this.executeAction(shortcut.action);
            }
        });
    },

    executeAction(action) {
        switch (action) {
            // Navigation
            case 'openCommandBar':
                CommandBar.open();
                break;
            case 'showShortcuts':
                this.showShortcutsModal();
                break;
            case 'closeModal':
                this.closeActiveModal();
                break;
            case 'goToDashboard':
                App.showModule('dashboard');
                break;
            case 'goToTasks':
                App.showModule('todos');
                break;
            case 'goToCalendar':
                App.showModule('calendar');
                break;
            case 'goToNotes':
                App.showModule('notes');
                break;
            case 'goToHabits':
                App.showModule('habits');
                break;
            case 'goToTimer':
                App.showModule('timer');
                break;
            case 'goToGoals':
                App.showModule('goals');
                break;
            case 'goToRoutines':
                App.showModule('routines');
                break;
            case 'goToReports':
                App.showModule('reports');
                break;

            // Actions
            case 'newItem':
                this.openNewItemForCurrentModule();
                break;
            case 'newTask':
                Modal.open('addTaskModal');
                break;
            case 'newEvent':
                Modal.open('addEventModal');
                break;

            // Timer
            case 'toggleTimer':
                if (App.currentModule === 'timer') {
                    Timer.toggle();
                }
                break;
            case 'resetTimer':
                if (App.currentModule === 'timer') {
                    Timer.reset();
                }
                break;

            // Theme
            case 'toggleTheme':
                ThemeManager.toggle();
                break;
        }

        // Show visual feedback
        this.showFeedback(action);
    },

    openNewItemForCurrentModule() {
        switch (App.currentModule) {
            case 'todos':
            case 'dashboard':
                Modal.open('addTaskModal');
                break;
            case 'calendar':
                Modal.open('addEventModal');
                break;
            case 'notes':
                Notes.openEditor();
                break;
            case 'habits':
                Modal.open('addHabitModal');
                break;
            case 'goals':
                Modal.open('addGoalModal');
                break;
            case 'routines':
                Modal.open('addRoutineModal');
                break;
            default:
                Modal.open('addTaskModal');
        }
    },

    closeActiveModal() {
        // Try to close command bar first
        if (typeof CommandBar !== 'undefined' && CommandBar.isOpen) {
            CommandBar.close();
            return;
        }

        // Close any open modal
        const openModal = document.querySelector('.modal-overlay:not(.hidden)');
        if (openModal) {
            Modal.close(openModal.id);
        }
    },

    showShortcutsModal() {
        const groupedShortcuts = this.definitions.reduce((acc, shortcut) => {
            if (!acc[shortcut.category]) {
                acc[shortcut.category] = [];
            }
            acc[shortcut.category].push(shortcut);
            return acc;
        }, {});

        let html = '<div class="shortcuts-modal-content">';

        for (const [category, shortcuts] of Object.entries(groupedShortcuts)) {
            html += `
                <div class="shortcuts-category">
                    <h4 class="shortcuts-category-title">${category}</h4>
                    <div class="shortcuts-list">
                        ${shortcuts.map(s => `
                            <div class="shortcut-item">
                                <span class="shortcut-description">${s.description}</span>
                                <span class="shortcut-keys">
                                    ${s.ctrl ? '<kbd>Ctrl</kbd> + ' : ''}
                                    ${s.shift ? '<kbd>Shift</kbd> + ' : ''}
                                    <kbd>${this.formatKey(s.key)}</kbd>
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';

        // Use dynamic modal
        const modal = document.getElementById('dynamicModal');
        if (modal) {
            modal.querySelector('.modal-title').textContent = 'Keyboard Shortcuts';
            modal.querySelector('.modal-body').innerHTML = html;
            Modal.open('dynamicModal');
        }
    },

    formatKey(key) {
        const keyMap = {
            ' ': 'Space',
            'Escape': 'Esc',
            '/': '/',
            '?': '?'
        };
        return keyMap[key] || key.toUpperCase();
    },

    showFeedback(action) {
        // Create a visual feedback toast
        const feedbackMap = {
            'goToDashboard': '📊 Dashboard',
            'goToTasks': '✓ Tasks',
            'goToCalendar': '📅 Calendar',
            'goToNotes': '📝 Notes',
            'goToHabits': '🎯 Habits',
            'goToTimer': '⏱️ Timer',
            'goToGoals': '🏆 Goals',
            'goToRoutines': '☀️ Routines',
            'goToReports': '📊 Reports',
            'toggleTheme': '🌓 Theme',
        };

        if (feedbackMap[action]) {
            this.showQuickFeedback(feedbackMap[action]);
        }
    },

    showQuickFeedback(text) {
        // Create floating feedback element
        const feedback = document.createElement('div');
        feedback.className = 'shortcut-feedback';
        feedback.innerHTML = text;
        document.body.appendChild(feedback);

        // Trigger animation
        requestAnimationFrame(() => {
            feedback.classList.add('show');
        });

        // Remove after animation
        setTimeout(() => {
            feedback.classList.remove('show');
            setTimeout(() => feedback.remove(), 200);
        }, 800);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Shortcuts.init();
});

// Export
window.Shortcuts = Shortcuts;
