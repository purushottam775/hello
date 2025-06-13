// Mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navAuth = document.querySelector('.nav-auth');

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        navAuth.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.navbar')) {
            navLinks.classList.remove('active');
            navAuth.classList.remove('active');
            mobileMenuBtn.classList.remove('active');
        }
    });
}); 