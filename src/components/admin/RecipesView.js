"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";

export default function RecipesView() {
    const [recipes, setRecipes] = useState([]);
    const [products, setProducts] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);

    // Form state
    const [selectedProduct, setSelectedProduct] = useState("");
    const [ingredients, setIngredients] = useState([{ inventoryId: "", qty: 0 }]);

    const loadData = () => {
        setRecipes(db.get('recipes'));
        setProducts(db.get('products'));
        setInventory(db.get('inventory'));
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        const recipeData = {
            productId: selectedProduct,
            ingredients: ingredients.filter(ing => ing.inventoryId && ing.qty > 0)
        };

        if (editingRecipe) {
            // Update: find and replace
            const allRecipes = db.get('recipes');
            const index = allRecipes.findIndex(r => r.productId === editingRecipe.productId);
            if (index !== -1) {
                allRecipes[index] = recipeData;
                localStorage.setItem('pos_recipes', JSON.stringify(allRecipes));
            }
        } else {
            // Check if recipe already exists for this product
            const existing = db.get('recipes').find(r => r.productId === selectedProduct);
            if (existing) {
                alert("Resep untuk produk ini sudah ada! Silakan edit yang ada.");
                return;
            }
            db.add('recipes', recipeData);
        }

        resetForm();
        loadData();
    };

    const handleEdit = (recipe) => {
        setEditingRecipe(recipe);
        setSelectedProduct(recipe.productId);
        setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ inventoryId: "", qty: 0 }]);
        setShowForm(true);
    };

    const handleDelete = (productId) => {
        if (confirm("Hapus resep ini?")) {
            const allRecipes = db.get('recipes');
            const filtered = allRecipes.filter(r => r.productId !== productId);
            localStorage.setItem('pos_recipes', JSON.stringify(filtered));
            loadData();
        }
    };

    const addIngredientRow = () => {
        setIngredients([...ingredients, { inventoryId: "", qty: 0 }]);
    };

    const removeIngredientRow = (index) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index, field, value) => {
        const updated = [...ingredients];
        updated[index][field] = field === 'qty' ? Number(value) : value;
        setIngredients(updated);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingRecipe(null);
        setSelectedProduct("");
        setIngredients([{ inventoryId: "", qty: 0 }]);
    };

    const getProductName = (productId) => {
        return products.find(p => p.id === productId)?.name || productId;
    };

    const getInventoryName = (inventoryId) => {
        const item = inventory.find(i => i.id === inventoryId);
        return item ? `${item.name} (${item.unit})` : inventoryId;
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.5rem" }}>
                <h2>Kelola Resep</h2>
                <button
                    onClick={() => setShowForm(true)}
                    style={{ padding: '0.5rem 1rem', background: '#00e0b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}
                >
                    + Tambah Resep
                </button>
            </div>

            {showForm && (
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #444' }}>
                    <h3>{editingRecipe ? 'Edit Resep' : 'Resep Baru'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.3rem' }}>Pilih Produk</label>
                            <select
                                required
                                style={{ padding: '8px', borderRadius: '4px', width: '100%', maxWidth: '300px' }}
                                value={selectedProduct}
                                onChange={e => setSelectedProduct(e.target.value)}
                                disabled={!!editingRecipe}
                            >
                                <option value="">-- Pilih Produk --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Bahan-bahan</label>
                            {ingredients.map((ing, index) => (
                                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        style={{ padding: '8px', borderRadius: '4px', flex: 1 }}
                                        value={ing.inventoryId}
                                        onChange={e => updateIngredient(index, 'inventoryId', e.target.value)}
                                    >
                                        <option value="">-- Pilih Bahan --</option>
                                        {inventory.map(item => (
                                            <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        style={{ padding: '8px', borderRadius: '4px', width: '100px' }}
                                        value={ing.qty}
                                        onChange={e => updateIngredient(index, 'qty', e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeIngredientRow(index)}
                                        style={{ padding: '8px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addIngredientRow}
                                style={{ padding: '6px 12px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                + Tambah Bahan
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" style={{ padding: '8px 16px', background: '#00e0b8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#000' }}>
                                {editingRecipe ? 'Update Resep' : 'Simpan Resep'}
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
                        <th>Produk</th>
                        <th>Komposisi</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {recipes.map((recipe, idx) => (
                        <tr key={idx}>
                            <td style={{ fontWeight: 'bold' }}>{getProductName(recipe.productId)}</td>
                            <td>
                                {recipe.ingredients.map((ing, i) => (
                                    <div key={i} style={{ fontSize: '0.9rem', color: '#ccc' }}>
                                        • {ing.qty} × {getInventoryName(ing.inventoryId)}
                                    </div>
                                ))}
                            </td>
                            <td>
                                <button onClick={() => handleEdit(recipe)} style={{ marginRight: '0.5rem', color: '#1890ff', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Edit
                                </button>
                                <button onClick={() => handleDelete(recipe.productId)} style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}>
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
