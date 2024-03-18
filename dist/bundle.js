'use strict';

var express = require('express');
var socket_io = require('socket.io');
var handlebars = require('express-handlebars');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var passport = require('passport');
var allowPrototypeAccess = require('@handlebars/allow-prototype-access');
var Handlebars = require('handlebars');
var dotenv = require('dotenv');
var commander = require('commander');
var mongoosePaginate = require('mongoose-paginate-v2');
var url = require('url');
var path = require('path');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
var passportLocal = require('passport-local');
require('passport-github2');
var jwtStrategy = require('passport-jwt');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var dotenv__namespace = /*#__PURE__*/_interopNamespaceDefault(dotenv);
var commander__namespace = /*#__PURE__*/_interopNamespaceDefault(commander);

// src/config/config.js
// src/config/config.js

const { Command } = commander__namespace;  // Modificado aquí

const program = new Command();

program
    .option('-d', 'Variable para debug', { noArgs: true })
    .option('-p <port>', 'Puerto del servidor', 9090)
    .option('--mode <mode>', 'Modo de trabajo', 'dev');

program.parse();

console.log("Mode Option: ", program.opts().mode);

const environment = program.opts().mode;

dotenv__namespace.config({
    path: environment === "prod" ? "./src/config/.env.production" : "./src/config/.env.development"
});

var config = {
    port: process.env.PORT,
    mongoUrl: process.env.MONGO_URL,
    gmailAcount: process.env.GMAIL_ACCOUNT,
    gmailAppPassword: process.env.GMAIL_APP_PASSWD,
};

const productSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    thumbnails: [String],
    code: String,
    stock: Number,
    status: {
        type: Boolean,
        default: true // Establecer el valor por defecto como true
    }
});
productSchema.plugin(mongoosePaginate);

const Product = mongoose.model('Product', productSchema);

class ProductManager {
    constructor() {
        // Puede añadirse alguna lógica inicial aquí si es necesario.
    }
    
    // Agrega un nuevo producto a la base de datos.
    async addProduct(producto) {
        try {
            const newProduct = new Product(producto);
            await newProduct.save();
            console.log('Producto agregado exitosamente.');
            return newProduct;
        } catch (error) {
            console.error('Error al agregar el producto:', error);
            return null;
        }
    }

    // Actualiza un producto existente basado en su ID.
    async updateProduct(_id, updatedProduct) {
        try {
            const product = await Product.findByIdAndUpdate(_id, updatedProduct, { new: true });
            if (!product) {
                console.log('El producto no existe.');
                return null;
            }
            console.log('Producto actualizado exitosamente.');
            return product;
        } catch (error) {
            console.error('Error al actualizar el producto:', error);
            return null;
        }
    }

    // Elimina un producto basado en su ID.
    async deleteProduct(_id) {
        try {
            const product = await Product.findByIdAndDelete(_id);
            if (!product) {
                console.log('El producto no existe.');
                return null;
            }
            console.log('Producto eliminado exitosamente.');
            return product;
        } catch (error) {
            console.error('Error al eliminar el producto:', error);
            return null;
        }
    }

    // Obtiene todos los productos de la base de datos.
    async getProducts() {
        try {
            const products = await Product.find();
            return products;
        } catch (error) {
            console.error('Error al obtener los productos:', error);
            return [];
        }
    }

    // Obtiene un producto por su ID específico.
    async getProductBy_id(_id) {
        try {
            
            const product = await Product.findById(_id);
            
            return product || null;
        } catch (error) {
            console.error('Error al obtener el producto por ID:', error);
            return null;
        }
    }
}

class ProductRepository {
  constructor(productManager) {
    this.productManager = productManager;
  }

  getAll = () => {
    return this.productManager.getProducts();
  }

  save = (product) => {
    return this.productManager.addProduct(product);
  }

  update = (id, updatedProduct) => {
    return this.productManager.updateProduct(id, updatedProduct);
  }

  delete = (id) => {
    return this.productManager.deleteProduct(id);
  }

  findById = (id) => {
    return this.productManager.getProductBy_id(id);
  }
}

const collection = 'users';

const schema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: {
    type: String,
    unique: true,
  },
  age: Number,
  password: String,
  role: {
    type: String,
    default: 'usuario' // Por defecto, todos los usuarios son "usuarios"
  },
  loggedBy: String,
});

const userModel = mongoose.model(collection, schema);

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: userModel,
        required: true,
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Product,
            required: true,  // Agrega esta línea si productId es obligatorio
        },
        quantity: {
            type: Number,
            default: 1,
        },
        name: String,  // Agrega esta línea para almacenar el nombre del producto
        price: Number,  // Agrega esta línea para almacenar el precio del producto
    }],
});


cartSchema.plugin(mongoosePaginate);

const Cart = mongoose.model('Cart', cartSchema);

const Pmanager = new ProductManager();

class CartManager {
    constructor(){}
    async getProductsInCart(userId) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                console.log('No se encontró un carrito para el usuario.' +userId );
                return [];
            }

            return cart.products;
        } catch (error) {
            console.error('Error al obtener productos del carrito:', error);
            return null;
        }
    }

    async addProductToCart(userId, _id) {
        console.log("id llegando" +_id);
        try {
          const productToAdd = await Pmanager.getProductBy_id(_id);
          if (!productToAdd) {
            return { success: false, message: `El producto ${_id} no existe` };
          }
      
          let cart = await Cart.findOne({ user: userId });
      
          if (!cart) {
            const newCart = new Cart({
              user: userId,
              products: [{
                productId: _id,
                quantity: 1,
                name: productToAdd.title,
                price: productToAdd.price,
              }],
            });
      
            await newCart.save();
            console.log('Nuevo carrito creado exitosamente con un producto.');
            return newCart;
          }
      
          const existingProduct = cart.products.find(item => {
            const itemProductId = String(item.productId);
            const inputId = String(_id);
        
            console.log('itemProductId:', itemProductId);
            console.log('inputId:', inputId);
        
            return itemProductId === inputId;
        });
        
        
        
          if (existingProduct) {
            existingProduct.quantity += 1;
          } else {
            cart.products.push({
              productId: _id,
              quantity: 1,
              name: productToAdd.title,
              price: productToAdd.price,
            });
          }
      
          await cart.save();
          console.log(`Producto ${productToAdd.title} agregado al carrito exitosamente.`);
      
          return cart;
        } catch (error) {
          console.error('Error al agregar producto al carrito:', error);
          return { success: false, message: 'Error interno del servidor' };
        }
      }
      
      async removeFromCart(userId, _id) {
        try {
            const cart = await Cart.findOne({ user: userId });
    
           
    
            if (!cart) {
                return { success: false, message: 'No se encontró un carrito para el usuario' };
            }
    
            const productIndex = cart.products.findIndex(product => String(product.productId) === String(_id));
    
            if (productIndex === -1) {
                return { success: false, message: 'El producto no está en el carrito' };
            }
    
            cart.products.splice(productIndex, 1);
            await cart.save();
    
            console.log(`Producto ${_id} eliminado del carrito exitosamente.`);
            return { success: true, message: `Producto ${_id} eliminado del carrito` };
        } catch (error) {
            console.error('Error al eliminar producto del carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }
    

    async removeAllProductsFromCart(userId) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito para el usuario' };
            }

            cart.products = [];
            await cart.save();

            console.log('Todos los productos eliminados del carrito exitosamente.');
            return { success: true, message: 'Todos los productos eliminados del carrito' };
        } catch (error) {
            console.error('Error al eliminar todos los productos del carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    async updateProductQuantity(userId, _id, quantity) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart) {
                return { success: false, message: 'No se encontró un carrito para el usuario' };
            }

            const productToUpdate = cart.products.find(product => String(product._id) === String(_id));

            if (!productToUpdate) {
                return { success: false, message: 'El producto no está en el carrito' };
            }

            productToUpdate.quantity = quantity;
            await cart.save();

            console.log(`Cantidad del producto ${_id} actualizada en el carrito exitosamente.`);
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar cantidad del producto en el carrito:', error);
            return { success: false, message: 'Error interno del servidor' };
        }
    }

    async getProductsInCartWithDetails(userId, page, limit) {
        try {
            const options = {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                populate: {
                    path: 'products.productId',
                    model: 'Product',
                }
            };

            const result = await Cart.paginate({ user: userId }, options);

            if (!result) {
                return {
                    status: 'error',
                    payload: [],
                    totalPages: 0,
                    prevPage: null,
                    nextPage: null,
                    page: 0,
                    hasPrevPage: false,
                    hasNextPage: false,
                    prevLink: null,
                    nextLink: null
                };
            }

            const modifiedDocs = result.docs.map(doc => ({
                ...doc.toObject(),
                products: doc.products.map(product => ({
                    _id: product._id,
                    quantity: product.quantity
                }))
            }));

            const { totalPages, prevPage, nextPage, page: _page, hasPrevPage, hasNextPage } = result;

            const prevLink = hasPrevPage ? `/cart/${userId}?page=${prevPage}` : null;
            const nextLink = hasNextPage ? `/cart/${userId}?page=${nextPage}` : null;

            return {
                status: 'success',
                payload: modifiedDocs,
                totalPages,
                prevPage,
                nextPage,
                page: _page,
                hasPrevPage,
                hasNextPage,
                prevLink,
                nextLink
            };
        } catch (error) {
            console.error('Error al obtener productos del carrito:', error);
            return {
                status: 'error',
                payload: [],
                totalPages: 0,
                prevPage: null,
                nextPage: null,
                page: 0,
                hasPrevPage: false,
                hasNextPage: false,
                prevLink: null,
                nextLink: null
            };
        }
    }

    
      
}

class CartRepository {
    constructor(cartManager) {
      this.cartManager = cartManager;
    }
  
    getAll = (userId) => {
      return this.cartManager.getProductsInCart(userId);
    }
    getById = (_id) => {
        return this.cartManager.getProductBy_id(_id)
    }
  
    addToCart = (userId, _id) => {
      return this.cartManager.addProductToCart(userId, _id);
    }
  
    removeFromCart = (userID, _id) => {
     

      return this.cartManager.removeFromCart(userID, _id);
    }
  
    updateCartItem = (productId, updatedQuantity) => {
      return this.cartManager.updateCartItem(productId, updatedQuantity);
    }
  
    clearCart = () => {
      return this.cartManager.clearCart();
    }
  
    
  }

const __filename$1 = url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.src || new URL('bundle.js', document.baseURI).href)));
const __dirname$1 = path.dirname(__filename$1);

// Generamos el hash
const createHash = password => bcrypt.hashSync(password, bcrypt.genSaltSync(10));

// Validamos el hash
const isValidPassword = (user, password) => {
    console.log(`Datos a validar: user-password: ${user.password}, password: ${password} `);
    return bcrypt.compareSync(password, user.password);
};

// JWT
const PRIVATE_KEY = "CoderhouseBackendCourseSecretKeyJWT";

const generateJWToken = (user) => {
    return jwt.sign({ user }, PRIVATE_KEY, { expiresIn: "7d" });
};

const authToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log("Token Present In Header Auth");
    console.log('Headers:', req.headers);
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ error: "User pato Not Authenticated or missing token." })
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, PRIVATE_KEY, (error, credentials) => {
        if (error) {
            console.error("Error verifying token:", error);
            return res.status(403).send({ error: "Token invalid, Unauthorized!" })
        }
        // Token ok
        req.user = credentials.user;
        console.log("User credentials from token:", req.user);
        next();
    });
};


// Para passportCall
const passportCall = (strategy) => {
    return async (req, res, next) => {
        try {
            await passport.authenticate(strategy, function (err, user, info) {
                if (err) return next(err);
                if (!user) {
                    return res.status(401).send({ error: info.messages ? info.messages : info.toString() });
                }
                req.user = user;
                next();
            })(req, res, next);
        } catch (error) {
            console.error("Error en passportCall:", error);
            next(error);
        }
    };
};

const authorization = (role) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                // Si el usuario no está autenticado, puedes redirigirlo o renderizar la vista de error
                // Puedes ajustar esto según tus necesidades
                return res.status(401).render('error.hbs', { error: 'Unauthorized: User not found in JWT' });
            }

            if (!role.includes(req.user.role.toUpperCase())) {
                // Si el usuario no tiene los permisos necesarios, renderiza la vista de error
                // Puedes ajustar esto según tus necesidades
                return res.status(403).render('error.hbs', { error: 'Forbidden: El usuario no tiene permisos con este rol.' });
            }

            next();
        } catch (error) {
            console.error("Error en authorization:", error);
            // En caso de error, también puedes renderizar la vista de error
            return res.status(500).render('error.hbs', { error: 'Internal Server Error' });
        }
    };
};

class UserService {
    constructor(){
        console.log("Calling users model using a service.");
    };  
   
    Register = async (user) => {
        try {
            const exist = await userModel.findOne({ email: user.email });
            console.log("Calling users model using a service.");

            if (exist) {
                console.log("El usuario ya existe");
                return { success: false, message: "El usuario ya existe" };
            }

            const newUser = {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                age: user.age,
                password: createHash(user.password),
            };

            const result = await userModel.create(newUser);

            console.log(result);
            return { success: true, message: "Registro exitoso", user: result };
        } catch (error) {
            console.error("Error registrando usuario:", error);
            return { success: false, message: "Error registrando usuario" };
        }
    };







    
    findByUsername = async (username) => {
        const result = await userModel.findOne({email: username});
        return result;
    };
  
}

class UserRepository{
    constructor(UserRepository){
        this.UserRepository = UserRepository;
    }
    Register = (user) => {
        return this.UserRepository.Register(user);
    }
    findByUsername = (username) => {
        return this.UserRepository.findByUsername({email: username});
    }
}

// ticket.model.js


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

const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    auth: {
        user: config.gmailAcount,
        pass: config.gmailAppPassword,
    }
});

const sendTicketByEmail = async (userEmail, ticketDetails) => {
    const { purchase_datetime, amount } = ticketDetails;

    // Cuerpo del correo con información del ticket
    const mailOptions = {
        from: "PreEntrega3-MatiasYacob " + config.gmailAcount,
        to: userEmail,
        subject: "Detalles del Ticket de Compra",
        html: `
            <div style="font-family: 'Arial', 'Helvetica', sans-serif; background-color: #ececec; padding: 20px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);">
                <h2 style="color: #333; text-align: center; font-size: 24px; font-family: 'Times New Roman', Times, serif; font-weight: bold;">¡Gracias por tu compra!</h2>
                <p style="font-size: 18px; margin-bottom: 10px; font-family: 'Verdana', sans-serif; font-weight: bold;">Aquí está el detalle de tu ticket:</p>
                <p style="font-size: 18px; margin-bottom: 5px;">Fecha de Compra: ${purchase_datetime}</p>
                <p style="font-size: 18px; margin-bottom: 20px;">Monto Total: $${amount}</p>
                <!-- Otras propiedades del ticket aquí -->

                <!-- Puedes agregar más estilos y detalles según sea necesario -->
            </div>
        `,
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        console.log('Ticket enviado por correo exitosamente:', result);
    } catch (error) {
        console.error('Error al enviar el ticket por correo:', error);
        throw error;
    }
};

class TicketManager {
    constructor() {}

    async createTicket(userId) {
        try {
            const cart = await Cart.findOne({ user: userId });

            if (!cart || cart.products.length === 0) {
                throw new Error('No hay productos en el carrito para crear un ticket.');
            }

            const user = await userModel.findById(userId);
            const ticket = new Ticket({
                purchase_datetime: new Date(),
                amount: this.calculateTotalAmount(cart.products),
                purchaser: user.email,
                products: cart.products,// hay que arreglar esto, seguramente es porque es un array de objetos
            });

            await ticket.save();

            // Elimina todos los productos del carrito después de crear el ticket
            await Cart.findOneAndUpdate({ user: userId }, { $set: { products: [] } });

            console.log('Ticket creado exitosamente.');

            // Llama al controlador de correo para enviar el ticket al usuario
            await sendTicketByEmail(user.email, ticket);

            return ticket;
        } catch (error) {
            console.error('Error al crear el ticket:', error);
            throw error;
        }
    }

    async getTicketsByUser(userId) {
        try {
            const user = await userModel.findById(userId);
    
            if (!user) {
                console.log('Usuario no encontrado.');
                return [];
            }
    
            const tickets = await Ticket.find({ purchaser: user.email });
    
            console.log('Tickets obtenidos exitosamente para el usuario:', user.email);
            
            return tickets;
        } catch (error) {
            console.error('Error al obtener los tickets:', error);
            throw error;
        }
    }

    // Otras funciones relacionadas con la gestión de tickets...

    // Función para calcular el monto total basado en los productos del carrito
    calculateTotalAmount(products) {
        return products.reduce((total, product) => total + product.quantity * product.price, 0);
    }
}

class TicketRepository {
    constructor(TicketManager) {
      this.TicketManager = TicketManager;
    }
  
    getAll = (userId) => {
      return this.TicketManager.getTicketsByUser(userId);
    }
  
    create = (userId) => {
      return this.TicketManager.createTicket(userId);
    }
  
   
  }

// Repository de Product

const productManager = new ProductManager();
const productRepository = new ProductRepository(productManager);

const cartManager = new CartManager();  
const cartRepository = new CartRepository(cartManager);  

const UserManager = new UserService();
const userRepository = new UserRepository(UserManager);
const ticketManager = new TicketManager();
const ticketRepository = new TicketRepository(ticketManager);

// Función para obtener todos los productos con filtros y paginación
async function getProducts(req, res) {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;
        let productsToSend = await productRepository.getAll();

        // Aplicar el filtro según el parámetro 'query' (nombre del producto)
        if (query) {
            productsToSend = productsToSend.filter(product =>
                product.title.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Aplicar ordenamiento ascendente o descendente según el parámetro 'sort'
        if (sort && (sort === 'asc' || sort === 'desc')) {
            productsToSend.sort((a, b) => {
                if (sort === 'asc') {
                    return a.price - b.price;
                } else {
                    return b.price - a.price;
                }
            });
        }

        // Calcular la información de paginación
        const totalItems = productsToSend.length;
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.min(page, totalPages);

        const startIndex = (currentPage - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalItems);

        // Obtener los productos para la página específica después del filtrado y ordenamiento
        const paginatedProducts = productsToSend.slice(startIndex, endIndex);

        // Construir el objeto de respuesta
        const responseObject = {
            status: 'success',
            payload: paginatedProducts,
            totalPages: totalPages,
            prevPage: currentPage > 1 ? currentPage - 1 : null,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            currentPage: currentPage,
            hasPrevPage: currentPage > 1,
            hasNextPage: currentPage < totalPages,
            prevLink: currentPage > 1 ? `/realtimeproducts?limit=${limit}&page=${currentPage - 1}` : null,
            nextLink: currentPage < totalPages ? `/realtimeproducts?limit=${limit}&page=${currentPage + 1}` : null,
        };

        res.render("realtimeproducts.hbs", { responseObject });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ status: 'error', error: 'Error al obtener los productos' });
    }
}
//obtiene los productos para el usuario
async function getProductsUser(req, res) {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;
        let productsToSend = await productRepository.getAll();

        // Aplicar el filtro según el parámetro 'query' (nombre del producto)
        if (query) {
            productsToSend = productsToSend.filter(product =>
                product.title.toLowerCase().includes(query.toLowerCase())
            );
        }

        // Aplicar ordenamiento ascendente o descendente según el parámetro 'sort'
        if (sort && (sort === 'asc' || sort === 'desc')) {
            productsToSend.sort((a, b) => {
                if (sort === 'asc') {
                    return a.price - b.price;
                } else {
                    return b.price - a.price;
                }
            });
        }

        // Calcular la información de paginación
        const totalItems = productsToSend.length;
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.min(page, totalPages);

        const startIndex = (currentPage - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalItems);

        // Obtener los productos para la página específica después del filtrado y ordenamiento
        const paginatedProducts = productsToSend.slice(startIndex, endIndex);

        // Construir el objeto de respuesta
        const responseObject = {
            status: 'success',
            payload: paginatedProducts,
            totalPages: totalPages,
            prevPage: currentPage > 1 ? currentPage - 1 : null,
            nextPage: currentPage < totalPages ? currentPage + 1 : null,
            currentPage: currentPage,
            hasPrevPage: currentPage > 1,
            hasNextPage: currentPage < totalPages,
            prevLink: currentPage > 1 ? `/products?limit=${limit}&page=${currentPage - 1}` : null,
            nextLink: currentPage < totalPages ? `/products?limit=${limit}&page=${currentPage + 1}` : null,
        };

        res.render("productos.hbs", { responseObject });
        //res.json({responseObject})
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({ status: 'error', error: 'Error al obtener los productos' });
    }
}


// Función para eliminar un producto por su ID
async function deleteProduct(req, res) {
    try {
        const productId = req.params.productId;

        // Validar que productId es un ObjectId válido antes de intentar eliminar
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).json({ status: 'error', error: 'ID de producto no válido' });
        }

        const deletedProduct = await productRepository.delete(productId);

        if (!deletedProduct) {
            return res.status(404).json({ status: 'error', error: 'El producto no existe' });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Producto eliminado exitosamente',
            logMessage: 'Producto eliminado exitosamente. Mensaje adicional para el log de la consola.',
        });
        

    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ status: 'error', error: 'Error al eliminar el producto' });
    }
}



// Función para obtener un producto por _id
async function getProductById(req, res) {
    try {
        const product_id = req.params._id;
        const product = await productRepository.findById(product_id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        console.error('Error al obtener el producto por _id:', error);
        res.status(500).json({ error: 'Error al obtener el producto por _id' });
    }
}

// Función para agregar un nuevo producto
async function addProduct(req, res) {
    try {
        const { title, description, price, thumbnails, code, stock, status } = req.body;

        // Validación de campos obligatorios
        if (!title || !price || !thumbnails || !code || !stock) {
            return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
        }

        const newProduct = {
            title,
            description,
            price: Number(price),
            thumbnails: Array.isArray(thumbnails) ? thumbnails : [thumbnails],
            code,
            stock: Number(stock),
            status: status || true
        };

        const product = await productRepository.save(newProduct);

        if (product) {
            // Log informativo
            console.log('Producto agregado exitosamente:', product);
            res.status(201).json({ status: 'success', data: product });
        } else {
            // Log de error
            console.error('Error al agregar el producto');
            res.status(500).json({ status: 'error', message: 'Error al agregar el producto' });
        }
    } catch (error) {
        // Log de error interno del servidor
        console.error('Error interno del servidor al agregar el producto:', error);
        res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
}


// Función para actualizar un producto por su ID
async function updateProductById(req, res) {
    const productId = req.params.id;
    const updatedFields = req.body; // Los campos actualizados estarán en req.body

    try {
        const updatedProduct = await productRepository.update(productId, updatedFields);
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error al actualizar el producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

const router$6 = express.Router();

// Rutas
// Ruta para eliminar un producto del carrito ("/cart/:productId")
router$6.delete('/:productId', passportCall('jwt'), authorization(['ADMIN']), deleteProduct);


// Ruta para agregar un nuevo producto
router$6.post('/', passportCall('jwt'), authorization(['ADMIN']), addProduct);



// Ruta para obtener todos los productos con filtros y paginación
router$6.get('/', getProducts);



// 🚧 ¡Atención! Estas rutas están en construcción y son propensas a cambios. 🚧


// Ruta para obtener un producto por su _id
router$6.get('/:_id', getProductById);

// Ruta para actualizar un producto por su ID
router$6.put('/:id', updateProductById);

const manager = new CartManager();


const getProductsInCartController = async  (req, res) => {
    try {
      const userId = req.user._id;
      console.log(req.user._id);
      const productsInCart = await cartRepository.getAll(userId);

  
      // Renderizar la vista 'cart' y pasar los productos como datos
      res.render('cart', { layout: false, productsInCart }); // layout: false para evitar el uso del diseño predeterminado
    } catch (error) {
      console.error('Error al obtener productos del carrito:', error);
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  };

  //agregar Producto
  const AddProductToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const productId = req.params.productId; 

        // Obtener el producto por su ID
        const productToAddCart = await productRepository.findById(productId);

        if (!productToAddCart) {
            return res.status(404).json({ status: 'error', error: 'El producto no existe' });
        }

        // Agregar el producto al carrito del usuario
        const updatedCart = await cartRepository.addToCart(userId, productToAddCart._id);

        return res.status(200).json({ status: 'success', message: 'Producto agregado al carrito exitosamente', cart: updatedCart });

    } catch (error) {
        console.error('Error al agregar el producto al carrito:', error);
        res.status(500).json({ status: 'error', error: 'Error al agregar el producto al carrito' });
    }
};

const removeProductFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.user._id;
        
        const result = await cartRepository.removeFromCart(userId, productId);

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
            
        }

        res.json({ success: true, message: `Producto ${productId} eliminado del carrito` });
    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const removeAllProductsFromCart = async (req, res) => {
    try {
        const result = await manager.removeAllProductsFromCart();

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: 'Todos los productos eliminados del carrito' });
    } catch (error) {
        console.error('Error al eliminar todos los productos del carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const updateProductQuantity = async (req, res) => {
    try {
        const productId = req.params._id;
        const { quantity } = req.body;

        if (!quantity || isNaN(quantity)) {
            return res.status(400).json({ success: false, message: 'La cantidad debe ser un número válido' });
        }

        const result = await manager.updateProductQuantity(productId, Number(quantity));

        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: `Cantidad del producto ${productId} actualizada en el carrito` });
    } catch (error) {
        console.error('Error al actualizar cantidad del producto en el carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const updateCart = async (req, res) => {
    try {
        const cartId = req.params._id;
        const { products } = req.body;

        // Verificar si el arreglo de productos es válido
        if (!Array.isArray(products)) {
            return res.status(400).json({ error: 'El formato del arreglo de productos es inválido' });
        }

        // Llamar al método para actualizar el carrito con el nuevo arreglo de productos
        const updatedCart = await manager.updateCart(cartId, products);

        if (!updatedCart) {
            return res.status(500).json({ error: 'Error al actualizar el carrito' });
        }

        return res.status(200).json(updatedCart);
    } catch (error) {
        console.error('Error al actualizar el carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const getProductsInCartWithDetails = async (req, res) => {
    try {
        const { cid } = req.params;
        let { page, limit } = req.query;

        // Establecer valores predeterminados si los parámetros no se proporcionan
        page = page || 1;
        limit = limit || 10;

        // Llamar al método en CartManager para obtener los productos paginados del carrito
        const result = await manager.getProductsInCartWithDetails(cid, page, limit);

        return res.json(result);
    } catch (error) {
        console.error('Error al obtener productos del carrito:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const createTicket = async (req, res) => {
    const userId = req.user._id;  // Ajusta según cómo estás manejando el ID del usuario
    try {
        const ticket = await ticketRepository.create(userId);
        res.status(201).json(ticket);
    } catch (error) {
        console.error('Error al crear el ticket:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// routes/cart.router.js


const router$5 = express.Router();




router$5.post('/tickets/create', passportCall('jwt'), authorization(['USUARIO']), createTicket);

router$5.post('/:productId', passportCall('jwt'), authorization(['USUARIO']), AddProductToCart);

router$5.delete('/:productId', passportCall('jwt'), authorization(['USUARIO']), removeProductFromCart);

router$5.delete('/', passportCall('jwt'), authorization(['USUARIO']), removeAllProductsFromCart);

router$5.put('/:_id', updateProductQuantity);

router$5.put('/cart/:_id', updateCart);

router$5.get('/cart/:cid', getProductsInCartWithDetails);

const UsersController = {};

// Renderiza la vista de inicio de sesión
UsersController.renderLogin = (req, res) => {
    res.render('login');
};

// Renderiza la vista de registro
UsersController.renderRegister = (req, res) => {
    res.render('register');
};

// Renderiza la vista del perfil de usuario
UsersController.renderProfile = (req, res) => {
    res.render("profile", {
        user: req.user
    });
};

// Obtiene información del usuario por ID
UsersController.getUserById = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found with ID: " + userId });
        }

        res.json(user);
    } catch (error) {
        console.error("Error consultando el usuario con ID: " + userId);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

const router$4 = express.Router();

// Renderiza la vista de inicio de sesión
router$4.get("/login", UsersController.renderLogin);

// Renderiza la vista de registro
router$4.get("/register", UsersController.renderRegister);

// Renderiza la vista del perfil de usuario
router$4.get("/", passportCall('jwt'), UsersController.renderProfile);

// Obtiene información del usuario por ID
router$4.get("/:userId", authToken, UsersController.getUserById);

// Importación de módulos y dependencias necesarios


// Creación de una instancia de Router
const router$3 = express.Router();

// Rutas públicas

// Ruta raíz ("/")
router$3.get("/", (req, res) => {
    res.render("home.hbs");
});

// Ruta para visualizar productos en tiempo real ("/realtimeproducts")
router$3.get('/realtimeproducts', passportCall('jwt'), authorization(['ADMIN']), async (req, res) => {
    try {
        await getProducts(req, res);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).send('Error interno del servidor');
    }
});
router$3.get('/tickets', passportCall('jwt'), authorization(['ADMIN', 'USUARIO']), async (req, res) => {
    const userId = req.user._id;

    try {
        const tickets = await ticketRepository.getAll(userId);
        console.log(userId);

        // Renderiza la vista y pasa los datos de los tickets como un objeto
        res.render("tickets.hbs", { tickets });
    } catch (error) {
        console.error('Error al obtener los tickets:', error);
        res.status(500).send('Error interno del servidor');
    }
});




// Ruta para visualizar productos para uso del usuario
router$3.get("/products", passportCall('jwt'), authorization(['ADMIN', 'USUARIO']), async (req, res) => {
    try {
        await getProductsUser(req, res);
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).send('Error interno del servidor');
    }
});

// Ruta para acceder al chat ("/chat")
router$3.get("/chat", (req, res) => {
    res.render("chat.hbs");
});

// Ruta para visualizar productos en el carrito ("/cart")

router$3.get("/cart", passportCall('jwt'), authorization(['ADMIN', 'USUARIO']), async (req, res) => {
    try {
        await getProductsInCartController(req, res);
        
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).send('Error interno del servidor');
    }
});
// Ruta para manejar sesiones ("/session")
router$3.get('/session', (req, res) => {
    if (req.session.counter) {
        req.session.counter++;
        res.send(`Se ha visitado este sitio: ${req.session.counter} veces.`);
    } else {
        req.session.counter = 1;
        res.send('Bienvenido!!');
    }
});

// Ruta para cerrar sesión ("/logout")
router$3.get('/logout', (req, res) => {
    req.session.destroy(error => {
        if (error) {
            res.json({ error: "Error logout", msg: "Error al cerrar la sesión" });
        }
        res.send('Sesión cerrada correctamente!');
    });
});

const SessionsController = {};

// Passport GitHub
SessionsController.githubAuth = passport.authenticate('github', { scope: ['user:email'] });

SessionsController.githubCallback = passport.authenticate('github', {
    failureRedirect: '/github/error',
    successRedirect: '/users', // Redirigir a la página de usuarios después de una autenticación exitosa
});

// Passport local - Registro
SessionsController.register = async (req, res) => {
    try {
        const result = await userRepository.Register(req.body);

        if (result.success) {
            // Si el registro es exitoso, puedes generar un token JWT aquí si es necesario
            const access_token = generateJWToken(result.user);
            console.log(access_token);

            res.status(201).json({ success: true, message: "Registro exitoso", user: result.user, access_token });
        } else {
            res.status(400).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error("Error en el servidor:", error);
        res.status(500).json({ success: false, message: "Error en el servidor", error });
    }
};

// Passport local - Inicio de sesión
SessionsController.login = passport.authenticate('login', {
    failureRedirect: "/api/session/fail-login",
});

SessionsController.logout = (req, res) => {
    // Elimina la sesión del usuario
    req.session.destroy((err) => {
        if (err) {
            console.error("Error al desloguear:", err);
            return res.status(500).send({ status: "error", message: "Error al desloguear" });
        }
        res.send({ status: "success", message: "Sesión cerrada exitosamente" });
    });
};

// Error en el registro
SessionsController.failRegister = (req, res) => {
    res.status(401).send({ error: "Fallo el registro" });
};

// Error en el inicio de sesión
SessionsController.failLogin = (req, res) => {
    res.status(401).send({ error: "Fallo el logueo" });
};

// Obtener el token de acceso usando JWT
SessionsController.getToken = (req, res) => {
    const user = req.user;
    const access_token = generateJWToken(user);
    console.log(access_token);
    res.send({ access_token: access_token });
};

const router$2 = express.Router();

// Passport GitHub
router$2.get('/github', SessionsController.githubAuth);
router$2.get("/githubcallback", SessionsController.githubCallback);

// Passport local - Registro
router$2.post('/register', SessionsController.register, (req, res) => {
    console.log("Registrando usuario:");
    // Puedes manejar la respuesta aquí y decidir si redirigir o enviar otra respuesta.
    res.status(201).send("Registro exitoso");
});

// Passport local - Inicio de sesión
router$2.post('/login', SessionsController.login, SessionsController.getToken);

// Logout
router$2.post('/logout', SessionsController.logout);

// Error en el registro
router$2.get("/fail-register", SessionsController.failRegister);

// Error en el inicio de sesión
router$2.get("/fail-login", SessionsController.failLogin);

const router$1 = express.Router();

router$1.get("/login",(req, res)=>{
    res.render("github-login");
});

router$1.get("/error",(req, res)=>{
    res.render("error",{error: "No se pudo autenticar usando GitHub"});
});

const jwtRouter$1 = express.Router();

jwtRouter$1.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email: email });
        console.log("Usuario encontrado para login:");
        console.log(user);
        if (!user) {
            console.warn("User doesn't exist with username: " + email);
            return res.status(204).send({ error: "Not found", message: "Usuario no encontrado con username: " + email });
        }
        if (!isValidPassword(user, password)) {
            console.warn("Invalid credentials for user: " + email);
            return res.status(401).send({ status: "error", error: "El usuario y la contraseña no coinciden!" });
        }
        const tokenUser = {
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
            age: user.age,
            role: user.role,
            _id: user._id
        };
        const access_token = generateJWToken(tokenUser);
        console.log(access_token);

        // Opciones para configurar la cookie
        const cookieOptions = {
            maxAge: 24 * 60 * 60 * 1000, // Duración de la cookie en milisegundos (1 día)
            
        };

        // Configuración de la cookie con nombre 'jwtCookieToken'
        res.cookie('jwtCookieToken', access_token, cookieOptions);

        res.send({ message: "Login success!!" });
    } catch (error) {
        console.error(error);
        return res.status(500).send({ status: "error", error: "Error interno de la aplicación." });
    }
});

const jwtRouter = express.Router();

// Ruta para el inicio de sesión (POST /login)
jwtRouter.post("/login", jwtRouter$1);

// Rutas protegidas con autorización basada en roles
jwtRouter.get('/ruta-admin', passportCall('jwt'), authorization('ADMIN'), (req, res) => {
    res.send('Bienvenido a la vista de administrador');
});

jwtRouter.get('/ruta-usuario', passportCall('jwt'), authorization('USUARIO'), (req, res) => {
    console.log('Contenido del token:', req.user);
    res.send('Bienvenido a la vista de usuario');
});

//import { sendEmail, sendEmailWithAttachment } from "../controllers/EmailController.js";

const router = express.Router();

class CustomRouter {
    constructor() {
        this.router = express.Router();
        this.init();
    };

    getRouter() {
        return this.router;
    }

    init() { }

    get(path, policies, ...callbacks) {
        console.log("Entrando por GET a custom router con Path: " + path);
        
        // Asegurarse de que policies sea siempre un array
        const policiesArray = Array.isArray(policies) ? policies : [policies];
        
        console.log(policiesArray);

        this.router.get(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    post(path, policies, ...callbacks) {
        // Similar al método get, asegurarse de que policies sea siempre un array
        const policiesArray = Array.isArray(policies) ? policies : [policies];

        this.router.post(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    put(path, policies, ...callbacks) {
        const policiesArray = Array.isArray(policies) ? policies : [policies];

        this.router.put(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    delete(path, policies, ...callbacks) {
        const policiesArray = Array.isArray(policies) ? policies : [policies];

        this.router.delete(
            path,
            this.handlePolicies(policiesArray),
            this.generateCustomResponses,
            this.applyCallbacks(callbacks)
        );
    }

    handlePolicies = (policies) => (req, res, next) => {
        console.log("Politicas a evaluar:");
        console.log(policies);

        if (policies.includes("PUBLIC")) return next();

        const authHeader = req.headers.authorization;
        console.log("Token present in header auth:");
        console.log(authHeader);

        const authToken = authHeader ? authHeader.split(' ')[1] : null;

        if (!authToken) {
            return res.status(401).send({ error: "User not authenticated or missing token." });
        }
        console.log(authToken);
        jwt.verify(authToken, PRIVATE_KEY, (error, credential) => {
            if (error) return res.status(403).send({ error: "Token invalid, Unauthorized!" });

            const user = credential.user;

            if (!policies.includes(user.role.toUpperCase())) {
                return res.status(403).send({ error: "El usuario no tiene privilegios, revisa tus roles!" });
            }

            req.user = user;
            console.log(req.user);
            next();
        });
    };

    generateCustomResponses = (req, res, next) => {
        res.sendSuccess = payload => res.status(200).send({ status: "Success", payload });
        res.sendInternalServerError = error => res.status(500).send({ status: "Error", error });
        res.sendClientError = error => res.status(400).send({ status: "Client Error, Bad request from client.", error });
        res.sendUnauthorizedError = error => res.status(401).send({ error: "User not authenticated or missing token." });
        res.sendForbiddenError = error => res.status(403).send({ error: "Token invalid or user with no access, Unauthorized please check your roles!" });
        next();
    };

    applyCallbacks(callbacks) {
        return callbacks.map((callback) => async (...item) => {
            try {
                await callback.apply(this, item);
            } catch (error) {
                console.error(error);
                item[1].status(500).send(error);
            }
        });
    }
}

class UsersExtendRouter extends CustomRouter {
    init() {

        const userService = new UserService();

        

        

        this.get('/', ["PUBLIC"], (req, res) => {
            console.log("TEST");
            res.send("Hola coders!!");
        });


        this.get('/currentUser', ["PUBLIC"], (req, res) => {
            res.sendSuccess(req.user);
        });


        this.get('/premiumUser', ["USER_PREMIUM"], (req, res) => {
            res.sendSuccess(req.user);
        });

        this.get('/adminUser', ["ADMIN"], (req, res) => {
            res.sendSuccess(req.user);
        });


        this.post('/login', ["PUBLIC"], async (req, res) => {
            const { email, password } = req.body;
            try {
                const user = await userService.findByUsername(email);
                console.log("Usuario encontrado para login:");
                console.log(user);
                if (!user) {
                    console.warn("User doesn't exists with username: " + email);
                    return res.status(202).send({ error: "Not found", message: "Usuario no encontrado con username: " + email });
                }

                if (!isValidPassword(user, password)) {
                    console.warn("Invalid credentials for user: " + email);
                    return res.status(401).send({ status: "error", error: "El usuario y la contraseña no coinciden!" });
                }

                const tokenUser = {
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                    age: user.age,
                    role: user.role
                };
                const access_token = generateJWToken(tokenUser);
                console.log(access_token);
                res.send({ message: "Login successful!", access_token: access_token, id: user._id });

            } catch (error) {
                console.error(error);
                return res.status(500).send({ status: "error", error: "Error interno de la applicacion." });
            }
        });


        this.post("/register", ["PUBLIC"], async (req, res) => {
            const { first_name, last_name, email, age, password } = req.body;
            console.log("Registrando usuario:");
            console.log(req.body);

            const exists = await userService.findByUsername(email);
            if (exists) {
                return res.status(400).send({ status: "error", message: "Usuario ya existe." });
            }
            const user = {
                first_name,
                last_name,
                email,
                age,
                password: createHash(password)
            };
            const result = await userService.save(user);
            res.status(201).send({ status: "success", message: "Usuario creado con extito con ID: " + result.id });
        });

    }

}

const MessageSchema = new mongoose.Schema({
   user: String,
   message: String,
});

const Message = mongoose.model('Message', MessageSchema); // Cambiado a 'Message' para coincidir con el nombre del modelo

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

// Archivo appInitialization.js 
// Cofiguracion de Express

function initializeApp(app, __dirname) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.set('view engine', 'hbs');
  app.set('views', `${__dirname}/views`);
  
  app.use('/api/product', router$6);
  app.use('/api/cart', router$5);
  app.use('/', router$3);
  
  app.use('/public', (req, res, next) => {
    if (req.url.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    next();
  }, express.static(`${__dirname}/public`));
}

class MongoSingleton {
    static #instance;


    constructor() {
        this.#connectMongoDB();
    }

    // Implementacon Singleton
    static getInstance() {
        if (this.#instance) {
            console.log("Ya se ha abierto una conexion a MongoDB.");
        } else {
            this.#instance = new MongoSingleton();
        }
        return this.#instance;
    }

    #connectMongoDB = async () => {
        try {
            await mongoose.connect(config.mongoUrl);
            console.log("Conectado con exito a MongoDB usando Moongose.");

        } catch (error) {
            
            console.error("No se pudo conectar a la BD usando Moongose: " + error);
            console.log("mongoURl"+ config.mongoUrl);
            console.log("puerto"+ config.port);
            process.exit();
        }
    }
}

const localStrategy = passportLocal.Strategy;

const JwtStrategy = jwtStrategy.Strategy;
const ExtractJWT = jwtStrategy.ExtractJwt;

const initializePassport = () => {
    //Estrategia de obtener Token JWT por Cookie:
    passport.use('jwt', new JwtStrategy(
        {
            jwtFromRequest: ExtractJWT.fromExtractors([cookieExtractor]), 
            secretOrKey: PRIVATE_KEY
        }, async (jwt_payload, done) => {
            console.log("Entrando a passport Strategy con JWT.");
            try {
                console.log("JWT obtenido del payload: " + jwt_payload.user.name);
                
                return done(null, jwt_payload.user);
            } catch (error) {
                console.error(error);
                return done(error);
            }
        }
    ));
    //Funciones de Serializacion y Desserializacion
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            let user = await userModel.findById(id);
            done(null, user);
        } catch (error) {
            console.error("Error deserializando el usuario: " + error);
        }
    });
};

passport.use('register', new localStrategy(
    {
        passReqToCallback: true,
        usernameField: 'email'
    },
    async (req, username, password, done) => {

        const { first_name, last_name, email, age } = req.body;

        try {
            const exist = await userModel.findOne({ email });
            if (exist) {
                console.log("El usuario ya existe");
                return done(null, false);
            }

            const user = {
                first_name,
                last_name,
                email,
                age,
                //se encripta después
                password: createHash(password)
            };

            const result = await userModel.create(user);

            //todo ok
            console.log(result);
            return done(null, result);
        } catch (error) {
            return done("Error registrando usuario: " + error);
        }
    }
));











const cookieExtractor = req => {
    let token = null;
    console.log("Entrando a Cookie Extractor");
    if (req && req.cookies) { //Validamos que exista el request y las cookies.
    console.log("Cookies Encontradas! ");
        
       token = req.cookies['jwtCookieToken'];
       console.log("Token obtenido!");
        
    }
    return token;
};

// Importación de módulos y archivos necesarios


// Configuración de Express

const app = express();
const port = config.port;
//URL de la base de datos de mongo
const MONGOURL = config.mongoUrl;



// Configuración de Express Session
app.use(
  session({
    store: new MongoStore({
      mongoUrl: MONGOURL,
      mongoOptions: {  },
      ttl: 10 * 60, // tiempo de vida de la sesión en segundos (10 minutos en este caso)
    }),
    secret: 'tu_secreto_aqui',
    resave: true,
    saveUninitialized: true,
    
  })
);

// Passport Configuration
initializePassport();
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser("CoderS3cr3tC0d3"));

// Ruta protegida que requiere autenticación
app.get('/userid', passportCall('jwt'), authorization(['ADMIN','USUARIO']), (req, res) => {
  // Aquí puedes acceder al _id del usuario
  const userId = req.user._id;

  // Envía el _id como respuesta en un objeto JSON
  res.json({ userId });
});





// Instancias de los managers
const cManager = new CartManager();
const pManager = new ProductManager();
const messageManager = new MessageManager();

// Configuración de Handlebars como motor de vistas
app.engine(
  "hbs",
  handlebars.engine({
    extname: "hbs",
    defaultLayout: "main",
    handlebars: allowPrototypeAccess.allowInsecurePrototypeAccess(Handlebars),
  })
);
app.use(express.static(__dirname$1 + '/public'));


const mongoInstance = async () => {
  try {
      await MongoSingleton.getInstance();
  } catch (error) {
      console.log(error);
  }
};
mongoInstance();



// Inicialización de la aplicación y configuraciones
initializeApp(app, __dirname$1);

// Definición de rutas para la API y las vistas
app.use('/api/email',router);
app.use('/api/product', router$6);
app.use('/api/carts', router$5);
app.use('/', router$3);
app.use('/api/sessions', router$2);
app.use('/users', router$4);
app.use('/github', router$1);
app.use('/api/jwt', jwtRouter);





//Custom router

const usersExtendRouter = new UsersExtendRouter();
app.use('/api/extend/users', usersExtendRouter.getRouter());


// Creación del servidor HTTP y Socket.IO
const httpServer = app.listen(port, () => {
  console.log(`Servidor Express corriendo en el puerto ${port}`);
  console.log(process.argv.slice(2));
  
  
});



const io = new socket_io.Server(httpServer);

// Manejo de eventos de conexión y operaciones relacionadas con Socket.IO
io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado');

  try {
    // Emitir los productos al cliente cuando se conecta
    
    socket.emit('productos', await getProducts()); 
    

    socket.on('AddProduct_toCart', async ({ userId, _id }) => {
      try {
        console.log("id del producto " + _id + " para el usuario " + userId);
    
        // Aquí deberías llamar a tu función cManager.addProductToCart con userId y _id
        const addProduct = await cManager.addProductToCart(userId, _id);
    
        if (addProduct) {
          console.log('Producto agregado al carrito:', addProduct);
        } else {
          console.log('El producto no pudo ser agregado al carrito.');
        }
      } catch (error) {
        console.error('Error al agregar el producto:', error);
      }
    });
    

    socket.on('Borrar_delCarrito', async (_id) => {
      try {
        console.log("id del producto" + _id);
        const productoBorrado = await cManager.removeProductFromCart(_id);

        if (productoBorrado) {
          console.log("Producto borrado:", productoBorrado);
        } else {
          console.log('El producto no pudo ser borrado del carrito');
        }
      } catch (error) {
        console.error('error al borrar', error);
      }
    });

    // Manejo de eventos de eliminación y creación de productos
    socket.on('delete_product', async (_id) => {
      try {
        const deletedProduct = await pManager.deleteProduct(_id);
        if (deletedProduct) {
          console.log('Producto eliminado:', deletedProduct);
          socket.emit('productos', await pManager.getProducts());
        } else {
          console.log('El producto no existe o no se pudo eliminar.');
        }
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
      }
    });

    socket.on('post_send', async (data) => {
      try {
        const product = {
          price: Number(data.price),
          stock: Number(data.stock),
          title: data.title,
          description: data.description,
          code: data.code,
          thumbnails: data.thumbnails,
        };

        await pManager.addProduct(product);
        socket.emit('productos', await pManager.getProducts());
      } catch (error) {
        console.log(error);
      }
    });

    // Manejo de mensajes con Socket.IO
    const messages = [];
    socket.on('message', async (data) => {
      messages.push(data);
      io.emit('messages', messages);
      try {
        await messageManager.addMessage(data);
        console.log('Mensaje guardado en la base de datos.');
      } catch (error) {
        console.error('Error al guardar el mensaje:', error);
      }
    });

    socket.on('newUser', (username) => {
      socket.broadcast.emit('userConnected', username);
    });

    socket.emit('messages', messages);
  } catch (error) {
    console.error(error);
  }
});

module.exports = app;
