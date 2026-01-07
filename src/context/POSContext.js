"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { db } from "@/lib/db";

const POSContext = createContext();

export function POSProvider({ children }) {
    const [user, setUser] = useState(null); // { id, name, role }
    const [shift, setShift] = useState(null); // { id, startCash, status: 'OPEN' }
    const [cart, setCart] = useState([]); // [{ product, qty, note }]
    const [products, setProducts] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0); // Force re-fetch

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            await db.init(); // Ensure DB is ready

            // Check session
            try {
                const storedUser = sessionStorage.getItem('pos_current_user');
                if (storedUser && storedUser !== 'undefined') {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error("Session parse error", e);
                sessionStorage.removeItem('pos_current_user');
            }

            // Check shift - only load if it belongs to current user
            const storedUser = sessionStorage.getItem('pos_current_user');
            if (storedUser && storedUser !== 'undefined') {
                try {
                    const currentUser = JSON.parse(storedUser);
                    const activeShift = await db.getOpenShift();
                    // Only set shift if it belongs to the current user
                    if (activeShift && activeShift.user_id === currentUser.id) {
                        setShift(activeShift);
                    }
                } catch (e) {
                    console.error("Shift load error", e);
                }
            }

            // Load Products
            const prods = await db.get('products');
            setProducts(prods);
        };
        loadData();
    }, [refreshKey]);

    // Actions
    const login = async (pin) => {
        const users = await db.get('users');
        const validUser = users.find(u => u.pin === pin);
        if (validUser) {
            setUser(validUser);
            sessionStorage.setItem('pos_current_user', JSON.stringify(validUser));
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        setShift(null); // Clear shift on logout
        sessionStorage.removeItem('pos_current_user');
        sessionStorage.removeItem('pos_current_shift');
    };

    const openShift = async (amount) => {
        if (!user) return;
        const newShift = {
            id: 'sh_' + Date.now(),
            user_id: user.id, // Changed to underscore for DB
            // cashierName: user.name, // Not in schema, use join or store if needed? Schema has user_id.
            start_time: new Date().toISOString(), // Schema: start_time
            start_cash: parseFloat(amount), // Schema: start_cash
            status: 'OPEN',
            expected_cash: parseFloat(amount), // Schema: expected_cash
        };

        try {
            await db.add('shifts', newShift);
            setShift(newShift);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const closeShift = async (actualCash, notes) => {
        if (!shift) return;
        const diff = actualCash - shift.expected_cash; // Schema: expected_cash
        const updates = {
            end_time: new Date().toISOString(),
            actual_cash: parseFloat(actualCash),
            difference: diff,
            status: 'CLOSED'
            // note: notes // Note not in schema? Add it? Schema has no 'note' col? 
            // My schema in previous turn: status text default 'OPEN'. No note column.
            // I'll skip note for now to match schema or schema needs update.
        };

        try {
            await db.update('shifts', shift.id, updates);
            setShift(null);
            return true;
        } catch (e) {
            console.error(e);
            return false;

        }
    };

    return (
        <POSContext.Provider value={{
            user, login, logout,
            shift, openShift, closeShift,
            cart, setCart,
            products,
            refreshData: () => setRefreshKey(k => k + 1)
        }}>
            {children}
        </POSContext.Provider>
    );
}

export const usePOS = () => useContext(POSContext);
