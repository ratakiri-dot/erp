
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
        { id: 'u1', name: 'Owner', role: 'ADMIN', pin: '1234' },
        { id: 'u2', name: 'Budi (Kasir)', role: 'CASHIER', pin: '0000' },
        { id: 'u3', name: 'Siti (Gudang)', role: 'INVENTORY', pin: '5678' },
        { id: 'u4', name: 'Finance Staff', role: 'FINANCE', pin: '9999' },
    ],
    // ... products/inventory reused from existing if needed, but better to fetch from DB
};

export const db = {
    // Check connection & Seed if empty
    init: async () => {
        try {
            // Check if users exist
            const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
            if (error) throw error;

            if (count === 0) {
                console.log('Seeding Database to Supabase...');
                // Seed Users
                await supabase.from('users').insert(SEED_DATA.users);

                // Seed Settings
                await supabase.from('settings').insert({
                    store_name: "RATAKIRI POS",
                    store_address: "Jl. Teknologi No. 1",
                    footer_message: "TERIMA KASIH",
                    show_dash_lines: true,
                    show_footer: true,
                    printer_type: 'BLUETOOTH'
                });

                // Add more seeding if strictly required, but usually user inputs data
                console.log('Seeding Complete.');
            }
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

    update: async (collection, id, updates) => {
        const { data, error } = await supabase.from(collection).update(updates).eq('id', id).select();
        if (error) {
            console.error(`Error updating ${collection}:`, error);
            throw error;
        }
        return data?.[0];
    },

    delete: async (collection, id) => {
        const { error } = await supabase.from(collection).delete().eq('id', id);
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
