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

export default ProductRepository;
