// Repository de Product
import ProductManager from './dao/mongo/Product.service.js';
import ProductRepository from './repository/ProductRepository.js';

const productManager = new ProductManager();
export const productRepository = new ProductRepository(productManager);

// Repository de Cart
import CartManager from './dao/mongo/Cart.service.js';
import CartRepository from './repository/CartRepository.js';

const cartManager = new CartManager();  
export const cartRepository = new CartRepository(cartManager);  

//Repository de Users
import UserService from './dao/mongo/users.service.js';
import UserRepository from './repository/UsersRepository.js';

const UserManager = new UserService();
export const userRepository = new UserRepository(UserManager);

//Repository de tickets

import TicketManager from './dao/mongo/ticket.service.js';
import TicketRepository from './repository/TicketRepository.js';
const ticketManager = new TicketManager()
export const ticketRepository = new TicketRepository(ticketManager)