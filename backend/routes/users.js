const express = require('express');
const router = express.Router();

// GET /api/users
router.get('/', (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Usuario 1', email: 'usuario1@example.com' },
      { id: 2, name: 'Usuario 2', email: 'usuario2@example.com' }
    ]
  });
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    id: parseInt(id),
    name: 'Usuario Ejemplo',
    email: 'usuario@example.com'
  });
});

// POST /api/users
router.post('/', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({
    id: Date.now(),
    name,
    email,
    message: 'Usuario creado exitosamente'
  });
});

// PUT /api/users/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  res.json({
    id: parseInt(id),
    name,
    email,
    message: 'Usuario actualizado exitosamente'
  });
});

// DELETE /api/users/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Usuario ${id} eliminado exitosamente`
  });
});

module.exports = router;

