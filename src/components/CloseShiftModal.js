"use client";

import { useState } from "react";
import styles from "./CloseShiftModal.module.css";
import { usePOS } from "@/context/POSContext";

export default function CloseShiftModal({ onClose }) {
    const { shift, closeShift, logout } = usePOS();
    const [actualCash, setActualCash] = useState("");
    const [note, setNote] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!actualCash) return;

        closeShift(actualCash, note);
        onClose();
        // Optional: Auto logout or show summary
        // logout();
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Close Shift</h2>
                    <button onClick={onClose} className={styles.closeBtn}>×</button>
                </div>

                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <p>Started At</p>
                        <p>{new Date(shift.startTime).toLocaleTimeString()}</p>
                    </div>
                    <div className={styles.statItem}>
                        <p>Start Cash</p>
                        <p>Rp {shift.startCash.toLocaleString()}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Actual Cash in Drawer (Blind Count)</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="Total uang fisik..."
                            value={actualCash}
                            onChange={(e) => setActualCash(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Notes (Optional)</label>
                        <textarea
                            className={styles.input}
                            placeholder="Alasan selisih..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            style={{ minHeight: '80px', fontSize: '1rem' }}
                        />
                    </div>

                    <button type="submit" className={styles.btn}>Finalize & Close Shift</button>
                </form>
            </div>
        </div>
    );
}
