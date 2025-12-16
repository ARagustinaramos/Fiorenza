const express = require('express');
const router = express.Router();

// GET /api/products
router.get('/', (req, res) => {
  res.json({
    products: [
      { id: 1, name: 'Producto 1', price: 100, description: 'Descripción del producto 1' },
      { id: 2, name: 'Producto 2', price: 200, description: 'Descripción del producto 2' }
    ]
  });
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: parseInt(id),
    name: 'Producto Ejemplo',
    price: 150,
    description: 'Descripción del producto ejemplo'
  });
});

// POST /api/products
router.post('/', (req, res) => {
  const { name, price, description } = req.body;
  res.status(201).json({
    id: Date.now(),
    name,
    price,
    description,
    message: 'Producto creado exitosamente'
  });
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  res.json({
    id: parseInt(id),
    name,
    price,
    description,
    message: 'Producto actualizado exitosamente'
  });
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Producto ${id} eliminado exitosamente`
  });
});

module.exports = router;

