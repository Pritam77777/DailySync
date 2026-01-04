// Main Application Controller
const App = {
    currentScreen: 'auth',
    currentModule: 'dashboard',
    user: null,
    profile: null,

    init() {
        // Initialize theme first
        ThemeManager.init();

        // Initialize offline database
        OfflineDB.init().catch(console.error);

        // Register service worker
        this.registerServiceWorker();

        // Initialize auth
        Auth.init();

        // Bind navigation events
        this.bindEvents();

        // Check for app install prompt
        this.setupInstallPrompt();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loadingScreen')?.classList.add('hidden');
        }, 1000);
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(() => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker registration failed:', err));
        }
    },

    showScreen(screen) {
        this.currentScreen = screen;

        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
            s.classList.add('hidden');
        });

        const targetScreen = document.getElementById(`${screen}Screen`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            targetScreen.classList.add('active');
        }

        // Initialize modules when showing dashboard
        if (screen === 'dashboard') {
            this.initializeModules();
            this.showModule('dashboard');
        }
    },

    showModule(module) {
        this.currentModule = module;

        document.querySelectorAll('.module-page').forEach(m => {
            m.classList.remove('active');
            m.classList.add('hidden');
        });

        const targetModule = document.getElementById(`${module}Module`);
        if (targetModule) {
            targetModule.classList.remove('hidden');
            targetModule.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === module);
        });

        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === module);
        });
    },

    initializeModules() {
        Todos.init();
        Calendar.init();
        Notes.init();
        Habits.init();
        Timer.init();
        Goals.init();
        Routines.init();
    },

    async loadUserData(user) {
        this.user = user;
        this.profile = await Database.getProfile();

        if (this.profile) {
            this.updateGreeting();
            this.checkBirthday();
        }

        this.updateDashboardWidgets();
    },

    updateGreeting() {
        const greetingEl = document.getElementById('greeting');
        const dateEl = document.getElementById('currentDate');

        if (!greetingEl) return;

        const now = new Date();
        const hour = now.getHours();
        let greeting = '';

        if (hour >= 5 && hour < 12) {
            greeting = 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
            greeting = 'Good Afternoon';
        } else if (hour >= 17 && hour < 21) {
            greeting = 'Good Evening';
        } else {
            greeting = 'Good Night';
        }

        const name = this.profile?.name || 'there';
        greetingEl.innerHTML = `${greeting}, ${name}!`;

        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    },

    checkBirthday() {
        if (!this.profile?.birthday) return;

        const today = new Date();
        const birthday = new Date(this.profile.birthday);

        if (today.getMonth() === birthday.getMonth() &&
            today.getDate() === birthday.getDate()) {
            Toast.show('Happy Birthday! Have an amazing day!', 'success');
        }
    },

    updateDashboardWidgets() {
        // Update stats when data changes
        this.renderDashboardSummary();
        this.renderDashboardTasks();
        this.renderDashboardEvents();
    },

    renderDashboardTasks() {
        const container = document.getElementById('dashboardTodos');
        if (!container) return;

        const today = new Date().toISOString().split('T')[0];
        const todayTasks = Todos.todos.filter(t => !t.completed).slice(0, 5);

        if (todayTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-mini">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span>No pending tasks</span>
                </div>
            `;
            return;
        }

        container.innerHTML = todayTasks.map(task => `
            <div class="dashboard-task-item" onclick="App.showModule('todos')">
                <div class="task-check ${task.completed ? 'completed' : ''}">
                    ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </div>
                <span class="task-title">${task.title}</span>
                <span class="badge ${Todos.getPriorityClass(task.priority)}">${task.priority}</span>
            </div>
        `).join('');
    },

    renderDashboardEvents() {
        const container = document.getElementById('dashboardEvents');
        if (!container) return;

        const today = new Date();
        const upcomingEvents = Calendar.events
            .filter(e => new Date(e.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5);

        if (upcomingEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-mini">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                    </svg>
                    <span>No upcoming events</span>
                </div>
            `;
            return;
        }

        container.innerHTML = upcomingEvents.map(event => `
            <div class="dashboard-event-item" onclick="App.showModule('calendar')">
                <div class="event-date-badge">
                    <span class="event-month">${new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span class="event-day">${new Date(event.date).getDate()}</span>
                </div>
                <div class="event-info">
                    <span class="event-title">${event.title}</span>
                    ${event.startTime ? `<span class="event-time">${event.startTime}</span>` : ''}
                </div>
            </div>
        `).join('');
    },

    renderDashboardSummary() {
        const todoStats = Todos.getStats();
        const habitStats = Habits.getOverallStats();
        const timerStats = Timer.getStats();
        const goalStats = Goals.getStats();

        const widgetsContainer = document.getElementById('dashboardWidgets');
        if (!widgetsContainer) return;

        widgetsContainer.innerHTML = `
      <div class="widget-card stagger-item" onclick="App.showModule('todos')">
        <div class="widget-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="widget-content">
          <span class="widget-value">${todoStats.completed}/${todoStats.total}</span>
          <span class="widget-label">Tasks Done</span>
        </div>
      </div>
      
      <div class="widget-card stagger-item" onclick="App.showModule('habits')">
        <div class="widget-icon widget-icon-green">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <div class="widget-content">
          <span class="widget-value">${habitStats.progress}%</span>
          <span class="widget-label">Habits Today</span>
        </div>
      </div>
      
      <div class="widget-card stagger-item" onclick="App.showModule('timer')">
        <div class="widget-icon widget-icon-purple">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div class="widget-content">
          <span class="widget-value">${timerStats.sessions}</span>
          <span class="widget-label">Focus Sessions</span>
        </div>
      </div>
      
      <div class="widget-card stagger-item" onclick="App.showModule('goals')">
        <div class="widget-icon widget-icon-orange">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <div class="widget-content">
          <span class="widget-value">${goalStats.avgProgress}%</span>
          <span class="widget-label">Goals Progress</span>
        </div>
      </div>
    `;
    },

    bindEvents() {
        // Desktop navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const module = item.dataset.module;
                if (module) this.showModule(module);
            });
        });

        // Mobile navigation
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const module = item.dataset.module;
                if (module) this.showModule(module);
            });
        });

        // Mobile menu toggle
        document.getElementById('menuToggle')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.toggle('open');
            document.querySelector('.sidebar-overlay')?.classList.toggle('active');
        });

        document.querySelector('.sidebar-overlay')?.addEventListener('click', () => {
            document.querySelector('.sidebar')?.classList.remove('open');
            document.querySelector('.sidebar-overlay')?.classList.remove('active');
        });

        // Online/Offline status
        window.addEventListener('online', () => {
            document.getElementById('offlineBanner')?.classList.add('hidden');
            Toast.show('You\'re back online!', 'success');
        });

        window.addEventListener('offline', () => {
            document.getElementById('offlineBanner')?.classList.remove('hidden');
            Toast.show('You\'re offline. Changes will sync when reconnected.', 'warning');
        });
    },

    setupInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;

            // Check if we should show the prompt
            const lastPrompt = localStorage.getItem('dailysync-install-prompt');
            const dismissed = localStorage.getItem('dailysync-install-dismissed');

            if (dismissed === 'true') return;

            const today = new Date().toDateString();
            if (lastPrompt === today) return;

            // Show install prompt after delay
            setTimeout(() => {
                this.showInstallPrompt(deferredPrompt);
                localStorage.setItem('dailysync-install-prompt', today);
            }, 30000); // 30 seconds delay
        });
    },

    showInstallPrompt(deferredPrompt) {
        const modal = document.getElementById('installPromptModal');
        if (!modal) return;

        modal.classList.remove('hidden');
        modal.classList.add('active');

        document.getElementById('installBtn')?.addEventListener('click', async () => {
            modal.classList.add('hidden');
            modal.classList.remove('active');

            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    Toast.show('Thanks for installing DailySync!', 'success');
                }
            }
        });

        document.getElementById('dismissInstall')?.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        });

        document.getElementById('neverShowInstall')?.addEventListener('click', () => {
            localStorage.setItem('dailysync-install-dismissed', 'true');
            modal.classList.add('hidden');
            modal.classList.remove('active');
        });
    }
};

// Toast Notification System
const Toast = {
    show(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">✕</button>
    `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
};

// Modal System
const Modal = {
    open(modalId, options = {}) {
        const overlay = document.getElementById(modalId) || document.getElementById('dynamicModal');

        if (options.title || options.content) {
            // Dynamic modal
            const modal = document.getElementById('dynamicModal');
            if (modal) {
                modal.querySelector('.modal-title').textContent = options.title || '';
                modal.querySelector('.modal-body').innerHTML = options.content || '';
                modal.classList.remove('hidden');
                modal.classList.add('active');
            }
        } else if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.add('active');
        }
    },

    close(modalId) {
        const overlay = document.getElementById(modalId);
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    }
};

// Onboarding
const Onboarding = {
    step: 1,
    data: {},

    init() {
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('onboardingForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.nextStep();
        });

        document.getElementById('skipOnboarding')?.addEventListener('click', () => {
            this.complete();
        });
    },

    nextStep() {
        const form = document.getElementById('onboardingForm');

        if (this.step === 1) {
            this.data.name = form.querySelector('[name="name"]')?.value || '';
        } else if (this.step === 2) {
            this.data.location = form.querySelector('[name="location"]')?.value || '';
            this.data.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        } else if (this.step === 3) {
            this.data.birthday = form.querySelector('[name="birthday"]')?.value || '';
        }

        this.step++;

        if (this.step > 3) {
            this.complete();
        } else {
            this.updateStep();
        }
    },

    updateStep() {
        document.querySelectorAll('.onboarding-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.step);
        });
    },

    async complete() {
        await Database.updateProfile({
            ...this.data,
            onboardingComplete: true,
            email: auth.currentUser?.email
        });

        Toast.show('Welcome to DailySync!', 'success');
        App.showScreen('dashboard');
        App.loadUserData(auth.currentUser);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    Onboarding.init();
});

// Export
window.App = App;
window.Toast = Toast;
window.Modal = Modal;
window.Onboarding = Onboarding;
