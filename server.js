const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require("cors");
const path = require('path');

const app = express();

// Middleware - IMPORTANT: Order matters!
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

//const mysql = require('mysql');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('DB connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to Railway MySQL');
    createTables();
});

module.exports = connection;


// Database connection
/*const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Change to your MySQL username
    password: '6362',      // Change to your MySQL password
    database: 'budget_tracker'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL Database');
    
    // Create tables if they don't exist
    createTables();
});
*/
// Create necessary tables
function createTables() {
    // Create users table
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS user (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    // Create transactions table
    const createTransactionsTable = `
        CREATE TABLE IF NOT EXISTS transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            type ENUM('income', 'expense') NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            category VARCHAR(50) NOT NULL,
            description VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
        )
    `;
    
    db.query(createUsersTable, (err) => {
        if (err) console.error('Error creating users table:', err);
        else console.log('Users table ready');
    });
    
    db.query(createTransactionsTable, (err) => {
        if (err) console.error('Error creating transactions table:', err);
        else console.log('Transactions table ready');
    });
}

// Authentication Routes

// Registration Route - MOVED BEFORE static files
app.post('/register', (req, res) => {
    console.log('Register route hit:', req.body); // Debug log
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const query = 'INSERT INTO user (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'Username or email already exists' });
            }
            return res.status(500).json({ success: false, message: 'Error registering user' });
        }

        return res.json({ 
            success: true, 
            message: 'Registration successful! Please login.', 
            redirect: '/login.html' 
        });
    });
});

// Login route
app.post('/login', (req, res) => {
    console.log('Login route hit:', req.body); // Debug log
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Please enter both username and password' });
    }

    const query = 'SELECT id, username FROM user WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (results.length > 0) {
            const user = results[0];
            return res.json({ 
                success: true, 
                message: 'Login successful',
                user_id: user.id,
                username: user.username, 
                redirect: '/dashboard.html' 
            });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    });
});

// Transaction Routes

// Get all transactions for a user
app.get('/transactions/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error fetching transactions' });
        }
        
        return res.json({ success: true, transactions: results });
    });
});

// Add new transaction
app.post('/transactions', (req, res) => {
    const { user_id, type, amount, category, description, date } = req.body;
    
    if (!user_id || !type || !amount || !category || !description || !date) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ success: false, message: 'Invalid transaction type' });
    }
    
    const query = 'INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [user_id, type, amount, category, description, date], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error adding transaction' });
        }
        
        return res.json({ success: true, message: 'Transaction added successfully', id: results.insertId });
    });
});

// Update transaction
app.put('/transactions/:id', (req, res) => {
    const transactionId = req.params.id;
    const { type, amount, category, description, date } = req.body;
    
    if (!type || !amount || !category || !description || !date) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    const query = 'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?';
    db.query(query, [type, amount, category, description, date, transactionId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error updating transaction' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        return res.json({ success: true, message: 'Transaction updated successfully' });
    });
});

// Delete transaction
app.delete('/transactions/:id', (req, res) => {
    const transactionId = req.params.id;
    
    const query = 'DELETE FROM transactions WHERE id = ?';
    db.query(query, [transactionId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error deleting transaction' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        return res.json({ success: true, message: 'Transaction deleted successfully' });
    });
});

// User Profile Routes

// Get user profile
app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    
    const query = 'SELECT id, username, email, created_at FROM user WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error fetching user profile' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.json({ success: true, user: results[0] });
    });
});

// Update user profile
app.put('/user/:id', (req, res) => {
    const userId = req.params.id;
    const { email, password } = req.body;
    
    let query, params;
    
    if (password && password.trim() !== '') {
        // Update both email and password
        query = 'UPDATE user SET email = ?, password = ? WHERE id = ?';
        params = [email, password, userId];
    } else {
        // Update only email
        query = 'UPDATE user SET email = ? WHERE id = ?';
        params = [email, userId];
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ success: false, message: 'Email already exists' });
            }
            return res.status(500).json({ success: false, message: 'Error updating profile' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.json({ success: true, message: 'Profile updated successfully' });
    });
});

// Delete user account
app.delete('/user/:id', (req, res) => {
    const userId = req.params.id;
    
    // First delete all transactions for the user (handled by CASCADE)
    const query = 'DELETE FROM user WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error deleting account' });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        return res.json({ success: true, message: 'Account deleted successfully' });
    });
});

// Analytics Routes

// Get transaction summary
app.get('/analytics/summary/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT 
            type,
            SUM(amount) as total,
            COUNT(*) as count
        FROM transactions 
        WHERE user_id = ? 
        GROUP BY type
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error fetching summary' });
        }
        
        const summary = {
            income: { total: 0, count: 0 },
            expense: { total: 0, count: 0 }
        };
        
        results.forEach(row => {
            summary[row.type] = {
                total: parseFloat(row.total),
                count: row.count
            };
        });
        
        return res.json({ success: true, summary });
    });
});

// Get category-wise expenses
app.get('/analytics/categories/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT 
            category,
            SUM(amount) as total,
            COUNT(*) as count
        FROM transactions 
        WHERE user_id = ? AND type = 'expense'
        GROUP BY category
        ORDER BY total DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error fetching category data' });
        }
        
        return res.json({ success: true, categories: results });
    });
});

// Get monthly trends
app.get('/analytics/trends/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT 
            DATE_FORMAT(date, '%Y-%m') as month,
            type,
            SUM(amount) as total
        FROM transactions 
        WHERE user_id = ?
        GROUP BY DATE_FORMAT(date, '%Y-%m'), type
        ORDER BY month ASC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Error fetching trend data' });
        }
        
        return res.json({ success: true, trends: results });
    });
});

// Default route to serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access your application at http://localhost:${PORT}`);
});
