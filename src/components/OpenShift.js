"use client";

import { useState } from "react";
import styles from "./OpenShift.module.css";
import { usePOS } from "@/context/POSContext";

export default function OpenShift() {
    const { user, openShift, logout } = usePOS();
    const [amount, setAmount] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount) return;
        openShift(amount);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>Welcome, {user?.name}</h2>
                <p style={{ color: '#888', marginBottom: '2rem' }}>Please start your shift to begin.</p>

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Starting Cash (Modal Awal)</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="Rp 0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button type="submit" className={styles.btn}>Start Session</button>
                </form>

                <button
                    onClick={logout}
                    style={{ background: 'none', border: 'none', color: '#666', marginTop: '1.5rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
