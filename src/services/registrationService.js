const { sendTextMessage, sendButtonsMessage  } = require('../utils/messageSender');
const { validatePassword, hashPassword } = require('../utils/validators');

let userRegistrationState = {};

const handleFirstMessage = async (phone_number_id, from) => {
    await sendButtonsMessage(phone_number_id, from);
    userRegistrationState[from] = { step: 'awaiting_choice' };
};

const handleRegistration = async (phone_number_id, from, received_message) => {
    const userState = userRegistrationState[from] || { step: 'initial' };

    if (userState.step === 'awaiting_choice') {
        const message_id = received_message.button_reply.id;

        if (message_id === 'register') {
            await sendTextMessage(phone_number_id, from, "Por favor, defina uma senha (deve conter no mínimo 8 caracteres e uma letra maiúscula).");
            userRegistrationState[from] = { step: 'awaiting_password' };
        } else if (message_id === 'buy') {
            await sendTextMessage(phone_number_id, from, "Você escolheu Comprar Remédio. Estamos processando seu pedido.");
            delete userRegistrationState[from];
        } else if (message_id === 'login') {
            await sendTextMessage(phone_number_id, from, "Você escolheu Login. Por favor, insira suas credenciais.");
            delete userRegistrationState[from];
        } else {
            await sendTextMessage(phone_number_id, from, "Escolha inválida. Por favor, selecione uma das opções.");
            await sendButtonsMessage(phone_number_id, from);
        }
    } else if (userState.step === 'awaiting_password') {
        // Fluxo de registro continua aqui
    }
};

const handleUserInteraction = async (phone_number_id, from, received_message) => {
    const userState = userRegistrationState[from] || { step: 'initial' };

    if (userState.step === 'initial') {
        await handleFirstMessage(phone_number_id, from);
    } else {
        await handleRegistration(phone_number_id, from, received_message);
    }
};

const saveUserToDatabase = async (user) => {
    console.log("Usuário salvo no banco:", user);
};

module.exports = { handleUserInteraction };
