// Goals Module
const Goals = {
  goals: [],
  unsubscribe: null,

  categories: [
    { name: 'career', color: 'blue', icon: 'briefcase' },
    { name: 'health', color: 'green', icon: 'activity' },
    { name: 'finance', color: 'yellow', icon: 'dollar' },
    { name: 'personal', color: 'purple', icon: 'star' },
    { name: 'education', color: 'teal', icon: 'book' },
    { name: 'relationships', color: 'pink', icon: 'heart' }
  ],

  getCategoryIcon(iconName) {
    const icons = {
      'briefcase': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
      'activity': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      'dollar': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      'star': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'book': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
      'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    };
    return icons[iconName] || icons['star'];
  },

  init() {
    this.bindEvents();
    this.setupRealtimeListener();
  },

  setupRealtimeListener() {
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = Database.onValue('goals', (data) => {
      this.goals = Database.toArray(data);
      this.render();
    });
  },

  bindEvents() {
    const addGoalForm = document.getElementById('addGoalForm');
    if (addGoalForm) {
      addGoalForm.addEventListener('submit', (e) => this.handleAddGoal(e));
    }
  },

  async handleAddGoal(e) {
    e.preventDefault();
    const form = e.target;

    const goal = {
      title: form.querySelector('[name="title"]').value.trim(),
      description: form.querySelector('[name="description"]')?.value.trim() || '',
      category: form.querySelector('[name="category"]').value || 'personal',
      targetDate: form.querySelector('[name="targetDate"]').value,
      milestones: [],
      progress: 0
    };

    if (!goal.title) {
      Toast.show('Please enter a goal title', 'error');
      return;
    }

    await Database.create('goals', goal);
    form.reset();
    Modal.close('addGoalModal');
    Toast.show('Goal created!', 'success');
  },

  async addMilestone(goalId, title) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    const milestones = goal.milestones || [];
    milestones.push({
      id: Date.now().toString(),
      title,
      completed: false
    });

    await Database.update(`goals/${goalId}`, {
      milestones,
      progress: this.calculateProgress(milestones)
    });
  },

  async toggleMilestone(goalId, milestoneId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    const milestones = (goal.milestones || []).map(m => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    await Database.update(`goals/${goalId}`, {
      milestones,
      progress: this.calculateProgress(milestones)
    });
  },

  async deleteMilestone(goalId, milestoneId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    const milestones = (goal.milestones || []).filter(m => m.id !== milestoneId);

    await Database.update(`goals/${goalId}`, {
      milestones,
      progress: this.calculateProgress(milestones)
    });
  },

  async deleteGoal(id) {
    await Database.delete(`goals/${id}`);
    Toast.show('Goal deleted', 'success');
  },

  calculateProgress(milestones) {
    if (!milestones || milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.completed).length;
    return Math.round((completed / milestones.length) * 100);
  },

  getDaysRemaining(targetDate) {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  getCategoryInfo(categoryName) {
    return this.categories.find(c => c.name === categoryName) || this.categories[3];
  },

  openMilestoneModal(goalId) {
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;

    const content = `
      <div class="milestones-list">
        ${(goal.milestones || []).map(m => `
          <div class="milestone-item ${m.completed ? 'completed' : ''}">
            <label class="checkbox">
              <input type="checkbox" ${m.completed ? 'checked' : ''} 
                     onchange="Goals.toggleMilestone('${goalId}', '${m.id}')">
              <span class="checkbox-mark">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </label>
            <span class="${m.completed ? 'line-through' : ''}">${m.title}</span>
            <button class="btn btn-ghost btn-icon" onclick="Goals.deleteMilestone('${goalId}', '${m.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
      <div class="add-milestone-form mt-md">
        <input type="text" id="newMilestoneInput" class="form-input" placeholder="Add a new milestone...">
        <button class="btn btn-primary mt-sm" onclick="Goals.handleAddMilestoneFromModal('${goalId}')">Add Milestone</button>
      </div>
    `;

    Modal.open('milestonesModal', {
      title: goal.title,
      content
    });
  },

  handleAddMilestoneFromModal(goalId) {
    const input = document.getElementById('newMilestoneInput');
    if (input && input.value.trim()) {
      this.addMilestone(goalId, input.value.trim());
      input.value = '';
    }
  },

  render() {
    const container = document.getElementById('goalsList');
    if (!container) return;

    if (this.goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <h3>No goals yet</h3>
          <p>Set your first goal and start achieving!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.goals.map(goal => {
      const category = this.getCategoryInfo(goal.category);
      const daysRemaining = this.getDaysRemaining(goal.targetDate);

      return `
        <div class="goal-card stagger-item category-${category.color}">
          <div class="goal-header">
            <span class="goal-icon">${this.getCategoryIcon(category.icon)}</span>
            <div class="goal-info">
              <h4>${goal.title}</h4>
              ${goal.description ? `<p class="text-secondary text-sm">${goal.description}</p>` : ''}
            </div>
            <button class="btn btn-ghost btn-icon" onclick="Goals.deleteGoal('${goal.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </div>
          
          <div class="goal-progress">
            <div class="progress-header">
              <span>${goal.progress}% Complete</span>
              ${daysRemaining !== null ? `
                <span class="${daysRemaining < 0 ? 'text-danger' : daysRemaining < 7 ? 'text-warning' : ''}">
                  ${daysRemaining < 0 ? 'Overdue' : daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
                </span>
              ` : ''}
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${goal.progress}%; background: var(--accent-${category.color})"></div>
            </div>
          </div>
          
          <div class="goal-milestones">
            <div class="milestones-preview">
              ${(goal.milestones || []).slice(0, 3).map(m => `
                <span class="milestone-chip ${m.completed ? 'completed' : ''}">
                  ${m.completed ? '✓' : '○'} ${m.title}
                </span>
              `).join('')}
              ${(goal.milestones || []).length > 3 ? `<span class="more-milestones">+${goal.milestones.length - 3} more</span>` : ''}
            </div>
            <button class="btn btn-secondary btn-sm" onclick="Goals.openMilestoneModal('${goal.id}')">
              Manage Milestones
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  getStats() {
    const total = this.goals.length;
    const completed = this.goals.filter(g => g.progress === 100).length;
    const avgProgress = total > 0 ? Math.round(this.goals.reduce((sum, g) => sum + g.progress, 0) / total) : 0;
    return { total, completed, avgProgress };
  }
};

// Export
window.Goals = Goals;
