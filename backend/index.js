require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const statusRoutes = require('./routes/status');
const clientesRoutes = require('./routes/clientes');
const usuariosRoutes = require('./routes/usuarios');
const salesRoutes = require('./routes/sales');
const cashRegisterRoutes = require('./routes/cashRegister');

app.use('/api/status', statusRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/cash-register', cashRegisterRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Backend PDV Fio de Gala rodando!', env: process.env.NODE_ENV || 'dev' });
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
}); 