// JavaScript for handling goal creation and display

document.addEventListener('DOMContentLoaded', () => {
    const goalForm = document.getElementById('goalForm');
    const goalsList = document.getElementById('goalsList');
    const goalTermOptions = document.querySelectorAll('.goal-term-option');

    let selectedIcon = '<i class="fas fa-money-bill-wave"></i>'; // Default icon
    let goals = []; // Array to store goal objects
    
    // Handle icon selection
    document.querySelectorAll('.icon-item').forEach(icon => {
        icon.addEventListener('click', () => {
            document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
            icon.classList.add('selected');
            selectedIcon = icon.outerHTML; // Store the full HTML of the selected icon
        });
    });

    // Handle goal term selection
    goalTermOptions.forEach(option => {
        option.addEventListener('click', () => {
            goalTermOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    goalForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const goalName = document.getElementById('goalName').value;
        const currentSavings = parseFloat(document.getElementById('currentSavings').value);
        const targetAmount = parseFloat(document.getElementById('targetAmount').value);
        const targetDate = document.getElementById('targetDate').value;
        const weeklySavings = parseFloat(document.getElementById('weeklySavings').value);
        const selectedTerm = document.querySelector('.goal-term-option.selected').dataset.term;

        // Basic validation
        if (!goalName || isNaN(currentSavings) || isNaN(targetAmount) || !targetDate || isNaN(weeklySavings)) {
            alert('Please fill in all fields with valid information.');
            return;
        }

        const newGoal = {
            id: Date.now(), // Unique ID for the goal
            name: goalName,
            icon: selectedIcon,
            currentSavings: currentSavings,
            targetAmount: targetAmount,
            targetDate: targetDate,
            weeklySavings: weeklySavings,
            term: selectedTerm
        };

        goals.push(newGoal);
        renderGoals();

        // Clear form fields
        goalForm.reset();
        // Reset selected icon and term
        document.querySelectorAll('.icon-item').forEach(i => i.classList.remove('selected'));
        document.querySelector('.goal-term-option[data-term="short"]').classList.add('selected');
        selectedIcon = '<i class="fas fa-money-bill-wave"></i>';
    });

    function renderGoals() {
        goalsList.innerHTML = ''; // Clear existing goals
        goals.forEach(goal => {
            // Calculate progress
            const progress = (goal.currentSavings / goal.targetAmount) * 100;
            const formattedProgress = Math.min(progress, 100).toFixed(1);

            // Calculate days left
            const today = new Date();
            const target = new Date(goal.targetDate);
            const timeDiff = target.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            let daysLeftText = daysLeft > 0 ? `${daysLeft} Days Left` : 'Overdue!';
            if (daysLeft === 0) daysLeftText = 'Today!';

            const goalCard = `
                <div class="goal-card" data-id="${goal.id}">
                    <div class="goal-header">
                        <h3>${goal.icon} ${goal.name}</h3>
                        <div class="goal-actions">
                            <button class="btn-add-weekly" data-id="${goal.id}">Add Weekly</button>
                            <button class="btn-edit-weekly-amount" data-id="${goal.id}">Edit Weekly</button>
                            <button class="btn-delete-goal" data-id="${goal.id}"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${formattedProgress}%;"></div>
                    </div>
                    <div class="progress-text">₹${goal.currentSavings.toFixed(2)} saved of ₹${goal.targetAmount.toFixed(2)}</div>
                    <div class="goal-details-grid">
                        <div class="detail-item">
                            <div class="value">₹${goal.weeklySavings.toFixed(2)}</div>
                            <div class="label">Weekly Savings</div>
                        </div>
                        <div class="detail-item">
                            <div class="value">${daysLeftText}</div>
                            <div class="label">Days Left</div>
                        </div>
                        <div class="detail-item">
                            <div class="value">${formattedProgress}%</div>
                            <div class="label">Progress</div>
                        </div>
                    </div>
                </div>
            `;
            goalsList.insertAdjacentHTML('beforeend', goalCard);

            // Check for goal completion after rendering
            if (goal.currentSavings >= goal.targetAmount) {
                setTimeout(() => {
                    alert(`Congratulations! You have achieved your goal: ${goal.name}!`);
                }, 100);
            }
        });

        // Add event listeners for delete, add weekly, and edit weekly amount buttons after rendering
        document.querySelectorAll('.btn-delete-goal').forEach(button => {
            button.addEventListener('click', (e) => {
                const goalId = parseInt(e.currentTarget.dataset.id);
                goals = goals.filter(goal => goal.id !== goalId);
                renderGoals();
            });
        });

        document.querySelectorAll('.btn-add-weekly').forEach(button => {
            button.addEventListener('click', (e) => {
                const goalId = parseInt(e.currentTarget.dataset.id);
                const goalToUpdate = goals.find(goal => goal.id === goalId);
                if (goalToUpdate) {
                    goalToUpdate.currentSavings += goalToUpdate.weeklySavings;
                    renderGoals();
                }
            });
        });

        document.querySelectorAll('.btn-edit-weekly-amount').forEach(button => {
            button.addEventListener('click', (e) => {
                const goalId = parseInt(e.currentTarget.dataset.id);
                const goalToEdit = goals.find(goal => goal.id === goalId);
                if (goalToEdit) {
                    const newWeeklySavings = prompt('Enter new weekly savings amount:', goalToEdit.weeklySavings);
                    if (newWeeklySavings !== null) {
                        const parsedAmount = parseFloat(newWeeklySavings);
                        if (!isNaN(parsedAmount) && parsedAmount >= 0) {
                            goalToEdit.weeklySavings = parsedAmount;
                            renderGoals();
                        } else {
                            alert('Please enter a valid positive number for weekly savings.');
                        }
                    }
                }
            });
        });
    }

    // Financial Literacy Hub JavaScript (merged from literacy.js)
    const weeklySavingsInputLiteracy = document.getElementById('weeklySavingsLiteracy');
    const numWeeksInputLiteracy = document.getElementById('numWeeksLiteracy');
    const annualInterestRateInputLiteracy = document.getElementById('annualInterestRateLiteracy');
    const simulateSavingsBtnLiteracy = document.getElementById('simulateSavingsBtnLiteracy');
    const simulationResultDivLiteracy = document.getElementById('simulationResultLiteracy');

    simulateSavingsBtnLiteracy.addEventListener('click', () => {
        const weeklySavings = parseFloat(weeklySavingsInputLiteracy.value);
        const numWeeks = parseInt(numWeeksInputLiteracy.value);
        const annualInterestRate = parseFloat(annualInterestRateInputLiteracy.value);

        // Basic validation
        if (isNaN(weeklySavings) || weeklySavings < 0) {
            alert('Please enter a valid positive number for Weekly Savings.');
            return;
        }
        if (isNaN(numWeeks) || numWeeks <= 0) {
            alert('Please enter a valid positive number for Number of Weeks.');
            return;
        }
        if (isNaN(annualInterestRate) || annualInterestRate < 0) {
            alert('Please enter a valid positive number for Annual Interest Rate.');
            return;
        }

        let totalSavings = 0;
        let monthlyInterestRate = (annualInterestRate / 100) / 12; // Monthly interest rate
        let weeklyInterestRate = monthlyInterestRate / 4; // Approximate weekly interest rate

        for (let i = 0; i < numWeeks; i++) {
            totalSavings += weeklySavings;
            totalSavings *= (1 + weeklyInterestRate);
        }

        simulationResultDivLiteracy.innerHTML = `Projected Savings: ₹${totalSavings.toFixed(2)}`;
    });
}); 