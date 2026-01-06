"use client";

import { useState } from "react";
import styles from "./PaymentModal.module.css";
import { usePOS } from "@/context/POSContext";
import { db } from "@/lib/db";
import { inventoryService } from "@/lib/inventory";
import { printerService } from "@/lib/bluetooth";
import ReceiptPreview from "@/components/ReceiptPreview";

export default function PaymentModal({ total, onClose }) {
    const { cart, setCart, shift, refreshData, user } = usePOS();
    const [method, setMethod] = useState('CASH');
    const [amountPaid, setAmountPaid] = useState(''); // State for cash input
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedTrx, setCompletedTrx] = useState(null); // Transaction object if payment done

    const handlePayment = () => {
        // Validation for Cash
        if (method === 'CASH') {
            const paid = parseFloat(amountPaid);
            if (!paid || paid < total) {
                alert("Jumlah uang tidak cukup!");
                return;
            }
        }

        setIsProcessing(true);

        // Simulate API delay
        setTimeout(async () => {
            const paid = method === 'CASH' ? parseFloat(amountPaid) : total;
            const change = paid - total;

            // 1. Create Transaction Record
            const transaction = {
                id: "trx_" + Date.now(),
                shift_id: shift ? shift.id : null, // Schema: shift_id
                cashier_id: user.id, // Schema: cashier_id
                items: cart,
                total: total, // Schema: total  (no subtotal/tax needed if flat)
                grand_total: total, // Schema: grand_total
                payment_method: method, // Schema: payment_method
                pay_amount: paid, // Schema: pay_amount
                change: change,
                status: 'PAID',
                created_at: new Date().toISOString()
            };

            await db.add('transactions', transaction);

            // 2. Inventory Deduct Logic
            // NOTE: inventoryService needs update too if it uses db.get/update synchronously
            // For now, let's assume we do this manually or refactor service.
            // Let's call inventoryService.deductStock but IT NEEDS TO BE ASYNC.
            // I will update inventoryService next.
            await inventoryService.deductStock(cart);

            // 3. Auto-Print Receipt (restored)
            try {
                // We use the same service, it will check internal type (BLUETOOTH vs SYSTEM)
                // "Sesuai apa yang terpasang" implies we trust the current mode or fallback.
                // Since web apps can't auto-detect printer presence easily without interaction,
                // we assume user set the mode or we default to SYSTEM if BT fails? 
                // For now, just trigger the print.
                await printerService.print(transaction);
            } catch (e) {
                console.error("Auto-print failed", e);
                // Don't alert, just let them click stats button if needed
            }

            // 4. Clear Cart & App State (But keep Modal open for Preview)
            setCart([]);
            refreshData();
            setIsProcessing(false);

            // 5. Set Completed State (Shows Preview)
            setCompletedTrx(transaction);
        }, 1000);
    };

    const handlePrint = async () => {
        if (!completedTrx) return;
        try {
            await printerService.print(completedTrx);
        } catch (e) {
            console.error("Printing failed", e);
            alert("Print failed");
        }
    };

    const handleFinish = () => {
        onClose();
        // window.location.reload(); // Not needed if we cleared cart via state
    };

    // Get Settings for Preview
    const rawSettings = db.get('settings');
    const settings = rawSettings.storeName ? rawSettings : (rawSettings[0] || {
        storeName: "POS SYSTEM DEMO",
        storeAddress: "Jl. Teknologi No. 1",
        footerMessage: "TERIMA KASIH",
        showDashLines: true,
        showFooter: true
    });

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} style={{ maxWidth: completedTrx ? '400px' : '400px' }}>

                {completedTrx ? (
                    // --- SUCCESS / PREVIEW STATE ---
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: '#52c41a', fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 className={styles.title} style={{ marginBottom: '1rem' }}>Payment Successful!</h2>

                        <div style={{ background: '#333', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            <ReceiptPreview data={completedTrx} settings={settings} />
                        </div>

                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={handlePrint}>
                                🖨️ Print Struk
                            </button>
                            <button className={styles.confirmBtn} onClick={handleFinish}>
                                Selesai (Next Order)
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- PAYMENT INPUT STATE ---
                    <>
                        <h2 className={styles.title}>Payment</h2>
                        <div className={styles.amount}>Rp {total.toLocaleString()}</div>

                        <div className={styles.methods}>
                            <button
                                className={`${styles.methodBtn} ${method === 'CASH' ? styles.active : ''}`}
                                onClick={() => setMethod('CASH')}
                            >
                                💵 Cash
                            </button>
                            <button
                                className={`${styles.methodBtn} ${method === 'QRIS' ? styles.active : ''}`}
                                onClick={() => {
                                    setMethod('QRIS');
                                    setAmountPaid(''); // Reset cash input if switching
                                }}
                            >
                                📱 QRIS
                            </button>
                        </div>

                        {/* CASH INPUT FIELD */}
                        {method === 'CASH' && (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Uang Diterima (Rp)</label>
                                <input
                                    type="number"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '1rem',
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        borderRadius: '8px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff'
                                    }}
                                    placeholder="0"
                                    autoFocus
                                />
                                {amountPaid && parseFloat(amountPaid) >= total && (
                                    <div style={{ marginTop: '0.5rem', textAlign: 'center', color: '#00e0b8' }}>
                                        Kembali: Rp {(parseFloat(amountPaid) - total).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        )}


                        <div className={styles.actions}>
                            <button className={styles.cancelBtn} onClick={onClose} disabled={isProcessing}>
                                Cancel
                            </button>
                            <button className={styles.confirmBtn} onClick={handlePayment} disabled={isProcessing}>
                                {isProcessing ? "Processing..." : "Confirm Payment"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
