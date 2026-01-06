
import { db } from "./db";

export const inventoryService = {
    deductStock: (items) => {
        // Items: [{ product, qty }]
        const recipes = db.get('recipes');
        const inventory = db.get('inventory');
        const logs = [];

        items.forEach(item => {
            const recipe = recipes.find(r => r.productId === item.product.id);
            if (recipe) {
                recipe.ingredients.forEach(ing => {
                    // Find inventory item
                    const invIndex = inventory.findIndex(i => i.id === ing.inventoryId);
                    if (invIndex !== -1) {
                        // Deduct
                        inventory[invIndex].stock -= (ing.qty * item.qty);

                        // Log (Simulated)
                        logs.push({
                            inventoryId: inventory[invIndex].id,
                            change: -(ing.qty * item.qty),
                            type: 'SALE',
                            balance: inventory[invIndex].stock
                        });
                    }
                });
            }
        });

        // Save back to DB
        localStorage.setItem('pos_inventory', JSON.stringify(inventory));
        // localStorage.setItem('pos_inventory_logs', JSON.stringify(logs)); // If we had logs table

        return true;
    }
};
