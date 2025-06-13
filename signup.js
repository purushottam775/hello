document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordToggle = document.querySelector('.password-toggle');
    const strengthMeter = document.querySelector('.strength-meter div');
    const strengthText = document.querySelector('.strength-text span');
    const errorMessage = document.getElementById('errorMessage');

    // Password visibility toggle
    passwordToggle.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        confirmPasswordInput.type = type;
        passwordToggle.querySelector('i').className = `fas fa-eye${type === 'password' ? '' : '-slash'}`;
    });

    // Password strength checker
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength++;
        
        // Character type checks
        if (password.match(/[a-z]+/)) strength++;
        if (password.match(/[A-Z]+/)) strength++;
        if (password.match(/[0-9]+/)) strength++;
        if (password.match(/[!@#$%^&*]+/)) strength++;

        // Update UI
        const strengthPercentage = (strength / 5) * 100;
        strengthMeter.style.width = `${strengthPercentage}%`;
        
        let strengthLabel = 'Weak';
        let color = '#ff4444';
        
        if (strength >= 4) {
            strengthLabel = 'Strong';
            color = '#00C851';
        } else if (strength >= 3) {
            strengthLabel = 'Good';
            color = '#00C851';
        } else if (strength >= 2) {
            strengthLabel = 'Fair';
            color = '#ffbb33';
        }
        
        strengthMeter.style.backgroundColor = color;
        strengthText.textContent = strengthLabel;
        strengthText.style.color = color;
        
        return strength;
    }

    passwordInput.addEventListener('input', () => {
        checkPasswordStrength(passwordInput.value);
    });

    // Form submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const terms = document.getElementById('terms').checked;
        
        // Clear previous error
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            showError('All fields are required');
            return;
        }
        
        if (!terms) {
            showError('Please accept the Terms of Service and Privacy Policy');
            return;
        }
        
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            showError('Password must be at least 8 characters long');
            return;
        }
        
        if (checkPasswordStrength(password) < 3) {
            showError('Please choose a stronger password');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showError('Please enter a valid email address');
            return;
        }

        const submitButton = signupForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
            
            // Make API call to create account
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create account');
            }
            
            // Success
            submitButton.innerHTML = '<i class="fas fa-check"></i> Account Created!';
            submitButton.classList.add('btn-success');
            
            // Store the token if provided
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            
            // Show success message and redirect
            showSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Signup error:', error);
            showError(error.message || 'An error occurred during signup');
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

    // Helper functions
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

    // Social login handlers
    document.querySelector('.social-btn.google').addEventListener('click', () => {
        // Implement Google OAuth login
        window.location.href = '/api/auth/google';
    });

    document.querySelector('.social-btn.microsoft').addEventListener('click', () => {
        // Implement Microsoft OAuth login
        window.location.href = '/api/auth/microsoft';
    });
}); 