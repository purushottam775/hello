// DOM Elements
const modal = document.getElementById('addTransactionModal');
const addTransactionBtn = document.getElementById('addTransactionBtn');
const cancelTransactionBtn = document.getElementById('cancelTransaction');
const closeModalBtn = document.querySelector('.close-modal');
const transactionForm = document.getElementById('transactionForm');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    return token;
}

// Initialize dashboard
async function initializeDashboard() {
    const token = checkAuth();
    if (!token) return;

    // Load user info
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData) {
        document.getElementById('userName').textContent = userData.fullName;
    }

    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    setupCharts();
    
    // Load initial data
    await loadDashboardData();
    setupBudgetAlerts();
    setupSavingsGoals();
    setupBudgetOverview();
    setupModals();
    setupAnalytics();
    generateInsights();
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const mobileCloseBtn = document.querySelector('.mobile-close');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // Transaction modal
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const modal = document.getElementById('transactionModal');
    const closeButtons = modal.querySelectorAll('.close-modal');

    addTransactionBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    transactionForm.addEventListener('submit', handleTransactionSubmit);

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    const navLogoutBtn = document.getElementById('navLogoutBtn');
    logoutBtn.addEventListener('click', handleLogout);
    navLogoutBtn.addEventListener('click', handleLogout);

    // Import/Export buttons
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportUserData);
    }

    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.onchange = (e) => importUserData(e.target.files[0]);
            fileInput.click();
        });
    }
}

// Handle logout
function handleLogout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
        // Show loading state
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
        logoutBtn.disabled = true;

        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('transactions');
        localStorage.removeItem('preferences');
        
        // Small delay to show loading state
        setTimeout(() => {
            // Redirect to login page
            window.location.href = 'login.html';
        }, 800);
    }
}

// Handle transaction form submission
async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const transactionData = {
        type: formData.get('type'),
        amount: parseFloat(formData.get('amount')),
        category: formData.get('category'),
        date: formData.get('date'),
        description: formData.get('description')
    };

    try {
        const res = await api.request('/transactions', 'POST', transactionData);
        if (!res.success) throw new Error(res.message || 'Failed to add transaction');
        document.getElementById('transactionModal').style.display = 'none';
        e.target.reset();
        await loadDashboardData(); // Reload dashboard data after successful transaction
    } catch (error) {
        showError('Failed to add transaction');
        logError(error);
    }
}

// Setup charts
function setupCharts() {
    // Monthly Overview Chart
    const monthlyCtx = document.getElementById('monthlyOverview').getContext('2d');
    const monthlyChart = new Chart(monthlyCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Income',
                data: [1500, 2000, 1800, 2200, 1900, 2400],
                borderColor: '#4F46E5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Expenses',
                data: [1200, 1600, 1400, 1900, 1700, 2000],
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Expense Categories Chart
    const categoriesCtx = document.getElementById('expenseCategories').getContext('2d');
    const categoriesChart = new Chart(categoriesCtx, {
        type: 'doughnut',
        data: {
            labels: ['Food', 'Rent', 'Transportation', 'Entertainment', 'Education'],
            datasets: [{
                data: [300, 800, 200, 150, 400],
                backgroundColor: [
                    '#4F46E5',
                    '#10B981',
                    '#F59E0B',
                    '#EF4444',
                    '#8B5CF6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            },
            cutout: '70%'
        }
    });

    // Handle chart period controls
    const periodButtons = document.querySelectorAll('[data-period]');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateChartPeriod(monthlyChart, button.dataset.period);
        });
    });

    // Handle chart view controls
    const viewButtons = document.querySelectorAll('[data-view]');
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateChartView(categoriesChart, button.dataset.view);
        });
    });
}

// Update chart period
function updateChartPeriod(chart, period) {
    let labels, incomeData, expenseData;

    switch(period) {
        case '6m':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            incomeData = [1500, 2000, 1800, 2200, 1900, 2400];
            expenseData = [1200, 1600, 1400, 1900, 1700, 2000];
            break;
        case '1y':
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            incomeData = [1500, 2000, 1800, 2200, 1900, 2400, 2100, 2300, 2500, 2700, 2600, 2800];
            expenseData = [1200, 1600, 1400, 1900, 1700, 2000, 1800, 2100, 2200, 2400, 2300, 2500];
            break;
        case 'all':
            labels = ['2021', '2022', '2023', '2024'];
            incomeData = [20000, 25000, 30000, 35000];
            expenseData = [18000, 22000, 27000, 32000];
            break;
    }

    chart.data.labels = labels;
    chart.data.datasets[0].data = incomeData;
    chart.data.datasets[1].data = expenseData;
    chart.update();
}

// Update chart view
function updateChartView(chart, view) {
    chart.config.type = view;
    chart.update();
}

// Load dashboard data
async function fetchDashboardData() {
    try {
        const data = await api.request('/dashboard', 'GET');
        console.log('Fetched dashboard data:', data);
        return data;
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showError('Failed to load dashboard data');
        logError(err);
        return { transactions: [], goals: [] };
    }
}

// Update all parts of the UI based on backend data
function updateDashboardUI(data) {
    // Update stats
    let income = 0, expenses = 0, savings = 0;
    data.transactions.forEach(tx => {
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expenses += tx.amount;
    });
    savings = income - expenses;
    document.getElementById('totalIncome').textContent = `₹${income.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${expenses.toFixed(2)}`;
    document.getElementById('totalBalance').textContent = `₹${savings.toFixed(2)}`;
    document.getElementById('totalSavings').textContent = `₹${savings.toFixed(2)}`;

    // Update recent transactions
    const transactionsList = document.getElementById('recentTransactions');
    if (transactionsList) {
        transactionsList.innerHTML = data.transactions.slice(-5).reverse().map(transaction => `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <h4>${transaction.category}</h4>
                    <span>${transaction.description || ''}</span>
                </div>
                <div class="transaction-amount">
                    <span>${transaction.type === 'expense' ? '-' : '+'}₹${Math.abs(transaction.amount).toFixed(2)}</span>
                    <small>${new Date(transaction.date).toLocaleDateString()}</small>
                </div>
            </div>
        `).join('');
    }

    // Update goals and budgets using dedicated render functions
    renderGoals(data.goals);
    renderBudgets(data.budgets);
    // Optionally update charts here with new data
    // updateChartsWithData(data);

    // Update financial overview cards
    updateFinancialOverview(data.transactions || []);
}

// Render Goals dynamically
function renderGoals(goals) {
    const grid = document.querySelector('.goals-grid');
    if (!grid) {
        console.error("Goals grid container not found!");
        return; // Stop if the container doesn't exist
    }
    grid.innerHTML = ''; // **!!! CLEAR EXISTING GOALS !!!**
    if (!goals || goals.length === 0) {
         grid.innerHTML = '<p>No goals added yet. Click "Add Goal" to get started!</p>'; // Optional: message for empty state
    } else {
        goals.forEach(goal => {
            // Ensure goal.saved and goal.target are numbers, handle potential NaN
            const saved = parseFloat(goal.saved) || 0;
            const target = parseFloat(goal.target) || 0;
            const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

            const goalHTML = `
                <div class="goal-card">
                    <div class="goal-info">
                        <h4>${goal.name}</h4>
                        <div class="goal-progress">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${percent}%;"></div>
                            </div>
                            <div class="goal-stats">
                                <span>₹${saved.toFixed(2)} / ₹${target.toFixed(2)}</span>
                                <span>${percent.toFixed(0)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += goalHTML;
        });
    }
}

// Render Budgets dynamically
function renderBudgets(budgets) {
    const container = document.querySelector('.budget-categories');
     if (!container) {
        console.error("Budget categories container not found!");
        return; // Stop if the container doesn't exist
    }
    container.innerHTML = ''; // **!!! CLEAR EXISTING BUDGETS !!!**
     if (!budgets || budgets.length === 0) {
         container.innerHTML = '<p>No budgets added yet.</p>'; // Optional: message for empty state
     } else {
        budgets.forEach(b => {
             // Ensure b.spent and b.limit are numbers, handle potential NaN
            const spent = parseFloat(b.spent) || 0;
            const limit = parseFloat(b.limit) || 0;
            const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

            const budgetHTML = `
                <div class="budget-category">
                    <div class="category-header">
                        <span>${b.name}</span>
                        <span>₹${spent.toFixed(2)} / ₹${limit.toFixed(2)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${percent}%; background: ${percent>80?'#EF4444':percent>60?'#F59E0B':'#10B981'};"></div>
                    </div>
                </div>
            `;
            container.innerHTML += budgetHTML;
        });
    }
}

// Override loadDashboardData to use backend and render dynamically
async function loadDashboardData() {
    const data = await fetchDashboardData();
    updateDashboardUI(data); // This will now call renderGoals and renderBudgets
}

// Budget Alert Management
function setupBudgetAlerts() {
    const alerts = document.querySelector('.alerts-section');
    if (!alerts) return;

    // Close alert functionality
    alerts.addEventListener('click', (e) => {
        if (e.target.classList.contains('alert-close')) {
            const alert = e.target.closest('.alert');
            alert.style.opacity = '0';
            setTimeout(() => alert.remove(), 300);
        }
    });

    // Check budget thresholds and show alerts
    checkBudgetThresholds();
}

function checkBudgetThresholds() {
    const mockBudgets = {
        'Food & Dining': { limit: 500, spent: 420 },
        'Transportation': { limit: 300, spent: 200 },
        'Entertainment': { limit: 200, spent: 150 }
    };

    Object.entries(mockBudgets).forEach(([category, data]) => {
        const percentageUsed = (data.spent / data.limit) * 100;
        if (percentageUsed >= 80) {
            createBudgetAlert(category, percentageUsed.toFixed(0), data.limit);
        }
    });
}

function createBudgetAlert(category, percentage, limit) {
    const alertHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="alert-content">
                <h4>Budget Alert</h4>
                <p>You've used ${percentage}% of your ${category} budget (£${limit})</p>
            </div>
            <button class="alert-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    const alertsSection = document.querySelector('.alerts-section');
    if (alertsSection) {
        alertsSection.insertAdjacentHTML('beforeend', alertHTML);
    }
}

// Savings Goals Management
function setupSavingsGoals() { /* Now handled by renderGoals */ }
function updateSavingsGoals(goals) { /* Now handled by renderGoals */ }

// Budget Overview Management
function setupBudgetOverview() { /* Now handled by renderBudgets */ }
function updateBudgetCategories(categories) { /* Now handled by renderBudgets */ }

// Modal Management
function setupModals() {
    const modals = ['category', 'goal', 'bill'].map(type => ({
        modal: document.getElementById(`${type}Modal`),
        form: document.getElementById(`${type}Form`),
        openBtn: document.querySelector(`[onclick="add${type.charAt(0).toUpperCase() + type.slice(1)}()"]`)
    }));

    modals.forEach(({ modal, form, openBtn }) => {
        if (!modal || !form || !openBtn) return;

        // Open modal
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('active');
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit(form.id);
            modal.classList.remove('active');
            form.reset();
        });
    });
}

// Form Submission Handlers
function handleFormSubmit(formId) {
    switch (formId) {
        case 'categoryForm':
            const category = {
                name: document.getElementById('categoryName').value,
                limit: parseFloat(document.getElementById('categoryLimit').value),
                color: document.getElementById('categoryColor').value
            };
            addBudgetCategory(category);
            break;

        case 'goalForm':
            const goal = {
                name: document.getElementById('goalName').value,
                target: parseFloat(document.getElementById('goalAmount').value),
                date: document.getElementById('goalDate').value
            };
            addFinancialGoal(goal);
            break;

        case 'billForm':
            const bill = {
                name: document.getElementById('billName').value,
                amount: parseFloat(document.getElementById('billAmount').value),
                dueDate: document.getElementById('billDueDate').value,
                recurring: document.getElementById('billRecurring').value
            };
            addBillReminder(bill);
            break;
    }
}

// Budget Categories
function addBudgetCategory(category) {
    const categoriesContainer = document.getElementById('budgetCategories');
    const spent = Math.random() * category.limit; // Mock data
    const percentage = (spent / category.limit) * 100;

    const categoryHTML = `
        <div class="budget-category">
            <div class="category-header">
                <span>${category.name}</span>
                <span>£${spent.toFixed(2)} / £${category.limit}</span>
            </div>
            <div class="progress">
                <div class="progress-bar" role="progressbar" 
                     style="width: ${percentage}%; background-color: ${category.color}" 
                     aria-valuenow="${percentage}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
        </div>
    `;
    categoriesContainer.insertAdjacentHTML('beforeend', categoryHTML);
    updateCharts(); // Refresh charts with new category
}

// Financial Goals
function addFinancialGoal(goal) {
    const goalsContainer = document.getElementById('goalsGrid');
    const saved = Math.random() * goal.target; // Mock data
    const percentage = (saved / goal.target) * 100;
    const remaining = goal.target - saved;
    const daysLeft = Math.ceil((new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24));

    const goalHTML = `
        <div class="goal-card">
            <div class="goal-icon">
                <i class="fas fa-bullseye"></i>
            </div>
            <div class="goal-info">
                <h4>${goal.name}</h4>
                <div class="goal-progress">
                    <div class="progress">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${percentage}%" 
                             aria-valuenow="${percentage}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                </div>
                <div class="goal-stats">
                    <span>£${saved.toFixed(2)} saved</span>
                    <span>£${remaining.toFixed(2)} to go</span>
                </div>
                <p class="goal-date">${daysLeft} days left</p>
            </div>
        </div>
    `;
    goalsContainer.insertAdjacentHTML('beforeend', goalHTML);
}

// Bill Reminders
function addBillReminder(bill) {
    const billsContainer = document.getElementById('billsList');
    const dueDate = new Date(bill.dueDate);
    const daysUntilDue = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
    const status = daysUntilDue <= 3 ? 'warning' : 'normal';

    const billHTML = `
        <div class="bill-item ${status}">
            <div class="bill-info">
                <i class="fas fa-file-invoice-dollar"></i>
                <div>
                    <h4>${bill.name}</h4>
                    <span class="bill-date">Due in ${daysUntilDue} days</span>
                </div>
            </div>
            <div class="bill-amount">
                <span>£${bill.amount}</span>
                ${bill.recurring !== 'none' ? `<span class="recurring-badge">${bill.recurring}</span>` : ''}
            </div>
        </div>
    `;
    billsContainer.insertAdjacentHTML('beforeend', billHTML);
}

// Smart Insights
function generateInsights() {
    const insightsContainer = document.getElementById('insightsGrid');
    const insights = [
        {
            type: 'success',
            title: 'Savings Goal Progress',
            message: 'You\'re on track to meet your laptop savings goal by next month!'
        },
        {
            type: 'warning',
            title: 'Budget Alert',
            message: 'Your entertainment spending is 15% higher than last month.'
        },
        {
            type: 'info',
            title: 'Spending Pattern',
            message: 'Your highest expense category this month is groceries.'
        }
    ];

    insights.forEach(insight => {
        const insightHTML = `
            <div class="insight-card ${insight.type}">
                <h4>${insight.title}</h4>
                <p>${insight.message}</p>
            </div>
        `;
        insightsContainer.insertAdjacentHTML('beforeend', insightHTML);
    });
}

// Analytics
function setupAnalytics() {
    const timeframeSelect = document.getElementById('analyticsTimeframe');
    if (timeframeSelect) {
        timeframeSelect.addEventListener('change', updateCharts);
    }
    updateCharts();
}

function updateCharts() {
    // Expense Trend Chart
    const expenseCtx = document.getElementById('expenseChart')?.getContext('2d');
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Expenses',
                    data: [1200, 1350, 1100, 1500, 1300, 1450],
                    borderColor: '#4F46E5',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Monthly Expense Trend'
                    }
                }
            }
        });
    }

    // Category Distribution Chart
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping'],
                datasets: [{
                    data: [30, 20, 15, 25, 10],
                    backgroundColor: [
                        '#4F46E5',
                        '#34D399',
                        '#FBBF24',
                        '#EC4899',
                        '#8B5CF6'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expense Distribution'
                    }
                }
            }
        });
    }
}

// --- Real-time Backend Integration ---
// Add this at the top after other imports
let socket;

function connectSocket() {
    socket = io('http://localhost:4000');
    socket.on('update', (data) => {
        console.log('Real-time update received:', data); // Log to confirm data is received
        updateDashboardUI(data); // **This should trigger the rendering**
    });
    socket.on('connect', () => console.log('Socket connected!')); // Log on successful connection
    socket.on('disconnect', () => console.log('Socket disconnected!')); // Log on disconnection
    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err); // Log connection errors
        showError('Failed to connect to backend for real-time updates.');
    });
}

// Add goal submit (example, if you have a goal form)
async function handleGoalSubmit(goalData) {
    try {
        const res = await fetch('http://localhost:4000/api/goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goalData)
        });
        if (!res.ok) throw new Error('Failed to add goal');
        // Real-time update will come from socket
    } catch (error) {
        showError('Failed to add goal');
        logError(error);
    }
}

// --- End Real-time Backend Integration ---

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    connectSocket();
    initializeDashboard();
}); 

// Function to export user data
function exportUserData() {
    const userData = {
        transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
        bills: JSON.parse(localStorage.getItem('bills') || '[]'),
        goals: JSON.parse(localStorage.getItem('goals') || '[]'),
        preferences: JSON.parse(localStorage.getItem('preferences') || '{}')
        // Add other data stored in localStorage if necessary
    };
    const dataStr = JSON.stringify(userData, null, 4);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savvy_money_data_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Data exported successfully!');
}

// Function to import user data
function importUserData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Prompt user for overwrite or merge
            const overwrite = confirm('Do you want to overwrite your existing data with the imported data? Click OK to overwrite, or Cancel to merge.');

            if (overwrite) {
                // Overwrite existing data
                if (importedData.transactions) localStorage.setItem('transactions', JSON.stringify(importedData.transactions));
                if (importedData.bills) localStorage.setItem('bills', JSON.stringify(importedData.bills));
                if (importedData.goals) localStorage.setItem('goals', JSON.stringify(importedData.goals));
                if (importedData.preferences) localStorage.setItem('preferences', JSON.stringify(importedData.preferences));
                // Handle other data types as needed
                alert('Data imported and overwritten successfully!');
            } else {
                // Merge data (simple append for arrays, overwrite for objects)
                const currentTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
                const importedTransactions = importedData.transactions || [];
                localStorage.setItem('transactions', JSON.stringify([...currentTransactions, ...importedTransactions]));

                const currentBills = JSON.parse(localStorage.getItem('bills') || '[]');
                const importedBills = importedData.bills || [];
                localStorage.setItem('bills', JSON.stringify([...currentBills, ...importedBills]));

                const currentGoals = JSON.parse(localStorage.getItem('goals') || '[]');
                const importedGoals = importedData.goals || [];
                localStorage.setItem('goals', JSON.stringify([...currentGoals, ...importedGoals]));

                const currentPreferences = JSON.parse(localStorage.getItem('preferences') || '{}');
                const importedPreferences = importedData.preferences || {};
                localStorage.setItem('preferences', JSON.stringify({ ...currentPreferences, ...importedPreferences }));
                // Handle other data types merging as needed
                alert('Data imported and merged successfully!');
            }
            loadDashboardData(); // Reload dashboard after import
        } catch (error) {
            alert('Failed to import data: Invalid JSON file.');
            logError(error);
        }
    };
    reader.readAsText(file);
}

// New function to update financial overview cards
function updateFinancialOverview(transactions) {
    const financialOverviewCards = document.querySelector('.financial-overview-cards');
    console.log('updateFinancialOverview called. Transactions:', transactions);
    if (financialOverviewCards) {
        if (transactions && transactions.length > 0) {
            financialOverviewCards.style.display = 'grid'; // Show the cards
            console.log('Financial overview cards display set to grid.');

            let totalBalance = 0;
            let totalIncome = 0;
            let totalExpenses = 0;
            let totalSavings = 0;

            // Dummy data for comparison (replace with actual historical data if available)
            const lastMonthIncome = 0; 
            const lastMonthExpenses = 0; 
            const lastMonthBalance = 0; 

            transactions.forEach(transaction => {
                if (transaction.type === 'income') {
                    totalBalance += transaction.amount;
                    totalIncome += transaction.amount;
                } else if (transaction.type === 'expense') {
                    totalBalance -= transaction.amount;
                    totalExpenses += transaction.amount;
                } else if (transaction.type === 'saving') { // Assuming a 'saving' type for deposits into savings
                    totalBalance -= transaction.amount;
                    totalSavings += transaction.amount;
                }
            });

            document.getElementById('totalBalance').textContent = totalBalance.toFixed(2);
            document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
            document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2);
            document.getElementById('totalSavings').textContent = totalSavings.toFixed(2);

            // Update percentage changes (using dummy data for now)
            const balanceChange = lastMonthBalance ? ((totalBalance - lastMonthBalance) / lastMonthBalance * 100) : 0;
            const incomeChange = lastMonthIncome ? ((totalIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
            const expensesChange = lastMonthExpenses ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses * 100) : 0;

            const balanceChangeElement = financialOverviewCards.querySelector('#totalBalance').nextElementSibling;
            const incomeChangeElement = financialOverviewCards.querySelector('#totalIncome').nextElementSibling;
            const expensesChangeElement = financialOverviewCards.querySelector('#totalExpenses').nextElementSibling;

            updateChangeIndicator(balanceChangeElement, balanceChange);
            updateChangeIndicator(incomeChangeElement, incomeChange);
            updateChangeIndicator(expensesChangeElement, expensesChange);

            // Update savings goal progress (dummy goal for now, e.g., 1000)
            const savingsGoal = 1000; 
            const savingsProgress = (totalSavings / savingsGoal) * 100;
            const progressBar = financialOverviewCards.querySelector('.progress-bar');
            const progressText = financialOverviewCards.querySelector('.progress-text');

            progressBar.style.width = `${Math.min(savingsProgress, 100)}%`;
            progressText.textContent = `${Math.min(savingsProgress, 100).toFixed(0)}% of goal`;

        } else {
            financialOverviewCards.style.display = 'none'; // Hide the cards if no transactions
            console.log('Financial overview cards display set to none (no transactions).');
        }
    } else {
        console.error('Financial overview cards container not found.');
    }
}

// Helper function to update change indicators (up/down arrow and text)
function updateChangeIndicator(element, percentage) {
    element.textContent = `${Math.abs(percentage).toFixed(0)}% vs last month`;
    element.classList.remove('up', 'down');
    element.querySelector('i').className = ''; // Clear existing icon classes

    if (percentage > 0) {
        element.classList.add('up');
        element.querySelector('i').classList.add('fas', 'fa-arrow-up');
    } else if (percentage < 0) {
        element.classList.add('down');
        element.querySelector('i').classList.add('fas', 'fa-arrow-down');
    } else {
        element.querySelector('i').classList.add('fas', 'fa-minus'); // Neutral icon
    }
} 