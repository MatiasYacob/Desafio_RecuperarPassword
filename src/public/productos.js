
// const socket = io();


// // Definir una variable global para almacenar el userId
// let globalUserId = null;

// async function obtenerUserId() {
//   try {
//     const response = await fetch('http://localhost:3000/userid', {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       credentials: 'include',
//     });

//     if (response.ok) {
//       const data = await response.json();
//       // Guardar el userId en la variable global
//       globalUserId = data.userId;
//       return data.userId;
//     } else {
//       const errorData = await response.json();
//       console.error('Error en la respuesta del servidor:', errorData);
//       return null;
//     }
//   } catch (error) {
//     console.error('Error en la solicitud para obtener el userId:', error);
//     return null;
//   }
// }
// async function realizarAccionesDespuesDeObtenerUserId() {
//   // Esperar a que se obtenga el userId
//   await obtenerUserId();

//   // Ahora globalUserId debe tener el valor correcto
//   console.log(globalUserId);

//   // Puedes realizar otras acciones aquí
// }

// // Llamar a la función que espera a que se obtenga el userId
// realizarAccionesDespuesDeObtenerUserId();

// function AddProductToCart(_id) {
//   // Obtener el userId desde la variable global
//   const userId = globalUserId;

//   if (!userId) {
//     console.error('No se pudo obtener el userId.');
//     return;
//   }

//   console.log('Emitiendo evento al servidor con userId y _id:', { userId, _id });

//   // Emitir evento al servidor con el id del producto y el userId
//   socket.emit('AddProduct_toCart', { userId, _id });
// }
