require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/verification', require('./routes/verification'));

// Simple root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the backend API!' });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`📧 Gmail configured for: ${process.env.GMAIL_USER}`);
    console.log(`👨‍💼 Admin email: ${process.env.ADMIN_EMAIL}`);
});