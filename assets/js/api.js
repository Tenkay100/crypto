/* Bit Crypto Chain Investment Crypto Investments - API & Price Engine */

const SUPPORTED_COINS = {
    BTC: { name: 'Bitcoin', symbol: 'BTC', price: 92450.00, change24h: 2.45, marketCap: '1.82T', icon: '₿' },
    ETH: { name: 'Ethereum', symbol: 'ETH', price: 3450.00, change24h: -1.20, marketCap: '414.2B', icon: 'Ξ' },
    SOL: { name: 'Solana', symbol: 'SOL', price: 185.50, change24h: 5.82, marketCap: '86.4B', icon: 'S' },
    BNB: { name: 'BNB', symbol: 'BNB', price: 580.20, change24h: 0.15, marketCap: '89.1B', icon: 'B' },
    XRP: { name: 'Ripple', symbol: 'XRP', price: 1.15, change24h: -3.40, marketCap: '65.2B', icon: 'X' },
    ADA: { name: 'Cardano', symbol: 'ADA', price: 0.48, change24h: 1.88, marketCap: '17.1B', icon: 'A' }
};

// Internal memory for keeping historical values to build charts
const priceHistory = {
    BTC: Array.from({ length: 15 }, () => 92000 + Math.random() * 1000),
    ETH: Array.from({ length: 15 }, () => 3400 + Math.random() * 80),
    SOL: Array.from({ length: 15 }, () => 180 + Math.random() * 10),
    BNB: Array.from({ length: 15 }, () => 575 + Math.random() * 10),
    XRP: Array.from({ length: 15 }, () => 1.1 + Math.random() * 0.1),
    ADA: Array.from({ length: 15 }, () => 0.45 + Math.random() * 0.05)
};

// Callback listeners when prices update
const priceUpdateListeners = [];

const CryptoAPI = {
    // Register callback for UI updates
    onPriceUpdate(callback) {
        if (typeof callback === 'function') {
            priceUpdateListeners.push(callback);
        }
    },

    // Get current data
    getCoins() {
        return JSON.parse(JSON.stringify(SUPPORTED_COINS));
    },

    // Fetch from Binance public API (Free, no keys, standard JSON)
    async fetchLivePrices() {
        try {
            const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];
            // We use standard fetch with a timeout
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch('https://api.binance.com/api/v3/ticker/24hr', { signal: controller.signal });
            clearTimeout(id);
            
            if (!response.ok) throw new Error('API Response Error');
            
            const data = await response.json();
            
            // Map the results back to our supported coins
            data.forEach(ticker => {
                const sym = ticker.symbol.replace('USDT', '');
                if (SUPPORTED_COINS[sym]) {
                    const price = parseFloat(ticker.lastPrice);
                    const change = parseFloat(ticker.priceChangePercent);
                    
                    SUPPORTED_COINS[sym].price = price;
                    SUPPORTED_COINS[sym].change24h = change;
                    
                    // Keep history updated
                    priceHistory[sym].push(price);
                    if (priceHistory[sym].length > 20) priceHistory[sym].shift();
                }
            });
            
            this.triggerListeners();
            return true;
        } catch (error) {
            console.warn('Failed to fetch from live Binance API, running simulation fallback: ', error.message);
            this.simulateFluctuations();
            return false;
        }
    },

    // Simulation fallback to give smooth interactive updates
    simulateFluctuations() {
        Object.keys(SUPPORTED_COINS).forEach(key => {
            const coin = SUPPORTED_COINS[key];
            const changePercent = (Math.random() - 0.5) * 0.003; // +- 0.15% fluctuation
            const oldPrice = coin.price;
            const newPrice = oldPrice * (1 + changePercent);
            
            coin.price = Number(newPrice.toFixed(coin.price > 10 ? 2 : 4));
            coin.change24h += Number((changePercent * 100).toFixed(2));
            
            // Limit 24h change to realistic range
            if (coin.change24h > 15) coin.change24h -= 1;
            if (coin.change24h < -15) coin.change24h += 1;
            
            priceHistory[key].push(coin.price);
            if (priceHistory[key].length > 20) priceHistory[key].shift();
        });
        this.triggerListeners();
    },

    triggerListeners() {
        priceUpdateListeners.forEach(listener => {
            try {
                listener(this.getCoins());
            } catch (e) {
                console.error('Error in price listener: ', e);
            }
        });
    },

    // Get historical data for a particular symbol for Chart.js
    getHistory(symbol) {
        return priceHistory[symbol] || [];
    },

    // Helper to start the ticking background loops
    startPriceEngine() {
        // Try live fetch immediately, then check every 30 seconds
        this.fetchLivePrices();
        
        setInterval(() => {
            this.fetchLivePrices();
        }, 30000);

        // Run sub-second micro fluctuations to make the charts/dashboard feel alive
        setInterval(() => {
            this.simulateFluctuations();
        }, 3000);
    },

    // Fetch live news from CryptoCompare API (No Key Required)
    async fetchLiveNews() {
        try {
            const response = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
            if (!response.ok) throw new Error('News API Error');
            const data = await response.json();
            return data.Data.slice(0, 5) || []; // Return top 5 articles
        } catch (error) {
            console.warn('Failed to fetch live crypto news, using fallback local feeds: ', error.message);
            return [
                {
                    title: 'Bitcoin Stabilizes Near Highs as Institutional Interest Continues to Grow',
                    body: 'Global investment desks reported sustained multi-sig wallet accumulation cycles over the last fiscal period.',
                    source: 'CryptoNews Desk',
                    url: '#',
                    imageurl: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&q=80&w=150'
                },
                {
                    title: 'Ethereum Smart Contract Layer Launches Upgrade Resolving Network Congestion',
                    body: 'Developers confirmed the successful deployment of sharding mechanics targeting gas fee volatility limits.',
                    source: 'Chain Ledger Daily',
                    url: '#',
                    imageurl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=150'
                },
                {
                    title: 'Solana Arbitrage Yield Swaps Reach Record Volumes in Defi Pools',
                    body: 'Decentralized liquidity protocols registered high-frequency spread arbitrage trades, confirming bullish sentiments.',
                    source: 'Defi Journal',
                    url: '#',
                    imageurl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=150'
                }
            ];
        }
    }
};

// Export to window
window.CryptoAPI = CryptoAPI;
window.CryptoAPI.startPriceEngine();
