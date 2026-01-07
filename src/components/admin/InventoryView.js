"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";

export default function InventoryView() {
    const [inventory, setInventory] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form fields
    const [name, setName] = useState("");
    const [unit, setUnit] = useState("gr");
    const [stock, setStock] = useState(0);
    const [cost, setCost] = useState(0);
    const [minStock, setMinStock] = useState(0);

    const [showRestock, setShowRestock] = useState(false);
    const [restockItem, setRestockItem] = useState(null);
    const [restockQty, setRestockQty] = useState(0);
    const [restockCost, setRestockCost] = useState(0);

    // Load Data
    const loadInventory = async () => {
        const data = await db.get('inventory');
        setInventory(data);
    };

    useEffect(() => {
        loadInventory();
    }, []);

    const openRestock = (item) => {
        setRestockItem(item);
        setRestockQty(0);
        setRestockCost(0);
        setShowRestock(true);
    };

    const handleRestockSubmit = async (e) => {
        e.preventDefault();

        const newStock = Number(restockItem.stock) + Number(restockQty);

        const totalValueOld = Number(restockItem.stock) * Number(restockItem.cost);
        const totalValueNew = Number(restockCost);
        const totalQty = newStock;

        let newUnitCost = restockItem.cost;
        if (totalQty > 0 && restockQty > 0) {
            newUnitCost = Math.round((totalValueOld + totalValueNew) / totalQty);
        }

        try {
            // Update Inventory
            await db.update('inventory', restockItem.id, {
                stock: newStock,
                cost: newUnitCost
            });

            // Add Expense (Use Schema snake_case)
            const expense = {
                id: 'exp_' + Date.now(),
                type: 'RESTOCK',
                item_id: restockItem.id,
                item_name: restockItem.name,
                qty: Number(restockQty),
                total_cost: Number(restockCost),
                date: new Date().toISOString(),
                user_id: 'ADMIN',
                description: `Restock ${restockItem.name}`
            };

            await db.add('expenses', expense);

            alert(`Restock Berhasil!`);
            setShowRestock(false);
            loadInventory();
        } catch (err) {
            console.error(err);
            alert("Restock gagal: " + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newItem = {
            name,
            unit,
            stock: Number(stock),
            cost: Number(cost),
            min_stock: Number(minStock) // Schema: min_stock
        };

        try {
            if (editingId) {
                await db.update('inventory', editingId, newItem);
            } else {
                await db.add('inventory', {
                    id: 'i_' + Date.now(),
                    ...newItem
                });
            }
            resetForm();
            loadInventory();
        } catch (err) {
            console.error(err);
            alert("Gagal menyimpan bahan");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setName(item.name);
        setUnit(item.unit);
        setStock(item.stock);
        setCost(item.cost);
        setMinStock(item.min_stock || item.minStock || 0); // Handle potential casing diff
        setShowForm(true);
    };



    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setName("");
        setUnit("gr");
        setStock(0);
        setCost(0);
        setMinStock(0);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.5rem" }}>
                <h2>Kelola Bahan Baku</h2>
                <button
                    onClick={() => setShowForm(true)}
                    style={{ padding: '0.5rem 1rem', background: '#00e0b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}
                >
                    + Tambah Bahan
                </button>
            </div>

            {/* RESTOCK MODAL */}
            {showRestock && restockItem && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ background: '#2c2c2e', padding: '2rem', borderRadius: '12px', width: '400px', border: '1px solid #444' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Restock: {restockItem.name}</h3>
                        <form onSubmit={handleRestockSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                                    Jumlah Beli ({restockItem.unit})
                                </label>
                                <input
                                    type="number" required autoFocus
                                    value={restockQty} onChange={e => setRestockQty(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: 'none' }}
                                    placeholder="Contoh: 1000"
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ccc' }}>
                                    Total Harga Belanja (Rp)
                                </label>
                                <input
                                    type="number" required
                                    value={restockCost} onChange={e => setRestockCost(e.target.value)}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: 'none' }}
                                    placeholder="Contoh: 50000"
                                />
                                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                                    Harga modal per unit akan disesuaikan otomatis (rata-rata).
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button type="button" onClick={() => setShowRestock(false)} style={{ flex: 1, padding: '1rem', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                    Batal
                                </button>
                                <button type="submit" style={{ flex: 1, padding: '1rem', background: '#00e0b8', color: 'black', fontWeight: 'bold', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                    Simpan Restock
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {showForm && (
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #444' }}>
                    <h3>{editingId ? 'Edit Bahan' : 'Bahan Baru'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Nama Bahan</label>
                            <input required style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }} value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Satuan</label>
                            <select style={{ padding: '8px', borderRadius: '4px', width: '100%' }} value={unit} onChange={e => setUnit(e.target.value)}>
                                <option value="gr">Gram (gr)</option>
                                <option value="ml">Mililiter (ml)</option>
                                <option value="pcs">Pieces (pcs)</option>
                                <option value="kg">Kilogram (kg)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Stok Awal</label>
                            <input required type="number" style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }} value={stock} onChange={e => setStock(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Harga/Unit (Rp)</label>
                            <input required type="number" style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }} value={cost} onChange={e => setCost(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Min. Stok</label>
                            <input required type="number" style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }} value={minStock} onChange={e => setMinStock(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                            <button type="submit" style={{ padding: '8px 16px', background: '#00e0b8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}>
                                {editingId ? 'Update' : 'Simpan'}
                            </button>
                            <button type="button" onClick={resetForm} style={{ padding: '8px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ overflowX: 'auto' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nama Bahan</th>
                            <th>Stok</th>
                            <th>Satuan</th>
                            <th>Harga/Unit</th>
                            <th>Min. Stok</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map(item => (
                            <tr key={item.id}>
                                <td>{item.name}</td>
                                <td style={{ fontWeight: 'bold' }}>{item.stock}</td>
                                <td>{item.unit}</td>
                                <td>Rp {(item.cost || 0).toLocaleString()}</td>
                                <td>{item.min_stock}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.8rem',
                                        background: item.stock < item.min_stock ? '#ff4d4f' : '#52c41a',
                                        color: 'white',
                                        display: 'inline-block', // Prevent break
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {item.stock < item.min_stock ? 'Low Stock' : 'OK'}
                                    </span>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                    <button onClick={() => openRestock(item)} style={{ marginRight: '0.5rem', background: '#00e0b8', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                        + Restock
                                    </button>
                                    <button onClick={() => handleEdit(item)} style={{ marginRight: '0.5rem', color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Edit
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Hapus
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
