document.addEventListener('DOMContentLoaded', () => {
    const chartTimePeriodSelect = document.getElementById('chartTimePeriod');

    let allTransactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Chart instances
    let expensesByCategoryChart;
    let incomeExpensesChart;
    let topCategoriesChart;
    let incomeByCategoryChart;
    let monthlyNetBalanceChart;

    function getTransactionsForPeriod(period) {
        const now = new Date();
        let filteredTransactions = [...allTransactions];

        switch (period) {
            case '6M':
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(now.getMonth() - 6);
                filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= sixMonthsAgo);
                break;
            case '1Y':
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                filteredTransactions = filteredTransactions.filter(t => new Date(t.date) >= oneYearAgo);
                break;
            case 'All':
                // No filtering needed for all time
                break;
            case 'this-month':
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                lastDayOfMonth.setHours(23, 59, 59, 999);
                filteredTransactions = filteredTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= firstDayOfMonth && tDate <= lastDayOfMonth;
                });
                break;
            case 'last-month':
                const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                lastDayOfLastMonth.setHours(23, 59, 59, 999);
                filteredTransactions = filteredTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= firstDayOfLastMonth && tDate <= lastDayOfLastMonth;
                });
                break;
            case 'this-year':
                const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
                const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
                lastDayOfYear.setHours(23, 59, 59, 999);
                filteredTransactions = filteredTransactions.filter(t => {
                    const tDate = new Date(t.date);
                    return tDate >= firstDayOfYear && tDate <= lastDayOfYear;
                });
                break;
            case 'all-time':
                // No filtering needed for all time
                break;
        }
        return filteredTransactions;
    }

    function renderAllCharts() {
        const selectedPeriod = chartTimePeriodSelect.value;
        const transactionsForPeriod = getTransactionsForPeriod(selectedPeriod);

        renderExpensesByCategoryChart(transactionsForPeriod);
        renderIncomeExpensesChart(transactionsForPeriod);
        renderTopCategoriesChart(transactionsForPeriod);
        renderIncomeByCategoryChart(transactionsForPeriod);
        renderMonthlyNetBalanceChart(transactionsForPeriod);
    }

    function renderExpensesByCategoryChart(transactions) {
        if (expensesByCategoryChart) expensesByCategoryChart.destroy();

        const expenses = transactions.filter(t => t.type === 'expense');
        const categoryMap = {};
        expenses.forEach(e => {
            categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
        });

        const labels = Object.keys(categoryMap);
        const data = Object.values(categoryMap);
        const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`);

        const ctx = document.getElementById('expensesByCategoryChart').getContext('2d');
        expensesByCategoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        }
                    },
                    title: {
                        display: false,
                        text: 'Expenses by Category'
                    }
                }
            }
        });
    }

    function renderIncomeExpensesChart(transactions) {
        if (incomeExpensesChart) incomeExpensesChart.destroy();

        // Group transactions by month
        const monthlyData = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                monthlyData[monthYear].income += t.amount;
            } else {
                monthlyData[monthYear].expense += t.amount;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const incomeData = sortedMonths.map(month => monthlyData[month].income);
        const expenseData = sortedMonths.map(month => monthlyData[month].expense);

        const ctx = document.getElementById('incomeExpensesChart').getContext('2d');
        incomeExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: '#dc3545',
                        borderColor: '#dc3545',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        }
                    },
                    title: {
                        display: false,
                        text: 'Income vs. Expenses (Monthly)'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--light-text-color'),
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color'),
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--light-text-color'),
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color'),
                        }
                    }
                }
            }
        });
    }

    function renderTopCategoriesChart(transactions) {
        if (topCategoriesChart) topCategoriesChart.destroy();

        const allCategories = {};
        transactions.forEach(t => {
            allCategories[t.category] = (allCategories[t.category] || 0) + t.amount;
        });

        // Convert to array, sort, and take top N
        const sortedCategories = Object.entries(allCategories)
            .sort(([,a],[,b]) => b - a)
            .slice(0, 5); // Show top 5

        const labels = sortedCategories.map(item => item[0]);
        const data = sortedCategories.map(item => item[1]);
        const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`);

        const ctx = document.getElementById('topCategoriesChart').getContext('2d');
        topCategoriesChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        }
                    },
                    title: {
                        display: false,
                        text: 'Top Categories'
                    }
                }
            }
        });
    }

    function renderIncomeByCategoryChart(transactions) {
        if (incomeByCategoryChart) incomeByCategoryChart.destroy();

        const incomes = transactions.filter(t => t.type === 'income');
        const categoryMap = {};
        incomes.forEach(i => {
            categoryMap[i.category] = (categoryMap[i.category] || 0) + i.amount;
        });

        const labels = Object.keys(categoryMap);
        const data = Object.values(categoryMap);
        const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`);

        const ctx = document.getElementById('incomeByCategoryChart').getContext('2d');
        incomeByCategoryChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        }
                    },
                    title: {
                        display: false,
                        text: 'Income by Category'
                    }
                }
            }
        });
    }

    function renderMonthlyNetBalanceChart(transactions) {
        if (monthlyNetBalanceChart) monthlyNetBalanceChart.destroy();

        const monthlyData = {};
        transactions.forEach(t => {
            const date = new Date(t.date);
            const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0 };
            }
            if (t.type === 'income') {
                monthlyData[monthYear].income += t.amount;
            } else {
                monthlyData[monthYear].expense += t.amount;
            }
        });

        const sortedMonths = Object.keys(monthlyData).sort();
        const netBalanceData = sortedMonths.map(month => monthlyData[month].income - monthlyData[month].expense);

        const ctx = document.getElementById('monthlyNetBalanceChart').getContext('2d');
        monthlyNetBalanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Net Balance',
                        data: netBalanceData,
                        borderColor: '#4B0082', // Primary color
                        backgroundColor: 'rgba(75, 0, 130, 0.2)',
                        fill: true,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        }
                    },
                    title: {
                        display: false,
                        text: 'Monthly Net Balance'
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--light-text-color'),
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color'),
                        }
                    },
                    y: {
                        beginAtZero: false, // Net balance can be negative
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--light-text-color'),
                        },
                        grid: {
                            color: getComputedStyle(document.body).getPropertyValue('--border-color'),
                        }
                    }
                }
            }
        });
    }

    // Event listener for main time period selection (for other charts)
    chartTimePeriodSelect.addEventListener('change', renderAllCharts);

    // Initial render of other charts
    renderAllCharts();

    // Listen for theme changes from main script to update chart text colors
    const observer = new MutationObserver(() => {
        if (expensesByCategoryChart) expensesByCategoryChart.update();
        if (incomeExpensesChart) incomeExpensesChart.update();
        if (topCategoriesChart) topCategoriesChart.update();
        if (incomeByCategoryChart) incomeByCategoryChart.update();
        if (monthlyNetBalanceChart) monthlyNetBalanceChart.update();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}); 