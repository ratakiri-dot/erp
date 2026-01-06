"use client";

import React from 'react';

export default function ReceiptPreview({ data, settings }) {
    // data: Transaction Object (or dummy)
    // settings: Store settings { storeName, storeAddress, footerMessage, showDashLines, showFooter }

    if (!data || !settings) return null;

    const styles = {
        container: {
            width: '300px',
            background: '#fff',
            color: '#000',
            fontFamily: "'Courier New', monospace",
            fontSize: '12px',
            padding: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            margin: '0 auto',
            lineHeight: '1.4',
            position: 'relative'
        },
        center: { textAlign: 'center' },
        right: { textAlign: 'right' },
        line: {
            borderBottom: '1px dashed #000',
            margin: '8px 0',
            display: settings.showDashLines ? 'block' : 'none'
        },
        itemRow: { display: 'flex', justifyContent: 'space-between' },
        bold: { fontWeight: 'bold' }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.center}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{settings.storeName}</div>
                <div>{settings.storeAddress}</div>
            </div>

            <div style={styles.line}></div>

            {/* Meta */}
            <div>
                <div>No: {data.id ? data.id.split('_')[1] : '0000'}</div>
                <div>Tgl: {data.createdAt ? new Date(data.createdAt).toLocaleString() : new Date().toLocaleString()}</div>
            </div>

            <div style={styles.line}></div>

            {/* Items */}
            {data.items && data.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '4px' }}>
                    <div style={styles.itemRow}>
                        <span>{item.qty}x {item.product.name}</span>
                    </div>
                    <div style={styles.right}>Rp {(item.qty * item.product.price).toLocaleString()}</div>
                </div>
            ))}

            <div style={styles.line}></div>

            {/* Total */}
            <div style={{ ...styles.right, ...styles.bold }}>
                TOTAL: Rp {data.grandTotal ? data.grandTotal.toLocaleString() : '0'}
            </div>

            {/* Change Info */}
            {data.cashPaid !== undefined && (
                <div style={{ marginTop: '4px' }}>
                    <div style={styles.itemRow}>
                        <span>Bayar</span>
                        <span>Rp {data.cashPaid.toLocaleString()}</span>
                    </div>
                    <div style={styles.itemRow}>
                        <span>Kembali</span>
                        <span>Rp {data.change ? data.change.toLocaleString() : '0'}</span>
                    </div>
                </div>
            )}

            {/* Footer */}
            {settings.showFooter && (
                <>
                    <br />
                    <div style={styles.center}>
                        {settings.footerMessage}
                    </div>
                </>
            )}
        </div>
    );
}
