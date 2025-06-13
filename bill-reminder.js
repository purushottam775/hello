document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const currentTheme = localStorage.getItem('theme') || 
        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    // Apply the theme
    document.body.setAttribute('data-theme', currentTheme);
    
    // Theme toggle click handler
    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    const billNameInput = document.getElementById('billName');
    const billAmountInput = document.getElementById('billAmount');
    const dueDateInput = document.getElementById('dueDate');
    const billCategorySelect = document.getElementById('billCategory');
    const billRecurrenceSelect = document.getElementById('billRecurrence');
    // const billNotesInput = document.getElementById('billNotes'); // Notes removed from HTML
    const addBillBtn = document.getElementById('addBillBtn');
    const billList = document.getElementById('billList');

    // Summary elements
    const pendingAmountSpan = document.getElementById('pendingAmount');
    const paidAmountSpan = document.getElementById('paidAmount');
    const categoryBreakdownDiv = document.getElementById('categoryBreakdown');
    const categoryChartCanvas = document.getElementById('categoryChart');
    let myChart; // To store the Chart.js instance

    // Filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categoryFilterSelect = document.getElementById('categoryFilter');

    // Quick action buttons
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');

    let bills = JSON.parse(localStorage.getItem('bills')) || [];
    let currentFilter = 'all'; // 'all', 'unpaid', 'overdue'
    let currentCategoryFilter = 'all'; // 'all' or specific category

    function saveBills() {
        localStorage.setItem('bills', JSON.stringify(bills));
    }

    function renderBills() {
        billList.innerHTML = '';

        let totalPending = 0;
        let totalPaid = 0;
        const categorySummary = {};

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const filteredBills = bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            const isUnpaid = !bill.isPaid;
            const isOverdue = !bill.isPaid && dueDate < now;

            // Apply filter based on currentFilter
            if (currentFilter === 'unpaid' && !isUnpaid) return false;
            if (currentFilter === 'overdue' && !isOverdue) return false;

            // Apply category filter
            if (currentCategoryFilter !== 'all' && bill.category !== currentCategoryFilter) return false;

            return true;
        });

        filteredBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (filteredBills.length === 0) {
            billList.innerHTML = '<li class="no-bills-message">No bills to display for this filter.</li>';
        } else {
            filteredBills.forEach(bill => {
                const li = document.createElement('li');
                li.className = 'bill-item';

                const dueDate = new Date(bill.dueDate);
                dueDate.setHours(0, 0, 0, 0);

                let statusClass = '';
                if (bill.isPaid) {
                    statusClass = 'bill-paid';
                } else if (dueDate < now) {
                    statusClass = 'bill-overdue';
                } else {
                    statusClass = 'bill-upcoming'; // New class for non-overdue, unpaid bills
                }
                li.classList.add(statusClass);

                // Calculate days remaining
                const diffTime = dueDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                let daysRemainingText = '';
                if (diffDays > 0) {
                    daysRemainingText = `${diffDays} days remaining`;
                } else if (diffDays === 0) {
                    daysRemainingText = 'Due Today';
                } else {
                    daysRemainingText = `Overdue by ${Math.abs(diffDays)} days`;
                }

                li.innerHTML = `
                    <div class="bill-item-details">
                        <strong>${bill.name}</strong>
                        <span>Amount: ₹${parseFloat(bill.amount).toFixed(2)}</span>
                        <div class="bill-item-tags">
                            <span class="bill-tag">${bill.recurrence || 'None'}</span>
                            <span class="bill-tag category">${bill.category || 'Uncategorized'}</span>
                        </div>
                        <span>Due: ${bill.dueDate}</span>
                        <span class="days-remaining">${daysRemainingText}</span>
                    </div>
                    <div class="bill-actions">
                        ${!bill.isPaid ? `<button class="mark-paid-btn" data-id="${bill.id}" title="Mark as Paid"><i class="fas fa-check-circle"></i></button>` : ''}
                        <button class="delete-bill-btn" data-id="${bill.id}" title="Delete Bill"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                billList.appendChild(li);

                // Calculate financial summary
                if (bill.isPaid) {
                    totalPaid += bill.amount;
                } else {
                    totalPending += bill.amount;
                }

                // Calculate category breakdown
                const category = bill.category || 'Uncategorized';
                categorySummary[category] = (categorySummary[category] || 0) + bill.amount;
            });
        }

        pendingAmountSpan.textContent = `₹${totalPending.toFixed(2)}`;
        paidAmountSpan.textContent = `₹${totalPaid.toFixed(2)}`;

        // Prepare data for Chart.js
        const chartLabels = Object.keys(categorySummary);
        const chartData = Object.values(categorySummary);
        const chartColors = ['#6C5CE7', '#00B894', '#FFCD48', '#D63031', '#74B9FF', '#FD79A8']; // Matching new theme colors

        if (myChart) {
            myChart.destroy(); // Destroy existing chart before creating a new one
        }

        myChart = new Chart(categoryChartCanvas, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'var(--text-light-gray)' // Legend text color
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += `₹${context.parsed.toFixed(2)}`;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        addEventListenersToButtons();
    }

    function addEventListenersToButtons() {
        document.querySelectorAll('.mark-paid-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const billId = event.currentTarget.dataset.id;
                markBillAsPaid(billId);
            });
        });

        document.querySelectorAll('.delete-bill-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const billId = event.currentTarget.dataset.id;
                deleteBill(billId);
            });
        });

        // Filter button event listeners
        filterButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                event.currentTarget.classList.add('active');
                currentFilter = event.currentTarget.dataset.filter;
                renderBills();
            });
        });

        categoryFilterSelect.addEventListener('change', (event) => {
            currentCategoryFilter = event.target.value;
            renderBills();
        });

        // Quick Actions event listeners
        exportDataBtn.addEventListener('click', exportData);
        importDataBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';
            fileInput.onchange = (e) => importData(e.target.files[0]);
            fileInput.click();
        });
    }

    function addBill() {
        const name = billNameInput.value.trim();
        const amount = billAmountInput.value;
        const dueDate = dueDateInput.value;
        const category = billCategorySelect.value;
        const recurrence = billRecurrenceSelect.value;

        if (!name || !amount || !dueDate || !category) {
            alert('Please fill in all required fields: Bill Name, Amount, Due Date, and Category.');
            return;
        }
        if (parseFloat(amount) <= 0) {
            alert('Bill amount must be a positive number.');
            return;
        }

        const newBill = {
            id: Date.now().toString(),
            name,
            amount: parseFloat(amount),
            dueDate,
            category,
            recurrence,
            isPaid: false
        };

        bills.push(newBill);
        saveBills();
        renderBills();
        clearForm();
    }

    function markBillAsPaid(id) {
        const billIndex = bills.findIndex(bill => bill.id === id);
        if (billIndex > -1) {
            bills[billIndex].isPaid = true;
            saveBills();
            renderBills();
        }
    }

    function deleteBill(id) {
        if (confirm('Are you sure you want to delete this bill?')) {
            bills = bills.filter(bill => bill.id !== id);
            saveBills();
            renderBills();
        }
    }

    function clearForm() {
        billNameInput.value = '';
        billAmountInput.value = '';
        dueDateInput.value = '';
        billCategorySelect.value = ''; // Clear category
        billRecurrenceSelect.value = 'None'; // Reset recurrence
        // billNotesInput.value = ''; // Notes removed from HTML
    }

    // Function to export bill data
    function exportData() {
        const billsData = JSON.parse(localStorage.getItem('bills') || '[]');
        const dataStr = JSON.stringify(billsData, null, 4);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `savvy_money_bills_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Bill data exported successfully!');
    }

    // Function to import bill data
    function importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedBills = JSON.parse(e.target.result);
                
                // Validate if imported data is an array (or suitable for bills)
                if (!Array.isArray(importedBills)) {
                    alert('Failed to import data: Invalid JSON format. Expected an array of bills.');
                    return;
                }

                const overwrite = confirm('Do you want to overwrite your existing bill data with the imported data? Click OK to overwrite, or Cancel to merge.');

                if (overwrite) {
                    bills = importedBills; // Overwrite
                    alert('Bill data imported and overwritten successfully!');
                } else {
                    // Merge data: filter out duplicates based on ID (if bills have IDs) or just append
                    const existingBillIds = new Set(bills.map(b => b.id));
                    const newBills = importedBills.filter(importedBill => !existingBillIds.has(importedBill.id));
                    bills = [...bills, ...newBills]; // Merge
                    alert('Bill data imported and merged successfully!');
                }
                saveBills();
                renderBills(); // Re-render bills after import
            } catch (error) {
                alert('Failed to import data: Invalid JSON file or format.');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    }

    // Initial render
    renderBills();

    // Event listeners
    addBillBtn.addEventListener('click', addBill);
}); 