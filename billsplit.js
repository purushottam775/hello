const billForm = document.getElementById('billForm');
const splitMethod = document.getElementById('splitMethod');
const customSplitInputs = document.getElementById('customSplitInputs');
const owedSummary = document.getElementById('owedSummary');
const paymentTracking = document.getElementById('paymentTracking');
const settleUpBtn = document.getElementById('settleUpBtn');
const expenseHistory = document.getElementById('expenseHistory');
const clearAllBtn = document.getElementById('clearAllBtn');
const numParticipantsInput = document.getElementById('numParticipants');
const participantFields = document.getElementById('participantFields');

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
    localStorage.setItem('billsplitTheme', mode);
}
const savedTheme = localStorage.getItem('billsplitTheme');
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

let currentBill = null;
let history = JSON.parse(localStorage.getItem('billHistory') || '[]');

function renderParticipantFields() {
    participantFields.innerHTML = '';
    const n = parseInt(numParticipantsInput.value);
    if (isNaN(n) || n < 2) return;
    for (let i = 1; i <= n; i++) {
        participantFields.innerHTML += `<input type="text" class="participant-name" placeholder="Participant ${i} Name (optional)" data-index="${i-1}" style="width:90%;margin-bottom:0.5rem;">`;
    }
    renderCustomSplitInputs();
}
numParticipantsInput.addEventListener('input', renderParticipantFields);

function getParticipantNames() {
    const n = parseInt(numParticipantsInput.value);
    if (isNaN(n) || n < 2) return [];
    const names = Array.from(document.querySelectorAll('.participant-name')).map((input, i) => input.value.trim() || `Person ${i+1}`);
    return names;
}

function renderCustomSplitInputs() {
    customSplitInputs.innerHTML = '';
    if (splitMethod.value !== 'custom') return;
    const names = getParticipantNames();
    names.forEach((name, i) => {
        customSplitInputs.innerHTML += `
            <div class="custom-split-row">
                <label>${name}:</label>
                <input type="number" min="0" step="0.01" placeholder="Amount" class="custom-share" data-name="${name}">
            </div>
        `;
    });
}
splitMethod.addEventListener('change', () => {
    if (splitMethod.value === 'custom') {
        customSplitInputs.style.display = '';
        renderCustomSplitInputs();
    } else {
        customSplitInputs.style.display = 'none';
        customSplitInputs.innerHTML = '';
    }
});
participantFields.addEventListener('input', () => {
    if (splitMethod.value === 'custom') renderCustomSplitInputs();
});

billForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('billDesc').value.trim();
    const amount = parseFloat(document.getElementById('billAmount').value);
    const names = getParticipantNames();
    if (names.length < 2) {
        owedSummary.innerHTML = '<span class="unpaid">At least 2 participants required.</span>';
        return;
    }
    let split = {};
    if (splitMethod.value === 'equal') {
        const perPerson = +(amount / names.length).toFixed(2);
        names.forEach(name => split[name] = perPerson);
    } else {
        let totalCustom = 0;
        const customShares = Array.from(document.querySelectorAll('.custom-share'));
        customShares.forEach(input => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) totalCustom += val;
        });
        if (Math.abs(totalCustom - amount) > 0.01) {
            owedSummary.innerHTML = '<span class="unpaid">Custom shares must sum to total amount.</span>';
            return;
        }
        customShares.forEach(input => {
            const name = input.getAttribute('data-name');
            split[name] = parseFloat(input.value) || 0;
        });
    }
    currentBill = {
        desc,
        amount,
        participants: names,
        split,
        paid: {},
        settled: false,
        date: new Date().toLocaleString()
    };
    names.forEach(name => currentBill.paid[name] = false);
    renderOwedSummary();
    renderPaymentTracking();
    settleUpBtn.style.display = '';
});

function renderOwedSummary() {
    if (!currentBill) return;
    let html = `<h3>Owed Amounts</h3><ul style='list-style:none;padding:0;'>`;
    for (const name of currentBill.participants) {
        html += `<li>${name}: <strong>₹${currentBill.split[name].toFixed(2)}</strong></li>`;
    }
    html += '</ul>';
    owedSummary.innerHTML = html;
}

function renderPaymentTracking() {
    if (!currentBill) return;
    let html = `<h3>Payment Tracking</h3><ul style='list-style:none;padding:0;'>`;
    for (const name of currentBill.participants) {
        html += `<li><label><input type='checkbox' class='paidCheck' data-name='${name}' ${currentBill.paid[name] ? 'checked' : ''}> ${name} <span class='${currentBill.paid[name] ? 'paid' : 'unpaid'}'>${currentBill.paid[name] ? 'Paid' : 'Unpaid'}</span></label></li>`;
    }
    html += '</ul>';
    paymentTracking.innerHTML = html;
    document.querySelectorAll('.paidCheck').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const n = e.target.getAttribute('data-name');
            currentBill.paid[n] = e.target.checked;
            renderPaymentTracking();
        });
    });
}

settleUpBtn.addEventListener('click', () => {
    if (!currentBill) return;
    if (Object.values(currentBill.paid).every(v => v)) {
        currentBill.settled = true;
        history.unshift(currentBill);
        localStorage.setItem('billHistory', JSON.stringify(history));
        owedSummary.innerHTML = '<span class="paid">Bill settled and saved to history!</span>';
        paymentTracking.innerHTML = '';
        settleUpBtn.style.display = 'none';
        renderExpenseHistory();
        currentBill = null;
    } else {
        owedSummary.innerHTML = '<span class="unpaid">All participants must pay before settling up.</span>';
    }
});

clearAllBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all bill history?')) {
        history = [];
        localStorage.removeItem('billHistory');
        renderExpenseHistory();
    }
});

function deleteBill(idx) {
    history.splice(idx, 1);
    localStorage.setItem('billHistory', JSON.stringify(history));
    renderExpenseHistory();
}

function renderExpenseHistory() {
    if (!history.length) {
        expenseHistory.innerHTML = '<em>No shared bills yet.</em>';
        return;
    }
    let html = '<ul style="list-style:none;padding:0;">';
    history.forEach((bill, idx) => {
        html += `<li style="margin-bottom:1rem;">
            <strong>${bill.desc}</strong> <span style="color:#aaa;">(${bill.date})</span><br>
            Amount: ₹${bill.amount.toFixed(2)}<br>
            Participants: ${bill.participants.join(', ')}<br>
            Split: ${bill.participants.map(n => `${n}: ₹${bill.split[n].toFixed(2)}`).join(', ')}<br>
            Status: <span class='${bill.settled ? 'paid' : 'unpaid'}'>${bill.settled ? 'Settled' : 'Unsettled'}</span>
            <button class="delete-bill-btn" onclick="deleteBill(${idx})"><i class="fas fa-trash"></i> Delete</button>
        </li>`;
    });
    html += '</ul>';
    expenseHistory.innerHTML = html;
}

// Expose deleteBill globally for inline onclick
window.deleteBill = deleteBill;

renderExpenseHistory(); 