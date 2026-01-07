"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/db";
import ReceiptPreview from "@/components/ReceiptPreview";

export default function SettingsView() {
    const [settings, setSettings] = useState({
        store_name: "",
        store_address: "",
        footer_message: "",
        show_dash_lines: true,
        show_footer: true,
        printer_type: "AUTO"
    });

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        const load = async () => {
            const raw = await db.get('settings');
            // Assuming single row
            const config = raw[0] || {
                store_name: "RATAKIRI POS",
                store_address: "Jl. Teknologi No. 1",
                footer_message: "TERIMA KASIH",
                show_dash_lines: true,
                show_footer: true,
                printer_type: 'AUTO'
            };

            setSettings({
                id: config.id, // Store ID for update
                store_name: config.store_name,
                store_address: config.store_address,
                footer_message: config.footer_message,
                show_dash_lines: config.show_dash_lines,
                show_footer: config.show_footer,
                printer_type: config.printer_type
            });
        };
        load();
    }, []);

    const handleSave = async () => {
        try {
            const updates = {
                store_name: settings.store_name,
                store_address: settings.store_address,
                footer_message: settings.footer_message,
                show_dash_lines: settings.show_dash_lines,
                show_footer: settings.show_footer,
                printer_type: settings.printer_type
            };

            if (settings.id) {
                await db.update('settings', settings.id, updates);
            } else {
                await db.add('settings', updates);
            }

            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);

        } catch (e) {
            alert("Failed to save");
            console.error(e);
        }
    };

    // Dummy data for preview
    const dummyData = {
        id: "trx_PREVIEW",
        created_at: new Date().toISOString(),
        items: [
            { qty: 2, product: { name: "Kopi Susu", price: 18000 } },
            { qty: 1, product: { name: "Croissant", price: 25000 } }
        ],
        grand_total: 61000
    };

    return (
        <div>
            <h2 style={{ marginBottom: "1.5rem" }}>System Settings</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>

                {/* LEFT: FORM */}
                <div style={{ background: '#1f1f22', padding: '2rem', borderRadius: '12px', border: '1px solid #333', height: 'fit-content' }}>
                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>Receipt Appearance</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Store Name</label>
                        <input
                            type="text"
                            value={settings.store_name}
                            onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #444', background: '#333', color: 'white' }}
                            placeholder="e.g. My Coffee Shop"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Store Address</label>
                        <textarea
                            value={settings.store_address}
                            onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #444', background: '#333', color: 'white', minHeight: '80px' }}
                            placeholder="e.g. Jl. Sudirman No 45, Jakarta"
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Footer Message</label>
                        <input
                            type="text"
                            value={settings.footer_message}
                            onChange={(e) => setSettings({ ...settings, footer_message: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #444', background: '#333', color: 'white' }}
                            placeholder="e.g. Thank You for Visiting!"
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>Printer Preference</label>
                        <select
                            value={settings.printer_type || 'AUTO'}
                            onChange={(e) => setSettings({ ...settings, printer_type: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #444', background: '#333', color: 'white' }}
                        >
                            <option value="AUTO">Auto (Bluetooth Priority → System)</option>
                            <option value="SYSTEM">Always System Print (Dialog)</option>
                            <option value="BLUETOOTH">Always Bluetooth</option>
                        </select>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#888' }}>
                            "Auto" will check if Bluetooth Connected. If yes, print BT. If no, open System Dialog.
                        </p>
                    </div>

                    {/* Toggles */}
                    <div style={{ marginBottom: '2rem', display: 'flex', gap: '2rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.show_dash_lines}
                                onChange={(e) => setSettings({ ...settings, show_dash_lines: e.target.checked })}
                                style={{ marginRight: '0.5rem', width: '18px', height: '18px' }}
                            />
                            Show Dash Lines
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={settings.show_footer}
                                onChange={(e) => setSettings({ ...settings, show_footer: e.target.checked })}
                                style={{ marginRight: '0.5rem', width: '18px', height: '18px' }}
                            />
                            Show Footer
                        </label>
                    </div>

                    <button
                        onClick={handleSave}
                        style={{
                            background: isSaved ? '#52c41a' : '#00e0b8',
                            color: 'black',
                            border: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        {isSaved ? "Saved Successfully" : "Save Settings"}
                    </button>
                </div>

                {/* RIGHT: PREVIEW */}
                <div>
                    <h3 style={{ marginBottom: '1.5rem' }}>Live Preview</h3>
                    <div style={{ background: '#333', padding: '2rem', borderRadius: '12px', display: 'flex', justifyContent: 'center' }}>
                        <ReceiptPreview data={dummyData} settings={settings} />
                    </div>
                    <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>
                        This is how the receipt will look when printed.
                    </p>
                </div>

            </div>
        </div>
    );
}
