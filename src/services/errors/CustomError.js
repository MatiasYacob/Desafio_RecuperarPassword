import EErrors from './errors-enum.js';

class CustomError extends Error {
  constructor(errorCode, additionalInfo) {
    super(getErrorMessage(errorCode) || 'Error desconocido');
    this.errorCode = errorCode;
    this.additionalInfo = additionalInfo;
    
  }
}

function getErrorMessage(errorCode) {
  switch (errorCode) {
    case EErrors.ROUTING_ERROR:
      return 'Error de enrutamiento';
    case EErrors.INVALID_TYPES_ERROR:
      return 'Error de tipos inválidos';
    case EErrors.DATABASE_ERROR:
      return 'Error de base de datos';
    case EErrors.PRODUCT_NOT_FOUND_ERROR:
      return 'Producto no encontrado';
    default:
      return 'Error desconocido';
  }
}

export default CustomError;
