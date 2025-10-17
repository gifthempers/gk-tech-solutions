// Main JavaScript for BVB Registration System

class RegistrationSystem {
  constructor() {
    this.apiBase = 'https://gk-backend-fnz6.onrender.com/api';
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupFormValidation();
  }

  bindEvents() {
    // Registration form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
      registrationForm.addEventListener('submit', (e) => this.handleRegistration(e));
    }

    // Validation form
    const validateForm = document.getElementById('validateForm');
    if (validateForm) {
      validateForm.addEventListener('submit', (e) => this.handleValidation(e));
    }

    // Verification form
    const verifyForm = document.getElementById('verifyForm');
    if (verifyForm) {
      verifyForm.addEventListener('submit', (e) => this.handleVerification(e));
    }

    // Modal events
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
      closeModal.addEventListener('click', () => this.hideModal());
    }

    const copyButton = document.getElementById('copyButton');
    if (copyButton) {
      copyButton.addEventListener('click', (e) => this.copyToClipboard(e));
    }

    // Convert text to uppercase for specific fields
    const uppercaseFields = ['fullName', 'ken', 'kenValidate'];
    uppercaseFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', (e) => {
          e.target.value = e.target.value.toUpperCase();
        });
      }
    });
  }

  setupFormValidation() {
    // Real-time validation for forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove existing error styling
    field.classList.remove('invalid', 'valid');

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (field.name === 'contactNumber' && value && !this.isValidPhone(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    } else if (field.name === 'ken' && value && value.length > 7) {
      isValid = false;
      errorMessage = 'KEN should not exceed 7 characters';
    }

    if (isValid && value) {
      field.classList.add('valid');
    } else if (!isValid) {
      field.classList.add('invalid');
      this.showFieldError(field, errorMessage);
    }

    return isValid;
  }

  clearFieldError(field) {
    field.classList.remove('invalid');
    const errorEl = field.parentNode.querySelector('.field-error');
    if (errorEl) {
      errorEl.remove();
    }
  }

  showFieldError(field, message) {
    this.clearFieldError(field);
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error text-red-500 text-xs mt-1';
    errorEl.textContent = message;
    field.parentNode.appendChild(errorEl);
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
    return phoneRegex.test(phone);
  }

  async handleRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validate form
    if (!this.validateRegistrationForm(data)) {
      return;
    }

    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/registration/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showSuccessModal('Registration Successful!', this.formatRegistrationSuccess(result.data));
        e.target.reset();
      } else {
        this.showError(result.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showError('Network error. Please check your connection and try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleValidation(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!data.ken) {
      this.showError('Please enter your KEN');
      return;
    }

    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/registration/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showValidationResult(result.data);
      } else {
        this.showError(result.message || 'No registration found with this KEN.');
      }
    } catch (error) {
      console.error('Validation error:', error);
      this.showError('Network error. Please check your connection and try again.');
    } finally {
      this.hideLoading();
    }
  }

  async handleVerification(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!data.registrationNumber || !data.contactNumber) {
      this.showError('Please fill in all required fields');
      return;
    }

    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/registration/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showVerificationSuccess(result.data);
      } else {
        this.showError(result.message || 'Verification failed. Please check your details.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      this.showError('Network error. Please check your connection and try again.');
    } finally {
      this.hideLoading();
    }
  }

  validateRegistrationForm(data) {
    const requiredFields = [
      'fullName', 'email', 'contactNumber', 'department', 
      'ken', 'foodPreference', 'registrationType', 'accommodation'
    ];

    for (let field of requiredFields) {
      if (!data[field] || !data[field].trim()) {
        this.showError(`Please fill in all required fields`);
        return false;
      }
    }

    if (!this.isValidEmail(data.email)) {
      this.showError('Please enter a valid email address');
      return false;
    }

    if (!this.isValidPhone(data.contactNumber)) {
      this.showError('Please enter a valid phone number');
      return false;
    }

    if (data.ken.length > 7) {
      this.showError('KEN should not exceed 7 characters');
      return false;
    }

    return true;
  }

  showValidationResult(data) {
    // Show verification section
    const verificationSection = document.getElementById('verificationSection');
    const regNumberField = document.getElementById('regNumber');
    
    if (verificationSection && regNumberField) {
      regNumberField.value = data.registrationNumber;
      verificationSection.classList.remove('hidden');
      verificationSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Show registration details
    this.showSuccessModal('Registration Found!', this.formatValidationResult(data));
  }

  showVerificationSuccess(data) {
    this.showSuccessModal('Verification Successful!', this.formatVerificationSuccess(data), data.verifiedNumber);
    
    // Hide verification section
    const verificationSection = document.getElementById('verificationSection');
    if (verificationSection) {
      setTimeout(() => {
        verificationSection.classList.add('hidden');
      }, 2000);
    }
  }

  formatRegistrationSuccess(data) {
    return `
      <div class="space-y-2 text-left">
        <p><strong>Registration Number:</strong> ${data.registrationNumber}</p>
        <p><strong>Name:</strong> ${data.fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Department:</strong> ${data.department}</p>
        <p><strong>KEN:</strong> ${data.ken}</p>
        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
          <p class="text-blue-800 font-medium">Important:</p>
          <p class="text-blue-700 text-xs">Please verify your registration using your Registration Number and Phone Number. Check your email for detailed instructions.</p>
        </div>
      </div>
    `;
  }

  formatValidationResult(data) {
    const statusBadge = data.isVerified 
      ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Verified</span>'
      : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Verification</span>';

    let content = `
      <div class="space-y-2 text-left">
        <p><strong>Registration Number:</strong> ${data.registrationNumber}</p>
        <p><strong>Name:</strong> ${data.fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Department:</strong> ${data.department}</p>
        <p><strong>Status:</strong> ${statusBadge}</p>
    `;

    if (data.isVerified && data.verifiedNumber) {
      content += `<p><strong>Verified Number:</strong> ${data.verifiedNumber}</p>`;
    }

    content += '</div>';
    return content;
  }

  formatVerificationSuccess(data) {
    return `
      <div class="space-y-2 text-left">
        <p><strong>Verified Number:</strong> ${data.verifiedNumber}</p>
        <p><strong>Registration Number:</strong> ${data.registrationNumber}</p>
        <p><strong>Name:</strong> ${data.fullName}</p>
        <div class="mt-4 p-3 bg-green-50 rounded-lg">
          <p class="text-green-800 font-medium">Success!</p>
          <p class="text-green-700 text-xs">Your registration has been verified successfully. Please save your verified number for event entry.</p>
        </div>
      </div>
    `;
  }

  showSuccessModal(title, content, copyText = null) {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const copyButton = document.getElementById('copyButton');

    if (modal && modalTitle && modalContent) {
      modalTitle.textContent = title;
      modalContent.innerHTML = content;
      
      if (copyText && copyButton) {
        copyButton.classList.remove('hidden');
        copyButton.dataset.copyText = copyText;
      } else if (copyButton) {
        copyButton.classList.add('hidden');
      }

      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  hideModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  async copyToClipboard(e) {
    const copyText = e.target.dataset.copyText;
    if (!copyText) return;

    try {
      await navigator.clipboard.writeText(copyText);
      
      // Show feedback
      const originalText = e.target.textContent;
      e.target.textContent = 'Copied!';
      e.target.classList.add('copy-success');
      
      setTimeout(() => {
        e.target.textContent = originalText;
        e.target.classList.remove('copy-success');
      }, 2000);
      
    } catch (err) {
      console.error('Failed to copy:', err);
      this.showError('Failed to copy to clipboard');
    }
  }

  showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.classList.remove('hidden');
      spinner.classList.add('flex');
    }
  }

  hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
      spinner.classList.add('hidden');
      spinner.classList.remove('flex');
    }
  }

  showError(message) {
    // Create and show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fixed top-4 right-4 z-50 max-w-md';
    errorDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="bi bi-exclamation-triangle mr-2"></i>
          <span>${message}</span>
        </div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;

    document.body.appendChild(errorDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 5000);
  }

  showSuccess(message) {
    // Create and show success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message fixed top-4 right-4 z-50 max-w-md';
    successDiv.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <i class="bi bi-check-circle mr-2"></i>
          <span>${message}</span>
        </div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;

    document.body.appendChild(successDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 3000);
  }
}

// Initialize the registration system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RegistrationSystem();
});

// Additional utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RegistrationSystem;
}