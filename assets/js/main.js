/* Bit Crypto Chain Investment Crypto Investments - Global Interactions */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic Navbar Scroll Effect
    const navbar = document.querySelector('.navbar-custom');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 2. Set Active Navigation Link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link-custom');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // 3. Render Top Ticker Elements
    const tickerContainer = document.getElementById('live-ticker-container');
    if (tickerContainer && window.CryptoAPI) {
        const renderTicker = (coins) => {
            let html = '<div class="ticker">';
            // Repeat twice for infinite scroll seamless transition
            const coinsList = Object.values(coins);
            const renderItems = () => {
                return coinsList.map(coin => {
                    const isUp = coin.change24h >= 0;
                    const sign = isUp ? '+' : '';
                    const classColor = isUp ? 'ticker-price-up' : 'ticker-price-down';
                    const iconArrow = isUp ? '▲' : '▼';
                    return `
                        <span class="ticker-item">
                            ${coin.name} (${coin.symbol}): 
                            <span class="glow-text-gold">$${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</span>
                            <span class="${classColor} ms-1">${iconArrow} ${sign}${coin.change24h.toFixed(2)}%</span>
                        </span>
                    `;
                }).join('');
            };
            
            html += renderItems() + renderItems() + '</div>';
            tickerContainer.innerHTML = html;
        };

        // Connect to API changes
        window.CryptoAPI.onPriceUpdate(renderTicker);
        // Initial render
        renderTicker(window.CryptoAPI.getCoins());
    }

    // 4. Contact Form Handler (Mock submit)
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('contactAlert');
            if (alertBox) {
                alertBox.className = "alert alert-success animate-fade-in";
                alertBox.innerHTML = "<strong>Success!</strong> Your message has been sent. A Bit Crypto Chain Investment advisor will reach out to you shortly.";
                alertBox.classList.remove('d-none');
                contactForm.reset();
                setTimeout(() => {
                    alertBox.classList.add('d-none');
                }, 6000);
            }
        });
    }

    // 5. Setup dynamic authentication visual hooks (navbar updates)
    setupNavbarAuthUI();
});

function setupNavbarAuthUI() {
    const authPlaceholder = document.getElementById('nav-auth-placeholder');
    if (authPlaceholder && window.Auth) {
        const currentUser = window.Auth.getCurrentUser();
        if (currentUser) {
            authPlaceholder.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="text-light me-3 d-none d-lg-inline">Welcome, <strong>${currentUser.name}</strong></span>
                    <a href="dashboard.html" class="btn btn-outline-gold btn-sm me-2">Dashboard</a>
                    <button onclick="handleLogout()" class="btn btn-dark-glass btn-sm">Logout</button>
                </div>
            `;
        } else {
            authPlaceholder.innerHTML = `
                <a href="login.html" class="btn btn-outline-gold btn-sm me-2">Login</a>
                <a href="signup.html" class="btn btn-gold btn-sm">Get Started</a>
            `;
        }
    }
}

function handleLogout() {
    if (window.Auth) {
        window.Auth.logout();
        window.location.href = 'index.html';
    }
}

// 6. Floating Live Chat Widget Injection & Logic
document.addEventListener('DOMContentLoaded', () => {
    const chatWidgetHTML = `
        <!-- Floating Chat Trigger -->
        <div id="live-chat-trigger" style="position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #D4AF37, #FFD700); box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 9999; border: 2px solid #FFFFFF;">
            <i class="fas fa-comments" style="color: #000000; font-size: 1.6rem;"></i>
        </div>
        
        <!-- Chat Window Container -->
        <div id="live-chat-window" class="glass-panel d-none" style="position: fixed; bottom: 100px; right: 30px; width: 320px; height: 400px; z-index: 9999; overflow: hidden; border: 1px solid var(--accent-gold); display: flex; flex-direction: column; background: #0B192C;">
            <!-- Header -->
            <div style="background: rgba(4, 8, 15, 0.9); padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                <div class="d-flex align-items-center">
                    <span style="display: inline-block; width: 8px; height: 8px; background: #00E676; border-radius: 50%; margin-right: 6px;"></span>
                    <strong style="color: #FFFFFF; font-size: 0.9rem;">Bit Crypto Chain Agent</strong>
                </div>
                <button id="close-chat" style="background: transparent; border: none; color: #FFFFFF; font-size: 1rem; cursor: pointer;"><i class="fas fa-times"></i></button>
            </div>
            <!-- Messages -->
            <div id="chat-messages" style="flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;">
                <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 12px; max-width: 85%; align-self: flex-start;">
                    <p style="margin: 0; font-size: 0.8rem; color: #E2E8F0;">Hello! Welcome to Bit Crypto Chain. How can I assist you with your investments today?</p>
                </div>
            </div>
            <!-- Input Form -->
            <form id="chat-input-form" style="padding: 12px; border-top: 1px solid var(--border-color); display: flex; gap: 6px; background: rgba(4, 8, 15, 0.5);">
                <input type="text" id="chat-input-msg" class="form-control form-control-custom" placeholder="Type a message..." style="height: 32px; font-size: 0.8rem; padding: 4px 10px;" required>
                <button type="submit" class="btn btn-gold" style="padding: 0 12px; height: 32px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-paper-plane" style="color: #000000; font-size: 0.8rem;"></i></button>
            </form>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', chatWidgetHTML);

    const trigger = document.getElementById('live-chat-trigger');
    const windowEl = document.getElementById('live-chat-window');
    const closeBtn = document.getElementById('close-chat');
    const chatForm = document.getElementById('chat-input-form');
    const inputMsg = document.getElementById('chat-input-msg');
    const messagesContainer = document.getElementById('chat-messages');

    if (trigger && windowEl && closeBtn) {
        trigger.addEventListener('click', () => {
            windowEl.classList.toggle('d-none');
        });

        closeBtn.addEventListener('click', () => {
            windowEl.classList.add('d-none');
        });
    }

    if (chatForm && messagesContainer && inputMsg) {
        const botAnswers = [
            "We are currently reviewing your account. To proceed, make sure you complete your profile details.",
            "Our multi-signature cold vaults are online and safe. Your investment allocations accrue daily.",
            "Withdrawal processes are instant. Please verify if your KYC audit forms are fully uploaded.",
            "Thank you for contacting Bit Crypto Chain. An advisor from Zurich or Zurich division will contact you shortly."
        ];
        let replyIndex = 0;

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = inputMsg.value.trim();
            if (!text) return;

            // Append user msg
            const userMsgDiv = document.createElement('div');
            userMsgDiv.style.cssText = "background: rgba(212, 175, 55, 0.15); padding: 8px 12px; border-radius: 12px; max-width: 85%; align-self: flex-end; border: 1px solid rgba(212,175,55,0.15);";
            userMsgDiv.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #FFFFFF;">${text}</p>`;
            messagesContainer.appendChild(userMsgDiv);
            
            inputMsg.value = '';
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Trigger bot reply
            setTimeout(() => {
                const botMsgDiv = document.createElement('div');
                botMsgDiv.style.cssText = "background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 12px; max-width: 85%; align-self: flex-start;";
                const reply = botAnswers[replyIndex % botAnswers.length];
                replyIndex++;
                botMsgDiv.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #E2E8F0;">${reply}</p>`;
                messagesContainer.appendChild(botMsgDiv);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 1000);
        });
    }
});

// Global expose
window.handleLogout = handleLogout;
