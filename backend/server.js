const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const certRoutes = require('./routes/certRoutes');
const lorRoutes = require('./routes/lorRoutes');
require('dotenv').config();

const app = express();
connectDB();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/certificates', certRoutes);
app.use('/api/lor', lorRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
