// Create and inject chatbot elements
function createChatbotElements() {
    // Create container
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.innerHTML = `
        <button class="chatbot-toggle" id="chatbotToggle">
            <div class="chatbot-icon">
                <svg viewBox="0 0 24 24" class="chat-icon">
                    <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                </svg>
                <svg viewBox="0 0 24 24" class="close-icon" style="display: none;">
                    <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </div>
        </button>
        <div class="chatbot-window" id="chatbotWindow">
            <iframe class="chatbot-iframe" src="https://cdn.botpress.cloud/webchat/v3.0/shareable.html?configUrl=https://files.bpcontent.cloud/2025/06/10/21/20250610211114-547PMTOU.json" frameborder="0"></iframe>
        </div>
    `;
    document.body.appendChild(container);

    // Add event listener
    const toggle = document.getElementById('chatbotToggle');
    const window = document.getElementById('chatbotWindow');
    const chatIcon = toggle.querySelector('.chat-icon');
    const closeIcon = toggle.querySelector('.close-icon');

    toggle.addEventListener('click', () => {
        window.classList.toggle('active');
        const navbarChatbotLink = document.getElementById('navbarChatbotLink');
        if (navbarChatbotLink) {
            navbarChatbotLink.classList.toggle('active');
        }

        if (window.classList.contains('active')) {
            chatIcon.style.display = 'none';
            closeIcon.style.display = 'block';
            toggle.classList.add('active');
        } else {
            chatIcon.style.display = 'block';
            closeIcon.style.display = 'none';
            toggle.classList.remove('active');
        }
    });
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', createChatbotElements); 