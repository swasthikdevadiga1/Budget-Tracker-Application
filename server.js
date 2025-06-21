const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require("cors");
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database connection using Railway environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error('❌ DB connection failed:', err.stack);
    return;
  }
  console.log('✅ Connected to Railway MySQL');
  createTables();
});

// Create necessary tables
function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS user (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

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

  connection.query(createUsersTable, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('✅ Users table ready');
  });

  connection.query(createTransactionsTable, (err) => {
    if (err) console.error('Error creating transactions table:', err);
    else console.log('✅ Transactions table ready');
  });
}

// Registration route
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'INSERT INTO user (username, email, password) VALUES (?, ?, ?)';
  connection.query(query, [username, email, password], (err, results) => {
    if (err) {
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
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Please enter both username and password' });
  }

  const query = 'SELECT id, username FROM user WHERE username = ? AND password = ?';
  connection.query(query, [username, password], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error' });

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

// Transaction routes

app.get('/transactions/:userId', (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC';
  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching transactions' });
    return res.json({ success: true, transactions: results });
  });
});

app.post('/transactions', (req, res) => {
  const { user_id, type, amount, category, description, date } = req.body;

  if (!user_id || !type || !amount || !category || !description || !date) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const query = 'INSERT INTO transactions (user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?)';
  connection.query(query, [user_id, type, amount, category, description, date], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error adding transaction' });
    return res.json({ success: true, message: 'Transaction added successfully', id: results.insertId });
  });
});

app.put('/transactions/:id', (req, res) => {
  const transactionId = req.params.id;
  const { type, amount, category, description, date } = req.body;

  const query = 'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ?';
  connection.query(query, [type, amount, category, description, date, transactionId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error updating transaction' });

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    return res.json({ success: true, message: 'Transaction updated successfully' });
  });
});

app.delete('/transactions/:id', (req, res) => {
  const transactionId = req.params.id;
  const query = 'DELETE FROM transactions WHERE id = ?';
  connection.query(query, [transactionId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting transaction' });

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    return res.json({ success: true, message: 'Transaction deleted successfully' });
  });
});

// User routes

app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'SELECT id, username, email, created_at FROM user WHERE id = ?';
  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching user profile' });

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: results[0] });
  });
});

app.put('/user/:id', (req, res) => {
  const userId = req.params.id;
  const { email, password } = req.body;

  let query, params;
  if (password && password.trim() !== '') {
    query = 'UPDATE user SET email = ?, password = ? WHERE id = ?';
    params = [email, password, userId];
  } else {
    query = 'UPDATE user SET email = ? WHERE id = ?';
    params = [email, userId];
  }

  connection.query(query, params, (err, results) => {
    if (err) {
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

app.delete('/user/:id', (req, res) => {
  const userId = req.params.id;
  const query = 'DELETE FROM user WHERE id = ?';
  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error deleting account' });

    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'Account deleted successfully' });
  });
});

// Analytics routes

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
  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching summary' });

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
  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching category data' });
    return res.json({ success: true, categories: results });
  });
});

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
  connection.query(query, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Error fetching trend data' });
    return res.json({ success: true, trends: results });
  });
});

// Serve login page as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Error handling
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
  console.log(`🚀 Server is running on port ${PORT}`);
});
