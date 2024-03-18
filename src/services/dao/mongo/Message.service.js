import { Message } from "./models/message.model.js";

class MessageManager {
    constructor() {}

    async addMessage(messageData) { // Renombrar el parámetro a messageData
        try {
            const newMessage = new Message(messageData);
            await newMessage.save();
            console.log('Message agregado exitosamente.');
            return newMessage;
        } catch (error) {
            console.error('Error al agregar el Message:', error);
            return null;
        }
    }
}

export default MessageManager;
