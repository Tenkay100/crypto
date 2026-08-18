/* Bit Crypto Chain Investment Crypto Investments - Dashboard & Admin Controller */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Session verification
    if (!window.Auth) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = window.Auth.getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize Page Views and Values
    initDashboard(currentUser);
});

let portfolioChart = null;

function initDashboard(user) {
    // Fill profile fields
    const welcomeName = document.getElementById('dash-welcome-name');
    if (welcomeName) welcomeName.textContent = user.name;
    
    const accountTypeBadge = document.getElementById('dash-account-type');
    if (accountTypeBadge) accountTypeBadge.textContent = user.portfolio.accountType || 'Standard Investor';

    // Populate Metrics
    updateMetricsUI(user);

    // Populate Transactions Table
    renderTransactions(user.transactions);

    // Sidebar navigation clicks
    const links = document.querySelectorAll('[data-view]');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Toggle active classes
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Switch views
            const viewName = link.getAttribute('data-view');
            switchView(viewName, user);
        });
    });

    // Populate Deposit wallet addresses based on selection
    const depCoinSelect = document.getElementById('depCoin');
    if (depCoinSelect) {
        depCoinSelect.addEventListener('change', () => {
            updateDepositAddress(depCoinSelect.value);
        });
        updateDepositAddress(depCoinSelect.value); // Initial trigger
    }

    // Handles form submissions
    setupFormHandlers(user);

    // Load Charts
    renderPortfolioCharts(user);

    // Load Live Market rates inside Dashboard Calculator
    setupProfitCalculator();

    // Toggle Mobile Sidebar Menu
    const toggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebarMenu');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Set CSRF token in dashboard forms
    const csrfInputs = document.querySelectorAll('.csrf-field');
    csrfInputs.forEach(input => {
        input.value = window.Auth.getCSRFToken();
    });

    // Admin Access validation
    const adminTab = document.getElementById('admin-sidebar-tab');
    if (adminTab) {
        if (user.role === 'admin' || user.email === 'bilodeautoddann@gmail.com') {
            adminTab.classList.remove('d-none');
        }
    }

    // Load Live News Feed
    const loadDashboardNews = () => {
        const container = document.getElementById('dash-news-container');
        if (!container) return;

        const getFallbackNews = () => [
            { title: 'Bitcoin Stabilizes Near Highs', source: 'CryptoNews Desk', url: '#' },
            { title: 'Ethereum Smart Contract Layer Upgraded', source: 'Chain Ledger Daily', url: '#' },
            { title: 'Solana Swaps Reach Record Volumes', source: 'Defi Journal', url: '#' }
        ];

        const renderNews = (list) => {
            container.innerHTML = list.map(art => `
                <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 8px;">
                    <a href="${art.url || '#'}" target="_blank" style="text-decoration: none;">
                        <strong style="color: #FFFFFF; font-size: 0.8rem; display: block; line-height: 1.3; margin-bottom: 4px;">${art.title || 'Crypto Update'}</strong>
                    </a>
                    <div class="d-flex justify-content-between text-muted" style="font-size: 0.7rem;">
                        <span>${art.source || 'News Feed'}</span>
                        <span class="text-gold">Read <i class="fas fa-external-link-alt" style="font-size: 0.65rem;"></i></span>
                    </div>
                </div>
            `).join('');
        };

        if (window.CryptoAPI) {
            window.CryptoAPI.fetchLiveNews().then(articles => {
                if (articles && articles.length > 0) {
                    renderNews(articles);
                } else {
                    renderNews(getFallbackNews());
                }
            }).catch(err => {
                console.error("Dashboard news error: ", err);
                renderNews(getFallbackNews());
            });
        } else {
            renderNews(getFallbackNews());
        }
    };

    loadDashboardNews();

    // Load Targeted System Announcements
    const loadDashboardAdvisories = () => {
        const container = document.getElementById('dash-advisory-announcements');
        if (!container) return;

        const anns = JSON.parse(localStorage.getItem('announcements')) || [];
        const filtered = anns.filter(a => a.target === 'all' || a.target === user.email);

        if (filtered.length > 0) {
            container.innerHTML = filtered.map((a, i) => `
                <div class="d-flex ${i < filtered.length - 1 ? 'border-bottom border-secondary border-opacity-10 pb-3 mb-3' : ''}">
                    <div class="fs-4 text-gold me-3"><i class="fas fa-bullhorn"></i></div>
                    <div>
                        <h6 class="text-white mb-1">${a.title}</h6>
                        <p class="text-muted small mb-0">${a.body}</p>
                        <small class="text-gold font-monospace" style="font-size: 0.65rem;">Published: ${a.date}</small>
                    </div>
                </div>
            `).join('');
        }
    };

    loadDashboardAdvisories();

    // Load Custom Notifications
    const loadCustomNotifications = () => {
        const container = document.getElementById('dash-custom-notifications');
        if (!container) return;

        const notifs = JSON.parse(localStorage.getItem('custom_notifications')) || [];
        const filtered = notifs.filter(n => n.userEmail === user.email);

        if (filtered.length > 0) {
            container.innerHTML = filtered.map((n, i) => {
                const readBtn = n.status === 'Unread' 
                    ? `<button onclick="markNotificationRead('${n.id}')" class="btn btn-outline-gold btn-xs py-0 px-2" style="font-size: 0.65rem; border-radius: 4px; border: 1px solid var(--accent-gold); background: transparent; color: var(--accent-gold);">Read</button>` 
                    : `<span class="badge bg-secondary" style="font-size: 0.65rem;">Read</span>`;
                return `
                    <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; margin-bottom: 8px;">
                        <div class="d-flex justify-content-between align-items-start mb-1">
                            <strong style="color: #FFFFFF; font-size: 0.8rem;">${n.title}</strong>
                            ${readBtn}
                        </div>
                        <p class="text-muted small mb-1" style="font-size: 0.75rem;">${n.body}</p>
                        <small class="text-muted font-monospace" style="font-size: 0.6rem;">${n.date}</small>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = `<div class="text-muted small">No notifications found.</div>`;
        }
    };

    window.markNotificationRead = (notifId) => {
        const notifs = JSON.parse(localStorage.getItem('custom_notifications')) || [];
        const notif = notifs.find(n => n.id === notifId);
        if (notif) {
            notif.status = 'Read';
            localStorage.setItem('custom_notifications', JSON.stringify(notifs));
            loadCustomNotifications();
        }
    };

    loadCustomNotifications();

    // Set KYC Status Badge and Message
    const kycBadge = document.getElementById('kyc-status-badge');
    const kycAlert = document.getElementById('kycAlert');
    if (kycBadge && user.portfolio) {
        if (user.portfolio.kyc_approved === true) {
            kycBadge.className = "badge bg-success text-white fw-bold";
            kycBadge.textContent = "Verified";
            
            if (kycAlert) {
                kycAlert.className = "alert alert-success animate-fade-in";
                kycAlert.innerHTML = `<strong>Verification Successful!</strong> Your KYC has been successfully completed.`;
                kycAlert.classList.remove('d-none');
            }
            const kycForm = document.getElementById('kycForm');
            if (kycForm) {
                kycForm.innerHTML = `<div class="text-center p-4">
                    <i class="fas fa-shield-halved text-gold fa-3x mb-3 animate-pulse"></i>
                    <h5 class="text-white">Profile Verified</h5>
                    <p class="text-muted small">No further actions are required. Your account holds full institutional clearance.</p>
                </div>`;
            }
        } else if (user.portfolio.kyc_notes) {
            kycBadge.className = "badge bg-danger text-white fw-bold";
            kycBadge.textContent = "Action Required";
            if (kycAlert) {
                kycAlert.className = "alert alert-danger animate-fade-in";
                kycAlert.innerHTML = `<strong>KYC Audit Advisory:</strong> ${user.portfolio.kyc_notes}`;
                kycAlert.classList.remove('d-none');
            }
        }
    }

    // Load Live Market Rates Table
    const loadLiveMarketRates = () => {
        const tbody = document.getElementById('dash-live-market-body');
        if (!tbody) return;

        const renderRates = (coins) => {
            const list = Object.values(coins);
            tbody.innerHTML = list.map(c => {
                const isUp = c.change24h >= 0;
                const sign = isUp ? '+' : '';
                const color = isUp ? 'text-success' : 'text-danger';
                const arrow = isUp ? '▲' : '▼';
                return `
                    <tr>
                        <td>
                            <strong style="color: #FFFFFF;">${c.name}</strong> 
                            <span class="badge bg-secondary ms-1" style="font-size: 0.6rem;">${c.symbol}</span>
                        </td>
                        <td class="font-monospace text-gold">$${c.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="font-monospace ${color}">${arrow} ${sign}${c.change24h.toFixed(2)}%</td>
                        <td class="text-muted font-monospace">$${(c.price * 19500000).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                `;
            }).join('');
        };

        if (window.CryptoAPI) {
            window.CryptoAPI.onPriceUpdate(renderRates);
            renderRates(window.CryptoAPI.getCoins());
        }
    };
    loadLiveMarketRates();

    // Floating Glassmorphism Alert Popups for active admin notices
    const checkNotificationPopups = () => {
        const notifs = JSON.parse(localStorage.getItem('custom_notifications')) || [];
        const unread = notifs.filter(n => n.userEmail === user.email && n.status === 'Unread');

        unread.forEach((n, idx) => {
            setTimeout(() => {
                showGlassPopup(n);
            }, idx * 2500); // Stagger popups
        });
    };

    const showGlassPopup = (n) => {
        // Prevent duplicates
        if (document.getElementById(`popup-alert-${n.id}`)) return;

        const popup = document.createElement('div');
        popup.id = `popup-alert-${n.id}`;
        popup.className = 'glass-panel p-3 border-glow-gold position-fixed';
        popup.style.cssText = `
            bottom: 20px;
            right: 20px;
            z-index: 1050;
            max-width: 320px;
            box-shadow: 0 8px 32px 0 rgba(212,175,55,0.2);
            animation: slideInUp 0.5s ease-out;
            border: 1px solid var(--accent-gold);
            background: rgba(11, 25, 44, 0.95);
        `;
        popup.innerHTML = `
            <div class="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10 pb-2 mb-2">
                <span class="text-gold fw-bold" style="font-size: 0.8rem;"><i class="fas fa-bell me-2"></i>New Admin Notice</span>
                <button type="button" class="btn-close btn-close-white" style="font-size: 0.75rem;" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
            <h6 class="text-white fw-bold mb-1" style="font-size: 0.85rem;">${n.title}</h6>
            <p class="text-muted mb-2" style="font-size: 0.75rem;">${n.body}</p>
            <button onclick="markNotificationRead('${n.id}'); this.parentElement.remove();" class="btn btn-gold btn-xs py-1 px-3 w-100" style="font-size: 0.7rem; border-radius: 4px;">Acknowledge</button>
        `;
        document.body.appendChild(popup);
    };

    checkNotificationPopups();
}

function updateMetricsUI(user) {
    const portfolioValueText = document.getElementById('val-portfolio');
    const profitText = document.getElementById('val-profit');
    const depositsText = document.getElementById('val-deposits');
    const withdrawText = document.getElementById('val-withdraw');

    if (portfolioValueText) portfolioValueText.textContent = `$${user.portfolio.portfolioValue.toLocaleString()}`;
    if (profitText) profitText.textContent = `$${user.portfolio.totalProfit.toLocaleString()}`;
    if (depositsText) depositsText.textContent = `$${user.portfolio.totalDeposits.toLocaleString()}`;
    if (withdrawText) withdrawText.textContent = `$${user.portfolio.withdrawalAvailable.toLocaleString()}`;
}

function switchView(viewName, user) {
    // Hide all view elements
    const panels = document.querySelectorAll('.dashboard-panel');
    panels.forEach(p => p.classList.add('d-none'));

    // Show selected panel
    const targetPanel = document.getElementById(`panel-${viewName}`);
    if (targetPanel) {
        targetPanel.classList.remove('d-none');
    }

    // If Admin panel selected, load admin controls
    if (viewName === 'admin') {
        loadAdminPanel();
    }

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
}

function updateDepositAddress(coin) {
    const addresses = {
        BTC: 'bc1qs8yxt3tr6tkh7q00yv6fu3chn05ws5dtjacwn5',
        ETH: '0xBitCryptoChainETHaddress555666777aaAbBbC',
        USDT: 'TYBitCryptoChainUSDTaddress888999000ccCdD'
    };
    const addressInput = document.getElementById('depAddress');
    if (addressInput) {
        addressInput.value = addresses[coin] || '';
    }
}

function renderTransactions(transactions) {
    const tableBody = document.getElementById('transactions-body');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No transaction logs available</td></tr>`;
        return;
    }

    tableBody.innerHTML = transactions.map(tx => {
        let badgeClass = 'pending';
        if (tx.status === 'Approved') badgeClass = 'success';
        if (tx.status === 'Rejected') badgeClass = 'failed';

        return `
            <tr>
                <td><strong>${tx.id}</strong></td>
                <td>${tx.type}</td>
                <td><span class="glow-text-gold">$${tx.amount.toLocaleString()}</span></td>
                <td><span class="badge bg-secondary">${tx.coin}</span></td>
                <td>${tx.date}</td>
                <td><span class="status-badge ${badgeClass}">${tx.status}</span></td>
            </tr>
        `;
    }).join('');
}

function setupFormHandlers(user) {
    // 1. Deposit submission
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const csrf = depositForm.querySelector('.csrf-field').value;
            if (!window.Auth.validateCSRF(csrf)) {
                alert('CSRF security validation failed!');
                return;
            }

            const amount = parseFloat(document.getElementById('depAmount').value);
            const coin = document.getElementById('depCoin').value;
            const ref = document.getElementById('depTxRef').value;

            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid deposit amount');
                return;
            }

            // Create a pending transaction
            const transaction = {
                type: 'Deposit',
                amount: amount,
                coin: coin,
                reference: ref,
                status: 'Pending'
            };

            window.Auth.addTransaction(user.email, transaction);
            
            // Reload user session state
            const updatedUser = window.Auth.getCurrentUser();
            renderTransactions(updatedUser.transactions);
            
            // Show feedback
            const feedback = document.getElementById('depositAlert');
            feedback.classList.remove('d-none');
            depositForm.reset();
            updateDepositAddress(document.getElementById('depCoin').value);

            setTimeout(() => {
                feedback.classList.add('d-none');
            }, 6000);
        });
    }

    // 2. Withdrawal submission
    const withdrawForm = document.getElementById('withdrawForm');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const csrf = withdrawForm.querySelector('.csrf-field').value;
            if (!window.Auth.validateCSRF(csrf)) {
                alert('CSRF security validation failed!');
                return;
            }

            const amount = parseFloat(document.getElementById('wdAmount').value);
            const coin = document.getElementById('wdCoin').value;
            const addr = document.getElementById('wdAddress').value;

            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid withdrawal amount');
                return;
            }

            if (amount > user.portfolio.withdrawalAvailable) {
                alert('Insufficient available funds for withdrawal');
                return;
            }

            // Create a pending transaction
            const transaction = {
                type: 'Withdraw',
                amount: amount,
                coin: coin,
                address: addr,
                status: 'Pending'
            };

            window.Auth.addTransaction(user.email, transaction);

            // Deduct immediately from client-side UI availability to simulate escrow hold
            user.portfolio.withdrawalAvailable -= amount;
            window.Auth.updateUserPortfolio(user.email, user.portfolio);
            
            // Reload user session state
            const updatedUser = window.Auth.getCurrentUser();
            updateMetricsUI(updatedUser);
            renderTransactions(updatedUser.transactions);
            
            // Show feedback
            const feedback = document.getElementById('withdrawAlert');
            feedback.classList.remove('d-none');
            withdrawForm.reset();

            setTimeout(() => {
                feedback.classList.add('d-none');
            }, 6000);
        });
    }

    // 3. Settings updates
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        // Load initial values
        document.getElementById('set-name').value = user.name;
        document.getElementById('set-email').value = user.email;

        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newName = document.getElementById('set-name').value;
            
            const users = JSON.parse(localStorage.getItem('users')) || {};
            if (users[user.email]) {
                users[user.email].name = newName;
                
                // Handle password modification
                const pass = document.getElementById('set-pass').value;
                if (pass && pass.trim().length >= 8) {
                    // Simulate cryptographic SHA-256 password hash update
                    const hashBuffer = new TextEncoder().encode(pass);
                    crypto.subtle.digest('SHA-256', hashBuffer).then(buffer => {
                        const hashHex = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
                        users[user.email].passwordHash = hashHex;
                        localStorage.setItem('users', JSON.stringify(users));
                    });
                } else {
                    localStorage.setItem('users', JSON.stringify(users));
                }

                // Update session
                const session = JSON.parse(sessionStorage.getItem('current_session'));
                session.name = newName;
                sessionStorage.setItem('current_session', JSON.stringify(session));

                alert('Profile updated successfully');
                location.reload();
            }
        });
    }
}

function renderPortfolioCharts(user) {
    const ctx = document.getElementById('portfolioProgressChart');
    if (!ctx) return;

    if (portfolioChart) {
        portfolioChart.destroy();
    }

    const val = user.portfolio.portfolioValue;

    // Create realistic mock historical performance data leading to the current portfolio value
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    const dataPoints = [
        val * 0.70,
        val * 0.75,
        val * 0.73,
        val * 0.82,
        val * 0.90,
        val * 0.96,
        val
    ];

    portfolioChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value ($)',
                data: dataPoints,
                borderColor: '#D4AF37',
                backgroundColor: 'rgba(212, 175, 55, 0.05)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#FFD700',
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#A0AEC0' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#A0AEC0',
                        callback: (v) => '$' + (v / 1000000) + 'M'
                    }
                }
            }
        }
    });
}

function setupProfitCalculator() {
    const amountInput = document.getElementById('calc-amount');
    const termInput = document.getElementById('calc-term');
    const rateInput = document.getElementById('calc-rate');

    const outputDaily = document.getElementById('calc-out-daily');
    const outputTotal = document.getElementById('calc-out-total');

    if (!amountInput || !outputDaily) return;

    const calculate = () => {
        const amount = parseFloat(amountInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 1.5;
        const term = parseInt(termInput.value) || 30;

        const daily = amount * (rate / 100);
        const total = daily * term;

        outputDaily.textContent = `$${daily.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        outputTotal.textContent = `$${(amount + total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${term} days)`;
    };

    [amountInput, termInput, rateInput].forEach(elem => {
        elem.addEventListener('input', calculate);
        elem.addEventListener('change', calculate);
    });

    calculate();
}

/* ==========================================================================
   ADMIN PANEL ACTIONS & CONTROLLERS
   ========================================================================== */

function loadAdminPanel() {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const pendingDepositsContainer = document.getElementById('admin-deposits-body');
    const pendingWithdrawsContainer = document.getElementById('admin-withdraws-body');
    const totalSystemUsers = document.getElementById('admin-total-users');

    if (!pendingDepositsContainer) return;

    // Count user accounts
    const userEmails = Object.keys(users);
    if (totalSystemUsers) totalSystemUsers.textContent = userEmails.length;

    let pendingDepHtml = '';
    let pendingWdHtml = '';

    userEmails.forEach(email => {
        const userObj = users[email];
        if (!userObj.transactions) return;

        userObj.transactions.forEach((tx, idx) => {
            if (tx.status === 'Pending') {
                if (tx.type === 'Deposit') {
                    pendingDepHtml += `
                        <tr>
                            <td><strong>${userObj.name}</strong><br><small class="text-muted">${email}</small></td>
                            <td>$${tx.amount.toLocaleString()} (${tx.coin})</td>
                            <td><code>${tx.reference || 'None'}</code></td>
                            <td>
                                <button onclick="approveTransaction('${email}', '${tx.id}', 'Deposit')" class="btn btn-success btn-sm me-1"><i class="fas fa-check"></i> Approve</button>
                                <button onclick="rejectTransaction('${email}', '${tx.id}', 'Deposit')" class="btn btn-danger btn-sm"><i class="fas fa-times"></i> Reject</button>
                            </td>
                        </tr>
                    `;
                } else if (tx.type === 'Withdraw') {
                    pendingWdHtml += `
                        <tr>
                            <td><strong>${userObj.name}</strong><br><small class="text-muted">${email}</small></td>
                            <td>$${tx.amount.toLocaleString()} (${tx.coin})</td>
                            <td><code>${tx.address || 'None'}</code></td>
                            <td>
                                <button onclick="approveTransaction('${email}', '${tx.id}', 'Withdraw')" class="btn btn-success btn-sm me-1"><i class="fas fa-check"></i> Approve</button>
                                <button onclick="rejectTransaction('${email}', '${tx.id}', 'Withdraw')" class="btn btn-danger btn-sm"><i class="fas fa-times"></i> Reject</button>
                            </td>
                        </tr>
                    `;
                }
            }
        });
    });

    pendingDepositsContainer.innerHTML = pendingDepHtml || '<tr><td colspan="4" class="text-center text-muted">No pending deposits approval required</td></tr>';
    pendingWithdrawsContainer.innerHTML = pendingWdHtml || '<tr><td colspan="4" class="text-center text-muted">No pending withdrawals approval required</td></tr>';
}

function approveTransaction(email, txId, type) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const userObj = users[email];
    if (!userObj) return;

    const tx = userObj.transactions.find(t => t.id === txId);
    if (tx && tx.status === 'Pending') {
        tx.status = 'Approved';
        
        // Update user metrics
        if (type === 'Deposit') {
            userObj.portfolio.totalDeposits += tx.amount;
            userObj.portfolio.portfolioValue += tx.amount;
        } else if (type === 'Withdraw') {
            userObj.portfolio.portfolioValue -= tx.amount;
        }

        localStorage.setItem('users', JSON.stringify(users));
        
        // Refresh session
        const currentSession = window.Auth.getCurrentUser();
        if (currentSession && currentSession.email === email) {
            updateMetricsUI(currentSession);
            renderTransactions(currentSession.transactions);
            renderPortfolioCharts(currentSession);
        }
        
        loadAdminPanel();
    }
}

function rejectTransaction(email, txId, type) {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const userObj = users[email];
    if (!userObj) return;

    const tx = userObj.transactions.find(t => t.id === txId);
    if (tx && tx.status === 'Pending') {
        tx.status = 'Rejected';

        // Refund withdrawn funds back to availability
        if (type === 'Withdraw') {
            userObj.portfolio.withdrawalAvailable += tx.amount;
        }

        localStorage.setItem('users', JSON.stringify(users));
        
        // Refresh session
        const currentSession = window.Auth.getCurrentUser();
        if (currentSession && currentSession.email === email) {
            updateMetricsUI(currentSession);
            renderTransactions(currentSession.transactions);
        }
        
        loadAdminPanel();
    }
}

// Bind to window for HTML element action triggers
window.approveTransaction = approveTransaction;
window.rejectTransaction = rejectTransaction;

/* ==========================================================================
   EXPANDED FEATURES LOGIC (Compounding, Converter, Tickets, KYC, Theme)
   ========================================================================== */

// 1. Theme Manager (Dark / Light Mode Toggle)
function toggleThemeMode(e) {
    if (e) e.preventDefault();
    const isLight = document.body.classList.toggle('light-mode');
    
    // Custom styling adjustments for Light Mode overrides
    if (isLight) {
        document.documentElement.style.setProperty('--bg-dark', '#F4F6F9');
        document.documentElement.style.setProperty('--bg-card', 'rgba(255, 255, 255, 0.9)');
        document.documentElement.style.setProperty('--text-light', '#1A202C');
        document.documentElement.style.setProperty('--text-muted', '#4A5568');
        document.documentElement.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
        document.getElementById('theme-toggle-text').textContent = 'Dark Mode';
        document.querySelector('.sidebar-link.text-info i').className = 'fas fa-sun';
    } else {
        document.documentElement.style.setProperty('--bg-dark', '#04080F');
        document.documentElement.style.setProperty('--bg-card', 'rgba(11, 25, 44, 0.55)');
        document.documentElement.style.setProperty('--text-light', '#F8F9FA');
        document.documentElement.style.setProperty('--text-muted', '#A0AEC0');
        document.documentElement.style.setProperty('--border-color', 'rgba(212, 175, 55, 0.15)');
        document.getElementById('theme-toggle-text').textContent = 'Light Mode';
        document.querySelector('.sidebar-link.text-info i').className = 'fas fa-moon';
    }
}
window.toggleThemeMode = toggleThemeMode;

// 2. Compound Interest Calculator
function calculateCompounding() {
    const principal = parseFloat(document.getElementById('comp-principal').value) || 0;
    const rate = parseFloat(document.getElementById('comp-rate').value) || 0;
    const term = parseInt(document.getElementById('comp-term').value) || 0;
    const reinvest = parseFloat(document.getElementById('comp-reinvest').value) || 0;

    let balance = principal;
    const dailyRate = rate / 100;
    const reinvestRate = reinvest / 100;

    for (let i = 0; i < term; i++) {
        const interest = balance * dailyRate;
        const reinvestedInterest = interest * reinvestRate;
        balance += reinvestedInterest;
    }

    document.getElementById('comp-total-result').textContent = `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
window.calculateCompounding = calculateCompounding;

// 3. Setup Crypto Converter listeners
function setupConverter() {
    const amountInput = document.getElementById('conv-amount');
    const coinSelect = document.getElementById('conv-coin');
    const outputSpan = document.getElementById('conv-output');

    if (!amountInput || !outputSpan) return;

    const convert = () => {
        const amt = parseFloat(amountInput.value) || 0;
        const coin = coinSelect.value;
        let price = 1;

        if (window.CryptoAPI) {
            const coins = window.CryptoAPI.getCoins();
            if (coins[coin]) price = coins[coin].price;
        }

        outputSpan.textContent = `$${(amt * price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    [amountInput, coinSelect].forEach(el => {
        el.addEventListener('input', convert);
        el.addEventListener('change', convert);
    });

    if (window.CryptoAPI) {
        window.CryptoAPI.onPriceUpdate(convert);
    }
    convert();
}

// 4. Form Actions (KYC & Support Tickets)
document.addEventListener('DOMContentLoaded', () => {
    // Setup converter listeners
    setupConverter();
    
    // Run initial compounding calculation
    if (document.getElementById('comp-principal')) {
        calculateCompounding();
    }

    // KYC Upload Audit Form
    const kycForm = document.getElementById('kycForm');
    if (kycForm) {
        kycForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const badge = document.getElementById('kyc-status-badge');
            const alertBox = document.getElementById('kycAlert');

            if (badge) {
                badge.className = "badge bg-info text-dark fw-bold";
                badge.textContent = "Under Review";
            }
            if (alertBox) {
                alertBox.classList.remove('d-none');
            }
            kycForm.reset();
        });
    }

    // Support Ticket Submission Form
    const ticketForm = document.getElementById('ticketForm');
    const ticketsTableBody = document.getElementById('tickets-logs-body');
    if (ticketForm && ticketsTableBody) {
        ticketForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const category = document.getElementById('t-category').value;
            const subject = document.getElementById('t-subject').value;
            const ref = 'TCK-' + Math.floor(1000 + Math.random() * 9000);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${ref}</strong></td>
                <td>${category.toUpperCase()}</td>
                <td>${subject}</td>
                <td><span class="status-badge pending">Under Review</span></td>
            `;

            ticketsTableBody.insertBefore(row, ticketsTableBody.firstChild);
            ticketForm.reset();
            alert('Support ticket created successfully!');
        });
    }
});
