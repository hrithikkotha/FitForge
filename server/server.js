const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDatabase = require('./seed/seedData');
const seedSuperAdmin = require('./seed/seedSuperAdmin');

dotenv.config({ path: '../.env' });

const app = express();

// Allowed origins: set ALLOWED_ORIGINS in .env (comma-separated) for production
// e.g. ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

// Middleware
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/api/foods', require('./routes/foods'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/admin', require('./routes/adminPanel'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get(/^(?!\/api).+/, (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
    });
}

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    // Only seed in development, or when explicitly enabled via SEED_DB=true
    if (process.env.NODE_ENV !== 'production' || process.env.SEED_DB === 'true') {
        await seedDatabase();
        await seedSuperAdmin();
    }
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
