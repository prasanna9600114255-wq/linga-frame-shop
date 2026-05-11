const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Multer setup for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Data file paths
const usersFile = path.join(__dirname, 'data/users.json');
const ordersFile = path.join(__dirname, 'data/orders.json');

// Initialize data files
function initDataFiles() {
    if (!fs.existsSync(usersFile)) {
        fs.writeFileSync(usersFile, JSON.stringify([]));
    }
    if (!fs.existsSync(ordersFile)) {
        fs.writeFileSync(ordersFile, JSON.stringify([]));
    }
}

function readUsers() {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function readOrders() {
    return JSON.parse(fs.readFileSync(ordersFile, 'utf8'));
}

function writeOrders(orders) {
    fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

// Send WhatsApp notification (via API)
async function sendWhatsAppNotification(phoneNumber, message) {
    try {
        // You can integrate with Twilio or other WhatsApp services
        // For now, we'll log it - users need to configure API
        console.log(`📱 WhatsApp Message to ${phoneNumber}: ${message}`);
        return true;
    } catch (error) {
        console.log('WhatsApp notification failed:', error.message);
        return false;
    }
}

// Send Email notification
async function sendEmailNotification(email, subject, message) {
    try {
        // You can integrate with SendGrid, NodeMailer, etc
        console.log(`📧 Email to ${email} - Subject: ${subject}`);
        console.log(message);
        return true;
    } catch (error) {
        console.log('Email notification failed:', error.message);
        return false;
    }
}

// Routes

// Register
app.post('/api/register', (req, res) => {
    const { name, email, password, phone, userType } = req.body;

    if (!name || !email || !password || !phone || !userType) {
        return res.status(400).json({ message: 'All fields required' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'Email already exists' });
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // In production, hash this!
        phone,
        userType, // 'customer' or 'admin'
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.json({
        message: 'Registration successful',
        userId: newUser.id,
        userType: newUser.userType
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
        message: 'Login successful',
        userId: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType
    });
});

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
        message: 'Image uploaded successfully',
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`
    });
});

// Create order
app.post('/api/orders', upload.single('image'), async (req, res) => {
    const { userId, customerName, customerEmail, customerPhone, frameColor, frameSize, price, imageUrl } = req.body;

    if (!userId || !customerName || !customerEmail || !frameColor || !frameSize || !price) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const uploadedImage = req.file ? `/uploads/${req.file.filename}` : imageUrl;

    const newOrder = {
        id: Date.now().toString(),
        userId,
        customerName,
        customerEmail,
        customerPhone,
        frameColor,
        frameSize,
        price,
        imageUrl: uploadedImage,
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    const orders = readOrders();
    orders.push(newOrder);
    writeOrders(orders);

    // Send notifications to admin
    const adminPhone = process.env.ADMIN_WHATSAPP;
    const adminEmail = process.env.ADMIN_EMAIL;

    const orderMessage = `New Order #${newOrder.id}
Customer: ${customerName}
Phone: ${customerPhone}
Frame: ${frameColor} - ${frameSize}
Price: ${price}`;

    await sendWhatsAppNotification(adminPhone, orderMessage);
    await sendEmailNotification(adminEmail, 'New Order Received', orderMessage);

    res.json({
        message: 'Order placed successfully',
        orderId: newOrder.id,
        status: 'confirmed'
    });
});

// Get customer orders
app.get('/api/customer-orders/:userId', (req, res) => {
    const orders = readOrders();
    const customerOrders = orders.filter(o => o.userId === req.params.userId);
    res.json(customerOrders);
});

// Get all orders (admin)
app.get('/api/admin-orders', (req, res) => {
    const orders = readOrders();
    res.json(orders);
});

// Update order status (admin)
app.put('/api/orders/:orderId/status', (req, res) => {
    const { status } = req.body;
    const orders = readOrders();
    const order = orders.find(o => o.id === req.params.orderId);

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    writeOrders(orders);

    res.json({ message: 'Order status updated', order });
});

// Get order details
app.get('/api/orders/:orderId', (req, res) => {
    const orders = readOrders();
    const order = orders.find(o => o.id === req.params.orderId);

    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
});

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
initDataFiles();
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('Admin WhatsApp:', process.env.ADMIN_WHATSAPP);
});
