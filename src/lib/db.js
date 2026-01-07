
import { supabase } from './supabase';

const DB_KEYS = {
    USERS: 'users',
    PRODUCTS: 'products',
    INVENTORY: 'inventory',
    RECIPES: 'recipes',
    SHIFTS: 'shifts',
    TRANSACTIONS: 'transactions',
    SETTINGS: 'settings',
    EXPENSES: 'expenses',
};

// Initial Seed Data (Keep for fallback seeding)
const SEED_DATA = {
    users: [
        { id: 'u1', name: 'Owner', role: 'ADMIN', pin: '1234' }, // Can do everything
        { id: 'u2', name: 'Budi (Kasir)', role: 'CASHIER', pin: '0000' }, // POS Only
        { id: 'u3', name: 'Siti (Gudang)', role: 'INVENTORY', pin: '1111' }, // Inventory Only
        { id: 'u4', name: 'Budi Keuangan', role: 'FINANCE', pin: '9999' } // Finance Only
    ],
    inventory: [
        { id: 'i1', name: 'Kopi Arabica (Gram)', unit: 'gr', stock: 1000, cost: 300, min_stock: 200 }, // Schema snake_case for min_stock
        { id: 'i2', name: 'Susu UHT (ML)', unit: 'ml', stock: 5000, cost: 20, min_stock: 1000 },
        { id: 'i3', name: 'Gula Aren (ML)', unit: 'ml', stock: 2000, cost: 50, min_stock: 500 },
        { id: 'i4', name: 'Cup 12oz', unit: 'pcs', stock: 500, cost: 800, min_stock: 50 },
    ],
    products: [
        { id: 'p1', name: 'Kopi Susu Gula Aren', price: 18000, category: 'Coffee', image: '☕' },
        { id: 'p2', name: 'Americano', price: 15000, category: 'Coffee', image: '🥃' },
        { id: 'p3', name: 'Croissant', price: 25000, category: 'Food', image: '🥐' },
    ],
    recipes: [
        // Kopi Susu: 15gr Kopi + 100ml Susu + 20ml Gula + 1 Cup
        {
            product_id: 'p1',
            ingredients: JSON.stringify([ // Schema stores JSONB
                { inventoryId: 'i1', qty: 15 },
                { inventoryId: 'i2', qty: 100 },
                { inventoryId: 'i3', qty: 20 },
                { inventoryId: 'i4', qty: 1 },
            ])
        },
        // Americano: 18gr Kopi + 1 Cup
        {
            product_id: 'p2',
            ingredients: JSON.stringify([
                { inventoryId: 'i1', qty: 18 },
                { inventoryId: 'i4', qty: 1 },
            ])
        }
    ]
};

export const db = {
    // Check connection & Seed if empty
    init: async () => {
        try {
            console.log('Checking Database status...');

            // 1. Check Users
            const { data: users, error: userErr } = await supabase.from('users').select('id').limit(1);
            if (!userErr && (!users || users.length === 0)) {
                console.log('Seeding Users...');
                await supabase.from('users').insert(SEED_DATA.users);
            }

            // 2. Check Inventory
            const { data: inventory, error: invErr } = await supabase.from('inventory').select('id').limit(1);
            if (!invErr && (!inventory || inventory.length === 0)) {
                console.log('Seeding Inventory...');
                await supabase.from('inventory').insert(SEED_DATA.inventory);
            }

            // 3. Check Products
            const { data: products, error: prodErr } = await supabase.from('products').select('id').limit(1);
            if (!prodErr && (!products || products.length === 0)) {
                console.log('Seeding Products...');
                await supabase.from('products').insert(SEED_DATA.products);
            }

            // 4. Check Recipes
            const { data: recipes, error: rcpErr } = await supabase.from('recipes').select('product_id').limit(1);
            if (!rcpErr && (!recipes || recipes.length === 0)) {
                console.log('Seeding Recipes...');
                await supabase.from('recipes').insert(SEED_DATA.recipes);
            }

            // 5. Check Settings
            const { data: settings, error: setErr } = await supabase.from('settings').select('id').limit(1);
            if (!setErr && (!settings || settings.length === 0)) {
                console.log('Seeding Settings...');
                await supabase.from('settings').insert({
                    store_name: "RATAKIRI POS",
                    store_address: "Jl. Teknologi No. 1",
                    footer_message: "TERIMA KASIH",
                    show_dash_lines: true,
                    show_footer: true,
                    printer_type: 'BLUETOOTH'
                });
            }

            console.log('Database Check/Seeding Complete.');
        } catch (err) {
            console.error('DB Init Error:', err);
        }
    },

    get: async (collection) => {
        const { data, error } = await supabase.from(collection).select('*');
        if (error) {
            console.error(`Error fetching ${collection}:`, error);
            return [];
        }
        return data || [];
    },

    add: async (collection, item) => {
        const { data, error } = await supabase.from(collection).insert(item).select();
        if (error) {
            console.error(`Error adding to ${collection}:`, error);
            throw error;
        }
        return data?.[0]; // Supabase returns array
    },

    update: async (collection, id, updates, idCol = 'id') => {
        const { data, error } = await supabase.from(collection).update(updates).eq(idCol, id).select();
        if (error) {
            console.error(`Error updating ${collection}:`, error);
            throw error;
        }
        return data?.[0];
    },

    delete: async (collection, id, idCol = 'id') => {
        const { error } = await supabase.from(collection).delete().eq(idCol, id);
        if (error) {
            console.error(`Error deleting from ${collection}:`, error);
            return false;
        }
        return true;
    },

    // Specific Helpers
    getOpenShift: async () => {
        const { data } = await supabase.from('shifts').select('*').eq('status', 'OPEN').maybeSingle();
        return data;
    },

    getProductRecipe: async (productId) => {
        const { data } = await supabase.from('recipes').select('*').eq('product_id', productId).maybeSingle();
        return data; // returns { product_id, ingredients: [] }
    }
};
