// Habit Tracker Module
const Habits = {
  habits: [],
  selectedDate: new Date(),
  unsubscribe: null,

  icons: ['strength', 'book', 'running', 'water', 'meditation', 'sleep', 'food', 'writing', 'art', 'music', 'money', 'cleaning'],

  getHabitIcon(iconName) {
    const icons = {
      'strength': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>',
      'book': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
      'running': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      'water': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
      'meditation': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
      'sleep': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
      'food': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>',
      'writing': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
      'art': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
      'music': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
      'money': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'cleaning': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>'
    };
    return icons[iconName] || icons['strength'];
  },

  init() {
    this.bindEvents();
    this.setupRealtimeListener();
  },

  setupRealtimeListener() {
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = Database.onValue('habits', (data) => {
      this.habits = Database.toArray(data);
      this.render();
    });
  },

  bindEvents() {
    const addHabitForm = document.getElementById('addHabitForm');
    if (addHabitForm) {
      addHabitForm.addEventListener('submit', (e) => this.handleAddHabit(e));
    }
  },

  async handleAddHabit(e) {
    e.preventDefault();
    const form = e.target;

    const habit = {
      name: form.querySelector('[name="name"]').value.trim(),
      icon: form.querySelector('[name="icon"]').value || 'strength',
      category: form.querySelector('[name="category"]').value || 'health',
      frequency: form.querySelector('[name="frequency"]').value || 'daily',
      completions: {},
      streak: 0
    };

    if (!habit.name) {
      Toast.show('Please enter a habit name', 'error');
      return;
    }

    await Database.create('habits', habit);
    form.reset();
    Modal.close('addHabitModal');
    Toast.show('Habit created!', 'success');
  },

  async toggleCompletion(id) {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;

    const dateKey = this.getDateKey(this.selectedDate);
    const completions = habit.completions || {};

    if (completions[dateKey]) {
      delete completions[dateKey];
    } else {
      completions[dateKey] = true;
    }

    const streak = this.calculateStreak(completions);

    await Database.update(`habits/${id}`, { completions, streak });
  },

  async deleteHabit(id) {
    await Database.delete(`habits/${id}`);
    Toast.show('Habit deleted', 'success');
  },

  getDateKey(date) {
    return date.toISOString().split('T')[0];
  },

  calculateStreak(completions) {
    if (!completions) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);

    // Check if completed today, if not start from yesterday
    if (!completions[this.getDateKey(checkDate)]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (completions[this.getDateKey(checkDate)]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  },

  getWeekDates() {
    const dates = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    return dates;
  },

  getCompletionRate(habit) {
    if (!habit.completions) return 0;

    const last30Days = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push(this.getDateKey(date));
    }

    const completed = last30Days.filter(d => habit.completions[d]).length;
    return Math.round((completed / 30) * 100);
  },

  render() {
    const container = document.getElementById('habitsList');
    if (!container) return;

    if (this.habits.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <h3>No habits yet</h3>
          <p>Start building better habits today!</p>
        </div>
      `;
      return;
    }

    const weekDates = this.getWeekDates();
    const todayKey = this.getDateKey(new Date());

    container.innerHTML = `
      <div class="habits-week-header">
        ${weekDates.map(date => `
          <div class="week-day-label ${this.getDateKey(date) === todayKey ? 'today' : ''}">
            <span>${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span>${date.getDate()}</span>
          </div>
        `).join('')}
      </div>
      
      ${this.habits.map(habit => `
        <div class="habit-row stagger-item">
          <div class="habit-info">
            <span class="habit-icon">${this.getHabitIcon(habit.icon)}</span>
            <div class="habit-details">
              <h4>${habit.name}</h4>
              <div class="habit-stats">
                <span class="streak ${habit.streak > 0 ? 'streak-fire' : ''}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--accent-orange)" stroke="var(--accent-orange)" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                  ${habit.streak} day streak
                </span>
                <span class="completion-rate">${this.getCompletionRate(habit)}% this month</span>
              </div>
            </div>
          </div>
          
          <div class="habit-week">
            ${weekDates.map(date => {
      const dateKey = this.getDateKey(date);
      const isCompleted = habit.completions && habit.completions[dateKey];
      const isToday = dateKey === todayKey;

      return `
                <button class="habit-check ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}"
                        onclick="Habits.toggleCompletionForDate('${habit.id}', '${dateKey}')">
                  ${isCompleted ? `
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ` : ''}
                </button>
              `;
    }).join('')}
          </div>
          
          <button class="btn btn-ghost btn-icon" onclick="Habits.deleteHabit('${habit.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `).join('')}
    `;

    this.renderStats();
  },

  async toggleCompletionForDate(id, dateKey) {
    const habit = this.habits.find(h => h.id === id);
    if (!habit) return;

    const completions = { ...(habit.completions || {}) };

    if (completions[dateKey]) {
      delete completions[dateKey];
    } else {
      completions[dateKey] = true;
    }

    const streak = this.calculateStreak(completions);

    await Database.update(`habits/${id}`, { completions, streak });
  },

  renderStats() {
    const statsContainer = document.getElementById('habitsStats');
    if (!statsContainer) return;

    const todayKey = this.getDateKey(new Date());
    const completedToday = this.habits.filter(h => h.completions && h.completions[todayKey]).length;
    const totalHabits = this.habits.length;
    const longestStreak = Math.max(...this.habits.map(h => h.streak || 0), 0);

    statsContainer.innerHTML = `
      <div class="stat-card">
        <span class="stat-value">${completedToday}/${totalHabits}</span>
        <span class="stat-label">Completed Today</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${longestStreak}</span>
        <span class="stat-label">Longest Streak</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0}%</span>
        <span class="stat-label">Today's Progress</span>
      </div>
    `;
  },

  getOverallStats() {
    const todayKey = this.getDateKey(new Date());
    const completedToday = this.habits.filter(h => h.completions && h.completions[todayKey]).length;
    return {
      total: this.habits.length,
      completed: completedToday,
      progress: this.habits.length > 0 ? Math.round((completedToday / this.habits.length) * 100) : 0
    };
  }
};

// Export
window.Habits = Habits;
