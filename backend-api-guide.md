# Backend Connection & Firebase Integration Guide

This guide describes how to connect the Bit Crypto Chain Investment Crypto Investments frontend to a production backend system, either using **Firebase (Firestore & Auth)** or a custom **Node.js/Express REST API**.

---

## 1. Firebase Firestore Integration

Firebase is an excellent backend choice for this application because it supports real-time database updates and simple user authentication out-of-the-box.

### Step 1: Initialize Firebase
Include this initialization script in your website layout:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "todd-capital-crypto.firebaseapp.com",
    projectId: "todd-capital-crypto",
    storageBucket: "todd-capital-crypto.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
```

### Step 2: Handle User Registration with Firestore Custom Fields
When a user signs up, write their security roles and blank portfolios directly to the Database:

```javascript
async function handleFirebaseRegister(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Set initial portfolio document
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            role: "user",
            portfolio: {
                accountType: "Standard Investor",
                status: "Active",
                portfolioValue: 0.00,
                totalProfit: 0.00,
                totalDeposits: 0.00,
                withdrawalAvailable: 0.00
            }
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}
```

### Step 3: Stream Real-Time Transactions & Balance Updates
Connect a live Firestore listener on the dashboard so that user metrics refresh immediately when an administrator approves a transaction:

```javascript
function listenToUserPortfolio(userId) {
    // 1. Listen to Portfolio updates
    onSnapshot(doc(db, "users", userId), (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            updateDashboardMetricsUI(userData.portfolio);
        }
    });

    // 2. Listen to Transactions updates
    const q = query(collection(db, "transactions"), where("userId", "==", userId));
    onSnapshot(q, (querySnapshot) => {
        const transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        renderTransactionsTableUI(transactions);
    });
}
```

---

## 2. Node.js & Express REST API Endpoint Structure

If implementing a custom Node.js server with PostgreSQL, secure authentication and session validation should follow this framework:

### Endpoint: Authentication (JWT & HTTP-Only Cookie Sessions)
```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../db'); // PostgreSQL connection pooling pool

router.post('/login', async (req, res) => {
    const { email, password, csrfToken } = req.body;

    // Validate CSRF token stored in request headers / session
    if (csrfToken !== req.session.csrfToken) {
        return res.status(403).json({ error: 'CSRF token verification failed' });
    }

    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userRes.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate session JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '30m' }
        );

        // Store secure HTTP-only cookie
        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: true, // Requires HTTPS config
            sameSite: 'strict',
            maxAge: 30 * 60 * 1000 // 30 minutes expiration
        });

        res.json({ success: true, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
```

### Endpoint: Submit Deposit Requests (Escrow hold)
```javascript
router.post('/deposit', authenticateJWT, async (req, res) => {
    const { amount, coin, referenceHash } = req.body;
    const userId = req.user.id;

    if (amount <= 0) return res.status(400).json({ error: 'Invalid deposit amount' });

    try {
        const txId = 'TX-' + Math.floor(10000 + Math.random() * 90000);
        await db.query(
            'INSERT INTO transactions (id, user_id, type, amount, coin, reference_hash, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [txId, userId, 'Deposit', amount, coin, referenceHash, 'Pending']
        );
        res.json({ success: true, message: 'Deposit requested successfully', txId });
    } catch (err) {
        res.status(500).json({ error: 'Database transaction logger failed' });
    }
});
```

---

## 3. HTTPS Configuration Guidelines

To secure your production deployment:
1. **Force HTTPS Redirect**: Implement strict SSL redirects on Nginx, Apache, or cloud platforms (e.g., Vercel, AWS CloudFront).
2. **CSP (Content Security Policy)**: Setup security headers restricting external script loadings:
   ```nginx
   add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https://images.unsplash.com;";
   ```
3. **Session Cookies**: Always ensure cookie configs declare `Secure; HttpOnly; SameSite=Strict`.
