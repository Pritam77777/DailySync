// Authentication Module
const Auth = {
    init() {
        this.setupAuthStateListener();
        this.handleRedirectResult();
        this.bindEvents();
    },

    // Handle redirect result for mobile Google login
    async handleRedirectResult() {
        try {
            const result = await auth.getRedirectResult();
            if (result.user) {
                Toast.show('Welcome!', 'success');
            }
        } catch (error) {
            if (error.code && error.code !== 'auth/popup-closed-by-user') {
                Toast.show(this.getErrorMessage(error.code), 'error');
            }
        }
    },

    setupAuthStateListener() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.handleUserLoggedIn(user);
            } else {
                this.handleUserLoggedOut();
            }
        });
    },

    async handleUserLoggedIn(user) {
        // Check if onboarding is complete
        const snapshot = await database.ref(`users/${user.uid}/profile/onboardingComplete`).once('value');
        const onboardingComplete = snapshot.val();

        if (!onboardingComplete) {
            App.showScreen('onboarding');
        } else {
            // Load user settings
            const settingsSnapshot = await database.ref(`users/${user.uid}/settings`).once('value');
            const settings = settingsSnapshot.val() || {};

            if (settings.theme) {
                ThemeManager.syncFromFirebase(settings.theme);
            }

            App.showScreen('dashboard');
            App.loadUserData(user);
        }
    },

    handleUserLoggedOut() {
        App.showScreen('auth');
    },

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Google login
        const googleLoginBtn = document.getElementById('googleLogin');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.handleGoogleLogin());
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Auth toggle
        const authToggle = document.querySelectorAll('.auth-toggle');
        authToggle.forEach(btn => {
            btn.addEventListener('click', () => this.toggleAuthMode());
        });
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            this.showLoading(true);
            await auth.signInWithEmailAndPassword(email, password);
            Toast.show('Welcome back!', 'success');
        } catch (error) {
            Toast.show(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async handleSignup(e) {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            Toast.show('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            Toast.show('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            this.showLoading(true);
            await auth.createUserWithEmailAndPassword(email, password);
            Toast.show('Account created successfully!', 'success');
        } catch (error) {
            Toast.show(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    },

    async handleGoogleLogin() {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        try {
            this.showLoading(true);

            // Use popup for all devices (more reliable than redirect without deep linking)
            await auth.signInWithPopup(provider);
            Toast.show('Welcome!', 'success');
        } catch (error) {
            console.error('Google Sign-In Error:', error); // Log full error for debugging

            if (error.code === 'auth/popup-blocked') {
                // Fallback to redirect if popup is blocked
                Toast.show('Popup blocked. Redirecting...', 'info');
                try {
                    await auth.signInWithRedirect(provider);
                } catch (redirectError) {
                    console.error('Redirect Error:', redirectError);
                    Toast.show(this.getErrorMessage(redirectError.code), 'error');
                }
            } else if (error.code !== 'auth/popup-closed-by-user') {
                Toast.show(this.getErrorMessage(error.code), 'error');
            }
        } finally {
            this.showLoading(false);
        }
    },

    async handleLogout() {
        try {
            await auth.signOut();
            Toast.show('Logged out successfully', 'success');
        } catch (error) {
            Toast.show('Error logging out', 'error');
        }
    },

    toggleAuthMode() {
        const loginSection = document.getElementById('loginSection');
        const signupSection = document.getElementById('signupSection');

        loginSection.classList.toggle('hidden');
        signupSection.classList.toggle('hidden');
    },

    showLoading(show) {
        const loadingOverlay = document.getElementById('authLoading');
        if (loadingOverlay) {
            loadingOverlay.classList.toggle('hidden', !show);
        }
    },

    getErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'This email is already registered',
            'auth/invalid-email': 'Invalid email address',
            'auth/operation-not-allowed': 'Google Sign-In is not enabled. Please contact support.',
            'auth/weak-password': 'Password is too weak',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
            'auth/unauthorized-domain': 'Domain not authorized. Add it to Firebase Console > Authentication > Settings.',
            'auth/popup-blocked': 'Popup was blocked. Please allow popups for this site.',
            'auth/cancelled-popup-request': 'Popup closed by user.'
        };
        return messages[code] || 'An error occurred. Please try again';
    }
};

// Export
window.Auth = Auth;
