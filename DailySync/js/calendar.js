// Calendar Module
const Calendar = {
  currentDate: new Date(),
  view: 'month',
  events: [],
  unsubscribe: null,

  init() {
    this.bindEvents();
    this.setupRealtimeListener();
    this.render();
  },

  setupRealtimeListener() {
    if (this.unsubscribe) this.unsubscribe();

    this.unsubscribe = Database.onValue('events', (data) => {
      this.events = Database.toArray(data);
      this.render();
      // Update dashboard when events change
      if (App.currentModule === 'dashboard') {
        App.renderDashboardEvents();
      }
    });
  },

  bindEvents() {
    document.getElementById('prevMonth')?.addEventListener('click', () => this.navigate(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => this.navigate(1));
    document.getElementById('todayBtn')?.addEventListener('click', () => this.goToToday());

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.view = e.target.dataset.view;
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.render();
      });
    });

    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
      addEventForm.addEventListener('submit', (e) => this.handleAddEvent(e));
    }
  },

  navigate(direction) {
    if (this.view === 'month') {
      this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    } else if (this.view === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + direction);
    }
    this.render();
  },

  goToToday() {
    this.currentDate = new Date();
    this.render();
  },

  async handleAddEvent(e) {
    e.preventDefault();
    const form = e.target;

    const event = {
      title: form.querySelector('[name="title"]').value.trim(),
      description: form.querySelector('[name="description"]')?.value.trim() || '',
      date: form.querySelector('[name="date"]').value,
      startTime: form.querySelector('[name="startTime"]').value,
      endTime: form.querySelector('[name="endTime"]').value,
      category: form.querySelector('[name="category"]').value,
      recurring: form.querySelector('[name="recurring"]')?.checked || false,
      recurrenceRule: form.querySelector('[name="recurrenceRule"]')?.value || null
    };

    if (!event.title || !event.date) {
      Toast.show('Please fill in required fields', 'error');
      return;
    }

    await Database.create('events', event);
    form.reset();
    Modal.close('addEventModal');
    Toast.show('Event added!', 'success');
  },

  async deleteEvent(id) {
    await Database.delete(`events/${id}`);
    Toast.show('Event deleted', 'success');
  },

  getEventsForDate(date) {
    const dateStr = this.formatDateKey(date);
    return this.events.filter(e => e.date === dateStr);
  },

  formatDateKey(date) {
    return date.toISOString().split('T')[0];
  },

  getCategoryClass(category) {
    const classes = {
      work: 'category-blue',
      personal: 'category-purple',
      health: 'category-green',
      social: 'category-pink',
      other: 'category-teal'
    };
    return classes[category] || 'category-blue';
  },

  render() {
    const container = document.getElementById('calendarContainer');
    if (!container) return;

    const header = document.getElementById('calendarHeader');
    if (header) {
      header.textContent = this.currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    }

    if (this.view === 'month') {
      this.renderMonthView(container);
    } else if (this.view === 'week') {
      this.renderWeekView(container);
    } else {
      this.renderDayView(container);
    }
  },

  renderMonthView(container) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const today = new Date();

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = `
      <div class="calendar-grid">
        <div class="calendar-days-header">
          ${days.map(d => `<div class="calendar-day-name">${d}</div>`).join('')}
        </div>
        <div class="calendar-days">
    `;

    // Previous month days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      html += `<div class="calendar-day other-month">${prevDate.getDate()}</div>`;
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === today.toDateString();
      const events = this.getEventsForDate(date);

      html += `
        <div class="calendar-day ${isToday ? 'today' : ''}" 
             onclick="Calendar.showDayEvents('${this.formatDateKey(date)}')">
          <span class="day-number">${day}</span>
          ${events.length > 0 ? `
            <div class="day-events">
              ${events.slice(0, 3).map(e => `
                <div class="event-dot ${this.getCategoryClass(e.category)}"></div>
              `).join('')}
              ${events.length > 3 ? `<span class="more-events">+${events.length - 3}</span>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Next month days
    const remainingDays = 42 - (startingDay + totalDays);
    for (let i = 1; i <= remainingDays; i++) {
      html += `<div class="calendar-day other-month">${i}</div>`;
    }

    html += `</div></div>`;
    container.innerHTML = html;
  },

  renderWeekView(container) {
    const startOfWeek = new Date(this.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(date.getDate() + i);
      days.push(date);
    }

    const today = new Date();

    let html = `<div class="week-view">`;

    days.forEach(date => {
      const isToday = date.toDateString() === today.toDateString();
      const events = this.getEventsForDate(date);

      html += `
        <div class="week-day ${isToday ? 'today' : ''}">
          <div class="week-day-header">
            <span class="week-day-name">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span class="week-day-number">${date.getDate()}</span>
          </div>
          <div class="week-day-events">
            ${events.map(e => `
              <div class="event-card ${this.getCategoryClass(e.category)}" 
                   onclick="Calendar.showEventDetails('${e.id}')">
                <span class="event-time">${e.startTime || ''}</span>
                <span class="event-title">${e.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
  },

  renderDayView(container) {
    const events = this.getEventsForDate(this.currentDate);
    const today = new Date();
    const isToday = this.currentDate.toDateString() === today.toDateString();

    const hours = Array.from({ length: 24 }, (_, i) => i);

    let html = `
      <div class="day-view">
        <div class="day-header ${isToday ? 'today' : ''}">
          <span class="day-name">${this.currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</span>
          <span class="day-date">${this.currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="day-timeline">
          ${hours.map(hour => {
      const hourEvents = events.filter(e => {
        if (!e.startTime) return false;
        const eventHour = parseInt(e.startTime.split(':')[0]);
        return eventHour === hour;
      });

      return `
              <div class="timeline-hour">
                <span class="hour-label">${hour.toString().padStart(2, '0')}:00</span>
                <div class="hour-events">
                  ${hourEvents.map(e => `
                    <div class="event-card ${this.getCategoryClass(e.category)}"
                         onclick="Calendar.showEventDetails('${e.id}')">
                      <span class="event-time">${e.startTime} - ${e.endTime}</span>
                      <span class="event-title">${e.title}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
    }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  showDayEvents(dateStr) {
    const events = this.events.filter(e => e.date === dateStr);
    const date = new Date(dateStr);

    const content = events.length > 0 ? events.map(e => `
      <div class="event-item ${this.getCategoryClass(e.category)}">
        <div class="event-info">
          <h4>${e.title}</h4>
          ${e.startTime ? `<p>${e.startTime} - ${e.endTime}</p>` : ''}
          ${e.description ? `<p class="text-secondary">${e.description}</p>` : ''}
        </div>
        <button class="btn btn-ghost btn-icon" onclick="Calendar.deleteEvent('${e.id}')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `).join('') : '<p class="text-secondary text-center">No events for this day</p>';

    Modal.open('dayEventsModal', {
      title: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      content
    });
  },

  showEventDetails(id) {
    const event = this.events.find(e => e.id === id);
    if (!event) return;

    Modal.open('eventDetailsModal', {
      title: event.title,
      content: `
        <div class="event-details">
          <p><strong>Date:</strong> ${event.date}</p>
          ${event.startTime ? `<p><strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>` : ''}
          ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
          <p><strong>Category:</strong> <span class="badge badge-${event.category}">${event.category}</span></p>
        </div>
        <div class="modal-actions mt-md">
          <button class="btn btn-danger" onclick="Calendar.deleteEvent('${id}'); Modal.close('eventDetailsModal');">Delete Event</button>
        </div>
      `
    });
  }
};

// Export
window.Calendar = Calendar;
