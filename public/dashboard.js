// Global variables
let currentUser = null;
let transactions = [];
let charts = {};

// Categories for income and expenses
const categories = {
    income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
    expense: ['Food', 'Transportation', 'Entertainment', 'Healthcare', 'Shopping', 'Bills', 'Education', 'Travel', 'Other']
};

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

// Initialize dashboard
function initializeDashboard() {
    // Check if user is logged in
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    
    if (!userId || !username) {
        window.location.href = '/login.html';
        return;
    }
    
    currentUser = { id: userId, username: username };
    document.getElementById('welcomeUser').textContent = username;
    document.getElementById('profileUsername').value = username;
    
    // Set today's date as default
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    // Load user data
    loadTransactions();
    loadUserProfile();
    
    // Setup form listeners
    setupEventListeners();
}

// Setup event listeners
function setupEventListeners() {
    // Transaction form
    document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);
    
    // Transaction type change
    document.getElementById('transactionType').addEventListener('change', updateCategories);
    
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', handleUpdateProfile);
}

// Show different sections
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => link.classList.remove('active'));
    
    // Show selected section
    document.getElementById(sectionName + 'Section').style.display = 'block';
    
    // Add active class to current nav link
    event.target.classList.add('active');
    
    // Load section-specific data
    if (sectionName === 'graphs') {
        setTimeout(loadCharts, 100); // Small delay to ensure canvas is visible
    }
}

// Update categories based on transaction type
function updateCategories() {
    const type = document.getElementById('transactionType').value;
    const categorySelect = document.getElementById('category');
    
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    if (type && categories[type]) {
        categories[type].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// Handle add transaction
async function handleAddTransaction(event) {
    event.preventDefault();
    
    const formData = {
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value,
        user_id: currentUser.id
    };
    
    try {
        const response = await fetch('/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Transaction added successfully!');
            resetTransactionForm();
            loadTransactions();
        } else {
            alert(result.message || 'Error adding transaction');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding transaction');
    }
}

// Reset transaction form
function resetTransactionForm() {
    document.getElementById('transactionForm').reset();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    updateCategories();
}

// Load transactions
async function loadTransactions() {
    try {
        const response = await fetch(`/transactions/${currentUser.id}`);
        const result = await response.json();
        
        if (result.success) {
            transactions = result.transactions;
            updateDashboard();
            displayTransactions();
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Update dashboard statistics
function updateDashboard() {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    
    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear) {
            if (transaction.type === 'income') {
                monthlyIncome += parseFloat(transaction.amount);
            } else {
                monthlyExpenses += parseFloat(transaction.amount);
            }
        }
    });
    
    const balance = monthlyIncome - monthlyExpenses;
    
    document.getElementById('totalIncome').textContent = `₹${monthlyIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${monthlyExpenses.toFixed(2)}`;
    document.getElementById('balance').textContent = `₹${balance.toFixed(2)}`;
    
    // Display recent transactions
    displayRecentTransactions();
}

// Display recent transactions
function displayRecentTransactions() {
    const recentContainer = document.getElementById('recentTransactions');
    const recentTransactions = transactions.slice(-5).reverse();
    
    if (recentTransactions.length === 0) {
        recentContainer.innerHTML = '<p class="text-muted">No transactions found. Add your first transaction!</p>';
        return;
    }
    
    recentContainer.innerHTML = recentTransactions.map(transaction => `
        <div class="transaction-item ${transaction.type}-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${transaction.description}</strong>
                    <br>
                    <small class="text-muted">${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}</small>
                </div>
                <div class="text-end">
                    <span class="h6 ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'income' ? '+' : '-'}₹${parseFloat(transaction.amount).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Display all transactions
function displayTransactions() {
    const container = document.getElementById('allTransactions');
    const filteredTransactions = filterTransactionsByType();
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = '<p class="text-muted">No transactions found.</p>';
        return;
    }
    
    container.innerHTML = filteredTransactions.map(transaction => `
        <div class="transaction-item ${transaction.type}-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${transaction.description}</strong>
                    <br>
                    <small class="text-muted">${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}</small>
                </div>
                <div class="text-end">
                    <span class="h6 ${transaction.type === 'income' ? 'text-success' : 'text-danger'}">
                        ${transaction.type === 'income' ? '+' : '-'}₹${parseFloat(transaction.amount).toFixed(2)}
                    </span>
                    <br>
                    <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${transaction.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filter transactions by type
function filterTransactions() {
    displayTransactions();
}

function filterTransactionsByType() {
    const filterType = document.getElementById('filterType').value;
    if (filterType === 'all') {
        return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return transactions.filter(t => t.type === filterType).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Delete transaction
async function deleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    try {
        const response = await fetch(`/transactions/${transactionId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Transaction deleted successfully!');
            loadTransactions();
        } else {
            alert(result.message || 'Error deleting transaction');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting transaction');
    }
}

// Load charts
function loadCharts() {
    loadIncomeExpenseChart();
    loadCategoryChart();
    loadTrendChart();
}

// Load income vs expense chart
function loadIncomeExpenseChart() {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    if (charts.incomeExpense) {
        charts.incomeExpense.destroy();
    }
    
    charts.incomeExpense = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Load category chart
function loadCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    const expensesByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(transaction => {
        expensesByCategory[transaction.category] = (expensesByCategory[transaction.category] || 0) + parseFloat(transaction.amount);
    });
    
    const labels = Object.keys(expensesByCategory);
    const data = Object.values(expensesByCategory);
    
    if (charts.category) {
        charts.category.destroy();
    }
    
    charts.category = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Load trend chart
function loadTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Group transactions by month
    const monthlyData = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthKey].income += parseFloat(transaction.amount);
        } else {
            monthlyData[monthKey].expenses += parseFloat(transaction.amount);
        }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const expenseData = sortedMonths.map(month => monthlyData[month].expenses);
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        return monthName;
    });
    
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Income',
                data: incomeData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: expenseData,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`/user/${currentUser.id}`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('profileEmail').value = result.user.email || '';
            document.getElementById('totalTransactions').textContent = transactions.length;
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Handle update profile
async function handleUpdateProfile(event) {
    event.preventDefault();
    
    const formData = {
        email: document.getElementById('profileEmail').value,
        password: document.getElementById('newPassword').value
    };
    
    try {
        const response = await fetch(`/user/${currentUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Profile updated successfully!');
            document.getElementById('newPassword').value = '';
        } else {
            alert(result.message || 'Error updating profile');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating profile');
    }
}

// Delete account
async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    
    if (!confirm('This will permanently delete all your data. Are you absolutely sure?')) {
        return;
    }
    
    try {
        const response = await fetch(`/user/${currentUser.id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Account deleted successfully!');
            logout();
        } else {
            alert(result.message || 'Error deleting account');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error deleting account');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    window.location.href = '/login.html';
}