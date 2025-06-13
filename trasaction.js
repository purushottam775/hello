document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transactionForm');
    const transactionTableBody = document.getElementById('transactionTableBody');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    const transactionModal = document.getElementById('transactionModal');
    const closeModalBtn = document.querySelector('.close-button');
    const searchInput = document.getElementById('searchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const printReportBtn = document.getElementById('printReportBtn');
    const clearSearchIcon = document.querySelector('.search-bar .clear-icon');
    const themeToggleBtn = document.getElementById('themeToggle'); // Get the theme toggle button
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');

    // Ensure modal is hidden on load
    transactionModal.style.display = 'none';

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let currentPage = 1;
    const rowsPerPage = 10;
    let currentSortColumn = 'date';
    let currentSortDirection = 'desc';

    // Theme toggle functionality
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.body.classList.add(currentTheme);
        if (currentTheme === 'dark-mode') {
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    } else {
        // Default to light mode and save it
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });

    // Modal functionality
    addTransactionBtn.addEventListener('click', () => {
        transactionModal.style.display = 'flex';
        document.getElementById('transactionId').value = '';
        transactionForm.reset();
    });

    closeModalBtn.addEventListener('click', () => {
        transactionModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == transactionModal) {
            transactionModal.style.display = 'none';
        }
    });

    // Save/Edit Transaction
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = document.getElementById('transactionId').value;
        const date = document.getElementById('transactionDate').value;
        const description = document.getElementById('transactionDescription').value;
        const category = document.getElementById('transactionCategory').value;
        const type = document.getElementById('transactionType').value;
        const amount = parseFloat(document.getElementById('transactionAmount').value);

        if (id) {
            // Edit existing transaction
            const index = transactions.findIndex(t => t.id === id);
            if (index !== -1) {
                transactions[index] = { id, date, description, category, type, amount };
            }
        } else {
            // Add new transaction
            const newTransaction = {
                id: Date.now().toString(), // Simple unique ID
                date,
                description,
                category,
                type,
                amount
            };
            transactions.push(newTransaction);
        }

        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderTransactions();
        updateSummary();
        transactionModal.style.display = 'none';
    });

    // Render Transactions
    function renderTransactions() {
        const filteredAndSortedTransactions = getFilteredAndSortedTransactions();
        const totalPages = Math.ceil(filteredAndSortedTransactions.length / rowsPerPage);
        currentPage = Math.min(currentPage, totalPages || 1);
        currentPage = Math.max(currentPage, 1);

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const transactionsToDisplay = filteredAndSortedTransactions.slice(startIndex, endIndex);

        transactionTableBody.innerHTML = '';

        if (transactionsToDisplay.length === 0) {
            transactionTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No transactions found.</td></tr>';
            pageInfo.textContent = 'Page 0 of 0';
            prevPageBtn.disabled = true;
            nextPageBtn.disabled = true;
            return;
        }

        transactionsToDisplay.forEach(transaction => {
            const row = transactionTableBody.insertRow();
            row.innerHTML = `
                <td>${transaction.date}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${transaction.type}-type">${transaction.type === 'income' ? 'Income' : 'Expense'}</td>
                <td class="amount ${transaction.type === 'income' ? 'income-amount' : 'expense-amount'}">₹${transaction.amount.toFixed(2)}</td>
                <td class="actions-buttons">
                    <button class="edit-btn" data-id="${transaction.id}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-id="${transaction.id}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
        });

        updatePaginationControls(totalPages);
    }

    function updatePaginationControls(totalPages) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // Edit Transaction
    transactionTableBody.addEventListener('click', (e) => {
        if (e.target.closest('.edit-btn')) {
            const id = e.target.closest('.edit-btn').dataset.id;
            const transaction = transactions.find(t => t.id === id);
            if (transaction) {
                document.getElementById('transactionId').value = transaction.id;
                document.getElementById('transactionDate').value = transaction.date;
                document.getElementById('transactionDescription').value = transaction.description;
                document.getElementById('transactionCategory').value = transaction.category;
                document.getElementById('transactionType').value = transaction.type;
                document.getElementById('transactionAmount').value = transaction.amount;
                transactionModal.style.display = 'flex';
            }
        }

        // Delete Transaction
        if (e.target.closest('.delete-btn')) {
            const id = e.target.closest('.delete-btn').dataset.id;
            if (confirm('Are you sure you want to delete this transaction?')) {
                transactions = transactions.filter(t => t.id !== id);
                localStorage.setItem('transactions', JSON.stringify(transactions));
                renderTransactions();
                updateSummary();
            }
        }
    });

    // Update Summary
    function updateSummary() {
        const currentMonthTransactions = getTransactionsForCurrentMonth();
        const lastMonthTransactions = getTransactionsForLastMonth();

        const totalIncome = currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const netBalance = totalIncome - totalExpenses;

        const lastMonthIncome = lastMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const lastMonthExpenses = lastMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const lastMonthBalance = lastMonthIncome - lastMonthExpenses;

        document.getElementById('totalIncome').textContent = `₹${totalIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
        document.getElementById('netBalance').textContent = `₹${netBalance.toFixed(2)}`;

        updateComparison('incomeComparison', totalIncome, lastMonthIncome, 'increase');
        updateComparison('expensesComparison', totalExpenses, lastMonthExpenses, 'decrease');
        updateComparison('balanceComparison', netBalance, lastMonthBalance, 'increase');
    }

    function updateComparison(elementId, currentAmount, lastMonthAmount, type) {
        const element = document.getElementById(elementId);
        let percentageChange = 0;
        let direction = 'same'; // 'up', 'down', 'same'

        if (lastMonthAmount !== 0) {
            percentageChange = ((currentAmount - lastMonthAmount) / lastMonthAmount) * 100;
        } else if (currentAmount > 0) {
            percentageChange = 100; // Infinite increase from zero
        } else if (currentAmount < 0) {
            percentageChange = -100; // Infinite decrease from zero
        }

        if (percentageChange > 0.01) {
            direction = 'up';
        } else if (percentageChange < -0.01) {
            direction = 'down';
        }

        let iconClass = 'fa-chart-line';
        let comparisonText = '';

        if (direction === 'up') {
            iconClass = 'fa-arrow-up';
            comparisonText = `${Math.abs(percentageChange).toFixed(0)}% vs last month`;
            element.style.color = type === 'increase' ? '#28a745' : '#dc3545';
        } else if (direction === 'down') {
            iconClass = 'fa-arrow-down';
            comparisonText = `${Math.abs(percentageChange).toFixed(0)}% vs last month`;
            element.style.color = type === 'increase' ? '#dc3545' : '#28a745';
        } else {
            iconClass = 'fa-minus';
            comparisonText = `0% vs last month`;
            element.style.color = 'var(--light-text-color)';
        }

        element.innerHTML = `<i class="fas ${iconClass}"></i> ${comparisonText}`;
    }

    // Filtering
    let activeTimeFilter = 'today';
    let activeTypeFilter = ''; // 'income', 'expenses', or '' for all
    let currentSearchQuery = '';

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Clear date inputs when a time filter is selected
            fromDateInput.value = '';
            toDateInput.value = '';

            if (button.dataset.timeFilter) {
                activeTimeFilter = button.dataset.timeFilter;
                activeTypeFilter = ''; // Reset type filter when time filter is selected
                // Deactivate type filter buttons
                document.querySelector('.filter-btn[data-type-filter="income"]').classList.remove('active');
                document.querySelector('.filter-btn[data-type-filter="expenses"]').classList.remove('active');

            } else if (button.dataset.typeFilter) {
                activeTypeFilter = button.dataset.typeFilter;
                activeTimeFilter = ''; // Reset time filter when type filter is selected
                // Deactivate time filter buttons
                document.querySelector('.filter-btn[data-time-filter="today"]').classList.remove('active');
                document.querySelector('.filter-btn[data-time-filter="this-week"]').classList.remove('active');
                document.querySelector('.filter-btn[data-time-filter="this-month"]').classList.remove('active');
            }
            currentPage = 1;
            renderTransactions();
        });
    });

    // Search functionality
    searchInput.addEventListener('keyup', () => {
        currentSearchQuery = searchInput.value.toLowerCase();
        currentPage = 1;
        renderTransactions();
    });

    fromDateInput.addEventListener('change', () => {
        // Deactivate all time filter buttons when a date is selected
        document.querySelectorAll('.filter-btn[data-time-filter]').forEach(btn => btn.classList.remove('active'));
        activeTimeFilter = ''; // Clear active time filter
        currentPage = 1;
        renderTransactions();
    });
    toDateInput.addEventListener('change', () => {
        // Deactivate all time filter buttons when a date is selected
        document.querySelectorAll('.filter-btn[data-time-filter]').forEach(btn => btn.classList.remove('active'));
        activeTimeFilter = ''; // Clear active time filter
        currentPage = 1;
        renderTransactions();
    });

    clearSearchIcon.addEventListener('click', () => {
        searchInput.value = '';
        fromDateInput.value = '';
        toDateInput.value = '';
        currentSearchQuery = '';
        activeTimeFilter = 'today'; // Reset to 'Today' filter
        // Reactivate 'Today' filter button
        document.querySelector('.filter-btn[data-time-filter="today"]').classList.add('active');
        document.querySelector('.filter-btn[data-type-filter="income"]').classList.remove('active');
        document.querySelector('.filter-btn[data-type-filter="expenses"]').classList.remove('active');
        currentPage = 1;
        renderTransactions();
    });

    function getFilteredAndSortedTransactions() {
        let filtered = [...transactions];

        // Apply date range filter first if set
        const fromDate = fromDateInput.value ? new Date(fromDateInput.value) : null;
        const toDate = toDateInput.value ? new Date(toDateInput.value) : null;

        if (fromDate) {
            filtered = filtered.filter(t => {
                const tDate = new Date(t.date);
                return tDate >= fromDate;
            });
        }
        if (toDate) {
            const adjustedToDate = new Date(toDate);
            adjustedToDate.setDate(adjustedToDate.getDate() + 1); // Include the entire end day
            filtered = filtered.filter(t => {
                const tDate = new Date(t.date);
                return tDate < adjustedToDate;
            });
        }

        // Apply time filter (only if date range filters are NOT set)
        if (!fromDate && !toDate) {
            const now = new Date();
            switch (activeTimeFilter) {
                case 'today':
                    filtered = filtered.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate.getDate() === now.getDate() &&
                               tDate.getMonth() === now.getMonth() &&
                               tDate.getFullYear() === now.getFullYear();
                    });
                    break;
                case 'this-week':
                    // Get the first day of the current week (Sunday)
                    const firstDayOfWeek = new Date(now);
                    firstDayOfWeek.setDate(now.getDate() - now.getDay());
                    firstDayOfWeek.setHours(0, 0, 0, 0); // Set to beginning of the day

                    // Get the last day of the current week (Saturday)
                    const lastDayOfWeek = new Date(firstDayOfWeek);
                    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
                    lastDayOfWeek.setHours(23, 59, 59, 999); // Set to end of the day

                    filtered = filtered.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= firstDayOfWeek && tDate <= lastDayOfWeek;
                    });
                    break;
                case 'this-month':
                    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
                    lastDayOfMonth.setHours(23, 59, 59, 999); // Set to end of the day

                    filtered = filtered.filter(t => {
                        const tDate = new Date(t.date);
                        return tDate >= firstDayOfMonth && tDate <= lastDayOfMonth;
                    });
                    break;
            }
        }


        // Apply type filter
        if (activeTypeFilter === 'income') {
            filtered = filtered.filter(t => t.type === 'income');
        } else if (activeTypeFilter === 'expenses') {
            filtered = filtered.filter(t => t.type === 'expense');
        }

        // Apply search query
        if (currentSearchQuery) {
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(currentSearchQuery) ||
                t.category.toLowerCase().includes(currentSearchQuery)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let valA, valB;

            switch (currentSortColumn) {
                case 'date':
                    valA = new Date(a.date);
                    valB = new Date(b.date);
                    break;
                case 'description':
                case 'category':
                case 'type':
                    valA = a[currentSortColumn].toLowerCase();
                    valB = b[currentSortColumn].toLowerCase();
                    break;
                case 'amount':
                    valA = a.amount;
                    valB = b.amount;
                    break;
            }

            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }

    // Sorting
    document.querySelectorAll('.transaction-table th').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.textContent.trim().split(' ')[0].toLowerCase(); // Get column name from text
            if (column === 'actions') return; // Don't sort actions column

            // Remove sort indicators from other columns
            document.querySelectorAll('.transaction-table th').forEach(th => {
                if (th !== header) {
                    th.classList.remove('asc', 'desc');
                }
            });

            if (currentSortColumn === column) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = column;
                currentSortDirection = 'asc'; // Default to ascending when changing column
            }
            header.classList.toggle('asc', currentSortDirection === 'asc');
            header.classList.toggle('desc', currentSortDirection === 'desc');

            renderTransactions();
        });
    });


    // Pagination controls
    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTransactions();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        const filteredAndSortedTransactions = getFilteredAndSortedTransactions();
        const totalPages = Math.ceil(filteredAndSortedTransactions.length / rowsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTransactions();
        }
    });

    // Helper functions for date comparison
    function getTransactionsForCurrentMonth() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastDayOfMonth.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= firstDayOfMonth && tDate <= lastDayOfMonth;
        });
    }

    function getTransactionsForLastMonth() {
        const now = new Date();
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        lastDayOfLastMonth.setHours(23, 59, 59, 999);

        return transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate >= firstDayOfLastMonth && tDate <= lastDayOfLastMonth;
        });
    }


    // Export to CSV
    exportCsvBtn.addEventListener('click', () => {
        const filteredTransactions = getFilteredAndSortedTransactions();
        if (filteredTransactions.length === 0) {
            alert('No transactions to export.');
            return;
        }

        let csvContent = "Date,Description,Category,Type,Amount\n";
        filteredTransactions.forEach(t => {
            csvContent += `${t.date},"${t.description}","${t.category}",${t.type},${t.amount.toFixed(2)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'transactions.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Print Report
    printReportBtn.addEventListener('click', () => {
        const printWindow = window.open('', '_blank');
        const filteredTransactions = getFilteredAndSortedTransactions();

        let tableHtml = `
            <h1>Transaction Report</h1>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .income-amount { color: #28a745; }
                .expense-amount { color: #dc3545; }
            </style>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (filteredTransactions.length === 0) {
            tableHtml += '<tr><td colspan="5" style="text-align: center;">No transactions to print.</td></tr>';
        } else {
            filteredTransactions.forEach(t => {
                tableHtml += `
                    <tr>
                        <td>${t.date}</td>
                        <td>${t.description}</td>
                        <td>${t.category}</td>
                        <td>${t.type === 'income' ? 'Income' : 'Expense'}</td>
                        <td class="${t.type}-amount">₹${t.amount.toFixed(2)}</td>
                    </tr>
                `;
            });
        }

        tableHtml += `
                </tbody>
            </table>
        `;

        printWindow.document.write(tableHtml);
        printWindow.document.close();
        printWindow.print();
    });

    // Initial render and summary update
    renderTransactions();
    updateSummary();
}); 