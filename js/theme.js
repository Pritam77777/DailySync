// Theme Management
const ThemeManager = {
    init() {
        const savedTheme = localStorage.getItem('dailysync-theme') || 'dark';
        this.setTheme(savedTheme);
        this.bindEvents();
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('dailysync-theme', theme);

        // Sync to Firebase if user is logged in
        if (window.auth?.currentUser) {
            window.database.ref(`users/${window.auth.currentUser.uid}/settings/theme`).set(theme);
        }
    },

    toggle() {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    bindEvents() {
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggle());
        }
    },

    syncFromFirebase(theme) {
        if (theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('dailysync-theme', theme);
        }
    }
};

// Export for use in other modules
window.ThemeManager = ThemeManager;
