// Form Validation Functions

document.addEventListener('DOMContentLoaded', function() {
    // Add validation to all forms with 'validate' class
    const forms = document.querySelectorAll('form.validate');
    forms.forEach(form => {
        form.addEventListener('submit', validateForm);
    });
    
    // Add input validation on blur
    const inputs = document.querySelectorAll('form.validate input, form.validate select, form.validate textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });
});

// Validate an entire form
function validateForm(e) {
    const form = e.target;
    let isValid = true;
    
    // Validate each input
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // If not valid, prevent form submission
    if (!isValid) {
        e.preventDefault();
    }
    
    return isValid;
}

// Validate a single input
function validateInput(input) {
    // Skip inputs without validation
    if (!input.hasAttribute('required') && !input.getAttribute('data-validate')) {
        return true;
    }
    
    // Get validation type
    let validationType = input.getAttribute('data-validate') || input.type;
    
    // Clear previous error messages
    clearError(input);
    
    // Check if empty
    if (input.hasAttribute('required') && isEmpty(input)) {
        showError(input, 'This field is required');
        return false;
    }
    
    // Skip further validation if empty and not required
    if (isEmpty(input) && !input.hasAttribute('required')) {
        return true;
    }
    
    // Validate based on type
    let isValid = true;
    switch (validationType) {
        case 'email':
            isValid = validateEmail(input);
            break;
        case 'tel':
            isValid = validatePhone(input);
            break;
        case 'number':
            isValid = validateNumber(input);
            break;
        case 'date':
            isValid = validateDate(input);
            break;
        case 'password':
            isValid = validatePassword(input);
            break;
        case 'confirm-password':
            isValid = validateConfirmPassword(input);
            break;
    }
    
    return isValid;
}

// Check if input is empty
function isEmpty(input) {
    return input.value.trim() === '';
}

// Validate email
function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value.trim())) {
        showError(input, 'Please enter a valid email address');
        return false;
    }
    return true;
}

// Validate phone number
function validatePhone(input) {
    const phoneRegex = /^\+?[\d\s\(\)-]{8,20}$/;
    if (!phoneRegex.test(input.value.trim())) {
        showError(input, 'Please enter a valid phone number');
        return false;
    }
    return true;
}

// Validate number
function validateNumber(input) {
    const min = input.getAttribute('min');
    const max = input.getAttribute('max');
    const value = parseFloat(input.value);
    
    if (isNaN(value)) {
        showError(input, 'Please enter a valid number');
        return false;
    }
    
    if (min !== null && value < parseFloat(min)) {
        showError(input, `Value must be greater than or equal to ${min}`);
        return false;
    }
    
    if (max !== null && value > parseFloat(max)) {
        showError(input, `Value must be less than or equal to ${max}`);
        return false;
    }
    
    return true;
}

// Validate date
function validateDate(input) {
    const date = new Date(input.value);
    if (isNaN(date.getTime())) {
        showError(input, 'Please enter a valid date');
        return false;
    }
    
    const min = input.getAttribute('min');
    const max = input.getAttribute('max');
    
    if (min !== null) {
        const minDate = new Date(min);
        if (date < minDate) {
            showError(input, `Date must be on or after ${formatDate(minDate)}`);
            return false;
        }
    }
    
    if (max !== null) {
        const maxDate = new Date(max);
        if (date > maxDate) {
            showError(input, `Date must be on or before ${formatDate(maxDate)}`);
            return false;
        }
    }
    
    return true;
}

// Validate password
function validatePassword(input) {
    const minLength = input.getAttribute('data-min-length') || 8;
    
    if (input.value.length < minLength) {
        showError(input, `Password must be at least ${minLength} characters long`);
        return false;
    }
    
    return true;
}

// Validate confirm password
function validateConfirmPassword(input) {
    const passwordInput = document.getElementById(input.getAttribute('data-match'));
    
    if (!passwordInput) {
        showError(input, 'Password field not found');
        return false;
    }
    
    if (input.value !== passwordInput.value) {
        showError(input, 'Passwords do not match');
        return false;
    }
    
    return true;
}

// Show error message
function showError(input, message) {
    // Create error message element if it doesn't exist
    let errorElement = input.parentElement.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        input.parentElement.appendChild(errorElement);
    }
    
    // Set error message and add error class to input
    errorElement.textContent = message;
    input.classList.add('error');
}

// Clear error message
function clearError(input) {
    const errorElement = input.parentElement.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
    input.classList.remove('error');
}

// Format date for error messages
function formatDate(date) {
    return date.toLocaleDateString();
}