import Ticket from "./models/ticket.model.js";
import { Cart } from "./models/cart.model.js";
import { Product } from "./models/product.model.js";
import userModel from "./models/user.model.js";
import { sendTicketByEmail } from "../../../controllers/EmailController.js";

class TicketManager {
    constructor() {}

    async createTicket(userId) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart || cart.products.length === 0) {
                throw new Error('No hay productos en el carrito para crear un ticket.');
            }

            // Verifica el stock antes de crear el ticket
            await this.checkStock(cart.products);

            const user = await userModel.findById(userId);
            const ticket = new Ticket({
                purchase_datetime: new Date(),
                amount: this.calculateTotalAmount(cart.products),
                purchaser: user.email,
                products: cart.products,
            });

            await ticket.save();

            // Ajusta el stock después de crear el ticket
            await this.updateStock(cart.products);

            // Elimina todos los productos del carrito después de crear el ticket
            await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

            console.log('Ticket creado exitosamente.');

            // Llama al controlador de correo para enviar el ticket al usuario
            await sendTicketByEmail(user.email, ticket);

            return ticket;
        } catch (error) {
            console.error('Error al crear el ticket:', error.message); // Imprime solo el mensaje del error
        
            if (error.message.includes('No hay suficiente stock')) {
                await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });
                throw new Error('No hay suficiente stock para completar la compra. Por favor, consulta con un vendedor.');
            }
        
            throw new Error('Error al crear el ticket. Consulta los registros para obtener más detalles.'); // Puedes personalizar este mensaje según tus necesidades
        }
        
    }

    async checkStock(products) {
        const session = await Product.startSession();
        session.startTransaction();
    
        try {
            for (const product of products) {
                const existingProduct = await Product.findById(product.productId).session(session);
    
                if (!existingProduct || existingProduct.stock < product.quantity) {
                    throw new Error(`No hay suficiente stock para el producto: ${existingProduct ? existingProduct.title : 'Producto no encontrado'}`);
                }
            }
    
            await session.commitTransaction();
            session.endSession();
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    }
    

    async updateStock(products) {
        for (const product of products) {
            // Resta la cantidad comprada del stock actual solo si el producto está disponible
            await Product.findByIdAndUpdate(product.productId, {
                $inc: { stock: -product.quantity },
                $set: { status: product.quantity <= product.stock } // Actualiza el estado del producto según el stock restante
            });
        }
    }

    async getTicketsByUser(userId) {
        try {
            const user = await userModel.findById(userId);

            if (!user) {
                
                return [];
            }

            const tickets = await Ticket.find({ purchaser: user.email });

            

            return tickets;
        } catch (error) {
            console.error("Error al obtener los tickets:", error);
            throw error;
        }
    }

    // Otras funciones relacionadas con la gestión de tickets...

    // Función para calcular el monto total basado en los productos del carrito
    calculateTotalAmount(products) {
        return products.reduce((total, product) => total + product.quantity * product.price, 0);
    }
}

export default TicketManager;