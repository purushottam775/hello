// API configuration
const API_URL = window.location.hostname === 'localhost' 
    ? `http://${window.location.hostname}:3001/api`
    : '/api';

// Helper function to get auth token
function getAuthToken() {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user).token : null;
    } catch (error) {
        console.error('Error reading auth token:', error);
        return null;
    }
}

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include'
        });
        
        const contentType = response.headers.get('content-type');
        let data = null;

        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch (error) {
                console.error('Error parsing JSON response:', error);
                throw new Error('Invalid JSON response from server');
            }
        }

        if (!response.ok) {
            throw new Error(data?.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Initialize the budget planner
async function initializeBudgetPlanner() {
    try {
        // Fetch transactions
        const transactions = await apiCall('/transactions');
        updateTransactionList(transactions);
        
        // Fetch summary
        const summary = await apiCall('/transactions/summary');
        updateSummary(summary);
        
        // Update chart
        updateChart(transactions);
    } catch (error) {
        console.error('Error initializing budget planner:', error);
        showError('Failed to load data. Please try again.');
    }
}

// Add new transaction
async function addTransaction(event) {
    event.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    
    try {
        const transaction = await apiCall('/transactions', {
            method: 'POST',
            body: JSON.stringify({ description, amount, type, category })
        });
        
        // Refresh the page data
        await initializeBudgetPlanner();
        
        // Reset form
        event.target.reset();
    } catch (error) {
        showError('Failed to add transaction. Please try again.');
    }
}

// Delete transaction
async function deleteTransaction(id) {
    try {
        await apiCall(`/transactions/${id}`, {
            method: 'DELETE'
        });
        
        // Refresh the page data
        await initializeBudgetPlanner();
    } catch (error) {
        showError('Failed to delete transaction. Please try again.');
    }
}

// Update transaction list in the UI
function updateTransactionList(transactions) {
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = '';
    
    transactions.forEach(transaction => {
        const div = document.createElement('div');
        div.className = `transaction ${transaction.type}`;
        div.innerHTML = `
            <div class="transaction-info">
                <h4>${transaction.description}</h4>
                <p class="category">${transaction.category}</p>
            </div>
            <div class="transaction-amount">
                <p>${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}</p>
                <button onclick="deleteTransaction('${transaction._id}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        transactionList.appendChild(div);
    });
}

// Update summary in the UI
function updateSummary(summary) {
    document.getElementById('balance').textContent = `$${summary.balance.toFixed(2)}`;
    document.getElementById('income-amount').textContent = `$${summary.totalIncome.toFixed(2)}`;
    document.getElementById('expense-amount').textContent = `$${summary.totalExpense.toFixed(2)}`;
}

// Update chart
function updateChart(transactions) {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Group expenses by category
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
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

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('error-message');
    } else {
        console.error('Error:', message);
    }
}

// Show success message
function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        successDiv.classList.add('success-message');
    }
}

// Clear messages
function clearMessages() {
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }
    
    if (successDiv) {
        successDiv.style.display = 'none';
        successDiv.textContent = '';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', addTransaction);
    }
});