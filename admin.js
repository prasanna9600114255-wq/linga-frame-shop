// Admin Dashboard JS

const API_URL = 'http://localhost:3000/api';
let currentOrderId = null;
let allOrders = [];

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    loadAdminOrders();
    displayAdminName();
});

function checkAuth() {
    const userType = localStorage.getItem('userType');
    if (userType !== 'admin') {
        window.location.href = 'login.html';
    }
}

function displayAdminName() {
    const adminName = document.getElementById('adminName');
    const name = localStorage.getItem('userName');
    adminName.textContent = name || 'Admin';
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.style.display = 'none';
    });

    // Update sidebar menu
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    const sectionId = sectionName + '-section';
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }

    // Mark menu item as active
    event.target.classList.add('active');

    // Load data for section
    if (sectionName === 'orders') {
        loadAllOrders();
    } else if (sectionName === 'pending') {
        loadPendingOrders();
    } else if (sectionName === 'confirmed') {
        loadConfirmedOrders();
    } else if (sectionName === 'stats') {
        loadStatistics();
    }
}

async function loadAdminOrders() {
    await loadAllOrders();
    loadStatistics();
}

async function loadAllOrders() {
    const container = document.getElementById('ordersContainer');

    try {
        const response = await fetch(`${API_URL}/admin-orders`);
        allOrders = await response.json();

        if (allOrders.length === 0) {
            container.innerHTML = '<p>No orders yet</p>';
            return;
        }

        displayOrdersTable(allOrders, container);

    } catch (error) {
        container.innerHTML = '<p>Error loading orders: ' + error.message + '</p>';
    }
}

async function loadPendingOrders() {
    const container = document.getElementById('pendingOrdersContainer');

    try {
        const response = await fetch(`${API_URL}/admin-orders`);
        const orders = await response.json();
        const pendingOrders = orders.filter(o => o.status === 'pending');

        if (pendingOrders.length === 0) {
            container.innerHTML = '<p>No pending orders</p>';
            return;
        }

        displayOrdersTable(pendingOrders, container);

    } catch (error) {
        container.innerHTML = '<p>Error loading orders: ' + error.message + '</p>';
    }
}

async function loadConfirmedOrders() {
    const container = document.getElementById('confirmedOrdersContainer');

    try {
        const response = await fetch(`${API_URL}/admin-orders`);
        const orders = await response.json();
        const confirmedOrders = orders.filter(o => o.status === 'confirmed');

        if (confirmedOrders.length === 0) {
            container.innerHTML = '<p>No confirmed orders</p>';
            return;
        }

        displayOrdersTable(confirmedOrders, container);

    } catch (error) {
        container.innerHTML = '<p>Error loading orders: ' + error.message + '</p>';
    }
}

function displayOrdersTable(orders, container) {
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Frame</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td class="order-id" onclick="viewOrderDetails('${order.id}')">#${order.id.slice(0, 8)}</td>
                        <td>${order.customerName}</td>
                        <td>${order.customerPhone}</td>
                        <td>${order.frameColor} - ${order.frameSize}</td>
                        <td>$${order.price}</td>
                        <td><span class="table-status status-${order.status}">${order.status}</span></td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                        <td><button class="btn btn-primary" onclick="viewOrderDetails('${order.id}')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    container.innerHTML = html;
}

function viewOrderDetails(orderId) {
    currentOrderId = orderId;
    const order = allOrders.find(o => o.id === orderId);

    if (!order) return;

    const modal = document.getElementById('orderModal');
    const detailContent = document.getElementById('orderDetailContent');
    const statusSelect = document.getElementById('statusSelect');

    detailContent.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Order ID:</span>
            <span class="detail-value">${order.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Customer Name:</span>
            <span class="detail-value">${order.customerName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Customer Email:</span>
            <span class="detail-value">${order.customerEmail}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Customer Phone:</span>
            <span class="detail-value">${order.customerPhone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Frame Color:</span>
            <span class="detail-value">${order.frameColor}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Frame Size:</span>
            <span class="detail-value">${order.frameSize}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Price:</span>
            <span class="detail-value">$${order.price}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Order Date:</span>
            <span class="detail-value">${new Date(order.createdAt).toLocaleString()}</span>
        </div>
        ${order.imageUrl ? `<img src="${order.imageUrl}" alt="Order image" class="detail-image">` : ''}
    `;

    statusSelect.value = order.status;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('orderModal');
    modal.classList.remove('show');
    currentOrderId = null;
}

async function updateOrderStatus() {
    if (!currentOrderId) return;

    const newStatus = document.getElementById('statusSelect').value;

    try {
        const response = await fetch(`${API_URL}/orders/${currentOrderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Failed to update status');
            return;
        }

        alert('Order status updated successfully');
        closeModal();
        loadAdminOrders();

    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function loadStatistics() {
    const totalOrders = allOrders.length;
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    const confirmedCount = allOrders.filter(o => o.status === 'confirmed').length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.price), 0);

    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('confirmedCount').textContent = confirmedCount;
    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);

    // Generate charts
    generateColorChart();
    generateSizeChart();
}

function generateColorChart() {
    const colorChart = document.getElementById('colorChart');
    const colorCounts = {};

    allOrders.forEach(order => {
        colorCounts[order.frameColor] = (colorCounts[order.frameColor] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(colorCounts), 1);

    const html = Object.entries(colorCounts).map(([color, count]) => {
        const percentage = (count / maxCount) * 100;
        return `
            <div class="chart-item">
                <div class="chart-label">${color}</div>
                <div class="chart-bar" style="width: ${percentage}%">
                    <span class="chart-value">${count}</span>
                </div>
            </div>
        `;
    }).join('');

    colorChart.innerHTML = html || '<p>No data</p>';
}

function generateSizeChart() {
    const sizeChart = document.getElementById('sizeChart');
    const sizeCounts = {};

    allOrders.forEach(order => {
        sizeCounts[order.frameSize] = (sizeCounts[order.frameSize] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(sizeCounts), 1);

    const html = Object.entries(sizeCounts).map(([size, count]) => {
        const percentage = (count / maxCount) * 100;
        return `
            <div class="chart-item">
                <div class="chart-label">${size}</div>
                <div class="chart-bar" style="width: ${percentage}%">
                    <span class="chart-value">${count}</span>
                </div>
            </div>
        `;
    }).join('');

    sizeChart.innerHTML = html || '<p>No data</p>';
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('orderModal');
    if (event.target === modal) {
        closeModal();
    }
};
