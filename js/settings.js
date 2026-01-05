// Settings Module
const Settings = {
    currentAccentColor: '#3b82f6', // Default blue

    init() {
        this.bindEvents();
        this.loadAccentColor();
    },

    bindEvents() {
        // Theme toggle event
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.handleThemeChange(e.target.value));
        }

        // Save profile form
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => this.saveProfile());
        }

        // Accent color picker
        const colorPicker = document.getElementById('accentColorPicker');
        if (colorPicker) {
            colorPicker.addEventListener('click', (e) => {
                const colorOption = e.target.closest('.accent-color-option');
                if (colorOption) {
                    const color = colorOption.dataset.color;
                    this.setAccentColor(color);
                }
            });
        }
    },

    async handleThemeChange(theme) {
        if (theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            // System preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }

        // Save to Firebase
        await this.saveSettings({ theme });
        Toast.show('Theme updated!', 'success');
    },

    setAccentColor(color) {
        this.currentAccentColor = color;

        // Update CSS variables
        document.documentElement.style.setProperty('--accent-blue', color);
        document.documentElement.style.setProperty('--gradient-primary',
            `linear-gradient(135deg, ${color} 0%, ${this.adjustColor(color, 30)} 100%)`);
        document.documentElement.style.setProperty('--shadow-glow-blue',
            `0 0 15px ${color}26`);

        // Update active state in picker
        document.querySelectorAll('.accent-color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === color);
        });

        // Save to local storage and Firebase
        localStorage.setItem('dailysync_accent_color', color);
        this.saveSettings({ accentColor: color });

        Toast.show('Accent color updated!', 'success');
    },

    loadAccentColor() {
        // Load from localStorage first for instant apply
        const savedColor = localStorage.getItem('dailysync_accent_color');
        if (savedColor) {
            this.currentAccentColor = savedColor;
            this.applyAccentColor(savedColor);
        }
    },

    applyAccentColor(color) {
        if (!color) return;

        document.documentElement.style.setProperty('--accent-blue', color);
        document.documentElement.style.setProperty('--gradient-primary',
            `linear-gradient(135deg, ${color} 0%, ${this.adjustColor(color, 30)} 100%)`);
        document.documentElement.style.setProperty('--shadow-glow-blue',
            `0 0 15px ${color}26`);

        // Update active state in picker
        document.querySelectorAll('.accent-color-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === color);
        });
    },

    // Helper to adjust color brightness for gradient
    adjustColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, Math.max(0, (num >> 16) + amt));
        const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
        const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    },

    async saveProfile() {
        const name = document.getElementById('settingsName')?.value.trim();
        const location = document.getElementById('settingsLocation')?.value.trim();
        const birthday = document.getElementById('settingsBirthday')?.value;

        if (!name) {
            Toast.show('Please enter your name', 'error');
            return;
        }

        const profile = {
            name,
            location: location || '',
            birthday: birthday || '',
            onboardingComplete: true
        };

        await Database.updateProfile(profile);

        // Update app profile
        App.profile = { ...App.profile, ...profile };
        App.updateGreeting();

        Toast.show('Profile saved successfully!', 'success');
    },

    async saveSettings(updates) {
        const user = auth.currentUser;
        if (!user) return;

        await database.ref(`users/${user.uid}/settings`).update(updates);
    },

    async loadSettings() {
        const user = auth.currentUser;
        if (!user) return {};

        const snapshot = await database.ref(`users/${user.uid}/settings`).once('value');
        return snapshot.val() || {};
    },

    render() {
        // Populate profile fields
        const profile = App.profile || {};

        const nameInput = document.getElementById('settingsName');
        const locationInput = document.getElementById('settingsLocation');
        const birthdayInput = document.getElementById('settingsBirthday');
        const themeSelect = document.getElementById('themeSelect');
        const emailDisplay = document.getElementById('settingsEmail');

        if (nameInput) nameInput.value = profile.name || '';
        if (locationInput) locationInput.value = profile.location || '';
        if (birthdayInput) birthdayInput.value = profile.birthday || '';
        if (emailDisplay && App.user) emailDisplay.textContent = App.user.email || '';

        // Set current theme and accent color
        this.loadSettings().then(settings => {
            if (themeSelect) {
                themeSelect.value = settings.theme || 'dark';
            }
            if (settings.accentColor) {
                this.applyAccentColor(settings.accentColor);
            }
        });

        // Apply saved accent color
        this.applyAccentColor(this.currentAccentColor);
    }
};

// Export
window.Settings = Settings;
