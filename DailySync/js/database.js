// Database Utilities
const Database = {
    // Generic CRUD operations
    async create(path, data) {
        const user = auth.currentUser;
        if (!user) return null;

        const ref = database.ref(`users/${user.uid}/${path}`).push();
        const id = ref.key;
        const timestamp = Date.now();

        await ref.set({
            ...data,
            id,
            createdAt: timestamp,
            updatedAt: timestamp
        });

        return id;
    },

    async read(path) {
        const user = auth.currentUser;
        if (!user) return null;

        const snapshot = await database.ref(`users/${user.uid}/${path}`).once('value');
        return snapshot.val();
    },

    async update(path, data) {
        const user = auth.currentUser;
        if (!user) return;

        await database.ref(`users/${user.uid}/${path}`).update({
            ...data,
            updatedAt: Date.now()
        });
    },

    async delete(path) {
        const user = auth.currentUser;
        if (!user) return;

        await database.ref(`users/${user.uid}/${path}`).remove();
    },

    async set(path, data) {
        const user = auth.currentUser;
        if (!user) return;

        await database.ref(`users/${user.uid}/${path}`).set(data);
    },

    // Real-time listener
    onValue(path, callback) {
        const user = auth.currentUser;
        if (!user) return () => { };

        const ref = database.ref(`users/${user.uid}/${path}`);
        ref.on('value', (snapshot) => {
            callback(snapshot.val());
        });

        return () => ref.off('value');
    },

    // Convert Firebase object to array
    toArray(obj) {
        if (!obj) return [];
        return Object.keys(obj).map(key => ({ ...obj[key], id: key }));
    },

    // Profile operations
    async updateProfile(data) {
        const user = auth.currentUser;
        if (!user) return;

        await database.ref(`users/${user.uid}/profile`).update(data);
    },

    async getProfile() {
        const user = auth.currentUser;
        if (!user) return null;

        const snapshot = await database.ref(`users/${user.uid}/profile`).once('value');
        return snapshot.val();
    }
};

// IndexedDB for offline storage
const OfflineDB = {
    dbName: 'DailySyncOffline',
    version: 1,
    db: null,

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;

                const stores = ['todos', 'events', 'notes', 'habits', 'goals', 'routines', 'profile'];
                stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: 'id' });
                    }
                });
            };
        });
    },

    async save(storeName, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.put(data);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    },

    async get(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async getAll(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },

    async remove(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            store.delete(id);

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
};

// Export
window.Database = Database;
window.OfflineDB = OfflineDB;
