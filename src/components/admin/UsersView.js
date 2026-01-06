"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";

export default function UsersView() {
    const [users, setUsers] = useState([]);
    const [showAdd, setShowAdd] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [role, setRole] = useState("CASHIER");
    const [pin, setPin] = useState("");

    const loadUsers = () => {
        setUsers(db.get('users'));
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleAddUser = (e) => {
        e.preventDefault();
        if (!name || !pin) return alert("Please fill details");

        db.add('users', {
            id: 'u_' + Date.now(),
            name,
            role,
            pin
        });

        setShowAdd(false);
        setName("");
        setPin("");
        loadUsers();
        alert("User Created!");
    };

    const handleDelete = (id) => {
        if (!confirm("Delete this user?")) return;
        const current = db.get('users');
        const filtered = current.filter(u => u.id !== id);
        localStorage.setItem('pos_users', JSON.stringify(filtered));
        loadUsers();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.5rem" }}>
                <h2>User Management</h2>
                <button
                    onClick={() => setShowAdd(true)}
                    style={{ padding: '0.5rem 1rem', background: '#00e0b8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Add User
                </button>
            </div>

            {showAdd && (
                <div style={{
                    background: '#2c2c2e', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #444'
                }}>
                    <h3 style={{ marginBottom: '1rem' }}>New User</h3>
                    <form onSubmit={handleAddUser} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Name</label>
                            <input style={{ padding: '8px', borderRadius: '4px', border: 'none' }} value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Role</label>
                            <select style={{ padding: '8px', borderRadius: '4px' }} value={role} onChange={e => setRole(e.target.value)}>
                                <option value="ADMIN">Admin / Owner</option>
                                <option value="CASHIER">Cashier</option>
                                <option value="INVENTORY">Inventory Staff</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>PIN</label>
                            <input style={{ padding: '8px', borderRadius: '4px', border: 'none', width: '80px' }} value={pin} onChange={e => setPin(e.target.value)} maxLength={6} />
                        </div>
                        <button type="submit" style={{ padding: '8px 16px', background: '#00e0b8', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Save
                        </button>
                        <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '8px 16px', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>PIN</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.id}>
                            <td>{u.name}</td>
                            <td>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                    background: u.role === 'ADMIN' ? '#ff4d4f' : u.role === 'INVENTORY' ? '#1890ff' : '#52c41a',
                                    color: 'white'
                                }}>
                                    {u.role}
                                </span>
                            </td>
                            <td style={{ fontFamily: 'monospace' }}>****</td>
                            <td>
                                <button onClick={() => handleDelete(u.id)} style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
