// Routines Module
const Routines = {
  routines: [],
  unsubscribe: null,

  templates: {
    morning: [
      { title: 'Wake up', duration: 5, icon: 'alarm' },
      { title: 'Drink water', duration: 2, icon: 'droplet' },
      { title: 'Stretch / Exercise', duration: 30, icon: 'activity' },
      { title: 'Shower', duration: 15, icon: 'droplets' },
      { title: 'Breakfast', duration: 20, icon: 'coffee' },
      { title: 'Review tasks', duration: 10, icon: 'clipboard' }
    ],
    evening: [
      { title: 'Review day', duration: 10, icon: 'book-open' },
      { title: 'Prepare for tomorrow', duration: 15, icon: 'calendar' },
      { title: 'Light reading', duration: 30, icon: 'book' },
      { title: 'Skincare routine', duration: 10, icon: 'sparkles' },
      { title: 'Meditation', duration: 10, icon: 'heart' },
      { title: 'Sleep', duration: 0, icon: 'moon' }
    ]
  },

  getActivityIcon(iconName) {
    const icons = {
      'alarm': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3 2 6"/><path d="m22 6-3-3"/></svg>',
      'droplet': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
      'activity': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
      'droplets': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>',
      'coffee': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>',
      'clipboard': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
      'book-open': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
      'calendar': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
      'book': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
      'sparkles': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
      'heart': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
      'moon': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
      'sun': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
      'list': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>'
    };
    return icons[iconName] || icons['list'];
  },

  init() {
    this.bindEvents();
    this.setupRealtimeListener();
  },

  setupRealtimeListener() {
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = Database.onValue('routines', (data) => {
      this.routines = Database.toArray(data);
      this.render();
    });
  },

  bindEvents() {
    const addRoutineForm = document.getElementById('addRoutineForm');
    if (addRoutineForm) {
      addRoutineForm.addEventListener('submit', (e) => this.handleAddRoutine(e));
    }

    document.getElementById('useMorningTemplate')?.addEventListener('click', () => {
      this.createFromTemplate('morning');
    });

    document.getElementById('useEveningTemplate')?.addEventListener('click', () => {
      this.createFromTemplate('evening');
    });
  },

  async handleAddRoutine(e) {
    e.preventDefault();
    const form = e.target;

    const routine = {
      name: form.querySelector('[name="name"]').value.trim(),
      type: form.querySelector('[name="type"]').value || 'custom',
      activities: [],
      active: false
    };

    if (!routine.name) {
      Toast.show('Please enter a routine name', 'error');
      return;
    }

    await Database.create('routines', routine);
    form.reset();
    Modal.close('addRoutineModal');
    Toast.show('Routine created!', 'success');
  },

  async createFromTemplate(type) {
    const template = this.templates[type];
    if (!template) return;

    const routine = {
      name: type === 'morning' ? 'Morning Routine' : 'Evening Routine',
      type,
      activities: template.map((t, index) => ({
        id: Date.now().toString() + index,
        ...t,
        completed: false,
        order: index
      })),
      active: false
    };

    await Database.create('routines', routine);
    Toast.show(`${type.charAt(0).toUpperCase() + type.slice(1)} routine created!`, 'success');
  },

  async addActivity(routineId, activity) {
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return;

    const activities = routine.activities || [];
    activities.push({
      id: Date.now().toString(),
      title: activity.title,
      duration: activity.duration || 15,
      icon: activity.icon || 'list',
      completed: false,
      order: activities.length
    });

    await Database.update(`routines/${routineId}`, { activities });
  },

  async toggleActivity(routineId, activityId) {
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return;

    const activities = (routine.activities || []).map(a => {
      if (a.id === activityId) {
        return { ...a, completed: !a.completed };
      }
      return a;
    });

    await Database.update(`routines/${routineId}`, { activities });
  },

  async deleteActivity(routineId, activityId) {
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return;

    const activities = (routine.activities || []).filter(a => a.id !== activityId);

    await Database.update(`routines/${routineId}`, { activities });
  },

  async updateActivityOrder(routineId, orderedIds) {
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return;

    const activities = (routine.activities || []).map(a => ({
      ...a,
      order: orderedIds.indexOf(a.id)
    })).sort((a, b) => a.order - b.order);

    await Database.update(`routines/${routineId}`, { activities });
  },

  async toggleActive(routineId) {
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return;

    // Reset all activities when activating
    const activities = (routine.activities || []).map(a => ({
      ...a,
      completed: false
    }));

    await Database.update(`routines/${routineId}`, {
      active: !routine.active,
      activities
    });

    if (!routine.active) {
      Toast.show('Routine activated! Let\'s go!', 'success');
    }
  },

  async deleteRoutine(id) {
    await Database.delete(`routines/${id}`);
    Toast.show('Routine deleted', 'success');
  },

  getProgress(routine) {
    if (!routine.activities || routine.activities.length === 0) return 0;
    const completed = routine.activities.filter(a => a.completed).length;
    return Math.round((completed / routine.activities.length) * 100);
  },

  getTotalDuration(routine) {
    if (!routine.activities) return 0;
    return routine.activities.reduce((sum, a) => sum + (a.duration || 0), 0);
  },

  openRoutineEditor(routineId) {
    const routine = this.routines.find(r => r.id === routineId);
    if (!routine) return;

    const activities = (routine.activities || []).sort((a, b) => (a.order || 0) - (b.order || 0));

    const content = `
      <div class="routine-activities" id="routineActivitiesList" data-routine-id="${routineId}">
        ${activities.map(a => `
          <div class="activity-item ${a.completed ? 'completed' : ''}" data-id="${a.id}" draggable="true">
            <span class="drag-handle"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg></span>
            <span class="activity-icon">${this.getActivityIcon(a.icon)}</span>
            <div class="activity-info">
              <span class="activity-title">${a.title}</span>
              <span class="activity-duration">${a.duration} min</span>
            </div>
            <button class="btn btn-ghost btn-icon" onclick="Routines.deleteActivity('${routineId}', '${a.id}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
      <div class="add-activity-form mt-md">
        <div class="flex gap-sm">
          <input type="text" id="newActivityTitle" class="form-input" placeholder="Activity name...">
          <input type="number" id="newActivityDuration" class="form-input" style="width: 80px" placeholder="Min" value="15">
        </div>
        <button class="btn btn-primary mt-sm w-full" onclick="Routines.handleAddActivityFromModal('${routineId}')">
          Add Activity
        </button>
      </div>
    `;

    Modal.open('routineEditorModal', {
      title: `Edit: ${routine.name}`,
      content
    });

    this.setupActivityDragAndDrop(routineId);
  },

  handleAddActivityFromModal(routineId) {
    const titleInput = document.getElementById('newActivityTitle');
    const durationInput = document.getElementById('newActivityDuration');

    if (titleInput && titleInput.value.trim()) {
      this.addActivity(routineId, {
        title: titleInput.value.trim(),
        duration: parseInt(durationInput.value) || 15
      });
      titleInput.value = '';
    }
  },

  setupActivityDragAndDrop(routineId) {
    setTimeout(() => {
      const list = document.getElementById('routineActivitiesList');
      if (!list) return;

      const items = list.querySelectorAll('.activity-item');
      let draggedItem = null;

      items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          draggedItem = item;
          item.classList.add('dragging');
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          draggedItem = null;

          const newOrder = Array.from(list.querySelectorAll('.activity-item'))
            .map(el => el.dataset.id);
          this.updateActivityOrder(routineId, newOrder);
        });

        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          if (draggedItem && item !== draggedItem) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
              list.insertBefore(draggedItem, item);
            } else {
              list.insertBefore(draggedItem, item.nextSibling);
            }
          }
        });
      });
    }, 100);
  },

  render() {
    const container = document.getElementById('routinesList');
    if (!container) return;

    if (this.routines.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 17-3.5-2"/>
            <path d="M6.8 9 3.3 7"/><path d="m20.7 7-3.5 2"/><circle cx="12" cy="12" r="4"/>
          </svg>
          <h3>No routines yet</h3>
          <p>Create your morning or evening routine!</p>
          <div class="empty-state-actions mt-md">
            <button class="btn btn-primary btn-sm" id="useMorningTemplate">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              Morning Routine
            </button>
            <button class="btn btn-secondary btn-sm" id="useEveningTemplate">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              Evening Routine
            </button>
          </div>
        </div>
      `;

      // Re-bind template buttons
      document.getElementById('useMorningTemplate')?.addEventListener('click', () => {
        this.createFromTemplate('morning');
      });
      document.getElementById('useEveningTemplate')?.addEventListener('click', () => {
        this.createFromTemplate('evening');
      });
      return;
    }

    container.innerHTML = this.routines.map(routine => {
      const progress = this.getProgress(routine);
      const totalDuration = this.getTotalDuration(routine);
      const activities = (routine.activities || []).sort((a, b) => (a.order || 0) - (b.order || 0));

      return `
        <div class="routine-card stagger-item ${routine.active ? 'active' : ''}">
          <div class="routine-header">
            <div class="routine-info">
              <span class="routine-type-icon">${routine.type === 'morning' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-orange)" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>' : routine.type === 'evening' ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>'}</span>
              <div>
                <h4>${routine.name}</h4>
                <span class="text-secondary text-sm">${activities.length} activities • ${totalDuration} min</span>
              </div>
            </div>
            <div class="routine-actions">
              <button class="btn ${routine.active ? 'btn-primary' : 'btn-secondary'}" 
                      onclick="Routines.toggleActive('${routine.id}')">
                ${routine.active ? 'Active' : 'Start'}
              </button>
              <button class="btn btn-ghost btn-icon" onclick="Routines.openRoutineEditor('${routine.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                </svg>
              </button>
              <button class="btn btn-ghost btn-icon" onclick="Routines.deleteRoutine('${routine.id}')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          
          ${routine.active ? `
            <div class="routine-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <span class="text-sm">${progress}% complete</span>
            </div>
            
            <div class="routine-activities-list">
              ${activities.map(a => `
                <div class="activity-check-item ${a.completed ? 'completed' : ''}" 
                     onclick="Routines.toggleActivity('${routine.id}', '${a.id}')">
                  <div class="activity-check ${a.completed ? 'checked' : ''}">
                    ${a.completed ? `
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    ` : ''}
                  </div>
                  <span class="activity-icon">${this.getActivityIcon(a.icon)}</span>
                  <span class="activity-title ${a.completed ? 'line-through' : ''}">${a.title}</span>
                  <span class="activity-duration">${a.duration}m</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }
};

// Export
window.Routines = Routines;
