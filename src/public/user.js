function llamarApi(){
    console.log("Llamando api users.");
    const userId = localStorage.getItem('USER_ID');
    fetch('api/extend/users/currentUser',{
        method:'GET',
        headers:{
            'Content-Type':'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    }).then(result=>{
        if(result.status===200){
            result.json()
          
        } else if (result.status === 401){
            console.log(result);
            alert("Credenciales invalidas, debes loguearte de nuevo.");
            window.location.replace('/users/login');
        } else if (result.status === 403){
            console.log(result);
            alert("Usuario no autorizado, revisa tus accesos.");
            window.location.replace('/users/login');
        }
    })
};
llamarApi();
