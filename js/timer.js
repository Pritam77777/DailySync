// Focus Timer (Pomodoro) Module
const Timer = {
    durations: {
        work: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    },
    currentMode: 'work',
    timeRemaining: 25 * 60,
    isRunning: false,
    interval: null,
    sessions: 0,
    totalFocusTime: 0,

    // Focus streaks
    focusStreak: 0,
    lastFocusDate: null,
    bestStreak: 0,

    audio: null,

    init() {
        this.loadSettings();
        this.bindEvents();
        this.render();
        this.loadTodayStats();
        this.loadStreakData();
        this.renderStreakDisplay();
    },

    async loadSettings() {
        const settings = await Database.read('settings/timerDurations');
        if (settings) {
            this.durations = settings;
            this.timeRemaining = this.durations.work;
        }
    },

    async loadTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const stats = await Database.read(`timerStats/${today}`);
        if (stats) {
            this.sessions = stats.sessions || 0;
            this.totalFocusTime = stats.totalFocusTime || 0;
        }
        this.updateStatsDisplay();
    },

    async loadStreakData() {
        const streakData = await Database.read('timerStreak');
        if (streakData) {
            this.focusStreak = streakData.current || 0;
            this.lastFocusDate = streakData.lastDate || null;
            this.bestStreak = streakData.best || 0;
            this.checkStreakValidity();
        }
        this.renderStreakDisplay();
    },

    checkStreakValidity() {
        if (!this.lastFocusDate) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastDate = new Date(this.lastFocusDate);
        lastDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            this.focusStreak = 0;
        }
    },

    bindEvents() {
        document.getElementById('timerStart')?.addEventListener('click', () => this.start());
        document.getElementById('timerPause')?.addEventListener('click', () => this.pause());
        document.getElementById('timerReset')?.addEventListener('click', () => this.reset());

        document.querySelectorAll('[data-timer-mode]').forEach(btn => {
            btn.addEventListener('click', (e) => this.setMode(e.target.dataset.timerMode));
        });

        const settingsForm = document.getElementById('timerSettingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.saveSettings(e));
        }
    },

    setMode(mode) {
        this.currentMode = mode;
        this.timeRemaining = this.durations[mode];
        this.isRunning = false;
        clearInterval(this.interval);

        document.querySelectorAll('[data-timer-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.timerMode === mode);
        });

        this.render();
    },

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.updateButtons();

        this.interval = setInterval(() => {
            this.timeRemaining--;

            if (this.timeRemaining <= 0) {
                this.complete();
            } else {
                this.render();
            }
        }, 1000);
    },

    pause() {
        this.isRunning = false;
        clearInterval(this.interval);
        this.updateButtons();
    },

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    },

    reset() {
        this.pause();
        this.timeRemaining = this.durations[this.currentMode];
        this.render();
    },

    async complete() {
        this.pause();
        this.playSound();

        if (this.currentMode === 'work') {
            this.sessions++;
            this.totalFocusTime += this.durations.work;
            await this.saveStats();
            await this.updateStreak();

            if (this.sessions % 4 === 0) {
                this.showConfetti();
            }

            Toast.show(`Great work! Session ${this.sessions} complete! 🎉`, 'success');

            if (this.sessions % 4 === 0) {
                this.setMode('longBreak');
                Toast.show('Time for a long break!', 'info');
            } else {
                this.setMode('shortBreak');
                Toast.show('Time for a short break!', 'info');
            }
        } else {
            Toast.show('Break over! Ready for another session?', 'info');
            this.setMode('work');
        }

        this.updateStatsDisplay();
        this.renderStreakDisplay();
    },

    async updateStreak() {
        const today = new Date().toISOString().split('T')[0];

        if (this.lastFocusDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (this.lastFocusDate === yesterdayStr || !this.lastFocusDate) {
                this.focusStreak++;
            } else {
                this.focusStreak = 1;
            }

            this.lastFocusDate = today;

            if (this.focusStreak > this.bestStreak) {
                this.bestStreak = this.focusStreak;
                Toast.show(`New best streak: ${this.bestStreak} days! 🔥`, 'success');
            }

            await Database.set('timerStreak', {
                current: this.focusStreak,
                lastDate: this.lastFocusDate,
                best: this.bestStreak
            });
        }
    },

    showConfetti() {
        const container = document.createElement('div');
        container.className = 'confetti-container';
        document.body.appendChild(container);

        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#fb923c', '#fbbf24'];

        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = Math.random() * 100 + '%';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animationDelay = Math.random() * 0.5 + 's';
            confetti.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';
            container.appendChild(confetti);
        }

        setTimeout(() => container.remove(), 2000);
    },

    async saveStats() {
        const today = new Date().toISOString().split('T')[0];
        await Database.set(`timerStats/${today}`, {
            sessions: this.sessions,
            totalFocusTime: this.totalFocusTime,
            date: today
        });
    },

    async saveSettings(e) {
        e.preventDefault();
        const form = e.target;

        this.durations = {
            work: parseInt(form.querySelector('[name="workDuration"]').value) * 60,
            shortBreak: parseInt(form.querySelector('[name="shortBreakDuration"]').value) * 60,
            longBreak: parseInt(form.querySelector('[name="longBreakDuration"]').value) * 60
        };

        await Database.set('settings/timerDurations', this.durations);
        this.reset();
        Modal.close('timerSettingsModal');
        Toast.show('Settings saved!', 'success');
    },

    renderStreakDisplay() {
        const container = document.getElementById('focusStreakDisplay');
        if (!container) return;

        container.innerHTML = `
            <div class="streak-badge ${this.focusStreak > 0 ? 'active' : ''}">
                <span class="streak-fire">🔥</span>
                <span class="streak-count">${this.focusStreak}</span>
                <span class="streak-label">day streak</span>
            </div>
            ${this.bestStreak > 0 ? `
                <div class="best-streak">
                    Best: ${this.bestStreak} days
                </div>
            ` : ''}
        `;
    },

    playSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;

            oscillator.start();

            setTimeout(() => {
                oscillator.stop();
            }, 200);

            setTimeout(() => {
                const osc2 = audioContext.createOscillator();
                osc2.connect(gainNode);
                osc2.frequency.value = 1000;
                osc2.type = 'sine';
                osc2.start();
                setTimeout(() => osc2.stop(), 200);
            }, 300);
        } catch (e) {
            console.log('Audio not supported');
        }
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    getProgress() {
        const total = this.durations[this.currentMode];
        return ((total - this.timeRemaining) / total) * 100;
    },

    updateButtons() {
        const startBtn = document.getElementById('timerStart');
        const pauseBtn = document.getElementById('timerPause');

        if (startBtn && pauseBtn) {
            startBtn.classList.toggle('hidden', this.isRunning);
            pauseBtn.classList.toggle('hidden', !this.isRunning);
        }
    },

    updateStatsDisplay() {
        const sessionsEl = document.getElementById('timerSessions');
        const focusTimeEl = document.getElementById('timerFocusTime');

        if (sessionsEl) sessionsEl.textContent = this.sessions;
        if (focusTimeEl) focusTimeEl.textContent = this.formatFocusTime(this.totalFocusTime);
    },

    formatFocusTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    render() {
        const timerDisplay = document.getElementById('timerDisplay');
        const progressCircle = document.getElementById('timerProgress');

        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.timeRemaining);
        }

        if (progressCircle) {
            const circumference = 2 * Math.PI * 90;
            const progress = this.getProgress();
            const offset = circumference - (progress / 100) * circumference;
            progressCircle.style.strokeDasharray = `${circumference}`;
            progressCircle.style.strokeDashoffset = `${offset}`;

            const colors = {
                work: 'var(--accent-blue)',
                shortBreak: 'var(--accent-green)',
                longBreak: 'var(--accent-purple)'
            };
            progressCircle.style.stroke = colors[this.currentMode];
        }

        this.updateButtons();
    },

    getStats() {
        return {
            sessions: this.sessions,
            totalFocusTime: this.totalFocusTime,
            currentMode: this.currentMode,
            isRunning: this.isRunning,
            streak: this.focusStreak,
            bestStreak: this.bestStreak
        };
    }
};

// Export
window.Timer = Timer;
