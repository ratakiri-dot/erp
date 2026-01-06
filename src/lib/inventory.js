
import { db } from "./db";

export const inventoryService = {
    deductStock: async (items) => {
        // Items: [{ product, qty }]
        const recipes = await db.get('recipes');
        const inventory = await db.get('inventory');
        // const logs = []; // Not using logs table yet

        for (const item of items) {
            const recipe = recipes.find(r => r.product_id === item.product.id); // Schema: product_id
            if (recipe) {
                // recipe.ingredients is JSONB in Supabase, so it's already an array
                const ingredients = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : recipe.ingredients;

                for (const ing of ingredients) {
                    // Find inventory item
                    const invItem = inventory.find(i => i.id === ing.inventoryId); // Schema: inventory id is 'id'
                    // Note: In recipe, we stored inventoryId. Check schema or data. 
                    // My seed data uses inventoryId in json.

                    if (invItem) {
                        const deductQty = ing.qty * item.qty;
                        const newStock = Number(invItem.stock) - deductQty;

                        // Update in DB
                        await db.update('inventory', invItem.id, { stock: newStock });

                        // Update local cache if we want, but we rely on refreshData() in context
                    }
                }
            }
        }
        return true;
    }
};
