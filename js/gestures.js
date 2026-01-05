// Mobile Gestures System
const Gestures = {
    threshold: 50, // Minimum swipe distance
    restraint: 100, // Maximum perpendicular distance
    allowedTime: 300, // Max time for swipe

    elements: new Map(),

    init() {
        this.bindSwipeableElements();
    },

    bindSwipeableElements() {
        // Bind to task items
        document.querySelectorAll('.task-item, .habit-item, .note-item').forEach(el => {
            this.makeSwipeable(el);
        });

        // Re-bind when new items are added (MutationObserver)
        this.observeNewElements();
    },

    observeNewElements() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.classList?.contains('task-item') ||
                            node.classList?.contains('habit-item') ||
                            node.classList?.contains('note-item')) {
                            this.makeSwipeable(node);
                        }
                        // Check children
                        node.querySelectorAll?.('.task-item, .habit-item, .note-item')
                            .forEach(el => this.makeSwipeable(el));
                    }
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    },

    makeSwipeable(element) {
        if (this.elements.has(element)) return;

        const state = {
            startX: 0,
            startY: 0,
            startTime: 0,
            isSwIping: false,
            currentX: 0
        };

        this.elements.set(element, state);

        // Create swipe action indicators
        this.createSwipeIndicators(element);

        element.addEventListener('touchstart', (e) => this.handleTouchStart(e, element), { passive: true });
        element.addEventListener('touchmove', (e) => this.handleTouchMove(e, element), { passive: false });
        element.addEventListener('touchend', (e) => this.handleTouchEnd(e, element), { passive: true });
    },

    createSwipeIndicators(element) {
        // Left swipe indicator (delete)
        const leftIndicator = document.createElement('div');
        leftIndicator.className = 'swipe-indicator swipe-left';
        leftIndicator.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
        `;

        // Right swipe indicator (complete)
        const rightIndicator = document.createElement('div');
        rightIndicator.className = 'swipe-indicator swipe-right';
        rightIndicator.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        `;

        // Wrap content
        const wrapper = document.createElement('div');
        wrapper.className = 'swipe-wrapper';

        // Move children to wrapper
        while (element.firstChild) {
            wrapper.appendChild(element.firstChild);
        }

        element.appendChild(leftIndicator);
        element.appendChild(rightIndicator);
        element.appendChild(wrapper);
        element.classList.add('swipeable');
    },

    handleTouchStart(e, element) {
        const state = this.elements.get(element);
        if (!state) return;

        const touch = e.touches[0];
        state.startX = touch.pageX;
        state.startY = touch.pageY;
        state.startTime = Date.now();
        state.isSwiping = true;
    },

    handleTouchMove(e, element) {
        const state = this.elements.get(element);
        if (!state || !state.isSwiping) return;

        const touch = e.touches[0];
        const distX = touch.pageX - state.startX;
        const distY = touch.pageY - state.startY;

        // Check if horizontal swipe
        if (Math.abs(distX) > Math.abs(distY)) {
            e.preventDefault();

            // Limit swipe distance
            const maxSwipe = 100;
            const limitedDist = Math.max(-maxSwipe, Math.min(maxSwipe, distX));

            state.currentX = limitedDist;

            // Apply transform
            const wrapper = element.querySelector('.swipe-wrapper');
            if (wrapper) {
                wrapper.style.transform = `translateX(${limitedDist}px)`;
                wrapper.style.transition = 'none';
            }

            // Show indicators based on direction
            const leftIndicator = element.querySelector('.swipe-left');
            const rightIndicator = element.querySelector('.swipe-right');

            if (distX < -this.threshold / 2) {
                leftIndicator?.classList.add('visible');
                rightIndicator?.classList.remove('visible');
            } else if (distX > this.threshold / 2) {
                rightIndicator?.classList.add('visible');
                leftIndicator?.classList.remove('visible');
            } else {
                leftIndicator?.classList.remove('visible');
                rightIndicator?.classList.remove('visible');
            }
        }
    },

    handleTouchEnd(e, element) {
        const state = this.elements.get(element);
        if (!state) return;

        const elapsedTime = Date.now() - state.startTime;
        const distX = state.currentX;

        // Reset position
        const wrapper = element.querySelector('.swipe-wrapper');
        if (wrapper) {
            wrapper.style.transition = 'transform 0.3s ease';
            wrapper.style.transform = 'translateX(0)';
        }

        // Hide indicators
        element.querySelectorAll('.swipe-indicator').forEach(ind => {
            ind.classList.remove('visible');
        });

        // Check if swipe was valid
        if (elapsedTime <= this.allowedTime) {
            if (distX >= this.threshold) {
                // Swipe right - complete action
                this.handleSwipeRight(element);
            } else if (distX <= -this.threshold) {
                // Swipe left - delete action
                this.handleSwipeLeft(element);
            }
        }

        state.isSwiping = false;
        state.currentX = 0;
    },

    handleSwipeRight(element) {
        // Complete task/habit
        const itemId = element.dataset.id;

        if (element.classList.contains('task-item')) {
            if (typeof Todos !== 'undefined' && Todos.toggleTask) {
                Todos.toggleTask(itemId);
                this.showSwipeFeedback(element, 'complete');
            }
        } else if (element.classList.contains('habit-item')) {
            if (typeof Habits !== 'undefined' && Habits.toggleHabit) {
                Habits.toggleHabit(itemId);
                this.showSwipeFeedback(element, 'complete');
            }
        }
    },

    handleSwipeLeft(element) {
        // Delete item
        const itemId = element.dataset.id;

        // Confirm deletion
        if (confirm('Delete this item?')) {
            if (element.classList.contains('task-item')) {
                if (typeof Todos !== 'undefined' && Todos.deleteTask) {
                    this.animateRemoval(element, () => {
                        Todos.deleteTask(itemId);
                    });
                }
            } else if (element.classList.contains('habit-item')) {
                if (typeof Habits !== 'undefined' && Habits.deleteHabit) {
                    this.animateRemoval(element, () => {
                        Habits.deleteHabit(itemId);
                    });
                }
            } else if (element.classList.contains('note-item')) {
                if (typeof Notes !== 'undefined' && Notes.deleteNote) {
                    this.animateRemoval(element, () => {
                        Notes.deleteNote(itemId);
                    });
                }
            }
        }
    },

    showSwipeFeedback(element, action) {
        element.classList.add(`swipe-${action}`);

        // Trigger haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        setTimeout(() => {
            element.classList.remove(`swipe-${action}`);
        }, 500);
    },

    animateRemoval(element, callback) {
        element.style.transition = 'all 0.3s ease';
        element.style.transform = 'translateX(-100%)';
        element.style.opacity = '0';
        element.style.height = element.offsetHeight + 'px';

        setTimeout(() => {
            element.style.height = '0';
            element.style.padding = '0';
            element.style.margin = '0';
        }, 100);

        setTimeout(() => {
            callback();
        }, 400);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Only init on touch devices
    if ('ontouchstart' in window) {
        Gestures.init();
    }
});

// Export
window.Gestures = Gestures;
