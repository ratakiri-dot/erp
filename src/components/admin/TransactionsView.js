"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";

export default function TransactionsView() {
    const [trxs, setTrxs] = useState([]);
    const [filteredTrxs, setFilteredTrxs] = useState([]);

    // Filters
    const [searchId, setSearchId] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("ALL");

    useEffect(() => {
        const load = () => {
            const raw = db.get('transactions');
            setTrxs(raw.reverse()); // Show newest first
            setFilteredTrxs(raw);
        };
        load();
    }, []);

    // Apply Filters
    useEffect(() => {
        let result = [...trxs];

        if (searchId) {
            result = result.filter(t => t.id.toLowerCase().includes(searchId.toLowerCase()));
        }

        if (dateStart) {
            const start = new Date(dateStart);
            start.setHours(0, 0, 0, 0);
            result = result.filter(t => new Date(t.createdAt) >= start);
        }

        if (dateEnd) {
            const end = new Date(dateEnd);
            end.setHours(23, 59, 59, 999);
            result = result.filter(t => new Date(t.createdAt) <= end);
        }

        if (paymentMethod !== "ALL") {
            result = result.filter(t => t.paymentMethod === paymentMethod);
        }

        setFilteredTrxs(result);
    }, [searchId, dateStart, dateEnd, paymentMethod, trxs]);

    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem" }}>Transaction History</h2>

            {/* FILTERS UI */}
            <div style={{ background: '#1f1f22', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search ID..."
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white', width: '150px' }}
                />

                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #444', background: '#333', color: 'white' }}
                >
                    <option value="ALL">All Payments</option>
                    <option value="CASH">Cash</option>
                    <option value="QRIS">QRIS</option>
                    <option value="DEBIT">Debit</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.9rem', color: '#888' }}>Date:</span>
                    <input
                        type="date"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                        style={{ background: '#333', border: '1px solid #444', color: 'white', padding: '0.3rem' }}
                    />
                    <span style={{ color: '#888' }}>-</span>
                    <input
                        type="date"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                        style={{ background: '#333', border: '1px solid #444', color: 'white', padding: '0.3rem' }}
                    />
                </div>
            </div>

            {filteredTrxs.length === 0 ? <p style={{ color: '#666' }}>No transactions found.</p> : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Time</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrxs.map(t => (
                            <tr key={t.id}>
                                <td style={{ fontFamily: 'monospace', color: '#888' }}>{t.id.split('_')[1] || t.id}</td>
                                <td style={{ fontSize: '0.9rem' }}>
                                    {new Date(t.createdAt).toLocaleDateString()} <br />
                                    <span style={{ color: '#666' }}>{new Date(t.createdAt).toLocaleTimeString()}</span>
                                </td>
                                <td>
                                    {t.items.map((i, idx) => (
                                        <div key={idx}>{i.qty}x {i.product.name}</div>
                                    ))}
                                </td>
                                <td style={{ fontWeight: "bold" }}>Rp {t.grandTotal.toLocaleString()}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', background: '#333', fontSize: '0.8rem'
                                    }}>
                                        {t.paymentMethod}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
