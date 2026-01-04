// Settings Module
const Settings = {
    init() {
        this.bindEvents();
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

        // Set current theme
        if (themeSelect) {
            this.loadSettings().then(settings => {
                themeSelect.value = settings.theme || 'dark';
            });
        }
    }
};

// Export
window.Settings = Settings;
