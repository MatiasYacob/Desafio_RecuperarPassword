import { Schema, model } from "mongoose";

const MessageSchema = new Schema({
   user: String,
   message: String,
});

const Message = model('Message', MessageSchema); // Cambiado a 'Message' para coincidir con el nombre del modelo

export { Message };
