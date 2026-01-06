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
        // Check for active session
        const currentUser = JSON.parse(sessionStorage.getItem('pos_current_user'));
        if (currentUser) setUser(currentUser);

        // Check for open shift
        const openShift = db.getOpenShift();
        if (openShift) setShift(openShift);

        // Load Products
        setProducts(db.get('products'));
    }, [refreshKey]);

    // Actions
    const login = (pin) => {
        const users = db.get('users');
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
        sessionStorage.removeItem('pos_current_user');
    };

    const openShift = (amount) => {
        if (!user) return;
        const newShift = {
            id: "sh_" + Date.now(),
            cashierId: user.id,
            cashierName: user.name,
            startTime: new Date().toISOString(),
            startCash: parseFloat(amount),
            status: 'OPEN',
            expectedCash: parseFloat(amount), // Will increase with sales
        };
        db.add('shifts', newShift);
        setShift(newShift);
    };

    const closeShift = (actualCash, notes) => {
        if (!shift) return;
        const diff = actualCash - shift.expectedCash;
        const closedShift = {
            ...shift,
            endTime: new Date().toISOString(),
            actualShutCash: parseFloat(actualCash),
            difference: diff,
            note: notes,
            status: 'CLOSED'
        };
        db.update('shifts', shift.id, closedShift);
        setShift(null);
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
