"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function TransactionsView() {
    const [trxs, setTrxs] = useState([]);
    const [filteredTrxs, setFilteredTrxs] = useState([]);

    // Filters
    const [searchId, setSearchId] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("ALL");

    useEffect(() => {
        const load = async () => {
            const raw = await db.get('transactions');
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
            result = result.filter(t => new Date(t.created_at) >= start);
        }

        if (dateEnd) {
            const end = new Date(dateEnd);
            end.setHours(23, 59, 59, 999);
            result = result.filter(t => new Date(t.created_at) <= end);
        }

        if (paymentMethod !== "ALL") {
            result = result.filter(t => t.paymentMethod === paymentMethod);
        }

        setFilteredTrxs(result);
    }, [searchId, dateStart, dateEnd, paymentMethod, trxs]);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Transaction History", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleString('id-ID')}`, 14, 30);

        if (dateStart || dateEnd) {
            doc.text(`Period: ${dateStart || 'All'} to ${dateEnd || 'Now'}`, 14, 36);
        }

        const totalAmount = filteredTrxs.reduce((sum, t) => sum + (t.grand_total || 0), 0);
        doc.text(`Total Transactions: ${filteredTrxs.length}`, 14, 42);
        doc.text(`Total Amount: Rp ${totalAmount.toLocaleString()}`, 14, 48);

        autoTable(doc, {
            startY: 55,
            head: [['ID', 'Date/Time', 'Items', 'Total', 'Payment']],
            body: filteredTrxs.map(t => [
                t.id?.includes('_') ? (t.id.split('_')[1] || t.id) : (t.id || 'N/A'),
                t.created_at ? new Date(t.created_at).toLocaleString('id-ID') : '-',
                (t.items || []).map(i => `${i?.qty}x ${i?.product?.name || 'Unknown'}`).join(', '),
                `Rp ${(t.grand_total || 0).toLocaleString()}`,
                t.payment_method || '-'
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [0, 224, 184] },
            columnStyles: {
                2: { cellWidth: 60 } // Items column wider
            }
        });

        doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.5rem" }}>
                <h2>Transaction History</h2>
                <button
                    onClick={handleExportPDF}
                    style={{ padding: '0.5rem 1rem', background: '#1890ff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📄 Export PDF
                </button>
            </div>

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
                                <td style={{ fontFamily: 'monospace', color: '#888' }}>{t.id?.includes('_') ? (t.id.split('_')[1] || t.id) : (t.id || 'N/A')}</td>
                                <td style={{ fontSize: '0.9rem' }}>
                                    {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'} <br />
                                    <span style={{ color: '#666' }}>{t.created_at ? new Date(t.created_at).toLocaleTimeString() : '-'}</span>
                                </td>
                                <td>
                                    {(t.items || []).map((i, idx) => (
                                        <div key={idx}>{i?.qty}x {i?.product?.name || 'Unknown'}</div>
                                    ))}
                                </td>
                                <td style={{ fontWeight: "bold" }}>Rp {(t.grand_total || 0).toLocaleString()}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '4px', background: '#333', fontSize: '0.8rem'
                                    }}>
                                        {t.payment_method}
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
