// Order Confirmation JS

const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadOrderDetails();
    displayAdminContact();
});

async function loadOrderDetails() {
    const orderId = localStorage.getItem('lastOrderId');
    const container = document.getElementById('orderDetails');

    if (!orderId) {
        container.innerHTML = '<p>Error: Order ID not found</p>';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`);
        const order = await response.json();

        if (!response.ok) {
            container.innerHTML = '<p>Error loading order details</p>';
            return;
        }

        container.innerHTML = `
            <div style="text-align: left;">
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Frame Color:</strong> ${order.frameColor}</p>
                <p><strong>Frame Size:</strong> ${order.frameSize}</p>
                <p><strong>Price:</strong> $${order.price}</p>
                <p><strong>Status:</strong> <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span></p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                ${order.imageUrl ? `<img src="${order.imageUrl}" alt="Your frame" style="max-width: 200px; margin-top: 1rem; border-radius: 5px;">` : ''}
            </div>
        `;

    } catch (error) {
        container.innerHTML = '<p>Error: ' + error.message + '</p>';
    }
}

function displayAdminContact() {
    const adminPhone = document.getElementById('adminPhone');
    // This would be fetched from the server in a real app
    adminPhone.textContent = '+91 9600114255';
}

function checkAuth() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = 'login.html';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}
