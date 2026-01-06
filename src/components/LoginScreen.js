"use client";

import { useState } from "react";
import styles from "./LoginScreen.module.css";
import { usePOS } from "@/context/POSContext";

export default function LoginScreen() {
    const { login } = usePOS();
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");

    const handleNumClick = (num) => {
        if (pin.length < 6) { // Increased to 6 just in case
            setPin((prev) => prev + num);
            setError("");
        }
    };

    const handleClear = () => {
        setPin((prev) => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (login(pin)) {
            // Success
        } else {
            setError("PIN Salah! Coba: 1234 (Admin), 0000 (Cashier), 5678 (Inventory), 9999 (Finance)");
            setPin("");
        }
    };

    // Feature to clean stale data
    const handleReset = () => {
        if (confirm("Reset Database? Ini akan menghapus semua data (User, Transaksi, dll) dan mengembalikan ke default SEED.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>POS Login</h1>
                <div className={styles.pinDisplay}>
                    {pin.split("").map((_, i) => (
                        <span key={i}>•</span>
                    ))}
                    {pin.length === 0 && <span style={{ fontSize: '1rem', color: '#555' }}>Enter PIN</span>}
                </div>

                <div className={styles.pinPad}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <button key={n} className={styles.numBtn} onClick={() => handleNumClick(n)}>
                            {n}
                        </button>
                    ))}
                    <button className={styles.numBtn} onClick={handleClear}>⌫</button>
                    <button className={styles.numBtn} onClick={() => handleNumClick(0)}>0</button>
                    <button className={`${styles.actionBtn}`} onClick={handleSubmit}>
                        ➜
                    </button>
                </div>

                {error && <p className={styles.error}>{error}</p>}

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#666',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                    >
                        🔄 Reset Default Database
                    </button>
                </div>
            </div>
        </div>
    );
}
