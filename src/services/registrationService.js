const userFlows = require('../state/userFlows');
const { sendWhatsAppMessage } = require('./whatsappService');
const { saveUserToDatabase } = require('./userService');
const bcrypt = require('bcryptjs');

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const startRegisterFlow = (phone_number_id, from, res) => {
    userFlows[from] = { step: 'password', data: { phoneNumber: from } };
    sendWhatsAppMessage(phone_number_id, from, 'Para começar seu registro, defina uma Senha:', res);
};

const handleRegistrationStep = (phone_number_id, from, userText, res) => {
    const currentStep = userFlows[from]?.step;

    if (!currentStep) {
        return sendWhatsAppMessage(phone_number_id, from, 'Não entendi, por favor, tente novamente.', res);
    }

    switch (currentStep) {
        case 'password':
            const hashedPassword = bcrypt.hashSync(userText, 10);
            userFlows[from].data.password = hashedPassword;
            userFlows[from].step = 'confirmPassword';
            sendWhatsAppMessage(phone_number_id, from, 'Por favor, confirme sua senha:', res);
            break;

        case 'confirmPassword':
            const isPasswordMatch = bcrypt.compareSync(userText, userFlows[from].data.password);
            if (isPasswordMatch) {
                userFlows[from].step = 'email';
                sendWhatsAppMessage(phone_number_id, from, 'Agora, por favor, informe seu e-mail:', res);
            } else {
                userFlows[from].step = 'password';
                sendWhatsAppMessage(phone_number_id, from, 'As senhas não coincidem. Vamos começar de novo.', res);
            }
            break;

        case 'email':
            if (validateEmail(userText)) {
                userFlows[from].data.email = userText;
                sendWhatsAppMessage(phone_number_id, from, 'Por favor, compartilhe sua localização:', res, null, true);
                userFlows[from].step = 'location';
            } else {
                sendWhatsAppMessage(phone_number_id, from, 'O e-mail fornecido não é válido. Por favor, tente novamente.', res);
            }
            break;

        case 'location':
            userFlows[from].data.location = userText;
            const { phoneNumber, password, email, location } = userFlows[from].data;
            saveUserToDatabase(from, { phoneNumber, password, email, location });
            sendWhatsAppMessage(phone_number_id, from, 'Parabéns! Seu registro foi concluído com sucesso.', res);
            delete userFlows[from];
            break;
    }
};

module.exports = { startRegisterFlow, handleRegistrationStep };
