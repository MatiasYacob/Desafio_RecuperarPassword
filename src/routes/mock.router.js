// mockingController.js
import { Router } from "express";
import { generateMockProducts } from "../Mock/mockingModule.js";

const router = Router();

router.get('/mockingproducts', (req, res) => {
  const mockProducts = generateMockProducts();
  res.render('mock.hbs', { products: mockProducts });
});

export default router;
