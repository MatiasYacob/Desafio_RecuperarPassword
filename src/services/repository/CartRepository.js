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
  
  export default CartRepository;
  