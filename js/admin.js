// Admin panel JavaScript for BVB Registration System

class AdminPanel {
  constructor() {
    this.apiBase = 'http://localhost:5000/api';
    this.registrations = [];
    this.filteredRegistrations = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadData();
  }

  bindEvents() {
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportToExcel());
    }

    // Manual registration form toggle
    const showManualForm = document.getElementById('showManualForm');
    const manualForm = document.getElementById('manualRegistrationForm');
    const cancelManual = document.getElementById('cancelManual');
    
    if (showManualForm && manualForm) {
      showManualForm.addEventListener('click', () => {
        manualForm.classList.remove('hidden');
        showManualForm.style.display = 'none';
      });
    }

    if (cancelManual && manualForm && showManualForm) {
      cancelManual.addEventListener('click', () => {
        manualForm.classList.add('hidden');
        showManualForm.style.display = 'block';
        this.resetManualForm();
      });
    }

    // Manual registration form submission
    const manualFormElement = document.getElementById('manualForm');
    if (manualFormElement) {
      manualFormElement.addEventListener('submit', (e) => this.handleManualRegistration(e));
    }

    // Search and filter
    const searchInput = document.getElementById('searchInput');
    const departmentFilter = document.getElementById('departmentFilter');
    const statusFilter = document.getElementById('statusFilter');

    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => this.filterRegistrations(), 300));
    }

    if (departmentFilter) {
      departmentFilter.addEventListener('change', () => this.filterRegistrations());
    }

    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.filterRegistrations());
    }

    // Modal events
    const closeModal = document.getElementById('closeModal');
    if (closeModal) {
      closeModal.addEventListener('click', () => this.hideModal());
    }

    // Convert text to uppercase for specific fields
    const uppercaseFields = ['manualFullName', 'manualKen'];
    uppercaseFields.forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('input', (e) => {
          e.target.value = e.target.value.toUpperCase();
        });
      }
    });
  }

  async loadData() {
    try {
      this.showLoading();
      
      // Load registrations
      const registrationsResponse = await fetch(`${this.apiBase}/admin/registrations`);
      const registrationsResult = await registrationsResponse.json();

      if (registrationsResult.success) {
        this.registrations = registrationsResult.data;
        this.filteredRegistrations = [...this.registrations];
        this.updateStatistics(registrationsResult);
        this.renderRegistrationsTable();
      } else {
        this.showError('Failed to load registrations');
      }

    } catch (error) {
      console.error('Error loading data:', error);
      this.showError('Network error. Please refresh the page.');
    } finally {
      this.hideLoading();
    }
  }

  updateStatistics(data) {
    const totalCount = document.getElementById('totalCount');
    const verifiedCount = document.getElementById('verifiedCount');
    const pendingCount = document.getElementById('pendingCount');
    const todayCount = document.getElementById('todayCount');

    if (totalCount) totalCount.textContent = data.totalCount || 0;
    if (verifiedCount) verifiedCount.textContent = data.verifiedCount || 0;
    if (pendingCount) pendingCount.textContent = data.unverifiedCount || 0;
    
    // Calculate today's registrations
    const today = new Date().toDateString();
    const todayRegistrations = this.registrations.filter(reg => 
      new Date(reg.registrationDate).toDateString() === today
    ).length;
    
    if (todayCount) todayCount.textContent = todayRegistrations;
  }

  renderRegistrationsTable() {
    const tableBody = document.getElementById('registrationsTableBody');
    if (!tableBody) return;

    if (this.filteredRegistrations.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="px-6 py-8 text-center text-gray-500">
            <i class="bi bi-inbox text-4xl mb-2 block"></i>
            No registrations found
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = this.filteredRegistrations.map(reg => `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${reg.registrationNumber}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${reg.fullName}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${reg.email}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${reg.contactNumber}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${this.formatDepartment(reg.department)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          ${reg.ken}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${this.formatStatus(reg.isVerified)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${reg.verifiedNumber || '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${this.formatDate(reg.registrationDate)}
        </td>
      </tr>
    `).join('');
  }

  formatDepartment(department) {
    const departmentMap = {
      'Computer Science Engineering (CSE)': 'CSE',
      'Electronics & Communication Engineering (ECE)': 'ECE',
      'Mechanical Engineering': 'Mechanical',
      'Civil Engineering': 'Civil',
      'Electrical & Electronics Engineering (EEE)': 'EEE',
      'Information Technology': 'IT',
      'Chemical Engineering': 'Chemical',
      'Biotechnology': 'Biotech'
    };
    return departmentMap[department] || department;
  }

  formatStatus(isVerified) {
    if (isVerified) {
      return `
        <span class="status-verified">
          <i class="bi bi-check-circle mr-1"></i>
          Verified
        </span>
      `;
    } else {
      return `
        <span class="status-pending">
          <i class="bi bi-clock mr-1"></i>
          Pending
        </span>
      `;
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  filterRegistrations() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const departmentFilter = document.getElementById('departmentFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';

    this.filteredRegistrations = this.registrations.filter(reg => {
      // Search filter
      const matchesSearch = !searchTerm || 
        reg.fullName.toLowerCase().includes(searchTerm) ||
        reg.email.toLowerCase().includes(searchTerm) ||
        reg.registrationNumber.toLowerCase().includes(searchTerm) ||
        reg.ken.toLowerCase().includes(searchTerm);

      // Department filter
      const matchesDepartment = !departmentFilter || 
        reg.department.toLowerCase().includes(departmentFilter.toLowerCase());

      // Status filter
      const matchesStatus = !statusFilter || 
        (statusFilter === 'verified' && reg.isVerified) ||
        (statusFilter === 'pending' && !reg.isVerified);

      return matchesSearch && matchesDepartment && matchesStatus;
    });

    this.renderRegistrationsTable();
  }

  async handleManualRegistration(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Validate form
    if (!this.validateManualForm(data)) {
      return;
    }

    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/admin/manual-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        this.showSuccessModal('Manual Registration Created!', this.formatManualSuccess(result.data));
        this.resetManualForm();
        this.hideManualForm();
        this.loadData(); // Refresh data
      } else {
        this.showError(result.message || 'Manual registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Manual registration error:', error);
      this.showError('Network error. Please check your connection and try again.');
    } finally {
      this.hideLoading();
    }
  }

  validateManualForm(data) {
    const requiredFields = [
      'fullName', 'email', 'contactNumber', 'department', 
      'ken', 'foodPreference', 'registrationType', 'accommodation'
    ];

    for (let field of requiredFields) {
      if (!data[field] || !data[field].trim()) {
        this.showError('Please fill in all required fields');
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

  formatManualSuccess(data) {
    return `
      <div class="space-y-2 text-left">
        <p><strong>Registration Number:</strong> ${data.registrationNumber}</p>
        <p><strong>Name:</strong> ${data.fullName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Department:</strong> ${data.department}</p>
        <p><strong>KEN:</strong> ${data.ken}</p>
        <div class="mt-4 p-3 bg-green-50 rounded-lg">
          <p class="text-green-800 font-medium">Success!</p>
          <p class="text-green-700 text-xs">Manual registration created successfully.</p>
        </div>
      </div>
    `;
  }

  resetManualForm() {
    const form = document.getElementById('manualForm');
    if (form) {
      form.reset();
    }
  }

  hideManualForm() {
    const manualForm = document.getElementById('manualRegistrationForm');
    const showButton = document.getElementById('showManualForm');
    
    if (manualForm) {
      manualForm.classList.add('hidden');
    }
    
    if (showButton) {
      showButton.style.display = 'block';
    }
  }

  async exportToExcel() {
    try {
      this.showLoading();
      
      const response = await fetch(`${this.apiBase}/admin/export`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `bvb-registrations-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showSuccess('Excel file exported successfully!');
      } else {
        this.showError('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Network error during export');
    } finally {
      this.hideLoading();
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[+]?[\d\s\-()]{10,15}$/;
    return phoneRegex.test(phone);
  }

  showSuccessModal(title, content) {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    if (modal && modalTitle && modalContent) {
      modalTitle.textContent = title;
      modalContent.innerHTML = content;
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

// Utility functions
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

// Initialize the admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdminPanel();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdminPanel;
}