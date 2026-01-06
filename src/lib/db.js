
const DB_KEYS = {
    USERS: 'pos_users',
    PRODUCTS: 'pos_products',
    INVENTORY: 'pos_inventory',
    RECIPES: 'pos_recipes',
    SHIFTS: 'pos_shifts',
    TRANSACTIONS: 'pos_transactions',
    SETTINGS: 'pos_settings',
    EXPENSES: 'pos_expenses',
};

// Initial Seed Data
const SEED_DATA = {
    users: [
        { id: 'u1', name: 'Owner', role: 'ADMIN', pin: '1234' }, // Can do everything
        { id: 'u2', name: 'Budi (Kasir)', role: 'CASHIER', pin: '0000' }, // POS Only
        { id: 'u3', name: 'Siti (Gudang)', role: 'INVENTORY', pin: '5678' }, // Inventory Only
        { id: 'u4', name: 'Finance Staff', role: 'FINANCE', pin: '9999' }, // Reports & Transactions Only
    ],
    inventory: [
        { id: 'i1', name: 'Kopi Arabica (Gram)', unit: 'gr', stock: 1000, cost: 300, minStock: 200 },
        { id: 'i2', name: 'Susu UHT (ML)', unit: 'ml', stock: 5000, cost: 20, minStock: 1000 },
        { id: 'i3', name: 'Gula Aren (ML)', unit: 'ml', stock: 2000, cost: 50, minStock: 500 },
        { id: 'i4', name: 'Cup 12oz', unit: 'pcs', stock: 500, cost: 800, minStock: 50 },
    ],
    products: [
        { id: 'p1', name: 'Kopi Susu Gula Aren', price: 18000, category: 'Coffee', image: '☕' },
        { id: 'p2', name: 'Americano', price: 15000, category: 'Coffee', image: '🥃' },
        { id: 'p3', name: 'Croissant', price: 25000, category: 'Food', image: '🥐' },
    ],
    recipes: [
        // Kopi Susu: 15gr Kopi + 100ml Susu + 20ml Gula + 1 Cup
        {
            productId: 'p1', ingredients: [
                { inventoryId: 'i1', qty: 15 },
                { inventoryId: 'i2', qty: 100 },
                { inventoryId: 'i3', qty: 20 },
                { inventoryId: 'i4', qty: 1 },
            ]
        },
        // Americano: 18gr Kopi + 1 Cup
        {
            productId: 'p2', ingredients: [
                { inventoryId: 'i1', qty: 18 },
                { inventoryId: 'i4', qty: 1 },
            ]
        }
    ],
    expenses: [],
};

export const db = {
    init: () => {
        if (typeof window === 'undefined') return;

        if (!localStorage.getItem(DB_KEYS.USERS)) {
            console.log('Seeding Database...');
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(SEED_DATA.users));
            localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(SEED_DATA.products));
            localStorage.setItem(DB_KEYS.INVENTORY, JSON.stringify(SEED_DATA.inventory));
            localStorage.setItem(DB_KEYS.RECIPES, JSON.stringify(SEED_DATA.recipes));
            localStorage.setItem(DB_KEYS.SHIFTS, JSON.stringify(SEED_DATA.expenses)); // Intentional blank
            localStorage.setItem(DB_KEYS.SHIFTS, JSON.stringify([]));
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify([]));
            localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify([]));
            localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify({
                storeName: "POS SYSTEM DEMO",
                storeAddress: "Jl. Teknologi No. 1",
                footerMessage: "TERIMA KASIH",
                showDashLines: true,
                showFooter: true
            }));
        }
    },

    get: (collection) => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(DB_KEYS[collection.toUpperCase()]);
        return data ? JSON.parse(data) : [];
    },

    add: (collection, item) => {
        const items = db.get(collection);
        items.push(item);
        localStorage.setItem(DB_KEYS[collection.toUpperCase()], JSON.stringify(items));
        return item;
    },

    update: (collection, id, updates) => {
        const items = db.get(collection);
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem(DB_KEYS[collection.toUpperCase()], JSON.stringify(items));
            return items[index];
        }
        return null;
    },

    delete: (collection, id) => {
        const items = db.get(collection);
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem(DB_KEYS[collection.toUpperCase()], JSON.stringify(filtered));
        return true;
    },

    // Specific Helpers
    getOpenShift: () => {
        const shifts = db.get('shifts');
        return shifts.find(s => s.status === 'OPEN');
    },

    getProductRecipe: (productId) => {
        const recipes = db.get('recipes');
        return recipes.find(r => r.productId === productId);
    }
};
