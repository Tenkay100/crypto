/* Bit Crypto Chain Investment Crypto Investments - Authentication Engine */

const firebaseConfig = {
  apiKey: "AIzaSyD9Ou2AeiI3KcLDGek8XCVPk2cQRfcuwdw",
  authDomain: "bitpaycrypto.firebaseapp.com",
  projectId: "bitpaycrypto",
  storageBucket: "bitpaycrypto.firebasestorage.app",
  messagingSenderId: "636382177107",
  appId: "1:636382177107:web:182f6376f991de1ae063a6"
};

let firebaseApp = null;
let firebaseDb = null;

// Dynamically inject Firebase Compat scripts for Firestore
function loadFirebaseSDK() {
    return new Promise((resolve) => {
        if (window.firebase && window.firebase.firestore) {
            resolve();
            return;
        }
        const appScript = document.createElement('script');
        appScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js";
        appScript.onload = () => {
            const fsScript = document.createElement('script');
            fsScript.src = "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js";
            fsScript.onload = () => {
                try {
                    firebaseApp = firebase.initializeApp(firebaseConfig);
                    firebaseDb = firebase.firestore();
                    console.log("Firestore Database link active");
                } catch (e) {
                    console.error("Firestore connection blocked: ", e);
                }
                resolve();
            };
            document.head.appendChild(fsScript);
        };
        document.head.appendChild(appScript);
    });
}

// Sync helper for Firestore
async function syncToFirebase() {
    if (!firebaseDb) return;
    try {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        await firebaseDb.collection('system').doc('usersData').set({ users: users }, { merge: true });
    } catch (e) {
        console.error("Firestore write failed: ", e);
    }
}

const DEMO_USER = {
    name: 'Todd Ann Bilodeau',
    email: 'bilodeautoddann@gmail.com',
    passwordHash: 'ce74a1b248c9ad42d03b3b7d92b9a0a16c9e6cbc9a8f17e37574acec978a4027', // Correct SHA256 for 'Toddann18@'
    accountType: 'Premium Investor',
    status: 'Active',
    portfolioValue: 31700000,
    asset: 'Bitcoin (Demo Data Only)',
    totalProfit: 4250000,
    totalDeposits: 27450000,
    withdrawalAvailable: 2500000
};

// Simple SHA-256 function for client-side hashing simulation
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const Auth = {
    async init() {
        // Setup CSRF token immediately (before any await) to prevent race conditions
        if (!sessionStorage.getItem('csrf_token')) {
            sessionStorage.setItem('csrf_token', Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
        }

        await loadFirebaseSDK();

        // Sync local storage from Firestore first if available
        if (firebaseDb) {
            try {
                const doc = await firebaseDb.collection('system').doc('usersData').get();
                if (doc.exists) {
                    const data = doc.data();
                    if (data && data.users && Object.keys(data.users).length > 0) {
                        localStorage.setItem('users', JSON.stringify(data.users));
                    }
                } else {
                    // Cloud document does not exist (new database). Push local storage users to cloud to initialize it!
                    if (localStorage.getItem('users') && localStorage.getItem('users') !== '{}') {
                        syncToFirebase();
                    }
                }
            } catch (e) {
                console.warn("Using offline localStorage fallback: ", e.message);
            }
        }

        // Initialize demo user in local storage if not already there
        if (!localStorage.getItem('users') || localStorage.getItem('users') === '{}') {
            const users = {};
            users[DEMO_USER.email] = {
                name: DEMO_USER.name,
                email: DEMO_USER.email,
                passwordHash: DEMO_USER.passwordHash,
                role: 'user',
                portfolio: {
                    accountType: DEMO_USER.accountType,
                    status: DEMO_USER.status,
                    portfolioValue: DEMO_USER.portfolioValue,
                    asset: DEMO_USER.asset,
                    totalProfit: DEMO_USER.totalProfit,
                    totalDeposits: DEMO_USER.totalDeposits,
                    withdrawalAvailable: DEMO_USER.withdrawalAvailable
                },
                transactions: [
                    { id: 'TX-10084', type: 'Deposit', amount: 15000000, coin: 'BTC', date: '2026-05-12', status: 'Approved' },
                    { id: 'TX-10085', type: 'Deposit', amount: 12450000, coin: 'BTC', date: '2026-06-01', status: 'Approved' },
                    { id: 'TX-10086', type: 'Withdraw', amount: 100000, coin: 'BTC', date: '2026-06-15', status: 'Approved' },
                    { id: 'TX-10087', type: 'ROI Profit', amount: 4250000, coin: 'BTC', date: '2026-07-01', status: 'Approved' }
                ]
            };
            
            // Add a default administrator account as well
            users['admin@toddcapital.com'] = {
                name: 'System Admin',
                email: 'admin@toddcapital.com',
                passwordHash: await sha256('admin4321'),
                role: 'admin'
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            syncToFirebase();
        } else {
            // Force update password hashes of default accounts to prevent issues
            const users = JSON.parse(localStorage.getItem('users'));
            let updated = false;

            if (users[DEMO_USER.email]) {
                if (users[DEMO_USER.email].passwordHash !== DEMO_USER.passwordHash) {
                    users[DEMO_USER.email].passwordHash = DEMO_USER.passwordHash;
                    updated = true;
                }
            }

            // Ensure the correct admin email exists in localStorage
            if (!users['admin@toddcapital.com'] || users['admin@toddcapital.com'].passwordHash !== await sha256('admin4321')) {
                users['admin@toddcapital.com'] = {
                    name: 'System Admin',
                    email: 'admin@toddcapital.com',
                    passwordHash: await sha256('admin4321'),
                    role: 'admin'
                };
                updated = true;
            }
            if (updated) {
                localStorage.setItem('users', JSON.stringify(users));
                syncToFirebase();
            }
        }
    },

    getCSRFToken() {
        return sessionStorage.getItem('csrf_token');
    },

    validateCSRF(token) {
        return token === this.getCSRFToken();
    },

    async register(name, email, password) {
        await this.init();
        const users = JSON.parse(localStorage.getItem('users'));

        if (users[email]) {
            return { success: false, message: 'Email address already registered' };
        }

        // Input validation
        if (!name || name.trim().length < 3) return { success: false, message: 'Invalid name' };
        if (!email.includes('@')) return { success: false, message: 'Invalid email format' };
        if (password.length < 8) return { success: false, message: 'Password must be at least 8 characters long' };

        const passwordHash = await sha256(password);

        users[email] = {
            name: name,
            email: email,
            passwordHash: passwordHash,
            role: 'user',
            portfolio: {
                accountType: 'Standard Investor',
                status: 'Active',
                portfolioValue: 0,
                asset: 'None',
                totalProfit: 0,
                totalDeposits: 0,
                withdrawalAvailable: 0
            },
            transactions: []
        };

        localStorage.setItem('users', JSON.stringify(users));
        syncToFirebase();
        return { success: true };
    },

    async login(email, password, csrfToken) {
        await this.init();
        
        // CSRF verification
        if (!this.validateCSRF(csrfToken)) {
            return { success: false, message: 'Security validation failed (CSRF Error)' };
        }

        const users = JSON.parse(localStorage.getItem('users'));
        const user = users[email];

        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }

        const passwordHash = await sha256(password);

        if (user.passwordHash !== passwordHash) {
            return { success: false, message: 'Invalid email or password' };
        }

        // Access control check
        if (user.portfolio && user.portfolio.status === 'Suspended') {
            return { success: false, message: 'Your account has been suspended by administration security controls.' };
        }

        // Set session
        const session = {
            email: user.email,
            name: user.name,
            role: user.role,
            loginTime: Date.now()
        };
        sessionStorage.setItem('current_session', JSON.stringify(session));
        return { success: true, role: user.role, user: session };
    },

    logout() {
        sessionStorage.removeItem('current_session');
    },

    getCurrentUser() {
        const session = sessionStorage.getItem('current_session');
        if (!session) return null;

        const sessionData = JSON.parse(session);
        
        // Session timeout check (e.g., 30 minutes)
        const sessionDuration = 30 * 60 * 1000;
        if (Date.now() - sessionData.loginTime > sessionDuration) {
            this.logout();
            return null;
        }

        // Reload user from localStorage to get the latest portfolio details
        const users = JSON.parse(localStorage.getItem('users')) || {};
        return users[sessionData.email] || null;
    },

    updateUserPortfolio(email, updatedPortfolio) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[email]) {
            users[email].portfolio = updatedPortfolio;
            localStorage.setItem('users', JSON.stringify(users));
            syncToFirebase();
            return true;
        }
        return false;
    },

    addTransaction(email, transaction) {
        const users = JSON.parse(localStorage.getItem('users')) || {};
        if (users[email]) {
            transaction.id = 'TX-' + Math.floor(10000 + Math.random() * 90000);
            transaction.date = new Date().toISOString().split('T')[0];
            users[email].transactions.unshift(transaction);
            localStorage.setItem('users', JSON.stringify(users));
            syncToFirebase();
            return true;
        }
        return false;
    },

    syncToFirebase() {
        syncToFirebase();
    }
};

window.Auth = Auth;
Auth.init();
