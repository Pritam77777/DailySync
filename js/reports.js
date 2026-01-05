// Reports & Analytics Module
const Reports = {
    data: {
        tasks: [],
        habits: [],
        timerStats: [],
        goals: []
    },
    currentPeriod: 'week', // week, month, year

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Period toggle
        document.querySelectorAll('[data-report-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPeriod = e.target.dataset.reportPeriod;
                this.updatePeriodButtons();
                this.generateReport();
            });
        });

        // Export buttons
        document.getElementById('exportJSON')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('exportCSV')?.addEventListener('click', () => this.exportCSV());
    },

    async render() {
        await this.loadData();
        this.generateReport();
        this.renderInsights();
    },

    async loadData() {
        // Load all relevant data for reports
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        // Load timer stats for the period
        this.data.timerStats = await this.loadTimerStats();

        // Load task completion data
        this.data.tasks = typeof Todos !== 'undefined' ? Todos.todos : [];

        // Load habit data
        this.data.habits = typeof Habits !== 'undefined' ? Habits.habits : [];

        // Load goals
        this.data.goals = typeof Goals !== 'undefined' ? Goals.goals : [];
    },

    async loadTimerStats() {
        const stats = [];
        const today = new Date();
        const days = this.currentPeriod === 'week' ? 7 :
            this.currentPeriod === 'month' ? 30 : 365;

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayStats = await Database.read(`timerStats/${dateStr}`);
            if (dayStats) {
                stats.push({
                    date: dateStr,
                    ...dayStats
                });
            }
        }

        return stats;
    },

    generateReport() {
        const container = document.getElementById('reportContent');
        if (!container) return;

        const summary = this.calculateSummary();
        const periodLabel = this.currentPeriod === 'week' ? 'This Week' :
            this.currentPeriod === 'month' ? 'This Month' : 'This Year';

        container.innerHTML = `
            <div class="report-summary-grid">
                <div class="report-card">
                    <div class="report-card-icon" style="background: rgba(59, 130, 246, 0.1); color: var(--accent-blue);">
                        ✓
                    </div>
                    <div class="report-card-content">
                        <span class="report-card-value">${summary.tasksCompleted}</span>
                        <span class="report-card-label">Tasks Completed</span>
                    </div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--accent-green);">
                        🎯
                    </div>
                    <div class="report-card-content">
                        <span class="report-card-value">${summary.habitsCompleted}</span>
                        <span class="report-card-label">Habits Done</span>
                    </div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-icon" style="background: rgba(139, 92, 246, 0.1); color: var(--accent-purple);">
                        ⏱️
                    </div>
                    <div class="report-card-content">
                        <span class="report-card-value">${this.formatDuration(summary.focusTime)}</span>
                        <span class="report-card-label">Focus Time</span>
                    </div>
                </div>
                
                <div class="report-card">
                    <div class="report-card-icon" style="background: rgba(251, 191, 36, 0.1); color: var(--accent-orange);">
                        🔥
                    </div>
                    <div class="report-card-content">
                        <span class="report-card-value">${summary.focusSessions}</span>
                        <span class="report-card-label">Focus Sessions</span>
                    </div>
                </div>
            </div>
            
            <div class="report-charts-grid">
                <div class="report-chart-card">
                    <h3 class="report-chart-title">Focus Time Trend</h3>
                    <div class="chart-container" id="focusTimeChart">
                        ${this.renderBarChart(summary.dailyFocusTime, 'Focus Time')}
                    </div>
                </div>
                
                <div class="report-chart-card">
                    <h3 class="report-chart-title">Task Completion</h3>
                    <div class="chart-container" id="taskChart">
                        ${this.renderProgressRing(summary.taskCompletionRate, 'Completion Rate')}
                    </div>
                </div>
            </div>
            
            <div class="report-details">
                <h3>Productivity Breakdown</h3>
                <div class="breakdown-list">
                    <div class="breakdown-item">
                        <span class="breakdown-label">Average Focus Time/Day</span>
                        <span class="breakdown-value">${this.formatDuration(summary.avgFocusTime)}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Most Productive Day</span>
                        <span class="breakdown-value">${summary.bestDay || 'N/A'}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Total Sessions</span>
                        <span class="breakdown-value">${summary.focusSessions}</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Habit Streak</span>
                        <span class="breakdown-value">${summary.habitStreak} days</span>
                    </div>
                </div>
            </div>
        `;
    },

    calculateSummary() {
        const summary = {
            tasksCompleted: 0,
            habitsCompleted: 0,
            focusTime: 0,
            focusSessions: 0,
            dailyFocusTime: [],
            taskCompletionRate: 0,
            avgFocusTime: 0,
            bestDay: null,
            habitStreak: 0
        };

        // Calculate from timer stats
        let maxFocusTime = 0;
        this.data.timerStats.forEach(stat => {
            summary.focusTime += stat.totalFocusTime || 0;
            summary.focusSessions += stat.sessions || 0;

            summary.dailyFocusTime.push({
                date: stat.date,
                value: stat.totalFocusTime || 0
            });

            if (stat.totalFocusTime > maxFocusTime) {
                maxFocusTime = stat.totalFocusTime;
                summary.bestDay = this.formatDate(stat.date);
            }
        });

        // Average focus time
        const days = this.currentPeriod === 'week' ? 7 :
            this.currentPeriod === 'month' ? 30 : 365;
        summary.avgFocusTime = Math.round(summary.focusTime / days);

        // Task completion
        const completedTasks = this.data.tasks.filter(t => t.completed).length;
        const totalTasks = this.data.tasks.length;
        summary.tasksCompleted = completedTasks;
        summary.taskCompletionRate = totalTasks > 0 ?
            Math.round((completedTasks / totalTasks) * 100) : 0;

        // Habits (count today's completed)
        const today = new Date().toISOString().split('T')[0];
        summary.habitsCompleted = this.data.habits.filter(h =>
            h.completedDates && h.completedDates.includes(today)
        ).length;

        // Habit streak (from Timer module's streak tracking)
        if (typeof Timer !== 'undefined') {
            summary.habitStreak = Timer.focusStreak || 0;
        }

        return summary;
    },

    renderBarChart(data, label) {
        if (!data || data.length === 0) {
            return '<div class="chart-empty">No data available</div>';
        }

        const maxValue = Math.max(...data.map(d => d.value), 1);
        const bars = data.slice(-7).reverse().map(d => {
            const height = Math.max(5, (d.value / maxValue) * 100);
            const day = new Date(d.date).toLocaleDateString('en', { weekday: 'short' });
            return `
                <div class="bar-item">
                    <div class="bar" style="height: ${height}%;" title="${this.formatDuration(d.value)}"></div>
                    <span class="bar-label">${day}</span>
                </div>
            `;
        }).join('');

        return `<div class="bar-chart">${bars}</div>`;
    },

    renderProgressRing(percentage, label) {
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage / 100) * circumference;

        return `
            <div class="progress-ring-container">
                <svg class="progress-ring" width="120" height="120">
                    <circle class="progress-ring-bg" cx="60" cy="60" r="45" />
                    <circle class="progress-ring-progress" cx="60" cy="60" r="45"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${offset}" />
                </svg>
                <div class="progress-ring-value">${percentage}%</div>
            </div>
        `;
    },

    renderInsights() {
        const container = document.getElementById('insightsContainer');
        if (!container) return;

        const insights = this.generateInsights();

        container.innerHTML = insights.map(insight => `
            <div class="insight-card ${insight.type}">
                <span class="insight-icon">${insight.icon}</span>
                <div class="insight-content">
                    <p class="insight-text">${insight.text}</p>
                </div>
            </div>
        `).join('');
    },

    generateInsights() {
        const insights = [];
        const summary = this.calculateSummary();

        // Focus time insight
        if (summary.focusTime > 0) {
            const hours = Math.floor(summary.focusTime / 3600);
            if (hours >= 10) {
                insights.push({
                    icon: '🏆',
                    text: `Amazing! You've focused for ${hours}+ hours this ${this.currentPeriod}!`,
                    type: 'success'
                });
            } else if (hours >= 5) {
                insights.push({
                    icon: '💪',
                    text: `Great progress! ${hours} hours of focused work this ${this.currentPeriod}.`,
                    type: 'positive'
                });
            }
        }

        // Best day insight
        if (summary.bestDay) {
            insights.push({
                icon: '📅',
                text: `Your most productive day was ${summary.bestDay}. Keep it up!`,
                type: 'info'
            });
        }

        // Task completion insight
        if (summary.taskCompletionRate >= 80) {
            insights.push({
                icon: '✨',
                text: `Excellent! ${summary.taskCompletionRate}% task completion rate!`,
                type: 'success'
            });
        } else if (summary.taskCompletionRate < 50 && summary.tasksCompleted > 0) {
            insights.push({
                icon: '💡',
                text: 'Tip: Break large tasks into smaller ones for better completion rates.',
                type: 'tip'
            });
        }

        // Streak insight
        if (summary.habitStreak >= 7) {
            insights.push({
                icon: '🔥',
                text: `${summary.habitStreak} day streak! You're building great habits!`,
                type: 'success'
            });
        }

        // Don't show any default insight if no data
        // Users will see the report cards with zeros instead

        return insights;
    },

    updatePeriodButtons() {
        document.querySelectorAll('[data-report-period]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.reportPeriod === this.currentPeriod);
        });
    },

    formatDuration(seconds) {
        if (!seconds) return '0m';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
    },

    // Data Export Functions
    async exportJSON() {
        const allData = {
            exportDate: new Date().toISOString(),
            tasks: this.data.tasks,
            habits: this.data.habits,
            goals: this.data.goals,
            timerStats: this.data.timerStats,
            profile: App.profile
        };

        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        this.downloadFile(blob, `dailysync-backup-${Date.now()}.json`);
        Toast.show('Data exported successfully!', 'success');
    },

    async exportCSV() {
        // Export tasks as CSV
        let csv = 'Title,Status,Priority,Due Date,Created\n';
        this.data.tasks.forEach(task => {
            csv += `"${task.title || ''}","${task.completed ? 'Completed' : 'Active'}","${task.priority || 'medium'}","${task.dueDate || ''}","${task.createdAt || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadFile(blob, `dailysync-tasks-${Date.now()}.csv`);
        Toast.show('Tasks exported to CSV!', 'success');
    },

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Export
window.Reports = Reports;
