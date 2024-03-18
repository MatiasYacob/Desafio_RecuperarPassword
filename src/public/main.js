
import CartManager from "../services/dao/mongo/Cart.service.js";

const socket = io();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const post = {
        title: formData.get("title"),
        description: formData.get("description"),
        price: formData.get("price"),
        thumbnails: formData.get("thumbnails"),
        code: formData.get("code"),
        stock: formData.get("stock"),
      }

      socket.emit("post_send", post);
    });
  }
});

socket.on("productos", (data) => {
  const products = document.querySelector("#products");
  products.innerHTML = "";

  data.forEach((producto) => {
    const productElement = document.createElement("div");
    productElement.classList.add("card", "m-2", "col-md-4", "bg-light", "border", "border-primary");
    productElement.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${producto.title}</h5>
            <p class="card-text">Descripción: ${producto.description}</p>
            <p class="card-text">Precio: $${producto.price}</p>
            <p class="card-text">Código: ${producto.code}</p>
            <p class="card-text">Stock: ${producto.stock}</p>
            <p class="card-text">Fotos: ${producto.thumbnails}</p>
            <p class="card-text">Status: ${producto.status}</p>
            <p class="card-text">ID: ${producto._id}</p>
            <button class="btn btn-danger" onclick="deleteAndReload('${producto._id}')">Eliminar</button>
            <button class="btn btn-success" onclick="AddProductToCart('${producto._id}')">Agregar al carrito</button>
        </div>
    `;
    products.appendChild(productElement);
  });
});

socket.on("cart_productos", (data) => {
  const products = document.querySelector("#products_carrito");
  products.innerHTML = "";

  data.forEach((producto) => {
    const productElement = document.createElement("div");
    productElement.classList.add("card", "m-2", "col-md-4", "bg-light", "border", "border-primary");
    productElement.innerHTML = `
      <div class="card-body">
        <p class="card-text">Cantidad: ${producto.quantity}</p>
        <p class="card-text">ID: ${producto._id}</p>
        <button class="btn btn-danger" onclick="removeProductFromCart('${producto._id}')">Eliminar</button>
      </div>
    `;
    products.appendChild(productElement);
  });
});

function deleteAndReload(productId) {
  deleteProduct(productId);
  reloadPage();
}

function reloadPage() {
  location.reload();
}

function deleteProduct(_id) {
  socket.emit("delete_product", _id);
}

function AddProductToCart(_id) {
  // Cambiamos este llamado para que utilice el servicio del carrito a través de Socket.IO
  socket.emit("AddProduct_toCart", _id);
  console.log('ID del producto enviado:', _id)  
    .then(() => {
      Swal.fire({
        position: 'top-end',
        icon: 'success',
        title: '¡Producto Agregado!',
        showConfirmButton: false,
        timer: 1500,
        toast: true,
      });
    })
    .catch(error => console.error('Error:', error));
}

function removeProductFromCart(_id) {
  // Cambiamos este llamado para que utilice el servicio del carrito a través de Socket.IO
  socket.emit("Borrar_delCarrito", _id);
  reloadPage();
  // Llamamos a la función correspondiente en el servicio del carrito
  cartService.removeProductFromCart(_id)
    .then(() => {
      reloadPage();
    })
    .catch(error => console.error('Error:', error));
}

// Resto del código para el chat...


// Lógica del Chat

let user; // Variable para almacenar el nombre del usuario
let askingForName = true; // Controla si se está solicitando el nombre del usuario

// Función para desplazarse hacia abajo en la ventana del chat
function scrollToBottom() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Función para solicitar el nombre del usuario y enviar mensajes
function askForNameAndSendMessage(message) {
  // Ventana emergente para solicitar el nombre del usuario
  Swal.fire({
    title: "Hola",
    text: "Ingresa tu nombre para continuar",
    input: "text",
    inputValidator: (value) => {
      return !value && "¡Ingresa tu nombre!";
    },
    allowOutsideClick: false,
  }).then((value) => {
    user = value.value; // Almacena el nombre del usuario
    socket.emit("newUser", user); // Emite el evento con el nuevo usuario al servidor
    askingForName = false; // Cambia el estado para no solicitar más el nombre

    // Si hay un mensaje y el usuario ya está identificado, envía el mensaje al servidor
    if (message.trim() !== "") {
      socket.emit("message", {
        user,
        message,
      });
    }
  });
}

; // Llama al inicio para solicitar el nombre del usuario

// Captura del cuadro de chat y escucha del evento de tecla "Enter"
const chatbox = document.getElementById("chatbox");
chatbox.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const message = e.target.value;
    // Si el usuario no está identificado y no se está solicitando el nombre, lo solicita
    if (user === undefined && !askingForName) {
      askForNameAndSendMessage(message);
      chatbox.value = "";
    } else {
      // Si hay un mensaje y el usuario está identificado, lo envía al servidor
      if (message.trim() !== "") {
        socket.emit("message", {
          user,
          message,
        });
        chatbox.value = "";
      }
    }
  }
});



// Notificación de nuevo usuario conectado
socket.on("userConnected", (username) => {
  if (user !== undefined && !askingForName) {
    // Muestra una notificación cuando un nuevo usuario se conecta al chat
    Swal.fire({
      position: "top-right",
      toast: true,
      title: "Nuevo usuario",
      text: `${username} se ha conectado al chat`,
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", () => {
          Swal.stopTimer();
        });
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });
  }
});

// Actualización de mensajes en la ventana del chat
socket.on("messages", (data) => {
  const log = document.querySelector("#messages");
  let messages = "";

  // Construye los mensajes con su formato y los muestra en la ventana del chat
  data.forEach((message) => {
    messages += `<strong>${message.user}</strong>: ${message.message} <br/>`;
  });

  log.innerHTML = messages; // Actualiza la ventana del chat con los nuevos mensajes
  scrollToBottom(); // Desplaza hacia abajo para mostrar los últimos mensajes
});
