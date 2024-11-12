const db = require('../config/db');

exports.createOrder = async (userId, items, total) => {
    if (!Array.isArray(items)) {
        throw new Error("Os itens precisam ser um array.");
    }

    try {
        // Organizar os itens por farmácia
        const pharmacyOrders = {};

        // Agrupar os itens por farmácia
        items.forEach(item => {
            if (!pharmacyOrders[item.pharmacyId]) {
                pharmacyOrders[item.pharmacyId] = [];
            }
            pharmacyOrders[item.pharmacyId].push(item);
        });

        // Criar um pedido para cada farmácia
        const orderResults = [];

        for (let pharmacyId in pharmacyOrders) {
            const orderItems = pharmacyOrders[pharmacyId].map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            }));

            // Calcular o total do pedido para a farmácia
            const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Inserir o pedido para esta farmácia
            const result = await db.execute(
                `INSERT INTO orders (user_phone, pharmacy_id, total, items, status) VALUES (?, ?, ?, ?, ?)`,
                [userId, pharmacyId, orderTotal, JSON.stringify(orderItems), 'w']  // Aqui armazenamos os itens como JSON
            );

            const orderId = result.insertId;

            orderResults.push({ pharmacyId, orderId });
        }

        return { success: true, orderResults };
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        return { success: false, error: error.message };
    }
};
