"use client";

import styles from "./CartSidebar.module.css";
import { usePOS } from "@/context/POSContext";

export default function CartSidebar({ onCheckout }) {
    const { cart, setCart } = usePOS();

    const updateQty = (productId, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.product.id === productId) {
                    const newQty = item.qty + delta;
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(item => item.qty > 0);
        });
    };

    const subtotal = cart.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
    const total = subtotal;

    return (
        <div className={styles.sidebar}>
            <div className={styles.cartHeader}>
                <h2>Current Order</h2>
            </div>

            <div className={styles.cartItems}>
                {cart.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>Cart is empty</p>
                ) : (
                    cart.map((item) => (
                        <div key={item.product.id} className={styles.item}>
                            <div className={styles.itemDetails}>
                                <span className={styles.itemName}>{item.product.name}</span>
                                <span className={styles.itemPrice}>
                                    Rp {(item.product.price * item.qty).toLocaleString()}
                                </span>
                            </div>
                            <div className={styles.controls}>
                                <button className={styles.qtyBtn} onClick={() => updateQty(item.product.id, -1)}>-</button>
                                <div className={styles.qty}>{item.qty}</div>
                                <button className={styles.qtyBtn} onClick={() => updateQty(item.product.id, 1)}>+</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className={styles.footer}>
                <div className={styles.row}>
                    <span>Subtotal</span>
                    <span>Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className={styles.totalRow}>
                    <span>Total</span>
                    <span>Rp {total.toLocaleString()}</span>
                </div>

                <button
                    className={styles.checkoutBtn}
                    disabled={cart.length === 0}
                    onClick={onCheckout}
                >
                    Checkout
                </button>
            </div>
        </div>
    );
}
