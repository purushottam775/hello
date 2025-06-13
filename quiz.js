const quizData = [
    {
        question: "What does 'APR' stand for in finance?",
        options: [
            "Annual Percentage Rate",
            "Annual Profit Ratio",
            "Average Payment Rate",
            "Asset Performance Ratio"
        ],
        answer: 0
    },
    {
        question: "Which of these is a type of retirement account?",
        options: [
            "IRA",
            "ETF",
            "IPO",
            "ROI"
        ],
        answer: 0
    },
    {
        question: "What is a stock dividend?",
        options: [
            "A fee for buying stocks",
            "A payment made by a corporation to its shareholders",
            "A type of bond",
            "A government tax"
        ],
        answer: 1
    },
    {
        question: "What does 'liquidity' mean in finance?",
        options: [
            "The amount of cash available",
            "The ability to convert assets to cash quickly",
            "The interest rate on loans",
            "The value of a company"
        ],
        answer: 1
    },
    {
        question: "Which is considered a 'safe haven' asset?",
        options: [
            "Cryptocurrency",
            "Gold",
            "Penny stocks",
            "Junk bonds"
        ],
        answer: 1
    },
    // Student Budget Planner Questions
    {
        question: "What is the first step in creating a student budget?",
        options: [
            "Start investing in stocks",
            "Track your income and expenses",
            "Apply for a credit card",
            "Buy a new laptop"
        ],
        answer: 1
    },
    {
        question: "Which of the following is a fixed expense for most students?",
        options: [
            "Monthly rent",
            "Eating out",
            "Movie tickets",
            "Shopping for clothes"
        ],
        answer: 0
    },
    {
        question: "Why is it important to save receipts or use a budgeting app?",
        options: [
            "To track spending and stay within budget",
            "To impress friends",
            "To get discounts",
            "To avoid paying taxes"
        ],
        answer: 0
    },
    {
        question: "What is an emergency fund?",
        options: [
            "Money set aside for unexpected expenses",
            "A loan from a friend",
            "A type of scholarship",
            "A monthly subscription"
        ],
        answer: 0
    },
    {
        question: "Which strategy helps students avoid overspending?",
        options: [
            "Impulse buying",
            "Making a shopping list and sticking to it",
            "Ignoring your bank balance",
            "Borrowing money frequently"
        ],
        answer: 1
    }
];

let currentQuestion = 0;
let score = 0;

const quizSection = document.getElementById('quiz-section');
const quizEl = document.getElementById('quiz');
const nextBtn = document.getElementById('next-btn');
const resultEl = document.getElementById('result');
const startBtn = document.getElementById('start-btn');

// Theme toggle logic
const themeToggle = document.getElementById('themeToggle');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');

function setTheme(mode) {
    if (mode === 'light') {
        document.body.classList.add('light-mode');
        sunIcon.style.display = '';
        moonIcon.style.display = 'none';
    } else {
        document.body.classList.remove('light-mode');
        sunIcon.style.display = 'none';
        moonIcon.style.display = '';
    }
    localStorage.setItem('quizTheme', mode);
}

// Load theme from localStorage
const savedTheme = localStorage.getItem('quizTheme');
if (savedTheme === 'light') {
    setTheme('light');
} else {
    setTheme('dark');
}

themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('light-mode')) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
});

startBtn.addEventListener('click', () => {
    startBtn.style.display = 'none';
    quizSection.style.display = 'block';
    currentQuestion = 0;
    score = 0;
    nextBtn.style.display = '';
    resultEl.innerHTML = '';
    showQuestion();
});

function showQuestion() {
    const q = quizData[currentQuestion];
    quizEl.innerHTML = `
        <div class="question">${q.question}</div>
        ${q.options.map((opt, i) => `<button class="option" data-index="${i}">${opt}</button>`).join('')}
    `;
    nextBtn.disabled = true;
    document.querySelectorAll('.option').forEach(btn => {
        btn.addEventListener('click', selectOption);
    });
}

function selectOption(e) {
    document.querySelectorAll('.option').forEach(btn => btn.classList.remove('selected'));
    e.target.classList.add('selected');
    nextBtn.disabled = false;
}

nextBtn.addEventListener('click', () => {
    const selected = document.querySelector('.option.selected');
    if (!selected) return;
    const answer = parseInt(selected.getAttribute('data-index'));
    if (answer === quizData[currentQuestion].answer) score++;
    currentQuestion++;
    if (currentQuestion < quizData.length) {
        showQuestion();
    } else {
        showResult();
    }
});

function showResult() {
    quizEl.innerHTML = '';
    nextBtn.style.display = 'none';
    resultEl.innerHTML = `You scored <strong>${score}</strong> out of <strong>${quizData.length}</strong>!`;
}

showQuestion(); 