const db = require("../config/db");

exports.createOrder = async (userPhone, items, total, location) => {
    console.log("Itens recebidos:", items);  // Verifique os itens recebidos

    if (!Array.isArray(items)) {
        throw new Error("Os itens precisam ser um array.");
    }

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // Organizar os itens por farmácia
        const pharmacyOrders = {};

        items.forEach(item => {
            if (!item.pharmacyId) {
                throw new Error("Cada item precisa ter um pharmacyId.");
            }

            if (!pharmacyOrders[item.pharmacyId]) {
                pharmacyOrders[item.pharmacyId] = [];
            }
            pharmacyOrders[item.pharmacyId].push(item);
        });

        console.log('Pedidos organizados por farmácia:', pharmacyOrders);  // Verifique como os itens estão organizados

        // Criar um pedido para cada farmácia
        const orderResults = [];

        for (let pharmacyId in pharmacyOrders) {
            const orderItems = pharmacyOrders[pharmacyId].map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            }));

            const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            console.log(`Total para a farmácia ${pharmacyId}:`, orderTotal); // Verifique o total calculado

            // Inserir o pedido para esta farmácia (incluindo os dados de localização)
            const result = await connection.execute(
                `INSERT INTO orders (user_phone, pharmacy_id, total, items, status, latitude, longitude, address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userPhone,
                    pharmacyId,
                    orderTotal,
                    JSON.stringify(orderItems),
                    'w',
                    location.latitude,
                    location.longitude,
                    location.address
                ]
            );

            console.log('Resultado da inserção do pedido:', result);  // Verifique a resposta do banco
            const orderId = result.insertId;
            orderResults.push({ pharmacyId, orderId });
        }

        await connection.commit();
        console.log('Pedidos criados com sucesso:', orderResults);  // Confirmação de sucesso
        return { success: true, orderResults };
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao criar pedido:', error);
        return { success: false, error: error.message };
    } finally {
        connection.release();
    }
};
