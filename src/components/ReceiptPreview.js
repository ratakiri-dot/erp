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
            display: settings.show_dash_lines ? 'block' : 'none'
        },
        itemRow: { display: 'flex', justifyContent: 'space-between' },
        bold: { fontWeight: 'bold' }
    };

    const idNum = data.id?.includes('_') ? (data.id.split('_')[1] || data.id) : (data.id || 'N/A');
    const dateStr = data.created_at ? new Date(data.created_at).toLocaleString('id-ID') : '-';

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.center}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{settings.store_name}</div>
                <div>{settings.store_address}</div>
            </div>

            <div style={styles.line}></div>

            {/* Meta */}
            <div>
                <div>No: {idNum}</div>
                <div>Tgl: {dateStr}</div>
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
                TOTAL: Rp {data.grand_total ? data.grand_total.toLocaleString() : '0'}
            </div>

            {/* Change Info */}
            {data.pay_amount !== undefined && (
                <div style={{ marginTop: '4px' }}>
                    <div style={styles.itemRow}>
                        <span>Bayar</span>
                        <span>Rp {data.pay_amount.toLocaleString()}</span>
                    </div>
                    <div style={styles.itemRow}>
                        <span>Kembali</span>
                        <span>Rp {data.change !== undefined ? data.change.toLocaleString() : '0'}</span>
                    </div>
                </div>
            )}

            {/* Footer */}
            {settings.show_footer && (
                <>
                    <br />
                    <div style={styles.center}>
                        {settings.footer_message}
                    </div>
                </>
            )}
        </div>
    );
}
