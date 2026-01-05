// Onboarding Tour System
const OnboardingTour = {
    isActive: false,
    currentStep: 0,
    overlay: null,

    steps: [
        {
            target: '.sidebar-logo',
            title: 'Welcome to DailySync! 👋',
            content: 'Your all-in-one productivity companion. Let me show you around!',
            position: 'right'
        },
        {
            target: '[data-module="todos"]',
            title: 'Task Management 📝',
            content: 'Organize your tasks with priorities, due dates, and categories. Press Ctrl+N to quickly add a task!',
            position: 'right'
        },
        {
            target: '[data-module="calendar"]',
            title: 'Calendar 📅',
            content: 'View your events in month, week, or day view. Drag events to reschedule them.',
            position: 'right'
        },
        {
            target: '[data-module="habits"]',
            title: 'Habit Tracker 🎯',
            content: 'Build positive habits with daily tracking and streak monitoring.',
            position: 'right'
        },
        {
            target: '[data-module="timer"]',
            title: 'Focus Timer ⏱️',
            content: 'Stay focused with the Pomodoro timer. Choose ambient sounds and track your focus streaks!',
            position: 'right'
        },
        {
            target: '[data-module="goals"]',
            title: 'Goals 🏆',
            content: 'Set long-term goals with milestones and track your progress over time.',
            position: 'right'
        },
        {
            target: '.sidebar-footer',
            title: 'Quick Tip 💡',
            content: 'Press Ctrl+K anywhere to open the command bar for quick navigation and actions!',
            position: 'right'
        }
    ],

    init() {
        // Check if tour should be shown
        this.checkFirstVisit();
    },

    checkFirstVisit() {
        const hasSeenTour = localStorage.getItem('dailysync_tour_complete');
        if (!hasSeenTour && App.profile?.onboardingComplete) {
            // Show tour after a short delay
            setTimeout(() => this.start(), 1500);
        }
    },

    start() {
        this.isActive = true;
        this.currentStep = 0;
        this.createOverlay();
        this.showStep(0);
    },

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.innerHTML = `
            <div class="tour-spotlight"></div>
            <div class="tour-tooltip">
                <div class="tour-tooltip-header">
                    <span class="tour-step-indicator"></span>
                    <button class="tour-skip-btn" onclick="OnboardingTour.end()">Skip</button>
                </div>
                <h3 class="tour-title"></h3>
                <p class="tour-content"></p>
                <div class="tour-actions">
                    <button class="btn btn-ghost tour-prev" onclick="OnboardingTour.prev()">Previous</button>
                    <button class="btn btn-primary tour-next" onclick="OnboardingTour.next()">Next</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    },

    showStep(index) {
        if (index < 0 || index >= this.steps.length) return;

        this.currentStep = index;
        const step = this.steps[index];
        const target = document.querySelector(step.target);

        if (!target) {
            this.next();
            return;
        }

        // Update spotlight position
        const rect = target.getBoundingClientRect();
        const spotlight = this.overlay.querySelector('.tour-spotlight');
        const padding = 8;

        spotlight.style.top = `${rect.top - padding}px`;
        spotlight.style.left = `${rect.left - padding}px`;
        spotlight.style.width = `${rect.width + padding * 2}px`;
        spotlight.style.height = `${rect.height + padding * 2}px`;

        // Update tooltip
        const tooltip = this.overlay.querySelector('.tour-tooltip');
        const title = this.overlay.querySelector('.tour-title');
        const content = this.overlay.querySelector('.tour-content');
        const indicator = this.overlay.querySelector('.tour-step-indicator');
        const prevBtn = this.overlay.querySelector('.tour-prev');
        const nextBtn = this.overlay.querySelector('.tour-next');

        title.textContent = step.title;
        content.textContent = step.content;
        indicator.textContent = `${index + 1} of ${this.steps.length}`;

        // Position tooltip
        this.positionTooltip(tooltip, rect, step.position);

        // Update buttons
        prevBtn.style.display = index === 0 ? 'none' : 'block';
        nextBtn.textContent = index === this.steps.length - 1 ? 'Finish' : 'Next';

        // Highlight target
        target.classList.add('tour-highlighted');
    },

    positionTooltip(tooltip, targetRect, position) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const margin = 20;

        let top, left;

        switch (position) {
            case 'right':
                top = targetRect.top;
                left = targetRect.right + margin;
                break;
            case 'left':
                top = targetRect.top;
                left = targetRect.left - tooltipRect.width - margin;
                break;
            case 'bottom':
                top = targetRect.bottom + margin;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            case 'top':
                top = targetRect.top - tooltipRect.height - margin;
                left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
                break;
            default:
                top = targetRect.bottom + margin;
                left = targetRect.left;
        }

        // Keep tooltip within viewport
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipRect.height - margin));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    },

    next() {
        // Remove highlight from current
        const currentTarget = document.querySelector(this.steps[this.currentStep]?.target);
        currentTarget?.classList.remove('tour-highlighted');

        if (this.currentStep >= this.steps.length - 1) {
            this.end();
        } else {
            this.showStep(this.currentStep + 1);
        }
    },

    prev() {
        // Remove highlight from current
        const currentTarget = document.querySelector(this.steps[this.currentStep]?.target);
        currentTarget?.classList.remove('tour-highlighted');

        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    },

    end() {
        this.isActive = false;

        // Remove highlights
        document.querySelectorAll('.tour-highlighted').forEach(el => {
            el.classList.remove('tour-highlighted');
        });

        // Remove overlay
        this.overlay?.remove();
        this.overlay = null;

        // Mark tour as complete
        localStorage.setItem('dailysync_tour_complete', 'true');

        Toast.show('Tour complete! Press ? to see keyboard shortcuts anytime.', 'success');
    },

    // Restart tour from settings
    restart() {
        localStorage.removeItem('dailysync_tour_complete');
        this.start();
    }
};

// Export
window.OnboardingTour = OnboardingTour;
