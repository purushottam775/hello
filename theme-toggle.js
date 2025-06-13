document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('themeToggleButton');
    const body = document.body;

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.classList.add(savedTheme);
        if (savedTheme === 'dark-mode') {
            themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // If no saved theme, check system preference
        body.classList.add('dark-mode');
        themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
    }

    themeToggleButton.addEventListener('click', () => {
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light-mode');
            themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark-mode');
            themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });
}); 