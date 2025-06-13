document.addEventListener('DOMContentLoaded', () => {
    const fromCurrencySelect = document.getElementById('fromCurrency');
    const toCurrencySelect = document.getElementById('toCurrency');
    const amountInput = document.getElementById('amount');
    const swapBtn = document.getElementById('swapBtn');
    const convertBtn = document.getElementById('convertBtn');
    const conversionResultBox = document.getElementById('conversionResultBox');
    const themeToggle = document.getElementById('themeToggle');

    const CURRENCY_API_URL = 'https://open.er-api.com/v6/latest/';
    let currencyRates = {}; // Store fetched exchange rates

    // Clear result display on initial load
    conversionResultBox.textContent = '';

    // Theme handling
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    async function fetchCurrencies() {
        try {
            const response = await fetch(`${CURRENCY_API_URL}USD`); // Fetch initial rates with USD as base
            const data = await response.json();
            if (data.result === 'success') {
                currencyRates = data.rates;
                const currencies = Object.keys(currencyRates);
                populateCurrencySelect(fromCurrencySelect, currencies);
                populateCurrencySelect(toCurrencySelect, currencies);
                // Set default values
                fromCurrencySelect.value = 'USD';
                toCurrencySelect.value = 'INR'; // Assuming INR as a common target
            } else {
                console.error('Error fetching currencies:', data['error-type']);
                conversionResultBox.textContent = 'Could not fetch currency data.';
            }
        } catch (error) {
            console.error('Network error fetching currencies:', error);
            conversionResultBox.textContent = 'Network error. Check connection.';
        }
    }

    function populateCurrencySelect(selectElement, currencies) {
        selectElement.innerHTML = ''; // Clear existing options
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.textContent = currency;
            selectElement.appendChild(option);
        });
    }

    function convertCurrency() {
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        const amount = parseFloat(amountInput.value);

        if (isNaN(amount) || amount <= 0) {
            conversionResultBox.textContent = 'Please enter a valid positive amount.';
            return;
        }

        if (fromCurrency === toCurrency) {
            conversionResultBox.textContent = `${amount.toFixed(2)} ${fromCurrency} = ${amount.toFixed(2)} ${toCurrency}`;
            return;
        }

        const rateFromUSD = currencyRates[fromCurrency];
        const rateToUSD = currencyRates[toCurrency];

        if (rateFromUSD && rateToUSD) {
            const convertedAmount = (amount / rateFromUSD) * rateToUSD;
            conversionResultBox.textContent = `${amount.toFixed(2)} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`;
        } else {
            console.error(`Missing exchange rate for ${fromCurrency} or ${toCurrency}`);
            conversionResultBox.textContent = 'Exchange rate not available.';
        }
    }

    swapBtn.addEventListener('click', () => {
        const tempCurrency = fromCurrencySelect.value;
        fromCurrencySelect.value = toCurrencySelect.value;
        toCurrencySelect.value = tempCurrency;
        convertCurrency(); // Re-convert after swapping
    });

    convertBtn.addEventListener('click', convertCurrency);

    // Initial fetch of currencies when the script loads
    fetchCurrencies();
}); 