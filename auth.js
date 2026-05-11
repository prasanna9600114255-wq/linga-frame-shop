// Authentication JS

const API_URL = 'http://localhost:3000/api';

// Register form handler
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if user is logged in
    checkAuth();
});

async function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const userType = document.getElementById('userType').value;
    const messageDiv = document.getElementById('message');

    // Validation
    if (!name || !email || !phone || !password || !userType) {
        showMessage('Please fill all fields', 'error', messageDiv);
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error', messageDiv);
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error', messageDiv);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                phone,
                password,
                userType
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Registration failed', 'error', messageDiv);
            return;
        }

        showMessage('Registration successful! Redirecting to login...', 'success', messageDiv);

        // Store user info
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userType', data.userType);

        setTimeout(() => {
            if (data.userType === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'shop.html';
            }
        }, 1500);

    } catch (error) {
        showMessage('Error: ' + error.message, 'error', messageDiv);
    }
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    if (!email || !password) {
        showMessage('Please fill all fields', 'error', messageDiv);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message || 'Login failed', 'error', messageDiv);
            return;
        }

        showMessage('Login successful! Redirecting...', 'success', messageDiv);

        // Store user info
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userPhone', data.phone);
        localStorage.setItem('userType', data.userType);

        setTimeout(() => {
            if (data.userType === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'shop.html';
            }
        }, 1000);

    } catch (error) {
        showMessage('Error: ' + error.message, 'error', messageDiv);
    }
}

function showMessage(message, type, element) {
    element.textContent = message;
    element.className = `message ${type}`;
}

function checkAuth() {
    const userId = localStorage.getItem('userId');
    const userType = localStorage.getItem('userType');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // If logged in and on auth page, redirect
    if (userId && (currentPage === 'login.html' || currentPage === 'register.html')) {
        if (userType === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'shop.html';
        }
    }

    // If not logged in and trying to access protected pages
    if (!userId && (currentPage === 'shop.html' || currentPage === 'admin-dashboard.html')) {
        window.location.href = 'login.html';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
