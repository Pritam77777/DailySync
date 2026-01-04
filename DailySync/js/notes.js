// Notes Module
const Notes = {
    notes: [],
    currentNote: null,
    filter: 'all',
    searchQuery: '',
    unsubscribe: null,

    colors: [
        { name: 'default', class: 'note-default' },
        { name: 'red', class: 'note-red' },
        { name: 'orange', class: 'note-orange' },
        { name: 'yellow', class: 'note-yellow' },
        { name: 'green', class: 'note-green' },
        { name: 'blue', class: 'note-blue' },
        { name: 'purple', class: 'note-purple' },
        { name: 'pink', class: 'note-pink' },
        { name: 'teal', class: 'note-teal' }
    ],

    init() {
        this.bindEvents();
        this.setupRealtimeListener();
    },

    setupRealtimeListener() {
        if (this.unsubscribe) this.unsubscribe();

        this.unsubscribe = Database.onValue('notes', (data) => {
            this.notes = Database.toArray(data).sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return (b.updatedAt || 0) - (a.updatedAt || 0);
            });
            this.render();
        });
    },

    bindEvents() {
        const searchInput = document.getElementById('notesSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.render();
            });
        }

        const addNoteForm = document.getElementById('addNoteForm');
        if (addNoteForm) {
            addNoteForm.addEventListener('submit', (e) => this.handleSaveNote(e));
        }

        // Folder filter
        document.querySelectorAll('[data-folder]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filter = e.target.dataset.folder;
                document.querySelectorAll('[data-folder]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.render();
            });
        });
    },

    async handleSaveNote(e) {
        e.preventDefault();
        const form = e.target;

        const note = {
            title: form.querySelector('[name="title"]').value.trim() || 'Untitled',
            content: form.querySelector('[name="content"]').innerHTML,
            color: form.querySelector('[name="color"]').value || 'default',
            folder: form.querySelector('[name="folder"]').value || 'general',
            pinned: false
        };

        if (this.currentNote) {
            await Database.update(`notes/${this.currentNote}`, note);
            Toast.show('Note updated!', 'success');
        } else {
            await Database.create('notes', note);
            Toast.show('Note created!', 'success');
        }

        this.currentNote = null;
        form.reset();
        Modal.close('noteEditorModal');
    },

    openEditor(id = null) {
        this.currentNote = id;
        const form = document.getElementById('addNoteForm');

        if (id) {
            const note = this.notes.find(n => n.id === id);
            if (note) {
                form.querySelector('[name="title"]').value = note.title;
                form.querySelector('[name="content"]').innerHTML = note.content;
                form.querySelector('[name="color"]').value = note.color;
                form.querySelector('[name="folder"]').value = note.folder || 'general';
            }
        } else {
            form.reset();
            form.querySelector('[name="content"]').innerHTML = '';
        }

        Modal.open('noteEditorModal');
    },

    async togglePin(id) {
        const note = this.notes.find(n => n.id === id);
        if (note) {
            await Database.update(`notes/${id}`, { pinned: !note.pinned });
            Toast.show(note.pinned ? 'Note unpinned' : 'Note pinned', 'success');
        }
    },

    async deleteNote(id) {
        await Database.delete(`notes/${id}`);
        Toast.show('Note deleted', 'success');
    },

    async changeColor(id, color) {
        await Database.update(`notes/${id}`, { color });
    },

    getFilteredNotes() {
        let filtered = this.notes;

        if (this.filter !== 'all') {
            filtered = filtered.filter(n => n.folder === this.filter);
        }

        if (this.searchQuery) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(this.searchQuery) ||
                n.content.toLowerCase().includes(this.searchQuery)
            );
        }

        return filtered;
    },

    formatContent(content) {
        // Strip HTML and truncate
        const div = document.createElement('div');
        div.innerHTML = content;
        const text = div.textContent || div.innerText || '';
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
    },

    render() {
        const container = document.getElementById('notesList');
        if (!container) return;

        const filtered = this.getFilteredNotes();

        if (filtered.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <h3>No notes yet</h3>
          <p>Create your first note to get started!</p>
        </div>
      `;
            return;
        }

        container.innerHTML = `
      <div class="notes-grid">
        ${filtered.map(note => `
          <div class="note-card stagger-item ${note.color ? `note-${note.color}` : ''}" 
               onclick="Notes.openEditor('${note.id}')">
            ${note.pinned ? `
              <div class="note-pin">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                </svg>
              </div>
            ` : ''}
            <h4 class="note-title">${note.title}</h4>
            <p class="note-preview">${this.formatContent(note.content)}</p>
            <div class="note-footer">
              <span class="note-date">${this.formatDate(note.updatedAt)}</span>
              <div class="note-actions" onclick="event.stopPropagation()">
                <button class="btn btn-ghost btn-icon" onclick="Notes.togglePin('${note.id}')" title="${note.pinned ? 'Unpin' : 'Pin'}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
                  </svg>
                </button>
                <button class="btn btn-ghost btn-icon" onclick="Notes.deleteNote('${note.id}')" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    },

    formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    },

    // Rich text editor commands
    execCommand(command, value = null) {
        document.execCommand(command, false, value);
        document.querySelector('[name="content"]').focus();
    }
};

// Export
window.Notes = Notes;
