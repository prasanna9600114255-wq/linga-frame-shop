// Shop JS

const API_URL = 'http://localhost:3000/api';

let selectedImageFile = null;
const FRAME_PRICES = {
    'Small (6x8)': 50,
    'Medium (8x10)': 80,
    'Large (11x14)': 120,
    'Extra Large (16x20)': 180
};

document.addEventListener('DOMContentLoaded', function () {
    checkAuth();
    setupEventListeners();
    loadCustomerOrders();
});

function setupEventListeners() {
    const imageInput = document.getElementById('imageInput');
    const frameColorRadios = document.querySelectorAll('input[name="frameColor"]');
    const frameSizeSelect = document.getElementById('frameSize');
    const orderForm = document.getElementById('orderForm');

    // Set default frame color to Gold
    document.getElementById('gold').checked = true;
    updateFramePreview();

    imageInput.addEventListener('change', handleImageUpload);
    frameColorRadios.forEach(radio => {
        radio.addEventListener('change', updateFramePreview);
    });
    frameSizeSelect.addEventListener('change', updatePrice);
    orderForm.addEventListener('submit', handleOrderSubmit);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
    }

    selectedImageFile = file;

    // Display preview
    const reader = new FileReader();
    reader.onload = function (event) {
        const previewImage = document.getElementById('previewImage');
        const noImageText = document.getElementById('noImageText');

        previewImage.src = event.target.result;
        previewImage.style.display = 'block';
        noImageText.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function updateFramePreview() {
    const frameColor = document.querySelector('input[name="frameColor"]:checked')?.value || 'Gold';
    const framePreview = document.getElementById('framePreview');

    framePreview.className = 'frame-display';

    switch (frameColor) {
        case 'Gold':
            framePreview.classList.add('gold-frame');
            break;
        case 'Silver':
            framePreview.classList.add('silver-frame');
            break;
        case 'Copper':
            framePreview.classList.add('copper-frame');
            break;
        case 'Black':
            framePreview.classList.add('black-frame');
            break;
    }
}

function updatePrice() {
    const frameSize = document.getElementById('frameSize').value;
    const price = FRAME_PRICES[frameSize] || 0;
    document.getElementById('priceDisplay').value = '$' + price.toFixed(2);
}

async function handleOrderSubmit(e) {
    e.preventDefault();

    const userId = localStorage.getItem('userId');
    const customerName = localStorage.getItem('userName');
    const customerEmail = localStorage.getItem('userEmail');
    const customerPhone = localStorage.getItem('userPhone');
    const frameColor = document.querySelector('input[name="frameColor"]:checked').value;
    const frameSize = document.getElementById('frameSize').value;
    const priceText = document.getElementById('priceDisplay').value;
    const price = parseFloat(priceText.replace('$', ''));

    if (!selectedImageFile) {
        alert('Please select an image');
        return;
    }

    if (!frameSize) {
        alert('Please select a frame size');
        return;
    }

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('customerName', customerName);
        formData.append('customerEmail', customerEmail);
        formData.append('customerPhone', customerPhone);
        formData.append('frameColor', frameColor);
        formData.append('frameSize', frameSize);
        formData.append('price', price);
        formData.append('image', selectedImageFile);

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Order failed');
            return;
        }

        // Store order ID and redirect to confirmation page
        localStorage.setItem('lastOrderId', data.orderId);
        window.location.href = 'order-confirmation.html';

    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadCustomerOrders() {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('ordersContainer');

    try {
        const response = await fetch(`${API_URL}/customer-orders/${userId}`);
        const orders = await response.json();

        if (orders.length === 0) {
            container.innerHTML = '<p>No orders yet. Create your first custom frame!</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <h4>Order #${order.id.slice(0, 8)}</h4>
                <span class="order-status status-${order.status}">${order.status.toUpperCase()}</span>
                <img src="${order.imageUrl}" alt="Order image" class="order-image">
                <div class="order-details">
                    <p><strong>Frame:</strong> ${order.frameColor} - ${order.frameSize}</p>
                    <p><strong>Price:</strong> $${order.price}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = '<p>Error loading orders: ' + error.message + '</p>';
    }
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
