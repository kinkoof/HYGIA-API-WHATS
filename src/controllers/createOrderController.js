const db = require('../config/db');

exports.createOrder = async (userId, pharmacyId, items, total) => {
    if (!Array.isArray(items)) {
        throw new Error("Os itens precisam ser um array.");
    }

    try {
        const orderItems = items.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        }));

        const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const result = await db.execute(
            `INSERT INTO orders (user_phone, pharmacy_id, total, items, status) VALUES (?, ?, ?, ?, ?)`,
            [userId, pharmacyId, orderTotal, JSON.stringify(orderItems), 'w']  // Aqui armazenamos os itens como JSON
        );

        const orderId = result.insertId;

        for (let item of orderItems) {
            await db.execute(
                `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
                [orderId, item.productId, item.quantity, item.price]
            );
        }

        return { success: true, orderId };
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        return { success: false, error: error.message };
    }
};
