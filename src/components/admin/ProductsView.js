"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";

export default function ProductsView() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(["Coffee", "Food", "Snack", "Beverage"]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form fields
    const [name, setName] = useState("");
    const [price, setPrice] = useState(0);
    const [category, setCategory] = useState("Coffee");
    const [image, setImage] = useState("☕");
    const [newCategory, setNewCategory] = useState("");
    const [showCategoryInput, setShowCategoryInput] = useState(false);

    const loadProducts = async () => {
        setProducts(await db.get('products'));
        // Load categories from localStorage or use defaults
        const savedCategories = localStorage.getItem('pos_categories');
        if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleAddCategory = () => {
        if (newCategory && !categories.includes(newCategory)) {
            const updated = [...categories, newCategory];
            setCategories(updated);
            localStorage.setItem('pos_categories', JSON.stringify(updated));
            setCategory(newCategory);
            setNewCategory("");
            setShowCategoryInput(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result); // Base64 string
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await db.update('products', editingId, { name, price: Number(price), category, image });
            } else {
                await db.add('products', {
                    id: 'p_' + Date.now(),
                    name,
                    price: Number(price),
                    category,
                    image
                });
            }
            resetForm();
            loadProducts();
        } catch (error) {
            alert('Error saving product');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setName(item.name);
        setPrice(item.price);
        setCategory(item.category);
        setImage(item.image);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Hapus produk ini? Resep terkait juga akan hilang.")) {
            await db.delete('products', id);
            // Also delete associated recipes
            const recipes = await db.get('recipes');
            // Assuming we have a delete helper or iterate. 
            // Better to use ON DELETE CASCADE in SQL, which we did!
            // So just deleting product is enough.
            loadProducts();
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingId(null);
        setName("");
        setPrice(0);
        setCategory(categories[0] || "Coffee");
        setImage("☕");
        setShowCategoryInput(false);
        setNewCategory("");
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.5rem" }}>
                <h2>Kelola Produk</h2>
                <button
                    onClick={() => setShowForm(true)}
                    style={{ padding: '0.5rem 1rem', background: '#00e0b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}
                >
                    + Tambah Produk
                </button>
            </div>

            {showForm && (
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #444' }}>
                    <h3>{editingId ? 'Edit Produk' : 'Produk Baru'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Nama Produk</label>
                            <input required style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }} value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Harga Jual (Rp)</label>
                            <input required type="number" style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '100%' }} value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Kategori</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select style={{ padding: '8px', borderRadius: '4px', flex: 1 }} value={category} onChange={e => setCategory(e.target.value)}>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowCategoryInput(!showCategoryInput)}
                                    style={{ padding: '8px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    title="Tambah Kategori Baru"
                                >
                                    +
                                </button>
                            </div>
                            {showCategoryInput && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <input
                                        placeholder="Kategori baru"
                                        style={{ padding: '6px', borderRadius: '4px', border: 'none', flex: 1, fontSize: '0.9rem' }}
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddCategory}
                                        style={{ padding: '6px 12px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Simpan
                                    </button>
                                </div>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Gambar</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    style={{ padding: '6px', borderRadius: '4px', border: 'none', flex: 1, fontSize: '0.85rem', background: '#1a1a1a', color: 'white' }}
                                />
                                <div style={{ fontSize: '2rem', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', borderRadius: '4px' }}>
                                    {image.startsWith('data:') ? (
                                        <img src={image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        image
                                    )}
                                </div>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.3rem' }}>Atau gunakan emoji: <input type="text" value={image.startsWith('data:') ? '' : image} onChange={e => setImage(e.target.value)} maxLength={2} style={{ width: '40px', padding: '4px', borderRadius: '4px', border: 'none', fontSize: '1rem', textAlign: 'center' }} /></p>
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

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Gambar</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Harga Jual</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(item => (
                        <tr key={item.id}>
                            <td>
                                {item.image.startsWith('data:') ? (
                                    <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                ) : (
                                    <span style={{ fontSize: '2rem' }}>{item.image}</span>
                                )}
                            </td>
                            <td>{item.name}</td>
                            <td>{item.category}</td>
                            <td style={{ fontWeight: 'bold' }}>Rp {item.price.toLocaleString()}</td>
                            <td>
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
    );
}
