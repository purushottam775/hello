document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        window.location.href = '/dashboard.html';
        return;
    }

    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.querySelector('.password-toggle');
    const errorMessage = document.getElementById('errorMessage');
    const rememberMe = document.getElementById('remember');

    // Password visibility toggle
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        passwordToggle.classList.toggle('fa-eye');
        passwordToggle.classList.toggle('fa-eye-slash');
    });

    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const remember = rememberMe.checked;
        
        // Clear previous error
        hideError();
        
        // Validation
        if (!email || !password) {
            showError('Please enter both email and password');
            return;
        }

        // Email validation
        if (!isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        try {
            setLoading(true, submitButton);
            
            // Make API call to login
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Invalid email or password');
            }
            
            // Store auth data based on remember me choice
            if (data.token) {
                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('token', data.token);
                if (data.user) {
                    storage.setItem('user', JSON.stringify(data.user));
                }
            }
            
            // Show success message and redirect
            showSuccess('Login successful! Redirecting to dashboard...');
            submitButton.innerHTML = '<i class="fas fa-check"></i> Success!';
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'An error occurred during login');
            setLoading(false, submitButton, originalButtonText);
        }
    });

    // Helper Functions
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.classList.remove('success-message');
    }

    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.classList.add('success-message');
    }

    function hideError() {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        errorMessage.classList.remove('success-message');
    }

    function setLoading(isLoading, button, originalText = '') {
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    // Social login handlers
    document.querySelector('.social-btn.google').addEventListener('click', () => {
        window.location.href = '/api/auth/google';
    });

    document.querySelector('.social-btn.microsoft').addEventListener('click', () => {
        window.location.href = '/api/auth/microsoft';
    });
});

// Add loading button styles
const style = document.createElement('style');
style.textContent = `
    .loading {
        position: relative;
        color: transparent !important;
    }

    .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #ffffff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .error-message {
        display: none;
        background-color: #FEE2E2;
        border: 1px solid #EF4444;
        color: #B91C1C;
        padding: 0.75rem;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        text-align: center;
    }
`;

document.head.appendChild(style); 