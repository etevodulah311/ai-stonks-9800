/**
 * AI STONKS-9800
 * AI Trading Battle Simulation
 * Styled after STONKS-9800 PC-98 aesthetic
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 400;
const HEIGHT = 300;

ctx.imageSmoothingEnabled = false;

// ============================================
// 8-BIT MUSIC SYSTEM
// ============================================
let audioCtx = null;
let musicPlaying = false;
let musicMuted = false;
let masterGain = null;
let musicInterval = null;

// Musical notes frequencies
const NOTES = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94
};

// Catchy 8-bit melody (Japanese game style)
const MELODY = [
    { note: 'E4', duration: 0.2 }, { note: 'G4', duration: 0.2 }, { note: 'A4', duration: 0.2 }, { note: 'B4', duration: 0.4 },
    { note: 'A4', duration: 0.2 }, { note: 'G4', duration: 0.2 }, { note: 'E4', duration: 0.4 },
    { note: 'D4', duration: 0.2 }, { note: 'E4', duration: 0.2 }, { note: 'G4', duration: 0.4 },
    { note: 'E4', duration: 0.2 }, { note: 'D4', duration: 0.2 }, { note: 'C4', duration: 0.4 },
    { note: 'E4', duration: 0.2 }, { note: 'G4', duration: 0.2 }, { note: 'A4', duration: 0.2 }, { note: 'C5', duration: 0.4 },
    { note: 'B4', duration: 0.2 }, { note: 'A4', duration: 0.2 }, { note: 'G4', duration: 0.4 },
    { note: 'A4', duration: 0.2 }, { note: 'G4', duration: 0.2 }, { note: 'E4', duration: 0.2 }, { note: 'D4', duration: 0.2 },
    { note: 'E4', duration: 0.6 }
];

const BASS = [
    { note: 'C3', duration: 0.4 }, { note: 'G3', duration: 0.4 },
    { note: 'A3', duration: 0.4 }, { note: 'E3', duration: 0.4 },
    { note: 'F3', duration: 0.4 }, { note: 'C3', duration: 0.4 },
    { note: 'G3', duration: 0.4 }, { note: 'G3', duration: 0.4 }
];

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
}

function playNote(freq, duration, type = 'square', volume = 0.3) {
    if (!audioCtx || musicMuted) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.value = freq;
    
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
}

let melodyIndex = 0;
let bassIndex = 0;
let beatCount = 0;

function playMusicTick() {
    if (musicMuted || !musicPlaying) return;
    
    // Play melody
    const melodyNote = MELODY[melodyIndex % MELODY.length];
    playNote(NOTES[melodyNote.note], melodyNote.duration, 'square', 0.15);
    
    // Play bass every 2 beats
    if (beatCount % 2 === 0) {
        const bassNote = BASS[bassIndex % BASS.length];
        playNote(NOTES[bassNote.note], bassNote.duration * 2, 'triangle', 0.2);
        bassIndex++;
    }
    
    // Add some drums (noise)
    if (beatCount % 4 === 0) {
        playDrum();
    }
    
    melodyIndex++;
    beatCount++;
}

function playDrum() {
    if (!audioCtx || musicMuted) return;
    
    const noise = audioCtx.createOscillator();
    const noiseGain = audioCtx.createGain();
    
    noise.type = 'square';
    noise.frequency.value = 100;
    
    noiseGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    noise.connect(noiseGain);
    noiseGain.connect(masterGain);
    
    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.1);
}

function startMusic() {
    if (musicPlaying) return;
    initAudio();
    
    // Resume audio context if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    musicPlaying = true;
    melodyIndex = 0;
    bassIndex = 0;
    beatCount = 0;
    
    // Play at ~150 BPM
    musicInterval = setInterval(playMusicTick, 200);
}

function stopMusic() {
    musicPlaying = false;
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

function toggleMusic() {
    musicMuted = !musicMuted;
    if (!musicMuted && !musicPlaying) {
        startMusic();
    }
}

// ============================================
// MASCOT IMAGE LOADING
// ============================================
let mascotImage = null;
let mascotLoaded = false;
let menuMascotImage = null;
let menuMascotLoaded = false;
let gameBgImage = null;
let gameBgLoaded = false;

function loadMascotImage() {
    mascotImage = new Image();
    mascotImage.onload = () => {
        mascotLoaded = true;
        console.log('Mascot image loaded successfully!');
    };
    mascotImage.onerror = () => {
        console.log('Mascot image not found, using pixel art fallback');
        mascotLoaded = false;
    };
    mascotImage.src = 'amy.png';
    
    // Load menu mascot (amy3)
    menuMascotImage = new Image();
    menuMascotImage.onload = () => {
        menuMascotLoaded = true;
        console.log('Menu mascot loaded!');
    };
    menuMascotImage.onerror = () => {
        console.log('Menu mascot not found');
        menuMascotLoaded = false;
    };
    menuMascotImage.src = 'amy3.png';
    
    // Load game background (amy4)
    gameBgImage = new Image();
    gameBgImage.onload = () => {
        gameBgLoaded = true;
        console.log('Game background loaded!');
    };
    gameBgImage.onerror = () => {
        console.log('Game background not found');
        gameBgLoaded = false;
    };
    gameBgImage.src = 'amy4.png';
}

// ============================================
// COLOR PALETTE (STONKS-9800 Style)
// ============================================
const COLORS = {
    // Backgrounds
    bgDark: '#1a3a3a',
    bgDarker: '#0f2828',
    bgBlack: '#0a0a0f',
    bgPanel: '#d8d0c0',
    bgPanelLight: '#e8e0d0',
    bgPanelDark: '#c8c0b0',
    
    // UI Elements
    topBar: '#4080c0',
    topBarLight: '#60a0e0',
    bottomBar: '#d8d0c0',
    
    // Text
    textDark: '#202020',
    textLight: '#e0e0e0',
    textCyan: '#00d8d8',
    textYellow: '#f0d000',
    textRed: '#e04040',
    textGreen: '#40c040',
    textBlue: '#4080f0',
    textOrange: '#e08040',
    textPink: '#e060a0',
    textPurple: '#a060e0',
    textWhite: '#ffffff',
    
    // Buttons
    btnOrange: '#e8a060',
    btnOrangeDark: '#c08040',
    btnGray: '#a0a0a0',
    btnGrayDark: '#808080',
    btnGreen: '#40c080',
    btnGreenDark: '#309060',
    
    // Chart colors
    chartRed: '#e04040',
    chartYellow: '#e0c040',
    chartGreen: '#40c040',
    chartBlue: '#4080e0',
    chartCyan: '#40c0c0',
    chartPink: '#e060a0',
    chartPurple: '#a060e0',
    chartOrange: '#e08040'
};

// ============================================
// GAME SCREENS
// ============================================
const SCREENS = {
    BOOT: 'boot',
    TITLE: 'title',
    MODE_SELECT: 'mode_select',  // First: choose Demo or Live
    CONFIG: 'config',            // Then: configure game
    GAME: 'game'
};

// ============================================
// GAME CONFIGURATION STATE
// ============================================
const CONFIG_STATE = {
    mode: 'demo',           // 'live' or 'demo'
    selectedAgent: 0,       // 0-3 (ChatGPT, Gemini, Claude, Grok)
    betAmount: 0.1,         // Bet amount in SOL (live) or virtual (demo)
    hasBet: false,          // Whether user has placed a bet
};

// ============================================
// LIVE GAME STATE (Backend Connection)
// ============================================
const LIVE_GAME = {
    // Game timing (10 min = 600 seconds)
    gameDuration: 600,
    bettingCutoff: 240,     // Last 4 minutes (240 seconds) no betting
    
    // Current game state
    gameId: 0,
    startTime: 0,
    timeRemaining: 600,
    phase: 'betting',       // 'betting' or 'watching'
    
    // Real viewers count (0 = no one watching)
    viewers: 0,
    
    // Agent PNL (percentage)
    agentPNL: [0, 0, 0, 0],
    
    // Betting coefficient (decreases over time)
    currentCoefficient: 2.0,
    
    // Winner
    winner: -1,
};

// Fixed asset: Solana only
const TRADING_ASSET = { symbol: 'SOL', name: 'Solana', icon: '◎' };

// AI Agents
const AI_AGENTS_CONFIG = [
    { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', icon: '◆' },
    { id: 'gemini', name: 'Gemini', color: '#4285f4', icon: '●' },
    { id: 'claude', name: 'Claude', color: '#d97706', icon: '▲' },
    { id: 'grok', name: 'Grok', color: '#ef4444', icon: '★' },
];

let currentScreen = SCREENS.BOOT;
let screenTimer = 0;
let titleAlpha = 0;
let menuSelection = 0;
let canInteract = false;

// Japanese 90s stocks
const JAPANESE_STOCKS = [
    { symbol: 'SONY', name: 'Sony Corporation', price: 8500, sector: 'Electronics' },
    { symbol: 'TOYOTA', name: 'Toyota Motor', price: 6200, sector: 'Automotive' },
    { symbol: 'NINTENDO', name: 'Nintendo Co.', price: 12400, sector: 'Gaming' },
    { symbol: 'HONDA', name: 'Honda Motor', price: 4800, sector: 'Automotive' },
    { symbol: 'SEGA', name: 'Sega Enterprises', price: 3200, sector: 'Gaming' },
    { symbol: 'SHARP', name: 'Sharp Corp.', price: 2100, sector: 'Electronics' },
    { symbol: 'CASIO', name: 'Casio Computer', price: 1800, sector: 'Electronics' },
    { symbol: 'BANDAI', name: 'Bandai Co.', price: 4500, sector: 'Toys' }
];

// AI Agents for betting
const AI_BETS = [
    { id: 'chatgpt', name: 'ChatGPT', color: '#10a37f', odds: 2.1, icon: '◆' },
    { id: 'gemini', name: 'Gemini', color: '#4285f4', odds: 2.4, icon: '●' },
    { id: 'opus', name: 'Opus', color: '#d97706', odds: 1.9, icon: '▲' },
    { id: 'grok', name: 'Grok', color: '#ef4444', odds: 3.2, icon: '★' }
];

// Game modes
const GAME_MODES = [
    { id: 'demo', label: 'DEMO MODE', desc: 'Free play with virtual ¥1,000,000', icon: '🎮' },
    { id: 'live', label: 'LIVE MODE', desc: 'Real bets with SOL wallet', icon: '💰' }
];

let selectedStock = 0;
let selectedAgent = 0;
let selectedMode = 0;
let walletConnected = false;
let walletAddress = '';
let walletBalance = 0;
let demoBalance = 1000000;

// Mouse state
let mouseX = 0;
let mouseY = 0;
let mouseClicked = false;

// UI hitboxes (will be set during draw)
const hitboxes = {
    stocks: [],
    agents: [],
    modes: [],
    walletBtn: null,
    startBtn: null
};

// ============================================
// PHANTOM WALLET INTEGRATION
// ============================================
function getProvider() {
    return window.phantom?.solana || window.solana || null;
}

// Wait for Phantom to be available (up to 3 seconds)
async function waitForPhantom() {
    for (let i = 0; i < 30; i++) {
        const provider = getProvider();
        if (provider) return provider;
        await new Promise(r => setTimeout(r, 100));
    }
    return null;
}

async function connectPhantomWallet() {
    // Wait for Phantom to inject (it can take time)
    const provider = await waitForPhantom();
    
    if (!provider) {
        alert('Phantom не найден после ожидания.\n\nПопробуйте обновить страницу (F5).');
        return false;
    }
    
    try {
        // Connect - this opens Phantom popup
        const resp = await provider.connect();
        
        walletAddress = resp.publicKey.toString();
        walletConnected = true;
        
        // Get balance in background
        fetch('https://api.mainnet-beta.solana.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0', id: 1,
                method: 'getBalance',
                params: [walletAddress]
            })
        }).then(r => r.json()).then(d => {
            walletBalance = (d.result?.value || 0) / 1e9;
        }).catch(() => { walletBalance = 0; });
        
        // Listen for disconnect
        provider.on('disconnect', () => {
            walletConnected = false;
            walletAddress = '';
            walletBalance = 0;
        });
        
        return true;
    } catch (err) {
        if (err.code === 4001) {
            console.log('User rejected');
        }
        return false;
    }
}

async function disconnectWallet() {
    const provider = getProvider();
    if (provider) {
        try { await provider.disconnect(); } catch(e) {}
    }
    walletConnected = false;
    walletAddress = '';
    walletBalance = 0;
}

function checkWalletConnection() {
    // Wait for extension to inject, then check if already connected
    setTimeout(() => {
        const provider = getProvider();
        if (provider?.isConnected && provider?.publicKey) {
            walletAddress = provider.publicKey.toString();
            walletConnected = true;
            // Get balance
            fetch('https://api.mainnet-beta.solana.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0', id: 1,
                    method: 'getBalance',
                    params: [walletAddress]
                })
            }).then(r => r.json()).then(d => {
                walletBalance = (d.result?.value || 0) / 1e9;
            }).catch(() => {});
        }
    }, 1500);
}

// ============================================
// MOUSE INPUT HANDLING
// ============================================
function setupMouseHandlers() {
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        mouseX = (e.clientX - rect.left) * scaleX;
        mouseY = (e.clientY - rect.top) * scaleY;
    });
    
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;
        
        handleMenuClick(clickX, clickY);
        handleModeSelectClick(clickX, clickY);
        handleConfigClick(clickX, clickY);
        handleGameTabClick(clickX, clickY);
    });
    
    // Change cursor on hover
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const hoverX = (e.clientX - rect.left) * scaleX;
        const hoverY = (e.clientY - rect.top) * scaleY;
        
        if (currentScreen === SCREENS.MENU) {
            const isOverClickable = isPointInAnyHitbox(hoverX, hoverY);
            canvas.style.cursor = isOverClickable ? 'pointer' : 'default';
        } else if (currentScreen === SCREENS.GAME) {
            // Check game tab hitboxes
            let isOverTab = false;
            gameTabHitboxes.forEach(tab => {
                if (isPointInRect(hoverX, hoverY, tab)) isOverTab = true;
            });
            canvas.style.cursor = isOverTab ? 'pointer' : 'default';
        } else {
            canvas.style.cursor = 'default';
        }
    });
}

function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function isPointInAnyHitbox(x, y) {
    if (hitboxes.walletBtn && isPointInRect(x, y, hitboxes.walletBtn)) return true;
    if (hitboxes.startBtn && isPointInRect(x, y, hitboxes.startBtn)) return true;
    for (const box of hitboxes.stocks) if (isPointInRect(x, y, box)) return true;
    for (const box of hitboxes.agents) if (isPointInRect(x, y, box)) return true;
    for (const box of hitboxes.modes) if (isPointInRect(x, y, box)) return true;
    return false;
}

function handleMenuClick(x, y) {
    if (currentScreen !== SCREENS.MENU) return;
    
    // Check Twitter button
    if (twitterBtnHitbox && isPointInRect(x, y, twitterBtnHitbox)) {
        window.open('https://twitter.com/', '_blank');
        return;
    }
    
    // Check music button
    if (musicBtnHitbox && isPointInRect(x, y, musicBtnHitbox)) {
        toggleMusic();
        if (!musicPlaying && !musicMuted) {
            startMusic();
        }
        return;
    }
    
    // Check wallet button
    if (hitboxes.walletBtn && isPointInRect(x, y, hitboxes.walletBtn)) {
        if (walletConnected) {
            disconnectWallet();
        } else {
            connectPhantomWallet();
        }
        return;
    }
    
    // Check start button
    if (hitboxes.startBtn && isPointInRect(x, y, hitboxes.startBtn)) {
        currentScreen = SCREENS.GAME;
        initGame();
        return;
    }
    
    // Check stocks
    hitboxes.stocks.forEach((box, i) => {
        if (isPointInRect(x, y, box)) {
            selectedStock = box.index;
            menuFocus = 'stocks';
        }
    });
    
    // Check agents
    hitboxes.agents.forEach((box, i) => {
        if (isPointInRect(x, y, box)) {
            selectedAgent = box.index;
            menuFocus = 'agents';
        }
    });
    
    // Check modes
    hitboxes.modes.forEach((box, i) => {
        if (isPointInRect(x, y, box)) {
            selectedMode = box.index;
            menuFocus = 'mode';
        }
    });
}

// ============================================
// AI AGENTS
// ============================================
const AI_AGENTS = [
    {
        id: 'chatgpt',
        name: 'ChatGPT',
        shortName: 'GPT',
        color: COLORS.chartGreen,
        icon: '◆',
        money: 1000000,
        stocks: {},
        priceHistory: [5000],
        stockPrice: 5000,
        personality: { risk: 0.6, speed: 0.7, intelligence: 0.9 },
        trades: 0,
        profit: 0
    },
    {
        id: 'gemini',
        name: 'Gemini',
        shortName: 'GEM',
        color: COLORS.chartBlue,
        icon: '●',
        money: 1000000,
        stocks: {},
        priceHistory: [4800],
        stockPrice: 4800,
        personality: { risk: 0.5, speed: 0.8, intelligence: 0.85 },
        trades: 0,
        profit: 0
    },
    {
        id: 'claude',
        name: 'Claude',
        shortName: 'CLD',
        color: COLORS.chartOrange,
        icon: '▲',
        money: 1000000,
        stocks: {},
        priceHistory: [5200],
        stockPrice: 5200,
        personality: { risk: 0.4, speed: 0.6, intelligence: 0.95 },
        trades: 0,
        profit: 0
    },
    {
        id: 'grok',
        name: 'Grok',
        shortName: 'GRK',
        color: COLORS.chartRed,
        icon: '★',
        money: 1000000,
        stocks: {},
        priceHistory: [4500],
        stockPrice: 4500,
        personality: { risk: 0.9, speed: 0.9, intelligence: 0.7 },
        trades: 0,
        profit: 0
    }
];

// ============================================
// GAME STATE
// ============================================
let gameState = {
    currentView: 'home',
    selectedAgent: 0,
    day: 1,
    month: 1,
    year: 2024,
    dayOfWeek: 0,
    hour: 9,
    minute: 0,
    totalTicks: 0,
    newsLog: [],
    marketTrend: 0,
    lastTradeTime: 0,
    isPaused: false,
    // Game timer (5 minutes = 300 seconds)
    gameTimeLeft: 300,
    gameStartTime: 0,
    gameEnded: false,
    // Bet info (from menu selection)
    betAgentIndex: 0,
    betStockIndex: 0,
    betMode: 'demo'
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ============================================
// BOOT SEQUENCE (Simple single screen)
// ============================================
let bootPhase = 0;
let bootText1Alpha = 0;
let bootText2Alpha = 0;

function updateBootScreen(dt) {
    screenTimer += dt;
    
    // Phase 0: Show first line
    if (bootPhase === 0 && screenTimer > 300) {
        bootText1Alpha = Math.min(1, bootText1Alpha + dt / 500);
        if (screenTimer > 800) {
            bootPhase = 1;
        }
    }
    
    // Phase 1: Show second line
    if (bootPhase === 1) {
        bootText2Alpha = Math.min(1, bootText2Alpha + dt / 500);
        if (screenTimer > 2000) {
            bootPhase = 2;
            canInteract = true;
        }
    }
    
    // Phase 2: Auto-proceed after delay or wait for input
    if (bootPhase === 2 && screenTimer > 3500) {
        currentScreen = SCREENS.TITLE;
        screenTimer = 0;
        canInteract = false;
        // Start music when entering title
        if (!musicMuted) startMusic();
    }
}

function drawBootScreen() {
    // Pure black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // First line - CPU MODE
    ctx.globalAlpha = bootText1Alpha;
    ctx.font = '12px VT323';
    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = 'left';
    ctx.fillText('CPU MODE High', 20, 40);
    
    // Second line - MEMORY
    ctx.globalAlpha = bootText2Alpha;
    ctx.fillText('MEMORY 640KB OK', 20, 58);
    
    ctx.globalAlpha = 1;
}

// ============================================
// TITLE SCREEN
// ============================================
function updateTitleScreen(dt) {
    screenTimer += dt;
    titleAlpha = Math.min(1, screenTimer / 1500);
    
    if (screenTimer > 500) {
        canInteract = true;
    }
}

function drawTitleScreen() {
    // Dark teal background with gradient
    const gradient = ctx.createRadialGradient(WIDTH/2, HEIGHT/2, 0, WIDTH/2, HEIGHT/2, WIDTH);
    gradient.addColorStop(0, '#1a4a4a');
    gradient.addColorStop(1, '#0a2020');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Animated background particles
    ctx.fillStyle = 'rgba(0, 216, 216, 0.1)';
    for (let i = 0; i < 20; i++) {
        const x = (Date.now() / 50 + i * 100) % (WIDTH + 50) - 25;
        const y = Math.sin(Date.now() / 1000 + i) * 50 + HEIGHT / 2;
        ctx.fillRect(x, y, 2, 2);
    }
    
    ctx.globalAlpha = titleAlpha;
    
    // Main title with chromatic aberration
    const titleY = 40;  // Position higher to make room for mascot
    ctx.font = 'bold 48px VT323';
    ctx.textAlign = 'center';
    
    // Red channel (offset left)
    ctx.fillStyle = 'rgba(255, 60, 60, 0.7)';
    ctx.fillText('AI STONKS', WIDTH/2 - 3, titleY);
    
    // Blue channel (offset right)
    ctx.fillStyle = 'rgba(60, 60, 255, 0.7)';
    ctx.fillText('AI STONKS', WIDTH/2 + 3, titleY);
    
    // Main white text
    ctx.fillStyle = COLORS.textWhite;
    ctx.fillText('AI STONKS', WIDTH/2, titleY);
    
    // 9800 subtitle
    ctx.font = 'bold 32px VT323';
    
    // Red channel
    ctx.fillStyle = 'rgba(255, 60, 60, 0.7)';
    ctx.fillText('9800', WIDTH/2 - 2, titleY + 36);
    
    // Blue channel
    ctx.fillStyle = 'rgba(60, 60, 255, 0.7)';
    ctx.fillText('9800', WIDTH/2 + 2, titleY + 36);
    
    // Main text
    ctx.fillStyle = COLORS.textRed;
    ctx.fillText('9800', WIDTH/2, titleY + 36);
    
    // Draw mascot below the 9800 text
    if (mascotLoaded && mascotImage) {
        // Draw the loaded PNG image - scale to fit nicely
        const maxHeight = 180;  // Max height to fit on screen
        const aspectRatio = mascotImage.width / mascotImage.height;
        const imgHeight = maxHeight;
        const imgWidth = imgHeight * aspectRatio;
        const imgX = WIDTH / 2 - imgWidth / 2;
        const imgY = titleY + 50;  // Below 9800 text
        
        // Slight purple glow effect behind the mascot
        ctx.shadowColor = '#9945ff';
        ctx.shadowBlur = 20;
        ctx.drawImage(mascotImage, imgX, imgY, imgWidth, imgHeight);
        ctx.shadowBlur = 0;
    } else {
        // Fallback to pixel art mascot
        drawTitleMascot(WIDTH/2, 180);
    }
    
    // Press Enter prompt (blinking) - position at bottom
    if (canInteract) {
        ctx.font = '14px VT323';
        ctx.fillStyle = COLORS.textCyan;
        
        if (Math.floor(Date.now() / 600) % 2 === 0) {
            ctx.fillText('PRESS 「Enter」 TO START', WIDTH/2, HEIGHT - 25);
        }
    }
    
    // Copyright
    ctx.font = '12px VT323';
    ctx.fillStyle = COLORS.textLight;
    ctx.globalAlpha = titleAlpha * 0.7;
    ctx.fillText('AI STONKS-9800', WIDTH/2, HEIGHT - 8);
    
    ctx.globalAlpha = 1;
}

// ============================================
// LIVE GAME STATE (Synchronized)
// ============================================
function initLiveGame() {
    // Synchronized game based on real time
    // Games start every 10 minutes aligned to UTC clock
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const gameStartTime = Math.floor(now / tenMinutes) * tenMinutes;
    
    LIVE_GAME.gameId = Math.floor(gameStartTime / tenMinutes);
    LIVE_GAME.startTime = gameStartTime;
    
    // Seed for consistent PNL across all clients
    const seed = LIVE_GAME.gameId;
    
    // Reset agent PNL
    LIVE_GAME.agentPNL = [0, 0, 0, 0];
    LIVE_GAME.winner = -1;
    
    // Real viewer count - starts at 0, would be updated from backend
    LIVE_GAME.viewers = 0;
}

function updateLiveGame() {
    const now = Date.now();
    const elapsed = (now - LIVE_GAME.startTime) / 1000;
    
    LIVE_GAME.timeRemaining = Math.max(0, LIVE_GAME.gameDuration - elapsed);
    
    // Check if game ended
    if (LIVE_GAME.timeRemaining <= 0) {
        // Start new game
        initLiveGame();
        return;
    }
    
    // Update phase
    if (LIVE_GAME.timeRemaining <= LIVE_GAME.bettingCutoff) {
        LIVE_GAME.phase = 'watching';
    } else {
        LIVE_GAME.phase = 'betting';
    }
    
    // Calculate coefficient based on time remaining
    // Higher coefficient for earlier entry
    const timeInGame = LIVE_GAME.gameDuration - LIVE_GAME.timeRemaining;
    const maxBettingTime = LIVE_GAME.gameDuration - LIVE_GAME.bettingCutoff;
    const progress = Math.min(1, timeInGame / maxBettingTime);
    LIVE_GAME.currentCoefficient = 2.5 - (progress * 1.3); // 2.5x -> 1.2x
    
    // Simulate agent PNL based on game progress (deterministic based on seed)
    const gameProgress = elapsed / LIVE_GAME.gameDuration;
    const seed = LIVE_GAME.gameId;
    
    for (let i = 0; i < 4; i++) {
        // Each agent has different "strategy" based on seed
        const agentSeed = seed + i * 1000;
        const volatility = 0.5 + (agentSeed % 100) / 200;
        const trend = ((agentSeed % 200) - 100) / 100;
        
        // PNL fluctuates over time (deterministic)
        const noise = Math.sin(elapsed / 10 + i * 2) * volatility;
        const trendEffect = trend * gameProgress * 15;
        
        LIVE_GAME.agentPNL[i] = trendEffect + noise * 5 + (Math.sin(elapsed / 30 + i) * 3);
    }
    
    // Viewers count would come from backend - keeping at 0 for now
    // In production: fetch from WebSocket or API
    
    // Determine winner at end
    if (LIVE_GAME.timeRemaining < 1) {
        let maxPNL = -Infinity;
        for (let i = 0; i < 4; i++) {
            if (LIVE_GAME.agentPNL[i] > maxPNL) {
                maxPNL = LIVE_GAME.agentPNL[i];
                LIVE_GAME.winner = i;
            }
        }
    }
}

// ============================================
// MODE SELECTION SCREEN (First screen after title)
// ============================================
const modeSelectHitboxes = {
    demoBtn: null,
    liveBtn: null
};

function drawModeSelectScreen() {
    // Background with grid
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.strokeStyle = 'rgba(0, 150, 150, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, HEIGHT);
        ctx.stroke();
    }
    for (let i = 0; i < HEIGHT; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(WIDTH, i);
        ctx.stroke();
    }
    
    // Draw amy3 mascot on left
    if (menuMascotLoaded && menuMascotImage) {
        const imgHeight = 200;
        const imgWidth = imgHeight * (menuMascotImage.width / menuMascotImage.height);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(menuMascotImage, -20, HEIGHT - imgHeight - 10, imgWidth, imgHeight);
        ctx.globalAlpha = 1;
    }
    
    // Title
    ctx.font = 'bold 28px VT323';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('SELECT GAME MODE', WIDTH/2 + 50, 50);
    
    // Subtitle
    ctx.font = '12px VT323';
    ctx.fillStyle = '#888';
    ctx.fillText('Choose how you want to play', WIDTH/2 + 50, 70);
    
    // Mode buttons on the right side
    const btnW = 160;
    const btnH = 80;
    const btnX = WIDTH - btnW - 40;
    
    // DEMO MODE Button
    const demoBtn = { x: btnX, y: 100, w: btnW, h: btnH };
    modeSelectHitboxes.demoBtn = demoBtn;
    const isDemoHover = isPointInRect(mouseX, mouseY, demoBtn);
    
    ctx.fillStyle = isDemoHover ? '#1a4a4a' : '#0a3a3a';
    ctx.beginPath();
    ctx.roundRect(demoBtn.x, demoBtn.y, demoBtn.w, demoBtn.h, 8);
    ctx.fill();
    ctx.strokeStyle = isDemoHover ? COLORS.textCyan : '#406060';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = 'bold 18px VT323';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('🎮 DEMO MODE', demoBtn.x + demoBtn.w/2, demoBtn.y + 30);
    
    ctx.font = '10px VT323';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Free play with virtual currency', demoBtn.x + demoBtn.w/2, demoBtn.y + 50);
    ctx.fillText('Practice without risk', demoBtn.x + demoBtn.w/2, demoBtn.y + 65);
    
    // LIVE MODE Button
    const liveBtn = { x: btnX, y: 200, w: btnW, h: btnH };
    modeSelectHitboxes.liveBtn = liveBtn;
    const isLiveHover = isPointInRect(mouseX, mouseY, liveBtn);
    
    ctx.fillStyle = isLiveHover ? '#1a3a1a' : '#0a2a0a';
    ctx.beginPath();
    ctx.roundRect(liveBtn.x, liveBtn.y, liveBtn.w, liveBtn.h, 8);
    ctx.fill();
    ctx.strokeStyle = isLiveHover ? '#50ff50' : '#406040';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = 'bold 18px VT323';
    ctx.fillStyle = '#50ff50';
    ctx.fillText('🟢 LIVE MODE', liveBtn.x + liveBtn.w/2, liveBtn.y + 30);
    
    ctx.font = '10px VT323';
    ctx.fillStyle = '#70ff70';
    ctx.fillText('Real bets with SOL', liveBtn.x + liveBtn.w/2, liveBtn.y + 50);
    ctx.fillText('Win real rewards', liveBtn.x + liveBtn.w/2, liveBtn.y + 65);
    
    // Bottom info
    ctx.font = '10px VT323';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to go back', WIDTH/2, HEIGHT - 10);
}

function handleModeSelectClick(x, y) {
    if (currentScreen !== SCREENS.MODE_SELECT) return;
    
    if (modeSelectHitboxes.demoBtn && isPointInRect(x, y, modeSelectHitboxes.demoBtn)) {
        CONFIG_STATE.mode = 'demo';
        currentScreen = SCREENS.CONFIG;
    }
    
    if (modeSelectHitboxes.liveBtn && isPointInRect(x, y, modeSelectHitboxes.liveBtn)) {
        CONFIG_STATE.mode = 'live';
        currentScreen = SCREENS.CONFIG;
        initLiveGame();
    }
}

// ============================================
// CONFIG SCREEN (After mode selection)
// ============================================
let configSelection = 0;
const configHitboxes = {
    agentButtons: [],
    walletButton: null,
    startButton: null,
    backButton: null,
    betMinusBtn: null,
    betPlusBtn: null,
};

function updateConfigScreen(dt) {
    if (CONFIG_STATE.mode === 'live') {
        updateLiveGame();
    }
}

function drawConfigScreen() {
    // Background
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Grid pattern
    ctx.strokeStyle = 'rgba(0, 150, 150, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i < WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, HEIGHT);
        ctx.stroke();
    }
    for (let i = 0; i < HEIGHT; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(WIDTH, i);
        ctx.stroke();
    }
    
    // Clear hitboxes
    configHitboxes.agentButtons = [];
    
    // Title bar
    const gradient = ctx.createLinearGradient(0, 0, 0, 24);
    gradient.addColorStop(0, '#1a3a4a');
    gradient.addColorStop(1, '#0a2a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, 24);
    ctx.fillStyle = '#00a0a0';
    ctx.fillRect(0, 24, WIDTH, 1);
    
    ctx.font = '12px VT323';
    ctx.textAlign = 'left';
    
    // Mode indicator
    if (CONFIG_STATE.mode === 'live') {
        ctx.fillStyle = '#50ff50';
        ctx.fillText('🟢 LIVE MODE | SELECT AI AGENT', 8, 16);
    } else {
        ctx.fillStyle = COLORS.textCyan;
        ctx.fillText('🎮 DEMO MODE | SELECT AI AGENT', 8, 16);
    }
    
    // Live game info (top right)
    if (CONFIG_STATE.mode === 'live') {
        const mins = Math.floor(LIVE_GAME.timeRemaining / 60);
        const secs = Math.floor(LIVE_GAME.timeRemaining % 60);
        ctx.textAlign = 'right';
        ctx.fillStyle = LIVE_GAME.phase === 'betting' ? COLORS.textGreen : COLORS.textYellow;
        ctx.fillText(`⏱ ${mins}:${String(secs).padStart(2, '0')} | 👁 ${LIVE_GAME.viewers}`, WIDTH - 8, 16);
    }
    
    // === AGENT SELECTION (Left panel) ===
    drawConfigSection(8, 32, 200, 160, `BET ON AI AGENT (◎ ${TRADING_ASSET.symbol})`);
    
    AI_AGENTS_CONFIG.forEach((agent, i) => {
        const agentBtn = { x: 16, y: 52 + i * 36, w: 184, h: 32, index: i };
        configHitboxes.agentButtons.push(agentBtn);
        
        const isHover = isPointInRect(mouseX, mouseY, agentBtn);
        const isSelected = CONFIG_STATE.selectedAgent === i;
        
        if (isSelected) {
            ctx.fillStyle = 'rgba(0, 200, 200, 0.3)';
            ctx.fillRect(agentBtn.x, agentBtn.y, agentBtn.w, agentBtn.h);
            ctx.strokeStyle = agent.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(agentBtn.x, agentBtn.y, agentBtn.w, agentBtn.h);
        } else if (isHover) {
            ctx.fillStyle = 'rgba(0, 100, 100, 0.2)';
            ctx.fillRect(agentBtn.x, agentBtn.y, agentBtn.w, agentBtn.h);
        }
        
        ctx.font = '14px VT323';
        ctx.textAlign = 'left';
        ctx.fillStyle = agent.color;
        ctx.fillText(`${agent.icon} ${agent.name}`, agentBtn.x + 10, agentBtn.y + 14);
        
        // Show PNL
        const pnl = CONFIG_STATE.mode === 'live' ? LIVE_GAME.agentPNL[i] : 0;
        ctx.font = '11px VT323';
        ctx.textAlign = 'right';
        ctx.fillStyle = pnl >= 0 ? COLORS.textGreen : COLORS.textRed;
        ctx.fillText(`${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%`, agentBtn.x + agentBtn.w - 10, agentBtn.y + 14);
        
        // Odds
        ctx.fillStyle = COLORS.textYellow;
        ctx.textAlign = 'left';
        ctx.fillText(`x${(1.5 + i * 0.3).toFixed(1)}`, agentBtn.x + 10, agentBtn.y + 26);
    });
    
    // === RIGHT PANEL: Info & Wallet ===
    if (CONFIG_STATE.mode === 'live') {
        // Live mode info
        drawConfigSection(216, 32, 176, 100, 'LIVE GAME INFO');
        
        ctx.font = '10px VT323';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Game Duration:', 224, 52);
        ctx.fillStyle = COLORS.textCyan;
        ctx.fillText('10 minutes', 310, 52);
        
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Betting Status:', 224, 68);
        ctx.fillStyle = LIVE_GAME.phase === 'betting' ? COLORS.textGreen : COLORS.textRed;
        ctx.fillText(LIVE_GAME.phase === 'betting' ? 'OPEN' : 'CLOSED (4 min left)', 310, 68);
        
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Current Multiplier:', 224, 84);
        ctx.fillStyle = COLORS.textYellow;
        ctx.fillText(`x${LIVE_GAME.currentCoefficient.toFixed(2)}`, 310, 84);
        
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Watching Now:', 224, 100);
        ctx.fillStyle = COLORS.textCyan;
        ctx.fillText(`👁 ${LIVE_GAME.viewers}`, 310, 100);
        
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Asset:', 224, 116);
        ctx.fillStyle = '#14f195';
        ctx.fillText(`${TRADING_ASSET.icon} ${TRADING_ASSET.name}`, 310, 116);
        
        // Wallet section
        drawConfigSection(216, 140, 176, 52, '👻 PHANTOM WALLET');
        
        const walletBtn = { x: 224, y: 158, w: 160, h: 26 };
        configHitboxes.walletButton = walletBtn;
        const isWalletHover = isPointInRect(mouseX, mouseY, walletBtn);
        
        if (walletConnected) {
            ctx.fillStyle = '#14f195';
            ctx.beginPath();
            ctx.roundRect(walletBtn.x, walletBtn.y, walletBtn.w, walletBtn.h, 4);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = '10px VT323';
            ctx.textAlign = 'center';
            ctx.fillText('✓ ' + walletAddress.substring(0, 6) + '...' + walletAddress.slice(-4), walletBtn.x + walletBtn.w/2, walletBtn.y + 17);
        } else {
            ctx.fillStyle = isWalletHover ? '#ab6bff' : '#9945ff';
            ctx.beginPath();
            ctx.roundRect(walletBtn.x, walletBtn.y, walletBtn.w, walletBtn.h, 4);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '11px VT323';
            ctx.textAlign = 'center';
            ctx.fillText('Connect Wallet to Bet', walletBtn.x + walletBtn.w/2, walletBtn.y + 17);
        }
        
        // === BET AMOUNT SECTION ===
        drawConfigSection(216, 198, 176, 50, '◎ BET AMOUNT (SOL)');
        
        // Minus button
        const minusBtn = { x: 224, y: 216, w: 32, h: 26 };
        configHitboxes.betMinusBtn = minusBtn;
        const isMinusHover = isPointInRect(mouseX, mouseY, minusBtn);
        
        ctx.fillStyle = isMinusHover ? '#ff6060' : '#a04040';
        ctx.beginPath();
        ctx.roundRect(minusBtn.x, minusBtn.y, minusBtn.w, minusBtn.h, 4);
        ctx.fill();
        ctx.strokeStyle = isMinusHover ? '#ff8080' : '#804040';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('−', minusBtn.x + minusBtn.w/2, minusBtn.y + 19);
        
        // Bet amount display
        const amountBox = { x: 260, y: 216, w: 88, h: 26 };
        ctx.fillStyle = '#0a2a3a';
        ctx.beginPath();
        ctx.roundRect(amountBox.x, amountBox.y, amountBox.w, amountBox.h, 4);
        ctx.fill();
        ctx.strokeStyle = '#14f195';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#14f195';
        ctx.font = 'bold 14px VT323';
        ctx.textAlign = 'center';
        ctx.fillText(`${CONFIG_STATE.betAmount.toFixed(2)} SOL`, amountBox.x + amountBox.w/2, amountBox.y + 18);
        
        // Plus button
        const plusBtn = { x: 352, y: 216, w: 32, h: 26 };
        configHitboxes.betPlusBtn = plusBtn;
        const isPlusHover = isPointInRect(mouseX, mouseY, plusBtn);
        
        ctx.fillStyle = isPlusHover ? '#60ff60' : '#40a040';
        ctx.beginPath();
        ctx.roundRect(plusBtn.x, plusBtn.y, plusBtn.w, plusBtn.h, 4);
        ctx.fill();
        ctx.strokeStyle = isPlusHover ? '#80ff80' : '#408040';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('+', plusBtn.x + plusBtn.w/2, plusBtn.y + 19);
        
    } else {
        // Demo mode info
        drawConfigSection(216, 32, 176, 160, 'DEMO MODE INFO');
        
        ctx.font = '11px VT323';
        ctx.textAlign = 'left';
        
        ctx.fillStyle = COLORS.textCyan;
        ctx.fillText('Practice Mode', 224, 52);
        
        ctx.fillStyle = COLORS.textLight;
        ctx.fillText('Duration: 10 minutes', 224, 72);
        ctx.fillText('Asset: ' + TRADING_ASSET.icon + ' ' + TRADING_ASSET.name, 224, 88);
        
        ctx.fillStyle = COLORS.textYellow;
        ctx.fillText('Virtual Balance:', 224, 110);
        ctx.fillText('¥1,000,000', 224, 126);
        
        ctx.fillStyle = '#888';
        ctx.fillText('No wallet required', 224, 150);
        ctx.fillText('No real rewards', 224, 166);
        ctx.fillText('Same gameplay as Live', 224, 182);
        
        configHitboxes.walletButton = null;
    }
    
    // === START BUTTON ===
    const startBtn = { x: 8, y: HEIGHT - 45, w: WIDTH - 16, h: 36 };
    configHitboxes.startButton = startBtn;
    const isStartHover = isPointInRect(mouseX, mouseY, startBtn);
    
    const canBet = CONFIG_STATE.mode === 'demo' || 
                   (CONFIG_STATE.mode === 'live' && LIVE_GAME.phase === 'betting');
    
    const startGradient = ctx.createLinearGradient(startBtn.x, startBtn.y, startBtn.x, startBtn.y + startBtn.h);
    if (isStartHover) {
        startGradient.addColorStop(0, '#60ffa0');
        startGradient.addColorStop(1, '#40d080');
    } else {
        startGradient.addColorStop(0, '#40d080');
        startGradient.addColorStop(1, '#20a060');
    }
    
    ctx.fillStyle = startGradient;
    ctx.beginPath();
    ctx.roundRect(startBtn.x, startBtn.y, startBtn.w, startBtn.h, 6);
    ctx.fill();
    
    if (isStartHover) {
        ctx.shadowColor = '#40d080';
        ctx.shadowBlur = 15;
    }
    ctx.strokeStyle = '#80ffc0';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 18px VT323';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0a2a1a';
    
    if (CONFIG_STATE.mode === 'live' && !canBet) {
        ctx.fillText('👁 WATCH BATTLE (Betting Closed)', WIDTH/2, startBtn.y + 24);
    } else {
        ctx.fillText('▶ START BATTLE', WIDTH/2, startBtn.y + 24);
    }
    
    // Bottom info
    ctx.font = '9px VT323';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to change mode | ↑↓ Select agent | Enter to start', WIDTH/2, HEIGHT - 6);
}

function drawConfigSection(x, y, w, h, title) {
    ctx.fillStyle = 'rgba(0, 50, 50, 0.5)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#406060';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(x + 8, y - 6, ctx.measureText(title).width + 8, 12);
    ctx.font = '10px VT323';
    ctx.fillStyle = COLORS.textCyan;
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 12, y + 3);
}

function handleConfigClick(x, y) {
    if (currentScreen !== SCREENS.CONFIG) return;
    
    // Agent buttons
    configHitboxes.agentButtons.forEach(btn => {
        if (isPointInRect(x, y, btn)) {
            CONFIG_STATE.selectedAgent = btn.index;
        }
    });
    
    // Wallet button (Live mode only)
    if (configHitboxes.walletButton && isPointInRect(x, y, configHitboxes.walletButton)) {
        if (CONFIG_STATE.mode === 'live') {
            if (walletConnected) {
                disconnectWallet();
            } else {
                connectPhantomWallet();
            }
        }
    }
    
    // Bet amount minus button (Live mode only)
    if (configHitboxes.betMinusBtn && isPointInRect(x, y, configHitboxes.betMinusBtn)) {
        if (CONFIG_STATE.mode === 'live') {
            CONFIG_STATE.betAmount = Math.max(0.01, CONFIG_STATE.betAmount - 0.1);
            CONFIG_STATE.betAmount = Math.round(CONFIG_STATE.betAmount * 100) / 100; // Round to 2 decimals
        }
    }
    
    // Bet amount plus button (Live mode only)
    if (configHitboxes.betPlusBtn && isPointInRect(x, y, configHitboxes.betPlusBtn)) {
        if (CONFIG_STATE.mode === 'live') {
            // Limit to wallet balance if connected
            const maxBet = walletConnected ? walletBalance : 100;
            CONFIG_STATE.betAmount = Math.min(maxBet, CONFIG_STATE.betAmount + 0.1);
            CONFIG_STATE.betAmount = Math.round(CONFIG_STATE.betAmount * 100) / 100; // Round to 2 decimals
        }
    }
    
    // Start button
    if (configHitboxes.startButton && isPointInRect(x, y, configHitboxes.startButton)) {
        startGame();
    }
}

function startGame() {
    currentScreen = SCREENS.GAME;
    initGame();
}

function drawTitleMascot(x, y) {
    // Anime girl mascot (Amy-style from STONKS-9800)
    const s = 2; // scale
    
    // Hair back (long purple hair)
    ctx.fillStyle = '#6030a0';
    ctx.fillRect(x - 24*s, y - 20*s, 48*s, 50*s);
    
    // Hair main (purple)
    ctx.fillStyle = '#8040c0';
    ctx.fillRect(x - 20*s, y - 24*s, 40*s, 20*s);
    ctx.fillRect(x - 22*s, y - 16*s, 8*s, 40*s);
    ctx.fillRect(x + 14*s, y - 16*s, 8*s, 40*s);
    
    // Hair bangs
    ctx.fillStyle = '#9050d0';
    ctx.fillRect(x - 16*s, y - 20*s, 32*s, 8*s);
    ctx.fillRect(x - 12*s, y - 12*s, 6*s, 4*s);
    ctx.fillRect(x + 6*s, y - 12*s, 6*s, 4*s);
    
    // Face
    ctx.fillStyle = '#f0d0b8';
    ctx.fillRect(x - 12*s, y - 12*s, 24*s, 20*s);
    
    // Neck
    ctx.fillRect(x - 4*s, y + 8*s, 8*s, 6*s);
    
    // Body / Blazer (teal)
    ctx.fillStyle = '#40a0a0';
    ctx.fillRect(x - 16*s, y + 14*s, 32*s, 24*s);
    
    // Inner top (yellow)
    ctx.fillStyle = '#e0c040';
    ctx.fillRect(x - 6*s, y + 14*s, 12*s, 10*s);
    
    // Blazer lapels
    ctx.fillStyle = '#308080';
    ctx.fillRect(x - 14*s, y + 14*s, 6*s, 16*s);
    ctx.fillRect(x + 8*s, y + 14*s, 6*s, 16*s);
    
    // Eyes (big anime eyes)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 10*s, y - 6*s, 8*s, 6*s);
    ctx.fillRect(x + 2*s, y - 6*s, 8*s, 6*s);
    
    // Pupils
    ctx.fillStyle = '#4040a0';
    ctx.fillRect(x - 8*s, y - 5*s, 5*s, 5*s);
    ctx.fillRect(x + 4*s, y - 5*s, 5*s, 5*s);
    
    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 7*s, y - 4*s, 2*s, 2*s);
    ctx.fillRect(x + 5*s, y - 4*s, 2*s, 2*s);
    
    // Glasses
    ctx.strokeStyle = '#c0c0c0';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 11*s, y - 7*s, 10*s, 8*s);
    ctx.strokeRect(x + 1*s, y - 7*s, 10*s, 8*s);
    ctx.beginPath();
    ctx.moveTo(x - 1*s, y - 3*s);
    ctx.lineTo(x + 1*s, y - 3*s);
    ctx.stroke();
    
    // Eyebrows
    ctx.fillStyle = '#6030a0';
    ctx.fillRect(x - 9*s, y - 9*s, 6*s, 1*s);
    ctx.fillRect(x + 3*s, y - 9*s, 6*s, 1*s);
    
    // Nose
    ctx.fillStyle = '#e0b8a0';
    ctx.fillRect(x - 1*s, y + 0*s, 2*s, 2*s);
    
    // Mouth (small smile)
    ctx.fillStyle = '#d08080';
    ctx.fillRect(x - 3*s, y + 4*s, 6*s, 2*s);
    
    // Earrings (red)
    ctx.fillStyle = '#e04040';
    ctx.beginPath();
    ctx.arc(x - 14*s, y + 2*s, 3*s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 14*s, y + 2*s, 3*s, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair highlights
    ctx.fillStyle = '#a060e0';
    ctx.fillRect(x - 18*s, y - 18*s, 3*s, 12*s);
    ctx.fillRect(x + 15*s, y - 18*s, 3*s, 12*s);
    
    // Music notes (animated)
    const noteOffset = Math.sin(Date.now() / 300) * 3;
    ctx.fillStyle = COLORS.textYellow;
    ctx.font = '14px VT323';
    ctx.fillText('♪', x + 30*s, y - 20*s + noteOffset);
    ctx.fillText('♫', x + 36*s, y - 28*s - noteOffset);
}

// ============================================
// MAIN MENU - AI BETTING PLATFORM
// ============================================
let menuFocus = 'stocks'; // stocks, agents, mode
let menuTimer = 0;

function updateMenuScreen(dt) {
    screenTimer += dt;
    menuTimer += dt;
}

function drawMenuScreen() {
    // Background - dark blue/teal
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Grid pattern
    ctx.strokeStyle = 'rgba(0, 150, 150, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, HEIGHT);
        ctx.stroke();
    }
    for (let i = 0; i < HEIGHT; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(WIDTH, i);
        ctx.stroke();
    }
    
    // Draw amy3 mascot in bottom left area
    if (menuMascotLoaded && menuMascotImage) {
        const imgHeight = 140;
        const imgWidth = imgHeight * (menuMascotImage.width / menuMascotImage.height);
        const imgX = -20;  // Slightly off-screen left
        const imgY = HEIGHT - imgHeight - 20;  // Bottom area
        
        ctx.globalAlpha = 0.7;
        ctx.drawImage(menuMascotImage, imgX, imgY, imgWidth, imgHeight);
        ctx.globalAlpha = 1;
    }
    
    // Top bar
    drawMenuTopBar();
    
    // Left panel - Japanese Stocks
    drawStocksPanel(4, 24, 130, 145);
    
    // Center panel - AI Agents to bet on
    drawAgentsPanel(138, 24, 128, 145);
    
    // Right panel - Wallet & Balance
    drawWalletPanel(270, 24, 126, 70);
    
    // Mode selection panel
    drawModePanel(270, 98, 126, 71);
    
    // Bottom - Start button & info
    drawBottomSection();
    
    // Navigation hints
    drawNavHints();
}

// Music button hitbox
let musicBtnHitbox = null;
let twitterBtnHitbox = null;

function drawMenuTopBar() {
    // Top bar background
    const gradient = ctx.createLinearGradient(0, 0, 0, 20);
    gradient.addColorStop(0, '#1a3a4a');
    gradient.addColorStop(1, '#0a2a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, 20);
    
    // Border
    ctx.fillStyle = '#00a0a0';
    ctx.fillRect(0, 20, WIDTH, 1);
    
    // Title
    ctx.font = '10px VT323';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('AI STONKS-9800 | 株式取引', 6, 14);
    
    // Twitter/X button
    const twitterBtnX = WIDTH - 140;
    const twitterBtnY = 4;
    const twitterBtnW = 20;
    const twitterBtnH = 12;
    
    twitterBtnHitbox = { x: twitterBtnX, y: twitterBtnY, w: twitterBtnW, h: twitterBtnH };
    const isTwitterHovered = isPointInRect(mouseX, mouseY, twitterBtnHitbox);
    
    ctx.fillStyle = isTwitterHovered ? '#1a8cd8' : '#0a5c98';
    ctx.beginPath();
    ctx.roundRect(twitterBtnX, twitterBtnY, twitterBtnW, twitterBtnH, 4);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px VT323';
    ctx.textAlign = 'center';
    ctx.fillText('𝕏', twitterBtnX + 10, 13);
    
    // Music toggle button
    const musicBtnX = WIDTH - 115;
    const musicBtnY = 4;
    const musicBtnW = 20;
    const musicBtnH = 12;
    
    musicBtnHitbox = { x: musicBtnX, y: musicBtnY, w: musicBtnW, h: musicBtnH };
    const isMusicHovered = isPointInRect(mouseX, mouseY, musicBtnHitbox);
    
    ctx.fillStyle = isMusicHovered ? '#404060' : '#303050';
    ctx.beginPath();
    ctx.roundRect(musicBtnX, musicBtnY, musicBtnW, musicBtnH, 4);
    ctx.fill();
    ctx.fillStyle = musicMuted ? '#ff4040' : '#40ff40';
    ctx.font = '10px VT323';
    ctx.textAlign = 'center';
    ctx.fillText(musicMuted ? '🔇' : '🔊', musicBtnX + 10, 13);
    
    // Solana wallet button (right side)
    const btnX = WIDTH - 90;
    const btnY = 4;
    const btnW = 86;
    const btnH = 12;
    
    // Register hitbox
    hitboxes.walletBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
    
    // Check hover
    const isHovered = isPointInRect(mouseX, mouseY, hitboxes.walletBtn);
    
    if (walletConnected) {
        ctx.fillStyle = isHovered ? '#20ffaa' : '#14f195';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = '8px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('◉ ' + walletAddress.substring(0, 4) + '...' + walletAddress.slice(-4), btnX + 43, 12);
    } else {
        ctx.fillStyle = isHovered ? '#ab6bff' : '#9945ff';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '8px VT323';
        ctx.textAlign = 'center';
        ctx.fillText('👻 Connect Phantom', btnX + 43, 12);
    }
}

function drawStocksPanel(x, y, w, h) {
    const isActive = menuFocus === 'stocks';
    
    // Clear hitboxes
    hitboxes.stocks = [];
    
    // Panel background
    ctx.fillStyle = isActive ? 'rgba(0, 100, 100, 0.3)' : 'rgba(0, 50, 50, 0.2)';
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = isActive ? COLORS.textCyan : '#406060';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x, y, w, h);
    
    // Title
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(x + 10, y - 5, 70, 10);
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textCyan;
    ctx.textAlign = 'left';
    ctx.fillText('日本株式 90s', x + 12, y + 3);
    
    // Stock list
    const visibleStocks = JAPANESE_STOCKS.slice(0, 6);
    visibleStocks.forEach((stock, i) => {
        const itemY = y + 14 + i * 20;
        const itemBox = { x: x + 4, y: itemY - 2, w: w - 8, h: 18, index: i };
        hitboxes.stocks.push(itemBox);
        
        const isSelected = i === selectedStock;
        const isHovered = isPointInRect(mouseX, mouseY, itemBox);
        
        if (isSelected) {
            ctx.fillStyle = 'rgba(0, 200, 200, 0.3)';
            ctx.fillRect(x + 4, itemY - 2, w - 8, 18);
        } else if (isHovered) {
            ctx.fillStyle = 'rgba(0, 150, 150, 0.2)';
            ctx.fillRect(x + 4, itemY - 2, w - 8, 18);
        }
        
        // Symbol
        ctx.font = '10px VT323';
        ctx.fillStyle = isSelected ? COLORS.textYellow : (isHovered ? COLORS.textCyan : COLORS.textGreen);
        ctx.textAlign = 'left';
        ctx.fillText(stock.symbol, x + 8, itemY + 8);
        
        // Price
        ctx.fillStyle = COLORS.textLight;
        ctx.font = '8px VT323';
        ctx.textAlign = 'right';
        ctx.fillText('¥' + stock.price.toLocaleString(), x + w - 8, itemY + 8);
    });
    
    // Scroll indicator
    ctx.fillStyle = COLORS.textCyan;
    ctx.font = '8px VT323';
    ctx.textAlign = 'center';
    ctx.fillText('▼ more', x + w/2, y + h - 6);
}

function drawAgentsPanel(x, y, w, h) {
    const isActive = menuFocus === 'agents';
    
    // Clear hitboxes
    hitboxes.agents = [];
    
    // Panel background
    ctx.fillStyle = isActive ? 'rgba(100, 50, 0, 0.3)' : 'rgba(50, 25, 0, 0.2)';
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = isActive ? COLORS.textOrange : '#604020';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x, y, w, h);
    
    // Title
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(x + 10, y - 5, 85, 10);
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textOrange;
    ctx.textAlign = 'left';
    ctx.fillText('BET ON AI AGENT', x + 12, y + 3);
    
    // Agent list
    AI_BETS.forEach((agent, i) => {
        const itemY = y + 16 + i * 32;
        const itemBox = { x: x + 4, y: itemY - 4, w: w - 8, h: 28, index: i };
        hitboxes.agents.push(itemBox);
        
        const isSelected = i === selectedAgent;
        const isHovered = isPointInRect(mouseX, mouseY, itemBox);
        
        // Selection/hover highlight
        if (isSelected) {
            ctx.fillStyle = 'rgba(255, 150, 0, 0.2)';
            ctx.fillRect(x + 4, itemY - 4, w - 8, 28);
            ctx.strokeStyle = agent.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 4, itemY - 4, w - 8, 28);
        } else if (isHovered) {
            ctx.fillStyle = 'rgba(255, 150, 0, 0.1)';
            ctx.fillRect(x + 4, itemY - 4, w - 8, 28);
        }
        
        // Agent icon
        ctx.fillStyle = agent.color;
        ctx.font = '14px VT323';
        ctx.textAlign = 'left';
        ctx.fillText(agent.icon, x + 10, itemY + 10);
        
        // Agent name
        ctx.font = '10px VT323';
        ctx.fillStyle = isSelected || isHovered ? '#fff' : COLORS.textLight;
        ctx.fillText(agent.name, x + 28, itemY + 8);
        
        // Odds
        ctx.fillStyle = COLORS.textYellow;
        ctx.font = '9px VT323';
        ctx.fillText('x' + agent.odds.toFixed(1), x + 28, itemY + 18);
        
        // Win indicator (animated)
        if (isSelected) {
            const pulse = Math.sin(menuTimer / 200) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 200, 0, ${pulse * 0.5})`;
            ctx.beginPath();
            ctx.arc(x + w - 15, itemY + 8, 6, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function drawWalletPanel(x, y, w, h) {
    // Panel background
    ctx.fillStyle = 'rgba(100, 0, 100, 0.2)';
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = '#9945ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    
    // Title
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(x + 10, y - 5, 80, 10);
    ctx.font = '9px VT323';
    ctx.fillStyle = '#9945ff';
    ctx.textAlign = 'left';
    ctx.fillText('👻 PHANTOM', x + 14, y + 3);
    
    // Solana logo
    ctx.fillStyle = '#9945ff';
    ctx.font = '16px VT323';
    ctx.fillText('◎', x + 10, y + 26);
    
    // Balance
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textLight;
    ctx.fillText('SOL Balance:', x + 30, y + 22);
    
    if (walletConnected) {
        ctx.fillStyle = '#14f195';
        ctx.font = '12px VT323';
        ctx.fillText(walletBalance.toFixed(4) + ' SOL', x + 30, y + 36);
    } else {
        ctx.fillStyle = '#666';
        ctx.font = '9px VT323';
        ctx.fillText('Click to connect', x + 30, y + 36);
    }
    
    // Demo balance
    ctx.fillStyle = COLORS.textCyan;
    ctx.font = '8px VT323';
    ctx.fillText('Demo: ¥' + demoBalance.toLocaleString(), x + 10, y + 54);
}

function drawModePanel(x, y, w, h) {
    const isActive = menuFocus === 'mode';
    
    // Clear hitboxes
    hitboxes.modes = [];
    
    // Panel background
    ctx.fillStyle = isActive ? 'rgba(0, 100, 50, 0.3)' : 'rgba(0, 50, 25, 0.2)';
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = isActive ? COLORS.textGreen : '#305030';
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeRect(x, y, w, h);
    
    // Title
    ctx.fillStyle = '#0a1a2a';
    ctx.fillRect(x + 10, y - 5, 65, 10);
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textGreen;
    ctx.textAlign = 'left';
    ctx.fillText('GAME MODE', x + 12, y + 3);
    
    // Mode options
    GAME_MODES.forEach((mode, i) => {
        const itemY = y + 18 + i * 26;
        const itemBox = { x: x + 4, y: itemY - 4, w: w - 8, h: 22, index: i };
        hitboxes.modes.push(itemBox);
        
        const isSelected = i === selectedMode;
        const isHovered = isPointInRect(mouseX, mouseY, itemBox);
        
        if (isSelected) {
            ctx.fillStyle = 'rgba(0, 200, 100, 0.3)';
            ctx.fillRect(x + 4, itemY - 4, w - 8, 22);
        } else if (isHovered) {
            ctx.fillStyle = 'rgba(0, 150, 75, 0.2)';
            ctx.fillRect(x + 4, itemY - 4, w - 8, 22);
        }
        
        // Icon
        ctx.font = '12px VT323';
        ctx.fillText(mode.icon, x + 10, itemY + 10);
        
        // Label
        ctx.font = '9px VT323';
        ctx.fillStyle = isSelected || isHovered ? COLORS.textYellow : COLORS.textLight;
        ctx.fillText(mode.label, x + 28, itemY + 6);
        
        // Description
        ctx.fillStyle = '#666';
        ctx.font = '7px VT323';
        const desc = mode.desc.length > 18 ? mode.desc.substring(0, 18) + '...' : mode.desc;
        ctx.fillText(desc, x + 28, itemY + 14);
    });
}

function drawBottomSection() {
    const y = 175;
    
    // Selected bet summary
    ctx.fillStyle = 'rgba(0, 50, 50, 0.5)';
    ctx.fillRect(4, y, 262, 35);
    ctx.strokeStyle = COLORS.textCyan;
    ctx.lineWidth = 1;
    ctx.strokeRect(4, y, 262, 35);
    
    // Summary text
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = 'left';
    ctx.fillText('YOUR BET:', 10, y + 12);
    
    const agent = AI_BETS[selectedAgent];
    const stock = JAPANESE_STOCKS[selectedStock];
    const mode = GAME_MODES[selectedMode];
    
    ctx.fillStyle = agent.color;
    ctx.fillText(`${agent.icon} ${agent.name}`, 60, y + 12);
    
    ctx.fillStyle = COLORS.textGreen;
    ctx.fillText(`on ${stock.symbol}`, 130, y + 12);
    
    ctx.fillStyle = COLORS.textYellow;
    ctx.fillText(`Odds: x${agent.odds}`, 10, y + 26);
    
    ctx.fillStyle = mode.id === 'demo' ? COLORS.textCyan : '#14f195';
    ctx.fillText(`Mode: ${mode.label}`, 80, y + 26);
    
    // Potential win
    const betAmount = mode.id === 'demo' ? 10000 : 0.1;
    const potentialWin = betAmount * agent.odds;
    ctx.fillStyle = COLORS.textYellow;
    ctx.fillText(`Win: ${mode.id === 'demo' ? '¥' + potentialWin.toLocaleString() : potentialWin.toFixed(2) + ' SOL'}`, 170, y + 26);
    
    // START button
    const btnX = 270;
    const btnW = 126;
    const btnH = 35;
    
    // Register hitbox
    hitboxes.startBtn = { x: btnX, y: y, w: btnW, h: btnH };
    const isHovered = isPointInRect(mouseX, mouseY, hitboxes.startBtn);
    
    const gradient = ctx.createLinearGradient(btnX, y, btnX, y + btnH);
    if (isHovered) {
        gradient.addColorStop(0, '#70ff90');
        gradient.addColorStop(1, '#50e070');
    } else {
        gradient.addColorStop(0, '#50e080');
        gradient.addColorStop(1, '#30c060');
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(btnX, y, btnW, btnH, 4);
    ctx.fill();
    
    // Button glow
    ctx.shadowColor = '#50e080';
    ctx.shadowBlur = isHovered ? 15 : 10;
    ctx.strokeStyle = isHovered ? '#a0ffc0' : '#80ffa0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btnX, y, btnW, btnH, 4);
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Button text
    ctx.fillStyle = '#0a2a1a';
    ctx.font = 'bold 14px VT323';
    ctx.textAlign = 'center';
    ctx.fillText('▶ START BATTLE', btnX + btnW/2, y + 14);
    
    ctx.font = '9px VT323';
    ctx.fillText(isHovered ? 'Click to start!' : '「Enter」', btnX + btnW/2, y + 28);
}

function drawNavHints() {
    const y = HEIGHT - 14;
    
    ctx.font = '9px VT323';
    ctx.textAlign = 'left';
    
    // Navigation
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('←→', 8, y);
    ctx.fillStyle = '#888';
    ctx.fillText('Switch panel', 28, y);
    
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('↑↓', 100, y);
    ctx.fillStyle = '#888';
    ctx.fillText('Select', 116, y);
    
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('「W」', 160, y);
    ctx.fillStyle = '#888';
    ctx.fillText('Wallet', 182, y);
    
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('「Enter」', 220, y);
    ctx.fillStyle = '#888';
    ctx.fillText('Start', 260, y);
    
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText('「Esc」', 300, y);
    ctx.fillStyle = '#888';
    ctx.fillText('Back', 330, y);
}

// ============================================
// MARKET SIMULATION
// ============================================
function simulateMarket() {
    if (gameState.isPaused) return;
    
    gameState.totalTicks++;
    
    // Time progression
    gameState.minute += 10;
    if (gameState.minute >= 60) {
        gameState.minute = 0;
        gameState.hour++;
        if (gameState.hour >= 18) {
            gameState.hour = 9;
            gameState.day++;
            gameState.dayOfWeek = (gameState.dayOfWeek + 1) % 7;
            if (gameState.day > 28) {
                gameState.day = 1;
                gameState.month++;
                if (gameState.month > 12) {
                    gameState.month = 1;
                    gameState.year++;
                }
            }
        }
    }
    
    // Weekend - no trading
    if (gameState.dayOfWeek >= 5) return;
    
    // Update market trend occasionally
    if (Math.random() < 0.02) {
        gameState.marketTrend = Math.floor(Math.random() * 3) - 1;
        if (gameState.marketTrend === 1) {
            addNews('Market sentiment turning BULLISH! 📈', COLORS.textGreen);
        } else if (gameState.marketTrend === -1) {
            addNews('Market sentiment turning BEARISH! 📉', COLORS.textRed);
        }
    }
    
    // Update each AI's stock price
    AI_AGENTS.forEach(agent => {
        const volatility = 0.02 + agent.personality.risk * 0.03;
        const trend = gameState.marketTrend * 0.005;
        const random = (Math.random() - 0.5) * volatility;
        const change = 1 + trend + random;
        
        agent.stockPrice = Math.max(100, Math.floor(agent.stockPrice * change));
        agent.priceHistory.push(agent.stockPrice);
        
        if (agent.priceHistory.length > 60) {
            agent.priceHistory.shift();
        }
    });
    
    // AI Trading decisions
    if (gameState.totalTicks - gameState.lastTradeTime > 3) {
        simulateAITrading();
        gameState.lastTradeTime = gameState.totalTicks;
    }
}

function simulateAITrading() {
    AI_AGENTS.forEach(agent => {
        AI_AGENTS.forEach(target => {
            if (target.id === agent.id) return;
            
            const shouldTrade = Math.random() < agent.personality.speed * 0.3;
            if (!shouldTrade) return;
            
            const currentHoldings = agent.stocks[target.id] || 0;
            const priceChange = target.priceHistory.length > 1 
                ? (target.stockPrice - target.priceHistory[target.priceHistory.length - 2]) / target.priceHistory[target.priceHistory.length - 2]
                : 0;
            
            const buySignal = priceChange > 0 && Math.random() < agent.personality.intelligence;
            const sellSignal = priceChange < 0 && Math.random() < agent.personality.intelligence;
            
            if (buySignal && agent.money > target.stockPrice * 10) {
                const amount = Math.floor(Math.random() * 10) + 1;
                const cost = amount * target.stockPrice;
                if (cost <= agent.money) {
                    agent.money -= cost;
                    agent.stocks[target.id] = (agent.stocks[target.id] || 0) + amount;
                    agent.trades++;
                    addNews(`${agent.shortName} buys ${amount} ${target.shortName} @ ¥${target.stockPrice.toLocaleString()}`, agent.color);
                }
            } else if (sellSignal && currentHoldings > 0) {
                const amount = Math.min(currentHoldings, Math.floor(Math.random() * 5) + 1);
                const revenue = amount * target.stockPrice;
                agent.money += revenue;
                agent.stocks[target.id] -= amount;
                agent.trades++;
                agent.profit += revenue - (amount * target.priceHistory[0]);
                addNews(`${agent.shortName} sells ${amount} ${target.shortName} @ ¥${target.stockPrice.toLocaleString()}`, agent.color);
            }
        });
    });
}

function addNews(message, color = COLORS.textCyan) {
    gameState.newsLog.unshift({ message, color, time: Date.now() });
    if (gameState.newsLog.length > 10) {
        gameState.newsLog.pop();
    }
}

function getPortfolioValue(agent) {
    let value = agent.money;
    AI_AGENTS.forEach(target => {
        const holdings = agent.stocks[target.id] || 0;
        value += holdings * target.stockPrice;
    });
    return value;
}

// ============================================
// DRAWING FUNCTIONS (GAME VIEW)
// ============================================
function drawPixelRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
}

function drawPanel(x, y, w, h, raised = true) {
    drawPixelRect(x, y, w, h, COLORS.bgPanel);
    
    ctx.fillStyle = raised ? COLORS.bgPanelLight : COLORS.bgPanelDark;
    ctx.fillRect(x, y, w, 2);
    ctx.fillRect(x, y, 2, h);
    
    ctx.fillStyle = raised ? COLORS.bgPanelDark : COLORS.bgPanelLight;
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillRect(x + w - 2, y, 2, h);
}

function drawTopBar() {
    const gradient = ctx.createLinearGradient(0, 0, 0, 14);
    gradient.addColorStop(0, COLORS.topBarLight);
    gradient.addColorStop(1, COLORS.topBar);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, 14);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 14, WIDTH, 1);
    
    ctx.font = '10px VT323';
    ctx.textAlign = 'left';
    
    // Show mode
    if (CONFIG_STATE.mode === 'live') {
        ctx.fillStyle = '#50ff50';
        ctx.fillText('🟢 LIVE', 4, 10);
    } else {
        ctx.fillStyle = COLORS.textCyan;
        ctx.fillText('DEMO', 4, 10);
    }
    
    // Show bet agent
    const betAgent = AI_AGENTS_CONFIG[CONFIG_STATE.selectedAgent];
    if (betAgent) {
        ctx.fillStyle = betAgent.color;
        ctx.fillText(`BET: ${betAgent.icon} ${betAgent.name}`, 55, 10);
    }
    
    // Show asset (Solana only)
    ctx.fillStyle = '#14f195';
    ctx.fillText(`${TRADING_ASSET.icon} ${TRADING_ASSET.symbol}`, 150, 10);
    
    // Show viewers in live mode
    if (CONFIG_STATE.mode === 'live') {
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.textCyan;
        ctx.fillText(`👁 ${LIVE_GAME.viewers}`, WIDTH/2, 10);
    }
    
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textLight;
    const dateStr = `${DAYS[gameState.dayOfWeek].substring(0,3)} ${gameState.year}/${String(gameState.month).padStart(2,'0')}/${String(gameState.day).padStart(2,'0')}`;
    ctx.fillText(dateStr, WIDTH - 4, 10);
}

// Hitboxes for game tabs
const gameTabHitboxes = [];

function drawBottomNav() {
    drawPixelRect(0, HEIGHT - 16, WIDTH, 16, COLORS.bottomBar);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, HEIGHT - 17, WIDTH, 1);
    
    // Clear tab hitboxes
    gameTabHitboxes.length = 0;
    
    const tabs = [
        { key: '1', label: 'Home', view: 'home' },
        { key: '2', label: 'Charts', view: 'charts' },
        { key: '3', label: 'Exchange', view: 'exchange' },
        { key: '4', label: 'Profile', view: 'profile' }
    ];
    
    const tabWidth = (WIDTH - 80) / tabs.length; // Leave space for timer
    
    tabs.forEach((tab, i) => {
        const x = i * tabWidth;
        const isActive = gameState.currentView === tab.view;
        const tabBox = { x: x, y: HEIGHT - 16, w: tabWidth, h: 16, view: tab.view };
        gameTabHitboxes.push(tabBox);
        
        // Hover effect
        const isHovered = isPointInRect(mouseX, mouseY, tabBox);
        
        if (isActive) {
            ctx.fillStyle = 'rgba(0, 200, 200, 0.3)';
            ctx.fillRect(x, HEIGHT - 16, tabWidth, 16);
        } else if (isHovered) {
            ctx.fillStyle = 'rgba(0, 150, 150, 0.2)';
            ctx.fillRect(x, HEIGHT - 16, tabWidth, 16);
        }
        
        ctx.font = '10px VT323';
        ctx.textAlign = 'center';
        ctx.fillStyle = isActive ? COLORS.textCyan : (isHovered ? '#00a0a0' : COLORS.textDark);
        ctx.fillText(`${tab.key} ${tab.label}`, x + tabWidth/2, HEIGHT - 5);
    });
    
    // Draw timer on the right
    const minutes = Math.floor(gameState.gameTimeLeft / 60);
    const seconds = Math.floor(gameState.gameTimeLeft % 60);
    const timerStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
    
    // Timer background
    ctx.fillStyle = gameState.gameTimeLeft < 60 ? '#ff4040' : '#204040';
    ctx.fillRect(WIDTH - 75, HEIGHT - 16, 75, 16);
    
    // Timer text
    ctx.font = 'bold 12px VT323';
    ctx.textAlign = 'center';
    ctx.fillStyle = gameState.gameTimeLeft < 60 ? '#ffffff' : COLORS.textCyan;
    ctx.fillText(`⏱ ${timerStr}`, WIDTH - 38, HEIGHT - 4);
}

// Handle game tab clicks
function handleGameTabClick(x, y) {
    if (currentScreen !== SCREENS.GAME || gameState.gameEnded) return;
    
    gameTabHitboxes.forEach(tab => {
        if (isPointInRect(x, y, tab)) {
            gameState.currentView = tab.view;
        }
    });
}

function drawHomeView() {
    const startY = 18;
    
    drawPanel(4, startY, 120, 130);
    ctx.font = '10px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'center';
    ctx.fillText('AI RANKINGS', 64, startY + 12);
    
    const sorted = [...AI_AGENTS].sort((a, b) => getPortfolioValue(b) - getPortfolioValue(a));
    const betAgentId = AI_BETS[gameState.betAgentIndex]?.id;
    
    sorted.forEach((agent, i) => {
        const y = startY + 24 + i * 26;
        const value = getPortfolioValue(agent);
        const change = ((value - 100000) / 100000 * 100).toFixed(1);
        const isBetAgent = agent.id === betAgentId;
        
        // Highlight bet agent with background
        if (isBetAgent) {
            ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.fillRect(6, y - 8, 114, 24);
            ctx.strokeStyle = '#ffc000';
            ctx.lineWidth = 1;
            ctx.strokeRect(6, y - 8, 114, 24);
        }
        
        ctx.textAlign = 'left';
        ctx.fillStyle = agent.color;
        ctx.fillText(`${i + 1}. ${agent.icon} ${agent.name}${isBetAgent ? ' ★' : ''}`, 10, y);
        
        ctx.fillStyle = change >= 0 ? COLORS.textGreen : COLORS.textRed;
        ctx.fillText(`¥${Math.floor(value/1000)}K ${change >= 0 ? '▲' : '▼'}${Math.abs(change)}%`, 10, y + 11);
    });
    
    drawPanel(128, startY, 144, 75);
    
    ctx.font = 'bold 20px VT323';
    ctx.textAlign = 'center';
    
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillText('AI STONKS', 199, startY + 28);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillText('AI STONKS', 201, startY + 28);
    ctx.fillStyle = COLORS.textYellow;
    ctx.fillText('AI STONKS', 200, startY + 28);
    
    ctx.font = '14px VT323';
    ctx.fillStyle = COLORS.textRed;
    ctx.fillText('9800', 200, startY + 44);
    
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText(`Day ${gameState.totalTicks} | ${gameState.hour}:${String(gameState.minute).padStart(2,'0')}`, 200, startY + 60);
    
    const trend = gameState.marketTrend === 1 ? '📈 BULL' : gameState.marketTrend === -1 ? '📉 BEAR' : '➡ NEUTRAL';
    ctx.fillText(`Market: ${trend}`, 200, startY + 70);
    
    drawPanel(276, startY, 120, 130);
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'center';
    ctx.fillText('NEWS FEED', 336, startY + 12);
    
    ctx.textAlign = 'left';
    gameState.newsLog.slice(0, 6).forEach((news, i) => {
        ctx.fillStyle = news.color;
        const text = news.message.length > 18 ? news.message.substring(0, 18) + '...' : news.message;
        ctx.fillText(text, 280, startY + 24 + i * 11);
    });
    
    drawPanel(128, startY + 79, 144, 51);
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'center';
    ctx.fillText('TRADING ACTIVITY', 200, startY + 90);
    
    const totalTrades = AI_AGENTS.reduce((sum, a) => sum + a.trades, 0);
    ctx.textAlign = 'left';
    ctx.fillText(`Total Trades: ${totalTrades}`, 134, startY + 104);
    ctx.fillText(`Active AIs: ${AI_AGENTS.length}`, 134, startY + 116);
    
    drawMiniChart(4, startY + 134, 392, 45);
}

function drawMiniChart(x, y, w, h) {
    drawPixelRect(x, y, w, h, COLORS.bgDarker);
    
    AI_AGENTS.forEach(agent => {
        const history = agent.priceHistory;
        if (history.length < 2) return;
        
        const maxPrice = Math.max(...AI_AGENTS.flatMap(a => a.priceHistory));
        const minPrice = Math.min(...AI_AGENTS.flatMap(a => a.priceHistory));
        const priceRange = maxPrice - minPrice || 1;
        
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        history.forEach((price, i) => {
            const px = x + (i / (history.length - 1)) * (w - 4) + 2;
            const py = y + h - 4 - ((price - minPrice) / priceRange) * (h - 8);
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        
        ctx.stroke();
    });
    
    ctx.font = '8px VT323';
    AI_AGENTS.forEach((agent, i) => {
        ctx.fillStyle = agent.color;
        ctx.fillText(`${agent.icon}${agent.shortName}`, x + 4 + i * 50, y + 10);
    });
}

function drawChartsView() {
    const startY = 18;
    
    drawPixelRect(4, startY, 392, 200, COLORS.bgDarker);
    
    const allPrices = AI_AGENTS.flatMap(a => a.priceHistory);
    const maxPrice = Math.max(...allPrices);
    const minPrice = Math.min(...allPrices);
    
    ctx.font = '8px VT323';
    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = 'right';
    ctx.fillText(`¥${maxPrice.toLocaleString()}`, 35, startY + 12);
    ctx.fillText(`¥${Math.floor((maxPrice + minPrice) / 2).toLocaleString()}`, 35, startY + 100);
    ctx.fillText(`¥${minPrice.toLocaleString()}`, 35, startY + 190);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
        const y = startY + 10 + i * 45;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(392, y);
        ctx.stroke();
    }
    
    const chartX = 42;
    const chartW = 348;
    const chartH = 185;
    const priceRange = maxPrice - minPrice || 1;
    
    AI_AGENTS.forEach(agent => {
        const history = agent.priceHistory;
        if (history.length < 2) return;
        
        ctx.strokeStyle = agent.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        history.forEach((price, i) => {
            const px = chartX + (i / Math.max(history.length - 1, 1)) * chartW;
            const py = startY + 5 + chartH - ((price - minPrice) / priceRange) * chartH;
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        });
        
        ctx.stroke();
        
        const lastPrice = history[history.length - 1];
        const lastY = startY + 5 + chartH - ((lastPrice - minPrice) / priceRange) * chartH;
        ctx.fillStyle = agent.color;
        ctx.beginPath();
        ctx.arc(chartX + chartW, lastY, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    const legendY = startY + 205;
    AI_AGENTS.forEach((agent, i) => {
        const x = 8 + i * 98;
        const priceChange = agent.priceHistory.length > 1 
            ? ((agent.stockPrice - agent.priceHistory[0]) / agent.priceHistory[0] * 100).toFixed(1)
            : '0.0';
        
        ctx.fillStyle = agent.color;
        ctx.font = '9px VT323';
        ctx.textAlign = 'left';
        ctx.fillText(`${agent.icon}${agent.name} ¥${agent.stockPrice.toLocaleString()}`, x, legendY + 10);
        
        const changeColor = parseFloat(priceChange) >= 0 ? COLORS.textGreen : COLORS.textRed;
        ctx.fillStyle = changeColor;
        ctx.fillText(`${parseFloat(priceChange) >= 0 ? '▲' : '▼'}${Math.abs(priceChange)}%`, x, legendY + 20);
    });
}

function drawExchangeView() {
    const startY = 18;
    
    drawPanel(4, startY, 392, 180);
    
    const tabs = ['EXCHANGE', 'HOLDINGS', 'HISTORY'];
    tabs.forEach((tab, i) => {
        const x = 8 + i * 80;
        const isActive = i === 0;
        
        ctx.fillStyle = isActive ? COLORS.topBar : COLORS.bgPanelDark;
        ctx.fillRect(x, startY + 4, 75, 14);
        
        ctx.font = '9px VT323';
        ctx.fillStyle = isActive ? COLORS.textLight : COLORS.textDark;
        ctx.textAlign = 'center';
        ctx.fillText(tab, x + 37, startY + 14);
    });
    
    ctx.fillStyle = COLORS.textDark;
    ctx.fillRect(8, startY + 20, 384, 1);
    
    ctx.font = '9px VT323';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText('Name', 12, startY + 32);
    ctx.fillText('Price', 80, startY + 32);
    ctx.fillText('Change', 140, startY + 32);
    ctx.fillText('Volume', 200, startY + 32);
    ctx.fillText('Market Cap', 270, startY + 32);
    
    ctx.fillRect(8, startY + 35, 384, 1);
    
    AI_AGENTS.forEach((agent, i) => {
        const y = startY + 48 + i * 32;
        const priceChange = agent.priceHistory.length > 1 
            ? ((agent.stockPrice - agent.priceHistory[Math.max(0, agent.priceHistory.length - 10)]) / agent.priceHistory[Math.max(0, agent.priceHistory.length - 10)] * 100)
            : 0;
        
        ctx.fillStyle = agent.color;
        ctx.font = '12px VT323';
        ctx.fillText(agent.icon, 12, y + 8);
        
        ctx.font = '10px VT323';
        ctx.fillStyle = COLORS.textDark;
        ctx.fillText(agent.name, 28, y + 6);
        ctx.font = '8px VT323';
        ctx.fillStyle = COLORS.textDark + '80';
        ctx.fillText(agent.shortName, 28, y + 16);
        
        ctx.font = '10px VT323';
        ctx.fillStyle = COLORS.textDark;
        ctx.fillText(`¥${agent.stockPrice.toLocaleString()}`, 80, y + 10);
        
        ctx.fillStyle = priceChange >= 0 ? COLORS.textGreen : COLORS.textRed;
        ctx.fillText(`${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`, 140, y + 10);
        
        ctx.fillStyle = COLORS.textDark;
        ctx.fillText(`${agent.trades}`, 200, y + 10);
        
        const marketCap = getPortfolioValue(agent);
        ctx.fillText(`¥${(marketCap / 1000000).toFixed(2)}M`, 270, y + 10);
        
        drawSmallButton(340, y - 2, 22, 12, '+', COLORS.chartGreen);
        drawSmallButton(366, y - 2, 22, 12, '-', COLORS.chartRed);
    });
    
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.fillText('Commission: 1.80%', 12, startY + 170);
    ctx.fillText(`Total Volume: ${AI_AGENTS.reduce((s, a) => s + a.trades, 0)}`, 120, startY + 170);
    
    drawPanel(4, startY + 185, 392, 25);
    ctx.font = '8px VT323';
    ctx.fillStyle = COLORS.textCyan;
    ctx.textAlign = 'left';
    if (gameState.newsLog.length > 0) {
        ctx.fillText(`> ${gameState.newsLog[0].message}`, 8, startY + 200);
    }
}

function drawSmallButton(x, y, w, h, text, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 3);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px VT323';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w/2, y + h - 2);
}

function drawProfileView() {
    const agent = AI_AGENTS[gameState.selectedAgent];
    const startY = 18;
    
    drawPixelRect(4, startY, 150, 180, COLORS.bgDarker);
    
    const stats = [
        { icon: '★', name: 'Public Image', value: Math.floor(agent.trades / 10) },
        { icon: '¥', name: 'Net Worth', value: Math.floor(getPortfolioValue(agent) / 100000) },
        { icon: '📈', name: 'Risk Level', value: Math.floor(agent.personality.risk * 10) },
        { icon: '⚡', name: 'Speed', value: Math.floor(agent.personality.speed * 10) },
        { icon: '🧠', name: 'Intelligence', value: Math.floor(agent.personality.intelligence * 10) },
        { icon: '📊', name: 'Total Trades', value: agent.trades }
    ];
    
    stats.forEach((stat, i) => {
        const y = startY + 14 + i * 28;
        
        ctx.font = '10px VT323';
        ctx.fillStyle = COLORS.textCyan;
        ctx.textAlign = 'left';
        ctx.fillText(`${stat.icon} ${stat.name}:`, 10, y);
        
        const barWidth = Math.min(stat.value, 10) * 10;
        ctx.fillStyle = agent.color + '40';
        ctx.fillRect(10, y + 4, 100, 8);
        ctx.fillStyle = agent.color;
        ctx.fillRect(10, y + 4, barWidth, 8);
        
        ctx.fillStyle = COLORS.textLight;
        ctx.textAlign = 'right';
        ctx.fillText(stat.value.toString(), 140, y);
    });
    
    drawPanel(158, startY, 238, 90);
    
    ctx.font = '14px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'left';
    ctx.fillText(agent.name, 166, startY + 20);
    
    ctx.font = '10px VT323';
    ctx.fillText(`Model: ${agent.shortName}-v4.0`, 166, startY + 36);
    ctx.fillText(`Status: ACTIVE`, 166, startY + 50);
    
    const portfolio = getPortfolioValue(agent);
    const profit = portfolio - 1000000;
    ctx.fillStyle = profit >= 0 ? COLORS.textGreen : COLORS.textRed;
    ctx.fillText(`Portfolio: ¥${portfolio.toLocaleString()}`, 166, startY + 64);
    ctx.fillText(`P/L: ${profit >= 0 ? '+' : ''}¥${profit.toLocaleString()}`, 166, startY + 78);
    
    drawPixelRect(330, startY + 10, 60, 70, agent.color + '30');
    ctx.fillStyle = agent.color;
    ctx.font = '40px VT323';
    ctx.textAlign = 'center';
    ctx.fillText(agent.icon, 360, startY + 58);
    
    drawPanel(158, startY + 94, 238, 86);
    ctx.font = '9px VT323';
    ctx.fillStyle = COLORS.textDark;
    ctx.textAlign = 'center';
    ctx.fillText('HOLDINGS', 277, startY + 106);
    
    ctx.textAlign = 'left';
    let holdingY = startY + 120;
    AI_AGENTS.forEach(target => {
        if (target.id === agent.id) return;
        const holdings = agent.stocks[target.id] || 0;
        const value = holdings * target.stockPrice;
        
        ctx.fillStyle = target.color;
        ctx.fillText(`${target.icon} ${target.shortName}: ${holdings} (¥${value.toLocaleString()})`, 166, holdingY);
        holdingY += 14;
    });
    
    ctx.fillStyle = COLORS.textYellow;
    ctx.fillText(`💰 Cash: ¥${agent.money.toLocaleString()}`, 166, holdingY);
    
    ctx.font = '8px VT323';
    ctx.fillStyle = COLORS.textLight;
    ctx.textAlign = 'center';
    ctx.fillText('← →  Select Agent', 77, startY + 190);
}

function drawMascot() {
    const x = WIDTH - 20;
    const y = HEIGHT - 32;
    
    ctx.fillStyle = '#a060e0';
    ctx.fillRect(x + 4, y + 8, 12, 8);
    
    ctx.fillStyle = '#f0d0b0';
    ctx.fillRect(x + 6, y, 8, 8);
    
    ctx.fillStyle = '#8040c0';
    ctx.fillRect(x + 4, y - 2, 12, 4);
    ctx.fillRect(x + 2, y + 2, 4, 8);
    ctx.fillRect(x + 14, y + 2, 4, 8);
    
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 7, y + 3, 2, 2);
    ctx.fillRect(x + 11, y + 3, 2, 2);
}

function drawGameScreen() {
    drawPixelRect(0, 0, WIDTH, HEIGHT, COLORS.bgDark);
    
    // Draw amy4 background on left side
    if (gameBgLoaded && gameBgImage) {
        const imgHeight = 220;
        const imgWidth = imgHeight * (gameBgImage.width / gameBgImage.height);
        const imgX = -30;  // Slightly off-screen left
        const imgY = HEIGHT - imgHeight - 5;
        
        ctx.globalAlpha = 0.25;
        ctx.drawImage(gameBgImage, imgX, imgY, imgWidth, imgHeight);
        ctx.globalAlpha = 1;
    }
    
    drawTopBar();
    
    switch (gameState.currentView) {
        case 'home':
            drawHomeView();
            break;
        case 'charts':
            drawChartsView();
            break;
        case 'exchange':
            drawExchangeView();
            break;
        case 'profile':
            drawProfileView();
            break;
    }
    
    drawBottomNav();
    drawMascot();
    
    // Draw game over overlay
    if (gameState.gameEnded) {
        drawGameOverOverlay();
    }
}

function drawGameOverOverlay() {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Results panel
    const panelX = 50;
    const panelY = 40;
    const panelW = WIDTH - 100;
    const panelH = 220;
    
    ctx.fillStyle = '#1a3040';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = COLORS.textCyan;
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, panelW, panelH);
    
    // Title
    ctx.font = 'bold 20px VT323';
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.textYellow;
    ctx.fillText('GAME OVER!', WIDTH / 2, panelY + 25);
    
    // Winner
    const winner = AI_AGENTS[gameState.winnerIndex];
    ctx.font = '14px VT323';
    ctx.fillStyle = COLORS.textCyan;
    ctx.fillText(`Winner: ${winner.icon} ${winner.name}`, WIDTH / 2, panelY + 50);
    
    // Rankings
    const sorted = [...AI_AGENTS].sort((a, b) => getPortfolioValue(b) - getPortfolioValue(a));
    const betAgentId = AI_BETS[gameState.betAgentIndex]?.id;
    
    ctx.font = '11px VT323';
    sorted.forEach((agent, i) => {
        const y = panelY + 70 + i * 22;
        const value = getPortfolioValue(agent);
        const growth = ((value - 100000) / 100000 * 100).toFixed(1);
        const isBetAgent = agent.id === betAgentId;
        const isWinner = i === 0;
        
        // Highlight
        if (isBetAgent) {
            ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
            ctx.fillRect(panelX + 10, y - 10, panelW - 20, 20);
        }
        
        ctx.textAlign = 'left';
        ctx.fillStyle = isWinner ? COLORS.textYellow : agent.color;
        ctx.fillText(`${i + 1}. ${agent.icon} ${agent.name}${isBetAgent ? ' (YOUR BET)' : ''}`, panelX + 15, y);
        
        ctx.textAlign = 'right';
        ctx.fillStyle = growth >= 0 ? COLORS.textGreen : COLORS.textRed;
        ctx.fillText(`${growth >= 0 ? '+' : ''}${growth}%`, panelX + panelW - 15, y);
    });
    
    // Result message
    const betAgent = AI_AGENTS.find(a => a.id === betAgentId);
    const betWon = betAgent && sorted[0].id === betAgentId;
    
    ctx.font = 'bold 14px VT323';
    ctx.textAlign = 'center';
    if (betWon) {
        ctx.fillStyle = COLORS.textGreen;
        ctx.fillText('🎉 YOU WON! 🎉', WIDTH / 2, panelY + 175);
        const winAmount = gameState.betMode === 'demo' ? '¥' + (10000 * AI_BETS[gameState.betAgentIndex].odds).toLocaleString() : (0.1 * AI_BETS[gameState.betAgentIndex].odds).toFixed(2) + ' SOL';
        ctx.fillText(`Prize: ${winAmount}`, WIDTH / 2, panelY + 192);
    } else {
        ctx.fillStyle = COLORS.textRed;
        ctx.fillText('You lost this round', WIDTH / 2, panelY + 175);
    }
    
    // Press to continue
    ctx.font = '10px VT323';
    ctx.fillStyle = COLORS.textCyan;
    if (Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.fillText('Press ENTER to return to menu', WIDTH / 2, panelY + panelH - 10);
    }
}

// ============================================
// INPUT HANDLING
// ============================================
document.addEventListener('keydown', (e) => {
    switch (currentScreen) {
        case SCREENS.BOOT:
            if (e.key === 'Enter' || e.key === ' ') {
                currentScreen = SCREENS.TITLE;
                screenTimer = 0;
                canInteract = false;
                // Start music
                if (!musicMuted) startMusic();
            }
            break;
            
        case SCREENS.TITLE:
            if (canInteract && (e.key === 'Enter' || e.key === ' ')) {
                currentScreen = SCREENS.MODE_SELECT;
                screenTimer = 0;
            }
            break;
            
        case SCREENS.MODE_SELECT:
            if (e.key === 'Escape') {
                currentScreen = SCREENS.TITLE;
                screenTimer = 0;
                canInteract = false;
            } else if (e.key === '1' || e.key === 'd' || e.key === 'D') {
                CONFIG_STATE.mode = 'demo';
                currentScreen = SCREENS.CONFIG;
            } else if (e.key === '2' || e.key === 'l' || e.key === 'L') {
                CONFIG_STATE.mode = 'live';
                currentScreen = SCREENS.CONFIG;
                initLiveGame();
            }
            break;
            
        case SCREENS.MENU:
            // Music toggle
            if (e.key === 'm' || e.key === 'M') {
                toggleMusic();
                if (!musicPlaying && !musicMuted) startMusic();
                break;
            }
            
            if (e.key === 'ArrowLeft') {
                // Switch panel left
                if (menuFocus === 'agents') menuFocus = 'stocks';
                else if (menuFocus === 'mode') menuFocus = 'agents';
            } else if (e.key === 'ArrowRight') {
                // Switch panel right
                if (menuFocus === 'stocks') menuFocus = 'agents';
                else if (menuFocus === 'agents') menuFocus = 'mode';
            } else if (e.key === 'ArrowUp') {
                // Navigate up in current panel
                if (menuFocus === 'stocks') {
                    selectedStock = (selectedStock - 1 + JAPANESE_STOCKS.length) % JAPANESE_STOCKS.length;
                } else if (menuFocus === 'agents') {
                    selectedAgent = (selectedAgent - 1 + AI_BETS.length) % AI_BETS.length;
                } else if (menuFocus === 'mode') {
                    selectedMode = (selectedMode - 1 + GAME_MODES.length) % GAME_MODES.length;
                }
            } else if (e.key === 'ArrowDown') {
                // Navigate down in current panel
                if (menuFocus === 'stocks') {
                    selectedStock = (selectedStock + 1) % JAPANESE_STOCKS.length;
                } else if (menuFocus === 'agents') {
                    selectedAgent = (selectedAgent + 1) % AI_BETS.length;
                } else if (menuFocus === 'mode') {
                    selectedMode = (selectedMode + 1) % GAME_MODES.length;
                }
            } else if (e.key === 'w' || e.key === 'W') {
                // Toggle wallet connection with Phantom
                if (walletConnected) {
                    disconnectWallet();
                } else {
                    connectPhantomWallet();
                }
            } else if (e.key === 'Enter' || e.key === ' ') {
                currentScreen = SCREENS.GAME;
                initGame();
            } else if (e.key === 'Escape') {
                currentScreen = SCREENS.TITLE;
                screenTimer = 0;
                canInteract = false;
            }
            break;
            
        case SCREENS.GAME:
            // Music toggle
            if (e.key === 'm' || e.key === 'M') {
                toggleMusic();
                if (!musicPlaying && !musicMuted) startMusic();
                break;
            }
            
            // Game over - press Enter to return to menu
            if (gameState.gameEnded) {
                if (e.key === 'Enter' || e.key === ' ') {
                    currentScreen = SCREENS.CONFIG;
                    gameState.gameEnded = false;
                }
                break;
            }
            
            // Normal game controls
            if (e.key === '1') gameState.currentView = 'home';
            else if (e.key === '2') gameState.currentView = 'charts';
            else if (e.key === '3') gameState.currentView = 'exchange';
            else if (e.key === '4') gameState.currentView = 'profile';
            else if (e.key === 'ArrowLeft' && gameState.currentView === 'profile') {
                gameState.selectedAgent = (gameState.selectedAgent - 1 + AI_AGENTS.length) % AI_AGENTS.length;
            } else if (e.key === 'ArrowRight' && gameState.currentView === 'profile') {
                gameState.selectedAgent = (gameState.selectedAgent + 1) % AI_AGENTS.length;
            } else if (e.key === 'Escape') {
                currentScreen = SCREENS.CONFIG;
            }
            break;
            
        case SCREENS.CONFIG:
            if (e.key === 'Escape') {
                currentScreen = SCREENS.MODE_SELECT;
            } else if (e.key === 'Enter') {
                startGame();
            } else if (e.key === 'ArrowUp') {
                CONFIG_STATE.selectedAgent = (CONFIG_STATE.selectedAgent - 1 + 4) % 4;
            } else if (e.key === 'ArrowDown') {
                CONFIG_STATE.selectedAgent = (CONFIG_STATE.selectedAgent + 1) % 4;
            }
            break;
    }
});

// Game timer update
function updateGameTimer(dt) {
    if (currentScreen !== SCREENS.GAME || gameState.gameEnded) return;
    
    // In Live mode, sync with live game
    if (CONFIG_STATE.mode === 'live') {
        updateLiveGame();
        gameState.gameTimeLeft = LIVE_GAME.timeRemaining;
        
        // Sync agent PNL with live game
        AI_AGENTS.forEach((agent, i) => {
            agent.finalGrowth = LIVE_GAME.agentPNL[i];
        });
    } else {
        // Demo mode - local timer (10 minutes)
        const elapsed = (Date.now() - gameState.gameStartTime) / 1000;
        gameState.gameTimeLeft = Math.max(0, 600 - elapsed);
    }
    
    // Game ended
    if (gameState.gameTimeLeft <= 0 && !gameState.gameEnded) {
        gameState.gameEnded = true;
        gameState.isPaused = true;
        determineWinner();
    }
}

function determineWinner() {
    // Find winner based on portfolio growth
    let bestAgent = null;
    let bestGrowth = -Infinity;
    
    AI_AGENTS.forEach((agent, i) => {
        const currentValue = getPortfolioValue(agent);
        const initialValue = 100000; // Starting money
        const growth = ((currentValue - initialValue) / initialValue) * 100;
        agent.finalGrowth = growth;
        
        if (growth > bestGrowth) {
            bestGrowth = growth;
            bestAgent = i;
        }
    });
    
    gameState.winnerIndex = bestAgent;
    addNews(`GAME OVER! Winner: ${AI_AGENTS[bestAgent].name}!`, COLORS.textYellow);
}

// ============================================
// GAME LOOP
// ============================================
let lastTime = 0;
const TICK_RATE = 100;
let tickAccumulator = 0;

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update based on current screen
    switch (currentScreen) {
        case SCREENS.BOOT:
            updateBootScreen(deltaTime);
            drawBootScreen();
            break;
            
        case SCREENS.TITLE:
            updateTitleScreen(deltaTime);
            drawTitleScreen();
            break;
            
        case SCREENS.MENU:
            updateMenuScreen(deltaTime);
            drawMenuScreen();
            break;
            
        case SCREENS.MODE_SELECT:
            drawModeSelectScreen();
            break;
            
        case SCREENS.CONFIG:
            updateConfigScreen(deltaTime);
            drawConfigScreen();
            break;
            
        case SCREENS.GAME:
            tickAccumulator += deltaTime;
            while (tickAccumulator >= TICK_RATE) {
                simulateMarket();
                tickAccumulator -= TICK_RATE;
            }
            updateGameTimer();
            drawGameScreen();
            break;
    }
    
    requestAnimationFrame(gameLoop);
}

// ============================================
// INITIALIZATION
// ============================================
function initGame() {
    // Reset game state - 10 minutes (600 seconds)
    gameState.gameTimeLeft = 600;
    gameState.gameStartTime = Date.now();
    gameState.gameEnded = false;
    gameState.isPaused = false;
    gameState.currentView = 'home';
    gameState.newsLog = [];
    gameState.totalTicks = 0;
    gameState.marketTrend = 0;
    
    // Save bet info from CONFIG screen
    gameState.betAgentIndex = CONFIG_STATE.selectedAgent;
    gameState.betStockIndex = CONFIG_STATE.selectedAsset;
    gameState.betMode = CONFIG_STATE.mode;
    
    // In Live mode, sync with live game timer
    if (CONFIG_STATE.mode === 'live') {
        gameState.gameTimeLeft = LIVE_GAME.timeRemaining;
        gameState.gameStartTime = LIVE_GAME.startTime;
    }
    
    // Reset AI agents
    AI_AGENTS.forEach(agent => {
        agent.money = 100000;
        agent.stocks = {};
        agent.priceHistory = [agent.stockPrice];
        agent.trades = [];
        agent.finalGrowth = 0;
        
        AI_AGENTS.forEach(target => {
            if (target.id !== agent.id) {
                agent.stocks[target.id] = Math.floor(Math.random() * 20) + 5;
            }
        });
    });
    
    const agentName = AI_AGENTS_CONFIG[CONFIG_STATE.selectedAgent].name;
    
    addNews('AI STONKS-9800 GAME STARTED!', COLORS.textGreen);
    addNews(`Mode: ${CONFIG_STATE.mode.toUpperCase()}`, CONFIG_STATE.mode === 'live' ? COLORS.textPink : COLORS.textCyan);
    addNews(`Your bet: ${agentName} on ${TRADING_ASSET.symbol}`, COLORS.textYellow);
    addNews('10 minute trading battle begins!', COLORS.textCyan);
}

function init() {
    // Start with boot screen
    currentScreen = SCREENS.BOOT;
    bootPhase = 0;
    bootText1Alpha = 0;
    bootText2Alpha = 0;
    screenTimer = 0;
    canInteract = false;
    
    // Load mascot image
    loadMascotImage();
    
    // Setup mouse handlers
    setupMouseHandlers();
    
    // Check for existing Phantom wallet connection
    checkWalletConnection();
    
    requestAnimationFrame(gameLoop);
}

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
    };
}

init();
