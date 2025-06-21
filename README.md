# Budget Tracker Application

A comprehensive budget tracking web application built with Node.js, Express, MySQL, and Bootstrap. Track your income, expenses, visualize your spending patterns, and manage your finances effectively.

## Features

### 🔐 User Authentication
- User registration and login
- Secure session management
- User profile management
- Account deletion functionality

### 💰 Transaction Management
- Add income and expense transactions
- Categorize transactions (Food, Transportation, Entertainment, etc.)
- Edit and delete transactions
- Filter transactions by type
- Date-based transaction tracking

### 📊 Data Visualization
- Income vs Expenses pie chart
- Category-wise expense breakdown
- Monthly trends line chart
- Real-time dashboard statistics

### 📱 Responsive Design
- Mobile-friendly interface
- Bootstrap-based responsive layout
- Modern gradient designs
- Intuitive user interface

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5, Custom CSS
- **Charts**: Chart.js
- **Other**: Body-parser, CORS

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v14.0.0 or higher)
- MySQL Server (v5.7 or higher)
- npm (usually comes with Node.js)

## Installation & Setup

### 1. Clone/Download the Project
```bash
# If using git
git clone https://github.com/swasthikdevadiga1/Budget-Tracker-Application
cd budget-tracker

# Or download and extract the zip file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Option A: Manual Database Creation
1. Start your MySQL server
2. Open MySQL command line or any MySQL client (like MySQL Workbench, phpMyAdmin)
3. Create a new database:
```sql
CREATE DATABASE budget_tracker;
```

#### Option B: The application will create tables automatically
The server.js file includes automatic table creation, so you just need to:
1. Make sure MySQL is running
2. Create the database `budget_tracker`
3. Update the database credentials in server.js

### 4. Configure Database Connection

Edit the database configuration in `server.js`:

```javascript
const db = mysql.createConnection({
    host: 'localhost',
    user: 'your_mysql_username',    // Change this
    password: 'your_mysql_password', // Change this  
    database: 'budget_tracker'
});
```

**Default configuration:**
- Host: localhost
- User: root
- Password: pswd (change this to your MySQL password)
- Database: budget_tracker

### 5. File Structure

Make sure your project has the following structure:
```
budget-tracker/
├── server.js              # Main server file
├── package.json           # Dependencies
├──public
|     |---login.html            # Login page
|     |---register.html         # Registration page 
|     |── dashboard.html        # Complete dashboard
|     ├── login.js              # Login functionality
|     ├── register.js           # Registration functionality
|     ├── dashboard.js          # Dashboard functionality
|     ├── login.css             # Login page styles
|     ├── register.css          # Register page styles
|     ├── index.css             # Dashboard styles
|     ├── premium-logo.jpeg     # Logo image
|     |___Screenshot from 2025-02-01 11-19-50.png
|
└── README.md            # This file

install node modules (npm install)
```

### 6. Start the Application

#### Development Mode (with auto-restart):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## Usage Guide

### 1. Registration
1. Navigate to `http://localhost:3000/register.html`
2. Fill in username, email, and password
3. Click "Register"
4. You'll be redirected to the login page

### 2. Login
1. Navigate to `http://localhost:3000` or `http://localhost:3000/login.html`
2. Enter your username and password
3. Click "Login"
4. You'll be redirected to the dashboard

### 3. Dashboard Features

#### Overview Section
- View total income, expenses, and balance for the current month
- See recent transactions
- Quick access to add new transactions

#### Handle Transactions
- Add new income or expense transactions
- Select appropriate categories
- Add descriptions and dates
- View all transactions with filtering options
- Delete unwanted transactions

#### Graphs Section
- **Income vs Expenses**: Doughnut chart showing the proportion
- **Expense Categories**: Pie chart showing spending by category
- **Monthly Trends**: Line chart showing income and expense trends over time

#### User Profile
- Update email address
- Change password
- View account statistics
- Delete account (with confirmation)

## Database Schema

The application creates the following tables automatically:

### Users Table
```sql
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);
```

## API Endpoints

### Authentication
- `POST /register` - User registration
- `POST /login` - User login

### Transactions
- `GET /transactions/:userId` - Get all transactions for a user
- `POST /transactions` - Add new transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### User Management
- `GET /user/:id` - Get user profile
- `PUT /user/:id` - Update user profile
- `DELETE /user/:id` - Delete user account

### Analytics
- `GET /analytics/summary/:userId` - Get transaction summary
- `GET /analytics/categories/:userId` - Get category-wise data
- `GET /analytics/trends/:userId` - Get monthly trends

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Make sure MySQL server is running
   - Check database credentials in server.js
   - Ensure the database 'budget_tracker' exists

2. **Port Already in Use**
   - Change the port in server.js: `app.listen(3001, ...)`
   - Or kill the process using port 3000

3. **Module Not Found**
   - Run `npm install` to install all dependencies
   - Check if all required files are present

4. **Login Issues**
   - Make sure you've registered first
   - Check browser console for JavaScript errors
   - Verify server is running

### Development Tips

1. **Enable Auto-restart**: Use `npm run dev` for development
2. **Database Debugging**: Check MySQL logs for connection issues
3. **Frontend Debugging**: Use browser developer tools
4. **API Testing**: Use Postman or similar tools to test API endpoints

## Security Considerations

⚠️ **Important**: This is a basic implementation. For production use, consider:

- Implementing proper password hashing (bcrypt)
- Adding JWT tokens for authentication
- Input validation and sanitization
- SQL injection prevention (using prepared statements)
- HTTPS implementation
- Rate limiting
- Environment variables for sensitive data

## Future Enhancements

- [ ] Budget goals and alerts
- [ ] Recurring transactions
- [ ] Export data to CSV/PDF
- [ ] Mobile app
- [ ] Multi-currency support
- [ ] Email notifications
- [ ] Advanced analytics and insights
- [ ] Data backup and restore

## Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure database is properly configured
4. Check server logs for detailed error messages

## License

This project is open source and available under the MIT License.

---

**Happy Budget Tracking! 💰📊**
