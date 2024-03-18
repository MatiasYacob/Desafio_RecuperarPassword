// ticket.model.js

import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
    },
    purchase_datetime: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,
        required: true,
    },
    purchaser: {
        type: String,
        required: true,
    },
});

// Middleware de pre-save para generar automáticamente el código
ticketSchema.pre('save', async function (next) {
    if (!this.code) {
        // Generar un código único si no está establecido
        this.code = generateUniqueTicketCode();
    }
    next();
});

// Función de generación de código único
function generateUniqueTicketCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Definir el modelo de Ticket
const Ticket = mongoose.model('Ticket', ticketSchema);

export default Ticket;
