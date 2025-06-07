// Authentication System
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.sessionStartTime = Date.now();
        this.init();
    }

    init() {
        // Check if user is already logged in on dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            this.checkSession();
            this.initializeDashboard();
        } else {
            // Check if user is logged in and redirect to dashboard
            if (this.currentUser && !window.location.pathname.includes('dashboard.html')) {
                window.location.href = 'dashboard.html';
            }
        }

        // Initialize form handlers
        this.initializeFormHandlers();
        this.initializePasswordToggles();
    }

    initializeFormHandlers() {
        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });

            // Password strength checker
            const passwordInput = document.getElementById('registerPassword');
            if (passwordInput) {
                passwordInput.addEventListener('input', () => {
                    this.checkPasswordStrength(passwordInput.value);
                });
            }

            // Confirm password validation
            const confirmPasswordInput = document.getElementById('confirmPassword');
            if (confirmPasswordInput) {
                confirmPasswordInput.addEventListener('input', () => {
                    this.validatePasswordMatch();
                });
            }
        }
    }

    initializePasswordToggles() {
        const toggleButtons = document.querySelectorAll('.password-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.togglePassword(targetId);
            });
        });
    }

    // Form Validation Methods
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    validateName(name) {
        return name.trim().length >= 2;
    }

    checkPasswordStrength(password) {
        const strengthIndicator = document.getElementById('passwordStrength');
        if (!strengthIndicator) return;

        let strength = 0;
        let message = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        switch (strength) {
            case 0:
            case 1:
                message = 'Weak password';
                strengthIndicator.className = 'password-strength weak';
                break;
            case 2:
            case 3:
                message = 'Medium password';
                strengthIndicator.className = 'password-strength medium';
                break;
            case 4:
            case 5:
                message = 'Strong password';
                strengthIndicator.className = 'password-strength strong';
                break;
        }

        strengthIndicator.textContent = password.length > 0 ? message : '';
    }

    validatePasswordMatch() {
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorElement = document.getElementById('confirmPasswordError');

        if (confirmPassword && password !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            return false;
        } else {
            errorElement.textContent = '';
            return true;
        }
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    // Authentication Methods
    handleLogin() {
        this.clearErrors();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validation
        let isValid = true;

        if (!email) {
            this.showError('loginEmailError', 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.showError('loginEmailError', 'Please enter a valid email');
            isValid = false;
        }

        if (!password) {
            this.showError('loginPasswordError', 'Password is required');
            isValid = false;
        }

        if (!isValid) return;

        // Check credentials
        const user = this.users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.updateUserData();

            // Set current user
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));

            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberUser', email);
            } else {
                localStorage.removeItem('rememberUser');
            }

            // Success message and redirect
            Swal.fire({
                icon: 'success',
                title: 'Login Successful!',
                text: `Welcome back, ${user.firstName}!`,
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'dashboard.html';
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Login Failed',
                text: 'Invalid email or password. Please try again.'
            });
        }
    }

    handleRegister() {
        this.clearErrors();
        
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        let isValid = true;

        if (!this.validateName(firstName)) {
            this.showError('firstNameError', 'First name must be at least 2 characters');
            isValid = false;
        }

        if (!this.validateName(lastName)) {
            this.showError('lastNameError', 'Last name must be at least 2 characters');
            isValid = false;
        }

        if (!email) {
            this.showError('registerEmailError', 'Email is required');
            isValid = false;
        } else if (!this.validateEmail(email)) {
            this.showError('registerEmailError', 'Please enter a valid email');
            isValid = false;
        } else if (this.users.find(u => u.email === email)) {
            this.showError('registerEmailError', 'Email already exists');
            isValid = false;
        }

        if (!this.validatePassword(password)) {
            this.showError('registerPasswordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        if (password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }

        if (!agreeTerms) {
            this.showError('agreeTermsError', 'You must agree to the terms and conditions');
            isValid = false;
        }

        if (!isValid) return;

        // Create new user
        const newUser = {
            id: Date.now(),
            firstName,
            lastName,
            email,
            password,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        this.users.push(newUser);
        this.updateUserData();

        // Success message and redirect
        Swal.fire({
            icon: 'success',
            title: 'Account Created!',
            text: 'Your account has been created successfully. Please sign in.',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = 'login.html';
        });
    }

    updateUserData() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    checkSession() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
    }

    logout() {
        Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to sign out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#667eea',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, sign out'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('currentUser');
                this.currentUser = null;
                
                Swal.fire({
                    icon: 'success',
                    title: 'Signed Out',
                    text: 'You have been successfully signed out.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'login.html';
                });
            }
        });
    }

    // Dashboard Methods
    initializeDashboard() {
        if (!this.currentUser) return;

        // Update user name
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.firstName;
        }

        // Update last login
        const lastLoginElement = document.getElementById('lastLogin');
        if (lastLoginElement && this.currentUser.lastLogin) {
            const lastLogin = new Date(this.currentUser.lastLogin);
            lastLoginElement.textContent = this.formatDate(lastLogin);
        }

        // Update login time
        const loginTimeElement = document.getElementById('loginTime');
        if (loginTimeElement) {
            loginTimeElement.textContent = this.formatDate(new Date());
        }

        // Start session timer
        this.startSessionTimer();
    }

    startSessionTimer() {
        setInterval(() => {
            const sessionTime = Math.floor((Date.now() - this.sessionStartTime) / 60000);
            const sessionTimeElement = document.getElementById('sessionTime');
            if (sessionTimeElement) {
                sessionTimeElement.textContent = `${sessionTime} minutes`;
            }
        }, 60000);
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Utility Functions
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function logout() {
    if (window.authSystem) {
        window.authSystem.logout();
    }
}

// Initialize the authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Pre-fill remember me email if exists
    const rememberedEmail = localStorage.getItem('rememberUser');
    const emailInput = document.getElementById('loginEmail');
    const rememberCheckbox = document.getElementById('rememberMe');
    
    if (rememberedEmail && emailInput) {
        emailInput.value = rememberedEmail;
        if (rememberCheckbox) {
            rememberCheckbox.checked = true;
        }
    }
});