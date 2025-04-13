// public/scripts/paymentPage.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('payment-form');
    const cardholderNameInput = document.getElementById('cardholderName');
    const cardNumberInput = document.getElementById('cardNumber');
    const expiryDateInput = document.getElementById('expiryDate');
    const cvvInput = document.getElementById('cvv');

    const cardholderNameError = document.getElementById('cardholderName-error');
    const cardNumberError = document.getElementById('cardNumber-error');
    const expiryDateError = document.getElementById('expiryDate-error');
    const cvvError = document.getElementById('cvv-error');

    // --- Luhn Algorithm Check ---
    const isValidLuhn = (numStr) => {
        let sum = 0;
        let alternate = false;
        for (let i = numStr.length - 1; i >= 0; i--) {
            let n = parseInt(numStr.charAt(i), 10);
            if (alternate) {
                n *= 2;
                if (n > 9) {
                    n = (n % 10) + 1;
                }
            }
            sum += n;
            alternate = !alternate;
        }
        return (sum % 10 === 0);
    };

    // --- Validation Functions ---
    const validateCardholderName = () => {
        const value = cardholderNameInput.value.trim();
        if (!value) {
            showError(cardholderNameInput, cardholderNameError, 'Cardholder name is required.');
            return false;
        }
        clearError(cardholderNameInput, cardholderNameError);
        return true;
    };

    const validateCardNumber = () => {
        const value = cardNumberInput.value.replace(/\s+/g, ''); // Remove spaces
        if (!value) {
            showError(cardNumberInput, cardNumberError, 'Card number is required.');
            return false;
        }
        if (!/^\d+$/.test(value)) {
             showError(cardNumberInput, cardNumberError, 'Card number must contain only digits.');
             return false;
        }
        // Basic length check (adjust based on supported card types)
        if (value.length < 13 || value.length > 19) {
             showError(cardNumberInput, cardNumberError, 'Card number must be between 13 and 19 digits.');
             return false;
        }
        if (!isValidLuhn(value)) {
            showError(cardNumberInput, cardNumberError, 'Invalid credit card number (Luhn check failed).');
            return false;
        }
        clearError(cardNumberInput, cardNumberError);
        return true;
    };

     const formatCardNumber = (event) => {
        let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        event.target.value = formattedValue.trim(); // Update input value
    };


    const validateExpiryDate = () => {
        const value = expiryDateInput.value.trim();
        if (!value) {
            showError(expiryDateInput, expiryDateError, 'Expiry date is required.');
            return false;
        }
        if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(value)) {
            showError(expiryDateInput, expiryDateError, 'Format must be MM/YY.');
            return false;
        }
        const [month, year] = value.split('/');
        const expiry = new Date(`20${year}`, month - 1); // Month is 0-indexed
        const now = new Date();
        now.setMonth(now.getMonth() -1); // Allow current month to be valid

        if (expiry < now) {
            showError(expiryDateInput, expiryDateError, 'Card has expired.');
            return false;
        }
        clearError(expiryDateInput, expiryDateError);
        return true;
    };

     const formatExpiryDate = (event) => {
        let value = event.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
         // Auto-add slash after 2 digits if user hasn't typed it
        if (value.length === 2 && event.inputType !== 'deleteContentBackward') {
             // Check if the previous value was shorter (i.e., user just typed the 2nd digit)
             if (event.target.value.length === 2) {
                 value += '/';
             }
        }
        event.target.value = value;
    };


    const validateCVV = () => {
        const value = cvvInput.value.trim();
        if (!value) {
            showError(cvvInput, cvvError, 'CVV is required.');
            return false;
        }
        if (!/^\d{3,4}$/.test(value)) {
            showError(cvvInput, cvvError, 'CVV must be 3 or 4 digits.');
            return false;
        }
        clearError(cvvInput, cvvError);
        return true;
    };

    // --- Helper Functions ---
    const showError = (inputElement, errorElement, message) => {
        inputElement.classList.add('invalid');
        errorElement.textContent = message;
    };

    const clearError = (inputElement, errorElement) => {
        inputElement.classList.remove('invalid');
        errorElement.textContent = '';
    };

    // --- Event Listeners ---
    cardholderNameInput.addEventListener('blur', validateCardholderName);
    cardNumberInput.addEventListener('blur', validateCardNumber);
    cardNumberInput.addEventListener('input', formatCardNumber); // Format as user types
    expiryDateInput.addEventListener('blur', validateExpiryDate);
    expiryDateInput.addEventListener('input', formatExpiryDate); // Format MM/YY
    cvvInput.addEventListener('blur', validateCVV);

    // --- Form Submission ---
    form.addEventListener('submit', (event) => {
        // Run all validations
        const isNameValid = validateCardholderName();
        const isCardValid = validateCardNumber();
        const isExpiryValid = validateExpiryDate();
        const isCvvValid = validateCVV();

        // If any validation fails, prevent submission
        if (!isNameValid || !isCardValid || !isExpiryValid || !isCvvValid) {
            event.preventDefault(); // Stop form submission
            // Optionally focus the first invalid field
            if (!isNameValid) cardholderNameInput.focus();
            else if (!isCardValid) cardNumberInput.focus();
            else if (!isExpiryValid) expiryDateInput.focus();
            else if (!isCvvValid) cvvInput.focus();
        }
        // If all valid, the form will submit naturally
        // Consider adding a loading state to the button here
    });
});
