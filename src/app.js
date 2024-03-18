// Importación de módulos y archivos necesarios
import express, { Router } from 'express';
import { Server } from 'socket.io';
import handlebars from 'express-handlebars';
import mongoose from 'mongoose';
import MongoStore from 'connect-mongo';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { allowInsecurePrototypeAccess } from "@handlebars/allow-prototype-access";
import Handlebars from "handlebars";
import config from './config/config.js';
import { addLogger } from './config/logger_CUSTOM.js';

// Rutas
import mokingRouter from './routes/mock.router.js'
import productRouter from './routes/product.router.js';
import cartRouter from './routes/cart.router.js';
import usersViewRouter from './routes/users.views.router.js';
import viewsRouter from './routes/views.routes.js';
import sessionRouter from './routes/sessions.router.js';
import githubLoginViewRouter from './routes/githubLoginviewRouter.routes.js';
import jwtRouter from './routes/jwt.router.js';
import { __dirname, authorization, passportCall } from './dirname.js';
import EmailRouter from './routes/mail.router.js';
import LoggerRouter from './routes/loggers.router.js';
import resetPasword from './routes/recuperarPassword.router.js'
//Custom router

 import UsersExtendRouter from './routes/custom/custom.extend.router.js';



// Managers
import ProductManager from './services/dao/mongo/Product.service.js';
import MessageManager from './services/dao/mongo/Message.service.js';
import CartManager from './services/dao/mongo/Cart.service.js';
//controller
import * as ProductController from "./controllers/ProductController.js"


// App Initialization
import { initializeApp } from './appInitialization.js';
import MongoSingleton from './config/mongodb.singleton.js';

// Passport Initialization
import initializePassport from '../src/config/passport.config.js';


// Configuración de Express

const app = express();
const port = config.port;
//URL de la base de datos de mongo
const MONGOURL = config.mongoUrl;
//Logger
app.use(addLogger);


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
    handlebars: allowInsecurePrototypeAccess(Handlebars),
  })
);
app.use(express.static(__dirname + '/public'));


const mongoInstance = async () => {
  try {
      await MongoSingleton.getInstance()
  } catch (error) {
      console.log(error);
  }
}
mongoInstance()



// Inicialización de la aplicación y configuraciones
initializeApp(app, __dirname);

// Definición de rutas para la API y las vistas
app.use('/api/email',EmailRouter);
app.use('/api/product', productRouter);
app.use('/api/carts', cartRouter);
app.use('/', viewsRouter);
app.use('/api/sessions', sessionRouter);
app.use('/users', usersViewRouter);
app.use('/github', githubLoginViewRouter);
app.use('/api/jwt', jwtRouter);
app.use('/resetPassword',resetPasword);
app.use('/',mokingRouter);
app.use('/', LoggerRouter);





//Custom router

const usersExtendRouter = new UsersExtendRouter();
app.use('/api/extend/users', usersExtendRouter.getRouter());


// Creación del servidor HTTP y Socket.IO
const httpServer = app.listen(port, () => {
  console.log(`Servidor Express corriendo en el puerto ${port}`);
  console.log(process.argv.slice(2));
  
  
});



const io = new Server(httpServer);

// Manejo de eventos de conexión y operaciones relacionadas con Socket.IO
io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado');

  try {
    // Emitir los productos al cliente cuando se conecta
    
    socket.emit('productos', await ProductController.getProducts()); 
    

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
        console.error('error al borrar', error)
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

// Exportar la aplicación Express
export default app;
