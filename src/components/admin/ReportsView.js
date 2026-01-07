"use client";

import { useState, useEffect } from "react";
import styles from "@/components/Dashboard.module.css";
import { db } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsView() {
    const [stats, setStats] = useState({ sales: 0, transactions: 0, cogs: 0, expenses: 0, profit: 0 });
    const [dailyData, setDailyData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [reportData, setReportData] = useState({}); // Stores raw filtered data (expenses etc)
    const [dateRange, setDateRange] = useState({ start: "", end: "" });
    const [filterType, setFilterType] = useState("TODAY"); // TODAY, YESTERDAY, THIS_WEEK, THIS_MONTH, CUSTOM

    // Helper to get dates
    const getDates = (type) => {
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (type === 'YESTERDAY') {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else if (type === 'THIS_WEEK') {
            // Start of current week (Monday)
            const dayOfWeek = start.getDay(); // 0 (Sun) - 6 (Sat)
            const diff = start.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
        } else if (type === 'THIS_MONTH') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        }

        // Format YYYY-MM-DD for input fields
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        return {
            start: formatDate(start),
            end: formatDate(end)
        };
    };

    useEffect(() => {
        if (filterType !== 'CUSTOM') {
            const { start, end } = getDates(filterType);
            setDateRange({ start, end });
        }
    }, [filterType]);

    useEffect(() => {
        if (!dateRange.start || !dateRange.end) return;

        const loadReportData = async () => {
            const transactions = await db.get('transactions');
            const recipes = await db.get('recipes');
            const inventory = await db.get('inventory');
            const expenses = await db.get('expenses');

            const start = new Date(dateRange.start);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.end);
            end.setHours(23, 59, 59, 999);

            // Filter Transactions
            const filteredTrx = transactions.filter(t => {
                const tDate = new Date(t.created_at); // Schema: created_at
                return tDate >= start && tDate <= end;
            });

            // Filter Expenses (for Net Profit)
            const filteredExp = expenses.filter(e => {
                const eDate = new Date(e.date);
                return eDate >= start && eDate <= end;
            });
            let totalOpExpenses = 0;
            filteredExp.forEach(e => totalOpExpenses += Number(e.total_cost || 0)); // Schema: total_cost

            let totalSales = 0;
            let totalCOGS = 0;
            const productMap = {}; // id -> {name, qty, sales}
            const dailyMap = {}; // date -> {sales, cogs}

            filteredTrx.forEach(trx => {
                // Schema uses grand_total. Items is JSONB.
                const saleAmount = Number(trx.grand_total || 0);
                totalSales += saleAmount;
                const dateKey = new Date(trx.created_at).toLocaleDateString();

                if (!dailyMap[dateKey]) dailyMap[dateKey] = { sales: 0, cogs: 0, profit: 0 };
                dailyMap[dateKey].sales += saleAmount;

                // trx.items is JSONB, might need parsing if string, but Supabase client usually auto-parses JSON columns
                const items = (typeof trx.items === 'string' ? JSON.parse(trx.items) : trx.items) || [];

                items.forEach(cartItem => {
                    if (!cartItem?.product?.id) return; // Added product.id check
                    // Top Products Stats
                    if (!productMap[cartItem.product.id]) {
                        productMap[cartItem.product.id] = { name: cartItem.product.name || 'Unknown', qty: 0, sales: 0 };
                    }
                    productMap[cartItem.product.id].qty += (cartItem.qty || 0);
                    productMap[cartItem.product.id].sales += ((cartItem.product.price || 0) * (cartItem.qty || 0));

                    // COGS Calc
                    // Find recipe by product_id
                    const recipe = recipes.find(r => r.product_id === cartItem.product.id);
                    let itemCost = 0;
                    if (recipe) {
                        const ingredients = (typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients) || [];
                        ingredients.forEach(ing => {
                            const invItem = inventory.find(i => i.id === ing.inventoryId);
                            if (invItem) itemCost += (Number(invItem.cost || 0) * (ing.qty || 0));
                        });
                    }
                    const totalItemCost = itemCost * (cartItem.qty || 0);
                    totalCOGS += totalItemCost;
                    dailyMap[dateKey].cogs += totalItemCost;
                });
            });

            // Finalize Daily Data
            const dailyArr = Object.keys(dailyMap).map(k => ({
                date: k,
                sales: dailyMap[k].sales,
                cogs: dailyMap[k].cogs,
                profit: dailyMap[k].sales - dailyMap[k].cogs // Profit here is Gross Profit
            })).sort((a, b) => new Date(a.date) - new Date(b.date));

            // Finalize Top Products
            const topArr = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

            setStats({
                sales: totalSales,
                transactions: filteredTrx.length,
                cogs: totalCOGS,
                expenses: totalOpExpenses,
                profit: totalSales - totalCOGS - totalOpExpenses // Net Profit
            });
            setDailyData(dailyArr);
            setTopProducts(topArr);
        };

        loadReportData();
    }, [dateRange]);



    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Financial Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 30);

        doc.text(`Total Sales: Rp ${(stats.sales || 0).toLocaleString()}`, 14, 40);
        doc.text(`Total Profit: Rp ${(stats.profit || 0).toLocaleString()}`, 14, 46);
        doc.text(`Transactions: ${stats.transactions || 0}`, 14, 52);

        // Daily Table
        doc.text("Daily Breakdown", 14, 65);
        autoTable(doc, {
            startY: 70,
            head: [['Date', 'Sales', 'COGS', 'Profit']],
            body: (dailyData || []).map(d => [
                d.date || '-',
                `Rp ${(d.sales || 0).toLocaleString()}`,
                `Rp ${(d.cogs || 0).toLocaleString()}`,
                `Rp ${(d.profit || 0).toLocaleString()}`
            ]),
        });

        // Top Products
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.text("Top 5 Products", 14, finalY);
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Product', 'Qty Sold', 'Revenue']],
            body: (topProducts || []).map(p => [
                p.name || '-',
                p.qty || 0,
                `Rp ${(p.sales || 0).toLocaleString()}`
            ]),
        });

        doc.save(`report_${dateRange.start}_${dateRange.end}.pdf`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.5rem" }}>
                <h2>Financial Report</h2>
                <button
                    onClick={handleExportPDF}
                    style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                    Export PDF
                </button>
            </div>

            {/* FILTERS */}
            <div style={{ background: '#1f1f22', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['TODAY', 'YESTERDAY', 'THIS_WEEK', 'THIS_MONTH'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: '4px',
                                border: '1px solid #444',
                                background: filterType === type ? '#00e0b8' : 'transparent',
                                color: filterType === type ? '#000' : '#888',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            {type.replace('_', ' ')}
                        </button>
                    ))}
                    <button
                        onClick={() => setFilterType('CUSTOM')}
                        style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            background: filterType === 'CUSTOM' ? '#00e0b8' : 'transparent',
                            color: filterType === 'CUSTOM' ? '#000' : '#888',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                        }}
                    >
                        CUSTOM
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setFilterType('CUSTOM'); }}
                        style={{ background: '#333', border: '1px solid #444', color: 'white', padding: '0.3rem' }}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setFilterType('CUSTOM'); }}
                        style={{ background: '#333', border: '1px solid #444', color: 'white', padding: '0.3rem' }}
                    />
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Gross Sales</p>
                    <h3 style={{ fontSize: '1.8rem', color: 'white' }}>Rp {(stats.sales || 0).toLocaleString()}</h3>
                </div>
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>COGS (HPP)</p>
                    <h3 style={{ fontSize: '1.8rem', color: '#ff4d4f' }}>Rp {(stats.cogs || 0).toLocaleString()}</h3>
                </div>
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Operational Expenses</p>
                    <h3 style={{ fontSize: '1.8rem', color: '#ff4d4f' }}>Rp {(stats.expenses || 0).toLocaleString()}</h3>
                </div>
                <div style={{ background: '#2c2c2e', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Net Profit</p>
                    <h3 style={{ fontSize: '1.8rem', color: '#00e0b8' }}>Rp {(stats.profit || 0).toLocaleString()}</h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* DAILY BREAKDOWN */}
                <div style={{ background: '#1f1f22', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Daily Breakdown</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left' }}>
                                    <th style={{ padding: '0.5rem' }}>Date</th>
                                    <th style={{ padding: '0.5rem' }}>Sales</th>
                                    <th style={{ padding: '0.5rem' }}>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyData.map(d => (
                                    <tr key={d.date} style={{ borderBottom: '1px solid #222' }}>
                                        <td style={{ padding: '0.5rem' }}>{d.date || '-'}</td>
                                        <td style={{ padding: '0.5rem' }}>Rp {(d.sales || 0).toLocaleString()}</td>
                                        <td style={{ padding: '0.5rem', color: '#00e0b8' }}>Rp {(d.profit || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {dailyData.length === 0 && <tr><td colSpan="3" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>No Data</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* TOP PRODUCTS */}
                <div style={{ background: '#1f1f22', padding: '1.5rem', borderRadius: '12px', border: '1px solid #333' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Top 5 Products</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {topProducts.map((p, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '0.4rem' }}>
                                <span>{i + 1}. {p.name || 'Unknown'} <span style={{ color: '#888', fontSize: '0.8rem' }}>({p.qty || 0}x)</span></span>
                                <span>Rp {(p.sales || 0).toLocaleString()}</span>
                            </li>
                        ))}
                        {topProducts.length === 0 && <p style={{ color: '#666' }}>No Sales</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
}
