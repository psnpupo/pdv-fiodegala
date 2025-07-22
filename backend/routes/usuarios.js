const express = require('express');
const router = express.Router();
const { createUsuario, listUsuarios, updateUsuario, deleteUsuario, assignRole, createDefaultRole } = require('../controllers/usuariosController');

router.post('/', createUsuario);
router.get('/', listUsuarios);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);
router.post('/:id/role', assignRole);
router.post('/:id/default-role', createDefaultRole);

module.exports = router; 