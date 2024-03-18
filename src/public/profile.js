async function logout() {
    try {
        const response = await fetch('/api/sessions/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // Puedes enviar datos en el cuerpo si es necesario
            // body: JSON.stringify({ key: 'value' })
        });

        if (response.status === 200) {
            // Redirige a la página de inicio de sesión o a donde desees
            window.location.replace('/users/login');
        } else {
            // Maneja el error de alguna manera
            console.error('Error al cerrar sesión:', response.statusText);
        }
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}