// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // If no token or user data, redirect to login
    if (!token || !user.id) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Update UI with user data
    const userNameElements = document.querySelectorAll('#userName, #userNameHeader');
    userNameElements.forEach(element => {
        if (element) {
            element.textContent = user.fullName;
        }
    });

    // Setup logout functionality
    const logoutButtons = document.querySelectorAll('#logoutBtn, #navLogoutBtn');
    logoutButtons.forEach(button => {
        if (button) {
            button.addEventListener('click', logout);
        }
    });

    return true;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Add authentication check on protected pages
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('transactions.html') || 
    window.location.pathname.includes('budget.html')) {
    checkAuth();
} 