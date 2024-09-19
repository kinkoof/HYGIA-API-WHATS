const { sendTextMessage } = require('../utils/messageSender');
const { validateEmail, hashPassword } = require('../utils/validators');
const { userRegistrationState } = require('../state');

const handleRegistration = async (phone_number_id, from, received_message) => {
    const userState = userRegistrationState[from] || { step: 'start' };

    if (userState.step === 'start') {
        await sendTextMessage(phone_number_id, from, "Por favor, me informe seu endereço de email.");
        userRegistrationState[from] = { step: 'awaiting_email' };
    } else if (userState.step === 'awaiting_email') {
        if (validateEmail(received_message)) {
            userRegistrationState[from] = { step: 'awaiting_name', email: received_message };
            await sendTextMessage(phone_number_id, from, "Email recebido! Agora, informe seu nome completo.");
        } else {
            await sendTextMessage(phone_number_id, from, "Por favor, insira um email válido.");
        }
    } else if (userState.step === 'awaiting_name') {
        userRegistrationState[from] = { step: 'awaiting_password', name: received_message };
        await sendTextMessage(phone_number_id, from, "Nome recebido! Agora, crie uma senha.");
    } else if (userState.step === 'awaiting_password') {
        const newUser = {
            email: userState.email,
            name: userState.name,
            password: hashPassword(received_message)
        };

        await saveUserToDatabase(newUser);
        await sendTextMessage(phone_number_id, from, "Registro completo! Bem-vindo à plataforma.");
        delete userRegistrationState[from]; // Limpar o estado após o registro
    }
};

module.exports = { handleRegistration };
