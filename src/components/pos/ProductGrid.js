"use client";

import styles from "./ProductGrid.module.css";
import { usePOS } from "@/context/POSContext";

export default function ProductGrid() {
    const { products, cart, setCart } = usePOS();

    const addToCart = (product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product.id === product.id
                        ? { ...item, qty: item.qty + 1 }
                        : item
                );
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    return (
        <div>
            <h2 style={{ marginBottom: '1rem' }}>Menu</h2>
            <div className={styles.grid}>
                {products.map((product) => (
                    <div
                        key={product.id}
                        className={styles.card}
                        onClick={() => addToCart(product)}
                    >
                        <div className={styles.imagePlaceholder}>
                            {product.image && product.image.startsWith('data:') ? (
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                />
                            ) : (
                                product.image || '📦'
                            )}
                        </div>
                        <div className={styles.info}>
                            <div className={styles.name}>{product.name}</div>
                            <div className={styles.price}>Rp {product.price.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
