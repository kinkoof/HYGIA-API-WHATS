exports.createOrder = async (userPhone, items, total) => {
    try {
        // Agrupa os itens por `pharmacy_id`
        const itemsByPharmacy = items.reduce((acc, item) => {
            if (!acc[item.pharmacyId]) acc[item.pharmacyId] = [];
            acc[item.pharmacyId].push(item);
            return acc;
        }, {});

        const orderResults = [];

        // Cria uma ordem para cada farmácia
        for (const pharmacyId in itemsByPharmacy) {
            const pharmacyItems = itemsByPharmacy[pharmacyId];
            const pharmacyTotal = pharmacyItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const itemsJson = JSON.stringify(pharmacyItems);

            // Insere a ordem na tabela "orders" para a farmácia atual
            const [orderResult] = await db.execute(
                `INSERT INTO orders (user_phone, pharmacy_id, total, items, status) VALUES (?, ?, ?, ?, 'w')`,
                [userPhone, pharmacyId, pharmacyTotal, itemsJson]
            );

            const orderId = orderResult.insertId;
            orderResults.push({ orderId, pharmacyId });
            console.log(`Pedido criado com sucesso para o usuário ${userPhone} na farmácia ${pharmacyId}`);
        }

        return { success: true, orderResults };
    } catch (error) {
        console.error('Erro ao criar pedidos:', error);
        return { success: false, error };
    }
};
