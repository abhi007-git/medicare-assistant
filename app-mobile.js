// ============================================================================
// MEDICARE ASSISTANT - MOBILE APP FOR VISUALLY IMPAIRED PATIENTS
// Voice-First Interface with Continuous Voice Recognition
// ============================================================================

class MediCareApp {
    constructor() {
        this.currentScreen = 'home';
        this.recognition = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.voiceSpeed = 0.9;
        this.voiceVolume = 1.0;
        this.lastSpoken = '';
        
        // Form state
        this.formData = { name: '', age: '', phone: '', symptoms: '' };
        this.formFields = ['name', 'age', 'phone', 'symptoms'];
        this.currentFieldIndex = 0;
        this.formActive = false;
        this.waitingForOptionalConfirmation = false;
        
        // Queue state
        this.queueToken = null;
        this.queueData = null;
        this.queueUpdateInterval = null;
        
        // Navigation state
        this.navDestination = null;
        this.navCurrentStep = 0;
        this.navSteps = [];
        this.hospitalRooms = {};
        this.qrScanner = null;
        this.qrScannerActive = false;
        this.qrScanCooldown = false;
        this.currentLocation = null;
        this.qrNodeMap = {};
        
        // Reader state
        this.readerActive = false;
        this.readerStream = null;
        
        this.init();
    }
    
    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    async init() {
        console.log('MediCare App initializing...');
        this.setupEventListeners();
        await this.requestPermissions();
        this.initVoiceRecognition();
        
        // Preload speech voices for medical terms
        if ('speechSynthesis' in window) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                const voices = window.speechSynthesis.getVoices();
                console.log('📢 Speech voices loaded:', voices.length);
            };
        }
        
        // Visual feedback for blind users' helpers
        setTimeout(() => {
            this.speak('Welcome to MediCare Assistant. I am always listening. Say Help to hear all commands.');
        }, 1000);
        
        // Load settings
        this.loadSettings();
    }
    
    async requestPermissions() {
        try {
            // Request microphone
            await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log('Microphone permission granted');
            
            // Request camera (for QR and OCR)
            await navigator.mediaDevices.getUserMedia({ video: true });
            console.log('Camera permission granted');
        } catch (error) {
            console.error('Permission error:', error);
            this.speak('Please allow microphone and camera access for full functionality.');
        }
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                this.navigateTo(screen);
            });
        });
        
        // Back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.navigateTo('home'));
        });
        
        // Mobile voice activation button
        const activateVoiceBtn = document.querySelector('#activate-voice-btn');
        if (activateVoiceBtn) {
            activateVoiceBtn.addEventListener('click', () => {
                console.log('Manual voice activation triggered');
                activateVoiceBtn.style.display = 'none';
                this.startListening();
                this.speak('Voice recognition activated. I am now listening.');
            });
        }
        
        // Home screen buttons
        document.querySelector('.voice-form-btn')?.addEventListener('click', () => this.navigateTo('form'));
        document.querySelector('.queue-btn')?.addEventListener('click', () => this.navigateTo('queue'));
        document.querySelector('.navigation-btn')?.addEventListener('click', () => this.navigateTo('navigation'));
        document.querySelector('.reader-btn')?.addEventListener('click', () => this.navigateTo('reader'));
        document.querySelector('#settings-btn')?.addEventListener('click', () => this.navigateTo('settings'));
        
        // Form buttons
        document.querySelector('#form-submit-btn')?.addEventListener('click', () => this.submitForm());
        document.querySelector('#form-reset-btn')?.addEventListener('click', () => this.resetForm());
        
        // Queue buttons
        document.querySelector('#queue-speak-btn')?.addEventListener('click', () => this.speakQueueStatus());
        document.querySelector('#queue-refresh-btn')?.addEventListener('click', () => this.refreshQueue());
        
        // Navigation buttons
        document.querySelector('#nav-reset-btn')?.addEventListener('click', () => this.resetNavigation());
        
        // Reader buttons
        document.querySelector('#reader-toggle-btn')?.addEventListener('click', () => this.toggleReader());
        
        // Settings sliders
        document.querySelector('#voice-speed')?.addEventListener('input', (e) => {
            this.voiceSpeed = parseFloat(e.target.value);
        });
        
        document.querySelector('#voice-volume')?.addEventListener('input', (e) => {
            this.voiceVolume = parseFloat(e.target.value);
        });
        
        document.querySelector('#settings-save-btn')?.addEventListener('click', () => this.saveSettings());
    }
    
    // ========================================================================
    // VOICE RECOGNITION
    // ========================================================================
    
    initVoiceRecognition() {
        console.log('Initializing voice recognition...');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Web Speech API not supported');
            alert('Voice recognition not supported in this browser. Please use Chrome or Edge with HTTPS.');
            this.speak('Voice recognition not supported in this browser. Please use Chrome or Edge.');
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        console.log('Speech Recognition object created');
        
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;
        
        this.recognition.onstart = () => {
            console.log('Voice recognition started - listening...');
            this.isListening = true;
            const voiceStatus = document.querySelector('#voice-status');
            if (voiceStatus) {
                voiceStatus.classList.add('listening');
            }
            // Hide activation button once listening starts
            const activateBtn = document.querySelector('#activate-voice-btn');
            if (activateBtn) {
                activateBtn.style.display = 'none';
            }
        };
        
        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            const confidence = event.results[last][0].confidence;
            
            console.log('Voice command detected:', command, 'Confidence:', confidence);
            this.handleVoiceCommand(command);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Recognition error:', event.error, event);
            
            // Show error message for specific errors
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert('Microphone access denied! Please allow microphone permission in browser settings.');
                this.speak('Microphone access denied. Please allow microphone permission.');
                // Show activation button if permission denied
                const activateBtn = document.querySelector('#activate-voice-btn');
                if (activateBtn) {
                    activateBtn.style.display = 'flex';
                }
            } else if (event.error === 'no-speech') {
                console.log('No speech detected, continuing...');
            } else if (event.error === 'network') {
                console.log('Network error, continuing...');
            }
            
            // Always restart, even on errors - keep listening continuously
            if (event.error !== 'aborted' && event.error !== 'not-allowed') {
                setTimeout(() => this.startListening(), 500);
            }
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            console.log('Voice recognition ended - restarting...');
            // Always restart listening automatically - NEVER STOP
            setTimeout(() => this.startListening(), 300);
        };
        
        // On mobile, show activation button instead of auto-starting
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            console.log('Mobile detected - showing activation button');
            const activateBtn = document.querySelector('#activate-voice-btn');
            if (activateBtn) {
                activateBtn.style.display = 'flex';
            }
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.recognition) {
            console.error('Recognition not initialized');
            return;
        }
        
        if (this.isListening) {
            console.log('Already listening, skipping start');
            return;
        }
        
        try {
            console.log('Starting speech recognition...');
            this.recognition.start();
            const voiceStatus = document.querySelector('#voice-status');
            if (voiceStatus) {
                voiceStatus.classList.add('listening');
            }
        } catch (error) {
            console.error('Recognition start error:', error);
            if (error.name === 'InvalidStateError') {
                console.log('Recognition already started, continuing...');
            }
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            document.querySelector('#voice-status').classList.remove('listening');
        }
    }
    
    // ========================================================================
    // VOICE COMMAND HANDLING
    // ========================================================================
    
    handleVoiceCommand(command) {
        // Stop command - interrupt ALL speech and processes immediately
        if (command.includes('stop') || command.includes('quiet')) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            // Stop any active form filling
            if (this.formActive) {
                this.formActive = false;
            }
            // Stop reader if active
            if (this.readerActive) {
                this.stopReader();
            }
            return;
        }
        
        // Global commands (work from any screen)
        if (command.includes('help')) {
            this.speakHelp();
            return;
        }
        
        if (command.includes('exit') || command.includes('go home') || command.includes('home screen')) {
            this.navigateTo('home');
            this.speak('Returning to home screen.');
            return;
        }
        
        if (command.includes('form')) {
            this.navigateTo('form');
            this.speak('Form section. Say start to begin filling the form.');
            return;
        }
        
        if (command.includes('queue') || command.includes('token')) {
            this.navigateTo('queue');
            setTimeout(() => this.speakQueueStatus(), 500);
            return;
        }
        
        if (command.includes('navigate') || command.includes('navigation')) {
            this.navigateTo('navigation');
            return;
        }
        
        if (command.includes('read') || command.includes('reader') || command.includes('sign')) {
            this.navigateTo('reader');
            return;
        }
        
        // Screen-specific commands
        switch (this.currentScreen) {
            case 'form':
                this.handleFormCommand(command);
                break;
            case 'queue':
                this.handleQueueCommand(command);
                break;
            case 'navigation':
                this.handleNavigationCommand(command);
                break;
            case 'reader':
                this.handleReaderCommand(command);
                break;
        }
    }
    
    speakHelp() {
        const helpMessage = `
            Available commands:
            Say Form to go to form section.
            Say Start to begin filling the form.
            Say Queue to check your queue status.
            Say Navigate to hear hospital room list.
            Say a number one to six to navigate to that room.
            Say Read or Reader to scan hospital signs.
            Say Exit to return to home screen.
            Say Stop to stop speech at any time.
            I am always listening for your commands.
        `;
        this.speak(helpMessage, true);
    }
    
    // ========================================================================
    // VOICE SYNTHESIS (TEXT TO SPEECH)
    // ========================================================================
    
    speak(text, priority = false) {
        if (!text) return;
        
        // Cancel current speech if priority
        if (priority) {
            window.speechSynthesis.cancel();
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voiceSpeed;
        utterance.volume = this.voiceVolume;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => {
            this.isSpeaking = true;
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
        };
        
        this.lastSpoken = text;
        window.speechSynthesis.speak(utterance);
    }
    
    // ========================================================================
    // NAVIGATION BETWEEN SCREENS
    // ========================================================================
    
    navigateTo(screenName) {
        console.log(`📍 Navigating from "${this.currentScreen}" to "${screenName}"`);
        
        // Clean up previous screen resources
        if (this.currentScreen === 'navigation' && screenName !== 'navigation') {
            console.log('🛑 Leaving navigation, stopping QR scanner...');
            this.stopQRScanner();
        }
        
        if (this.currentScreen === 'reader' && screenName !== 'reader') {
            console.log('🛑 Leaving sign reader, stopping camera...');
            this.stopReader();
        }
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.querySelector(`#${screenName}-screen`).classList.add('active');
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-screen="${screenName}"]`)?.classList.add('active');
        
        this.currentScreen = screenName;
        
        // Screen-specific initialization
        switch (screenName) {
            case 'home':
                this.speak('Home screen');
                break;
            case 'form':
                this.resetForm();
                this.speak('Voice form screen. Say Start to begin filling.');
                break;
            case 'queue':
                this.initQueue();
                break;
            case 'navigation':
                console.log('✅ Initializing navigation section...');
                this.initNavigation();
                break;
            case 'reader':
                console.log('✅ Initializing sign reader section...');
                this.speak('Sign reader screen. Say Start to scan signs.');
                break;
            case 'settings':
                this.speak('Settings screen');
                break;
        }
    }
    
    // ========================================================================
    // FORM HANDLING
    // ========================================================================
    
    handleFormCommand(command) {
        if (command.includes('start') && !this.formActive) {
            this.startForm();
        } else if (command.includes('yes') && this.waitingForOptionalConfirmation) {
            this.waitingForOptionalConfirmation = false;
            this.speak('Please provide the information.');
        } else if (command.includes('no') && this.waitingForOptionalConfirmation) {
            this.waitingForOptionalConfirmation = false;
            this.speak('Okay, skipping.');
            this.currentFieldIndex++;
            setTimeout(() => this.askFormQuestion(), 1000);
        } else if (command.includes('next') || command.includes('continue')) {
            if (this.formActive) {
                this.currentFieldIndex++;
                this.askFormQuestion();
            }
        } else if (command.includes('repeat')) {
            this.repeatFormQuestion();
        } else if (command.includes('skip')) {
            this.skipFormField();
        } else if (command.includes('back') || command.includes('previous')) {
            this.previousFormField();
        } else if (command.includes('submit')) {
            this.submitForm();
        } else if (command.includes('reset')) {
            this.resetForm();
        } else if (this.formActive) {
            // Capture field value
            this.captureFormValue(command);
        }
    }
    
    startForm() {
        this.formActive = true;
        this.currentFieldIndex = 0;
        this.waitingForOptionalConfirmation = false;
        this.speak('Starting form filling. I will ask for your information.', true);
        setTimeout(() => this.askFormQuestion(), 1500);
    }
    
    askFormQuestion() {
        if (this.currentFieldIndex >= this.formFields.length) {
            this.speak('All required fields completed. Say Submit to send the form.');
            this.formActive = false;
            return;
        }
        
        const field = this.formFields[this.currentFieldIndex];
        const questions = {
            'name': 'What is your name?',
            'age': 'What is your age?',
            'phone': 'Do you want to provide your phone number? Say yes or no.',
            'symptoms': 'Do you want to describe your symptoms? Say yes or no.'
        };
        
        const instruction = document.querySelector('#form-instruction');
        if (instruction) {
            instruction.textContent = questions[field];
        }
        
        // Optional fields need confirmation
        if (field === 'phone' || field === 'symptoms') {
            this.waitingForOptionalConfirmation = true;
            this.speak(questions[field]);
        } else {
            this.speak(questions[field]);
        }
    }
    
    captureFormValue(value) {
        const field = this.formFields[this.currentFieldIndex];
        
        // Skip filler words
        if (value.length < 2 || ['the', 'a', 'an', 'is'].includes(value)) {
            return;
        }
        
        // Don't capture if waiting for yes/no
        if (this.waitingForOptionalConfirmation) {
            return;
        }
        
        this.formData[field] = value;
        
        // Update UI
        const input = document.querySelector(`#form-${field}`);
        if (input) {
            input.value = value;
        }
        
        const fieldNames = {
            'name': 'Name',
            'age': 'Age',
            'phone': 'Phone number',
            'symptoms': 'Symptoms'
        };
        
        this.speak(`${fieldNames[field]} recorded.`);
        this.currentFieldIndex++;
        setTimeout(() => this.askFormQuestion(), 1200);
    }
    
    repeatFormQuestion() {
        if (this.currentFieldIndex < this.formFields.length) {
            this.askFormQuestion();
        }
    }
    
    skipFormField() {
        if (this.currentFieldIndex < this.formFields.length) {
            this.speak('Skipping field.');
            this.currentFieldIndex++;
            setTimeout(() => this.askFormQuestion(), 1000);
        }
    }
    
    previousFormField() {
        if (this.currentFieldIndex > 0) {
            this.currentFieldIndex--;
            this.speak('Going back.');
            setTimeout(() => this.askFormQuestion(), 1000);
        } else {
            this.speak('Already at first field.');
        }
    }
    
    submitForm() {
        if (!this.formData.name || !this.formData.age) {
            this.speak('Please provide at least your name and age before submitting.');
            return;
        }
        
        this.speak('Form submitted successfully. Your registration is complete.', true);
        this.formActive = false;
    }
    
    resetForm() {
        this.formData = { name: '', age: '', phone: '', symptoms: '' };
        this.currentFieldIndex = 0;
        this.formActive = false;
        
        document.querySelectorAll('#form-screen input, #form-screen textarea').forEach(input => {
            input.value = '';
        });
        
        this.speak('Form reset. Say Start Form to begin again.');
    }
    
    // ========================================================================
    // QUEUE MANAGEMENT
    // ========================================================================
    
    handleQueueCommand(command) {
        if (command.includes('refresh') || command.includes('update')) {
            this.refreshQueue();
        } else if (command.includes('status') || command.includes('repeat')) {
            this.speakQueueStatus();
        }
    }
    
    refreshQueue() {
        this.initQueue();
    }
    
    initQueue() {
        // Generate queue data
        this.queueToken = 'A-' + String(Math.floor(Math.random() * 20) + 1).padStart(2, '0');
        this.queueData = {
            token: this.queueToken,
            position: Math.floor(Math.random() * 10) + 1,
            waitTime: Math.floor(Math.random() * 30) + 5,
            currentServing: 'A-' + String(Math.floor(Math.random() * 20) + 1).padStart(2, '0'),
            emergency: Math.random() > 0.8
        };
        
        this.updateQueueUI();
        this.speakQueueStatus();
        
        // Auto-update queue every 30 seconds
        if (this.queueUpdateInterval) {
            clearInterval(this.queueUpdateInterval);
        }
        
        this.queueUpdateInterval = setInterval(() => {
            if (this.currentScreen === 'queue' && this.queueData) {
                // Simulate queue movement
                if (this.queueData.position > 0) {
                    this.queueData.position--;
                    this.queueData.waitTime = Math.max(0, this.queueData.waitTime - 5);
                    this.updateQueueUI();
                    
                    if (this.queueData.position === 0) {
                        this.speak('Attention! It is your turn now. Please proceed to consultation room.', true);
                    } else if (this.queueData.position === 1) {
                        this.speak('You are next in line. Please be ready.', true);
                    }
                }
            }
        }, 30000); // Every 30 seconds
    }
    
    updateQueueUI() {
        if (!this.queueData) return;
        
        document.querySelector('#queue-token').textContent = this.queueData.token;
        document.querySelector('#queue-wait').textContent = this.queueData.position === 0 ? 'Your Turn!' : `~${this.queueData.waitTime} min`;
        document.querySelector('#queue-current').textContent = this.queueData.currentServing;
        
        const emergencyBadge = document.querySelector('#queue-emergency-badge');
        if (this.queueData.emergency) {
            emergencyBadge.classList.remove('hidden');
        } else {
            emergencyBadge.classList.add('hidden');
        }
        
        const statusMsg = document.querySelector('#queue-status-msg');
        if (this.queueData.position === 0) {
            statusMsg.textContent = 'Your turn! Please proceed to the consultation room.';
        } else if (this.queueData.position === 1) {
            statusMsg.textContent = 'You are next in line. Please be ready.';
        } else {
            statusMsg.textContent = `${this.queueData.position} patients ahead of you.`;
        }
    }
    
    speakQueueStatus() {
        if (!this.queueData) {
            this.speak('Queue information not available.');
            return;
        }
        
        let message = `Your token number is ${this.queueData.token}. `;
        
        if (this.queueData.position === 0) {
            message += 'It is your turn now. Please proceed to consultation room.';
        } else {
            message += `${this.queueData.position} patients ahead of you. `;
            message += `Time left for your turn: approximately ${this.queueData.waitTime} minutes. `;
            message += `Currently serving token ${this.queueData.currentServing}.`;
        }
        
        this.speak(message, true);
    }
    
    // ========================================================================
    // NAVIGATION (HOSPITAL WAYFINDING)
    // ========================================================================
    
    handleNavigationCommand(command) {
        // Only reset command for navigation
        if (command.includes('reset')) {
            this.resetNavigation();
        }
    }
    
    initNavigation() {
        // QR code navigation instructions from qr.html
        this.qrInstructions = {
            "QR_START": "You are at the hospital entrance. Go straight for 10 meters to reach Main Corridor One.",
            "QR_MAIN_1": "You are at Main Corridor One. Continue straight for 8 meters to reach Junction A.",
            "QR_JUNCTION_A": "You are at Junction A. Turn left for Room One Cardiology, turn right for Room Two Orthopedics, or go straight to reach Junction B.",
            "QR_JUNCTION_B": "You are at Junction B. Turn left for Room Three Pediatrics, turn right for Room Four Neurology, or continue straight for Main Corridor Two.",
            "QR_MAIN_2": "You are at Main Corridor Two. Go straight for 5 meters to reach Room Five, Emergency.",
            "QR_ROOM_1": "You have arrived at Room One, Cardiology department.",
            "QR_ROOM_2": "You have arrived at Room Two, Orthopedics department.",
            "QR_ROOM_3": "You have arrived at Room Three, Pediatrics department.",
            "QR_ROOM_4": "You have arrived at Room Four, Neurology department.",
            "QR_ROOM_5": "You have arrived at Room Five, Emergency department."
        };
        
        this.speak('Navigation section. Please scan a QR code.');
        this.startQRScanner();
    }
    
    resetNavigation() {
        this.currentLocation = null;
        document.querySelector('#nav-destination').textContent = 'Ready to Scan';
        document.querySelector('#nav-instruction-text').textContent = 'Please scan a QR code';
        this.speak('Please scan a QR code.');
        this.startQRScanner();
    }
    
    async startQRScanner() {
        console.log('🎥 startQRScanner called');
        
        // Stop existing scanner if any
        if (this.qrScanner && this.qrScannerActive) {
            console.log('Stopping existing scanner...');
            await this.stopQRScanner();
        }
        
        try {
            const qrReader = document.querySelector('#qr-reader');
            if (!qrReader) {
                console.error('❌ QR reader element (#qr-reader) not found in DOM');
                this.speak('QR scanner element not found. Please refresh the page.');
                return;
            }
            console.log('✅ QR reader element found');
            
            // Check if Html5Qrcode is available
            if (typeof Html5Qrcode === 'undefined') {
                console.error('❌ Html5Qrcode library not loaded');
                this.speak('QR scanner library not available. Please refresh the page.');
                return;
            }
            console.log('✅ Html5Qrcode library loaded');
            
            // Request camera permission explicitly first (especially for mobile)
            console.log('📸 Requesting camera permission...');
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment" } 
                });
                // Stop the test stream immediately - we just wanted to get permission
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Camera permission granted');
            } catch (permErr) {
                console.error('❌ Camera permission denied:', permErr);
                alert('Camera permission is required for QR scanning. Please allow camera access in your browser settings.');
                this.speak('Camera permission denied. Please allow camera access.');
                return;
            }
            
            console.log('🔧 Initializing Html5Qrcode scanner...');
            this.qrScanner = new Html5Qrcode("qr-reader");
            console.log('✅ Scanner object created');
            
            const config = {
                fps: 10,
                qrbox: 250,
                aspectRatio: 1.0,
                disableFlip: false
            };
            
            // Get available cameras
            console.log('📷 Getting available cameras...');
            const devices = await Html5Qrcode.getCameras();
            console.log('📷 Available cameras:', devices.length, devices);
            
            if (devices && devices.length > 0) {
                // Use the last camera (usually back camera on mobile)
                const cameraId = devices.length > 1 ? devices[devices.length - 1].id : devices[0].id;
                console.log('📷 Using camera:', cameraId);
                
                // Start scanning with specific camera
                console.log('▶️ Starting QR scanner...');
                await this.qrScanner.start(
                    cameraId,
                    config,
                    (decodedText) => {
                        // QR code successfully scanned
                        console.log('✅ QR Code detected:', decodedText);
                        
                        // Vibrate if available
                        if (navigator.vibrate) {
                            navigator.vibrate(200);
                        }
                        
                        // Handle hospital QR codes
                        this.handleQRCode(decodedText);
                    },
                    (error) => {
                        // QR scan error - silent, just keep scanning
                    }
                );
                
                this.qrScannerActive = true;
                console.log('✅ QR Scanner started successfully!');
                this.speak('QR scanner ready. Point camera at room QR code.');
            } else {
                console.error('❌ No cameras found');
                this.speak('No camera found on this device.');
            }
            
        } catch (error) {
            console.error('❌ QR Scanner initialization error:', error);
            console.error('Error details:', error.message, error.stack);
            this.qrScannerActive = false;
            this.speak('Unable to start QR scanner. ' + error.message);
        }
    }
    
    async stopQRScanner() {
        console.log('🛑 Stopping QR scanner...');
        
        if (this.qrScanner && this.qrScannerActive) {
            try {
                await this.qrScanner.stop();
                await this.qrScanner.clear();
                this.qrScannerActive = false;
                console.log('✅ QR Scanner stopped and cleared');
            } catch (err) {
                console.error('❌ QR Scanner stop error:', err);
                // Force stop even if error
                this.qrScannerActive = false;
            }
        } else {
            console.log('⚠️ QR Scanner was not active');
        }
        
        // Reset cooldown if any
        this.qrScanCooldown = false;
    }
    
    async handleQRCode(qrData) {
        // Prevent processing during cooldown
        if (this.qrScanCooldown) {
            return;
        }
        
        // Stop scanner immediately to prevent continuous scanning
        await this.stopQRScanner();
        this.qrScanCooldown = true;
        
        console.log('Raw QR data:', qrData);
        
        // Try to parse JSON if QR contains JSON data
        let qrId = qrData;
        try {
            const parsed = JSON.parse(qrData);
            if (parsed.id) {
                qrId = parsed.id;
                console.log('Parsed QR ID:', qrId);
            }
        } catch (e) {
            // Not JSON, use raw data
            console.log('Not JSON, using raw data');
        }
        
        // Vibrate feedback
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        // Get the instruction for this QR code
        const instruction = this.qrInstructions[qrId];
        
        if (!instruction) {
            // Unknown QR code - just speak the data
            this.speak(qrId, true);
            document.querySelector('#nav-destination').textContent = qrId;
            document.querySelector('#nav-instruction-text').textContent = qrId;
        } else {
            // Speak the full navigation instruction
            this.speak(instruction, true);
            document.querySelector('#nav-destination').textContent = qrId;
            document.querySelector('#nav-instruction-text').textContent = instruction;
        }
        
        // Wait 3 seconds before allowing next scan
        setTimeout(() => {
            this.qrScanCooldown = false;
            if (this.currentScreen === 'navigation' && !this.qrScannerActive) {
                this.speak('Ready for next scan.');
                this.startQRScanner();
            }
        }, 3000);
    }
    
    // ========================================================================
    // SIGN READER (OCR)
    // ========================================================================
    
    handleReaderCommand(command) {
        if (command.includes('start') || command.includes('scan')) {
            this.startReader();
        } else if (command.includes('stop')) {
            this.stopReader();
        } else if (command.includes('repeat') || command.includes('again')) {
            this.speakLastDetection();
        }
    }
    
    async toggleReader() {
        if (this.readerActive) {
            this.stopReader();
        } else {
            await this.startReader();
        }
    }
    
    async startReader() {
        try {
            console.log('🎬 Starting sign reader...');
            
            const video = document.querySelector('#reader-camera');
            this.readerStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            video.srcObject = this.readerStream;
            
            console.log('✅ Camera started');
            
            this.readerActive = true;
            document.querySelector('#reader-toggle-btn').innerHTML = '<span class="material-symbols-outlined">stop</span> Stop Scanning';
            document.querySelector('#reader-status-badge').innerHTML = '<span class="text-success">🔴 Scanning...</span>';
            document.querySelector('#reader-text').textContent = 'Point camera at medical signs...';
            
            this.speak('Camera activated. Point at medical signs. Text will be read automatically.');
            
            // Start OCR detection after a brief delay for camera to stabilize
            setTimeout(() => {
                console.log('🚀 Starting OCR detection...');
                this.startOCRDetection();
            }, 500);
        } catch (error) {
            console.error('❌ Camera error:', error);
            this.speak('Unable to access camera. Please allow camera permission.');
        }
    }
    
    stopReader() {
        console.log('🛑 Stopping sign reader...');
        
        // Clear OCR interval
        if (this.ocrInterval) {
            clearInterval(this.ocrInterval);
            this.ocrInterval = null;
            console.log('⏹️ OCR interval cleared');
        }
        
        if (this.readerStream) {
            console.log('📷 Releasing camera tracks...');
            this.readerStream.getTracks().forEach(track => {
                track.stop();
                console.log('   ✅ Track stopped:', track.kind);
            });
            this.readerStream = null;
            console.log('✅ Camera stream released');
        }
        
        this.readerActive = false;
        
        const toggleBtn = document.querySelector('#reader-toggle-btn');
        const statusBadge = document.querySelector('#reader-status-badge');
        
        if (toggleBtn) {
            toggleBtn.innerHTML = '<span class="material-symbols-outlined">photo_camera</span> Start Scanning';
        }
        if (statusBadge) {
            statusBadge.innerHTML = '<span class="text-text-muted">Idle</span>';
        }
        
        console.log('✅ Sign reader stopped completely');
    }
    
    startOCRDetection() {
        if (!this.readerActive) return;
        
        // Run first scan immediately
        this.performOCR();
        
        // Then perform OCR every 1 second for fast, real-time detection
        this.ocrInterval = setInterval(async () => {
            if (this.readerActive) {
                await this.performOCR();
            } else {
                clearInterval(this.ocrInterval);
            }
        }, 1000);
    }
    
    async performOCR() {
        try {
            const video = document.querySelector('#reader-camera');
            if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
                console.log('Video not ready for OCR');
                return; // Video not ready
            }
            
            console.log('📸 Capturing frame for OCR...');
            
            // Capture frame from video
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Check which OCR service to use
            const ocrService = window.API_CONFIG?.OCR_SERVICE || 'tesseract';
            console.log('🔍 Using OCR service:', ocrService);
            
            let text = '';
            
            if (ocrService === 'tesseract') {
                // Use Tesseract.js (client-side, no API key needed)
                console.log('Running Tesseract OCR...');
                text = await this.ocrWithTesseract(canvas);
            } else if (ocrService === 'ocrspace') {
                // Use OCR.space API
                console.log('Running OCR.space API...');
                text = await this.ocrWithOCRSpace(canvas);
            } else if (ocrService === 'google') {
                // Use Google Cloud Vision API
                console.log('Running Google Vision API...');
                text = await this.ocrWithGoogleVision(canvas);
            } else if (ocrService === 'azure') {
                // Use Azure Computer Vision API
                console.log('Running Azure Vision API...');
                text = await this.ocrWithAzure(canvas);
            }
            
            console.log('📄 OCR Result:', text);
            
            if (text && text.trim()) {
                console.log('✅ Text detected, processing...');
                this.handleDetectedText(text.trim());
            } else {
                console.log('❌ No text detected');
            }
        } catch (error) {
            console.error('❌ OCR error:', error);
        }
    }
    
    async ocrWithTesseract(canvas) {
        // Tesseract.js - Client-side OCR (FREE, NO API KEY)
        console.log('📚 Tesseract OCR: Starting...');
        
        if (typeof Tesseract === 'undefined') {
            console.error('❌ Tesseract.js not loaded');
            this.speak('Tesseract library not loaded. Please refresh the page.');
            return '';
        }
        
        try {
            console.log('🔧 Enhancing image...');
            
            // Simple enhancement - just increase contrast slightly
            const enhancedCanvas = document.createElement('canvas');
            enhancedCanvas.width = canvas.width;
            enhancedCanvas.height = canvas.height;
            const ctx = enhancedCanvas.getContext('2d');
            
            // Draw original
            ctx.drawImage(canvas, 0, 0);
            
            // Slight contrast boost only
            const imageData = ctx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height);
            const data = imageData.data;
            const factor = 1.5; // Moderate contrast increase
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            console.log('📖 Running Tesseract...');
            
            const result = await Tesseract.recognize(enhancedCanvas, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        const pct = Math.round(m.progress * 100);
                        if (pct % 25 === 0) { // Log every 25%
                            console.log(`   📊 ${pct}%`);
                        }
                    }
                }
            });
            
            const text = result.data.text.trim();
            const confidence = result.data.confidence;
            
            console.log('✅ OCR Complete!');
            console.log('📝 Text:', text || '(empty)');
            console.log('📊 Confidence:', confidence.toFixed(1) + '%');
            
            // Show on screen for visual feedback
            document.querySelector('#reader-text').textContent = text || 'Scanning...';
            
            return text;
        } catch (error) {
            console.error('❌ Tesseract error:', error);
            return '';
        }
    }
    
    async ocrWithOCRSpace(canvas) {
        // OCR.space API
        const config = window.API_CONFIG?.OCR_SPACE;
        if (!config || !config.API_KEY) {
            console.error('OCR.space API key not configured');
            this.speak('OCR API key not configured. Please add your API key in config.js');
            return '';
        }
        
        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
            const formData = new FormData();
            formData.append('file', blob, 'image.jpg');
            formData.append('apikey', config.API_KEY);
            formData.append('language', 'eng');
            
            const response = await fetch(config.URL, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            return result.ParsedResults?.[0]?.ParsedText || '';
        } catch (error) {
            console.error('OCR.space error:', error);
            return '';
        }
    }
    
    async ocrWithGoogleVision(canvas) {
        // Google Cloud Vision API
        const config = window.API_CONFIG?.GOOGLE_VISION;
        if (!config || !config.API_KEY) {
            console.error('Google Vision API key not configured');
            this.speak('Google Vision API key not configured. Please add your API key in config.js');
            return '';
        }
        
        try {
            const base64Image = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
            
            const response = await fetch(`${config.URL}?key=${config.API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requests: [{
                        image: { content: base64Image },
                        features: [{ type: 'TEXT_DETECTION' }]
                    }]
                })
            });
            
            const result = await response.json();
            return result.responses?.[0]?.fullTextAnnotation?.text || '';
        } catch (error) {
            console.error('Google Vision error:', error);
            return '';
        }
    }
    
    async ocrWithAzure(canvas) {
        // Microsoft Azure Computer Vision API
        console.log('🔷 Azure OCR: Starting...');
        
        const config = window.API_CONFIG?.AZURE_VISION;
        if (!config || !config.API_KEY || !config.ENDPOINT) {
            console.error('❌ Azure Vision API key/endpoint not configured');
            console.log('Config:', config);
            this.speak('Azure Vision API not configured. Please add your API key and endpoint in config dot j s file.');
            return '';
        }
        
        console.log('🔷 Azure config found:', {
            endpoint: config.ENDPOINT,
            hasKey: !!config.API_KEY,
            keyLength: config.API_KEY?.length
        });
        
        try {
            // Enhance image quality before sending
            const enhancedCanvas = document.createElement('canvas');
            enhancedCanvas.width = canvas.width;
            enhancedCanvas.height = canvas.height;
            const ctx = enhancedCanvas.getContext('2d');
            
            // Draw original image
            ctx.drawImage(canvas, 0, 0);
            
            // Increase contrast for better OCR
            const imageData = ctx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height);
            const data = imageData.data;
            const factor = 1.2; // Contrast factor
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
            }
            
            ctx.putImageData(imageData, 0, 0);
            
            // Convert to blob with high quality
            const blob = await new Promise(resolve => enhancedCanvas.toBlob(resolve, 'image/jpeg', 0.95));
            console.log('🔷 Enhanced image blob created, size:', blob.size);
            
            const url = `${config.ENDPOINT}${config.URL_SUFFIX}?language=en&detectOrientation=true`;
            console.log('🔷 Calling Azure API:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': config.API_KEY,
                    'Content-Type': 'application/octet-stream'
                },
                body: blob
            });
            
            console.log('🔷 Azure response status:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Azure API error:', errorText);
                this.speak('Azure API error. Status: ' + response.status);
                return '';
            }
            
            const result = await response.json();
            console.log('🔷 Azure result:', result);
            
            // Extract text from regions
            const regions = result.regions || [];
            let text = '';
            let allWords = [];
            
            regions.forEach(region => {
                region.lines.forEach(line => {
                    let lineText = [];
                    line.words.forEach(word => {
                        lineText.push(word.text);
                        allWords.push(word.text);
                    });
                    text += lineText.join(' ') + ' ';
                });
            });
            
            text = text.trim();
            
            // If no text found, try getting it from the language property
            if (!text && result.language) {
                console.log('🔷 Trying alternative text extraction...');
                text = allWords.join(' ');
            }
            
            console.log('🔷 Extracted text:', text);
            console.log('🔷 Word count:', allWords.length);
            
            return text.trim();
        } catch (error) {
            console.error('❌ Azure Vision error:', error);
            console.error('Error stack:', error.stack);
            this.speak('Azure API connection failed. Please check your internet connection.');
            return '';
        }
    }
    
    handleDetectedText(text) {
        // Only process if text actually exists
        if (!text || text.trim().length === 0) {
            console.log('⚠️ No text detected');
            return; // Silent - no text detected
        }
        
        // Clean up the text - remove extra spaces and newlines
        text = text.trim().replace(/\s+/g, ' ');
        
        // Log detected text for debugging
        console.log('📝 RAW Detected text:', text);
        
        // If text is too short (less than 2 characters), likely noise
        if (text.length < 2) {
            console.log('⚠️ Text too short (less than 2 chars), ignoring');
            return;
        }
        
        console.log('✅ Text is valid length:', text.length, 'characters');
        
        // Comprehensive medical terms dictionary
        const medicalTerms = [
            // Departments (full names)
            'radiology', 'cardiology', 'neurology', 'orthopedics', 'orthopedic', 
            'pediatrics', 'pediatric', 'oncology', 'dermatology', 'gynecology', 
            'gynaecology', 'urology', 'ophthalmology', 'psychiatry', 'pathology',
            'anesthesiology', 'anesthesia', 'surgery', 'surgical', 'medicine',
            'gastroenterology', 'pulmonology', 'nephrology', 'endocrinology',
            'hematology', 'rheumatology', 'immunology',
            // Short forms
            'radiology', 'cardio', 'neuro', 'ortho', 'peds', 'onco', 'derm',
            'gastro', 'pulmo', 'nephro', 'endo', 'hemato', 'rheum',
            // Common hospital terms
            'emergency', 'icu', 'opd', 'ot', 'operation', 'theater', 'theatre',
            'department', 'dept', 'ward', 'room', 'unit', 'block', 'wing',
            'pharmacy', 'laboratory', 'lab', 'reception', 'registration',
            'admission', 'discharge', 'consultation', 'clinic', 'hospital',
            'center', 'centre', 'medical', 'health', 'care',
            // Equipment & Procedures
            'x-ray', 'xray', 'ct scan', 'mri', 'ultrasound', 'sonography',
            'ecg', 'ekg', 'echo', 'endoscopy', 'dialysis', 'scan', 'imaging',
            'blood test', 'vaccine', 'vaccination', 'injection', 'therapy',
            // Staff
            'doctor', 'dr', 'nurse', 'patient', 'staff'
        ];
        
        const lowerText = text.toLowerCase();
        
        // Find ALL medical terms in the detected text (LENIENT - no word boundaries)
        const foundTerms = [];
        const foundTermsLower = new Set();
        
        medicalTerms.forEach(term => {
            if (lowerText.includes(term)) {
                // Found the term! Extract it with original case from text
                const termLower = term.toLowerCase();
                const index = lowerText.indexOf(termLower);
                
                if (index !== -1 && !foundTermsLower.has(termLower)) {
                    // Extract the term with its original capitalization
                    const extractedTerm = text.substr(index, term.length);
                    foundTerms.push(extractedTerm);
                    foundTermsLower.add(termLower);
                    console.log(`   ✅ Found: "${extractedTerm}" (from term: "${term}")`);
                }
            }
        });
        
        console.log('🔍 Total medical terms found:', foundTerms.length, '→', foundTerms);
        
        if (foundTerms.length === 0) {
            console.log('❌ No medical terms found in:', text);
            document.querySelector('#reader-text').textContent = 'Scanning... (no medical terms)';
            return;
        }
        
        // Speak only the medical terms found
        const termsToSpeak = foundTerms.join(', ');
        console.log('🎯 Terms to speak:', termsToSpeak);
        
        console.log('✅✅✅ MEDICAL TERMS FOUND:', termsToSpeak);
        console.log('🔊🔊🔊 WILL SPEAK NOW:', termsToSpeak);
        
        // Update UI
        document.querySelector('#reader-text').textContent = '✅ Detected: ' + text;
        document.querySelector('#reader-last-detection').textContent = '🔊 Speaking: ' + termsToSpeak;
        
        // IMMEDIATE VOICE OUTPUT - Multiple attempts to ensure it speaks!
        console.log('🔇 Step 1: Canceling any previous speech...');
        window.speechSynthesis.cancel();
        
        // Try immediate speech first
        console.log('🔊 Step 2: Attempting immediate speech...');
        this.speakMedicalTerm(termsToSpeak);
        
        // Also try after delay as backup
        setTimeout(() => {
            console.log('🔊 Step 3: Backup speech attempt...');
            this.speakMedicalTerm(termsToSpeak);
        }, 100);
        
        // Vibrate for feedback
        if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300, 100, 300]);
            console.log('📳 Vibration triggered (3 times)');
        }
    }
    
    speakMedicalTerm(text) {
        console.log('🎤 speakMedicalTerm called with:', text);
        
        // FORCE WAKE UP speech synthesis
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();
        
        // Wait for voices to load if not ready
        const voices = window.speechSynthesis.getVoices();
        console.log('📢 Available voices:', voices.length);
        
        // Create speech utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8; // Slower for clarity
        utterance.volume = 1.0; // Maximum volume
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        
        // Use first English voice if available
        if (voices.length > 0) {
            const enVoice = voices.find(v => v.lang.startsWith('en'));
            if (enVoice) {
                utterance.voice = enVoice;
                console.log('🗣️ Using voice:', enVoice.name);
            }
        }
        
        utterance.onstart = () => {
            console.log('✅✅✅ SPEECH STARTED:', text);
            this.isSpeaking = true;
        };
        
        utterance.onend = () => {
            console.log('✅ Speech completed');
            this.isSpeaking = false;
        };
        
        utterance.onerror = (e) => {
            console.error('❌ Speech error:', e.error, e);
            console.error('Error details:', e);
        };
        
        // SPEAK IT - MULTIPLE METHODS!
        console.log('🔊 Calling speechSynthesis.speak()...');
        try {
            window.speechSynthesis.speak(utterance);
            console.log('🎤 Speech queued successfully');
            
            // Force resume again after queueing
            setTimeout(() => window.speechSynthesis.resume(), 10);
        } catch (err) {
            console.error('❌ Speech exception:', err);
        }
    }
    
    speakLastDetection() {
        const text = document.querySelector('#reader-text').textContent;
        if (text && text !== 'Point camera at signs or text') {
            this.speak(text, true);
        } else {
            this.speak('No text detected yet.');
        }
    }
    
    // ========================================================================
    // SETTINGS
    // ========================================================================
    
    loadSettings() {
        const saved = localStorage.getItem('mediCareSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.voiceSpeed = settings.voiceSpeed || 0.9;
            this.voiceVolume = settings.voiceVolume || 1.0;
            
            document.querySelector('#voice-speed').value = this.voiceSpeed;
            document.querySelector('#voice-volume').value = this.voiceVolume;
            
            // Load Azure API settings
            if (settings.azureApiKey) {
                document.querySelector('#azure-api-key').value = settings.azureApiKey;
                // Update API_CONFIG if user provided settings
                if (window.API_CONFIG) {
                    window.API_CONFIG.AZURE_VISION.API_KEY = settings.azureApiKey;
                }
            }
            if (settings.azureEndpoint) {
                document.querySelector('#azure-endpoint').value = settings.azureEndpoint;
                if (window.API_CONFIG) {
                    window.API_CONFIG.AZURE_VISION.ENDPOINT = settings.azureEndpoint;
                }
            }
        }
    }
    
    saveSettings() {
        // Get Azure API settings from input fields
        const azureApiKey = document.querySelector('#azure-api-key').value.trim();
        const azureEndpoint = document.querySelector('#azure-endpoint').value.trim();
        
        const settings = {
            voiceSpeed: this.voiceSpeed,
            voiceVolume: this.voiceVolume,
            azureApiKey: azureApiKey,
            azureEndpoint: azureEndpoint
        };
        
        // Update API_CONFIG in real-time
        if (window.API_CONFIG && azureApiKey && azureEndpoint) {
            window.API_CONFIG.AZURE_VISION.API_KEY = azureApiKey;
            window.API_CONFIG.AZURE_VISION.ENDPOINT = azureEndpoint;
            window.API_CONFIG.OCR_SERVICE = 'azure';
        }
        
        localStorage.setItem('mediCareSettings', JSON.stringify(settings));
        this.speak('Settings saved successfully.');
    }
    
    async testAzureConnection() {
        const apiKey = document.querySelector('#azure-api-key').value.trim();
        const endpoint = document.querySelector('#azure-endpoint').value.trim();
        
        if (!apiKey || !endpoint) {
            alert('⚠️ Please enter both API Key and Endpoint URL');
            this.speak('Please enter both API key and endpoint.');
            return;
        }
        
        this.speak('Testing Azure connection...');
        
        try {
            // Test with a simple image
            const testCanvas = document.createElement('canvas');
            testCanvas.width = 100;
            testCanvas.height = 100;
            const ctx = testCanvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.fillText('TEST', 20, 50);
            
            const blob = await new Promise(resolve => testCanvas.toBlob(resolve, 'image/jpeg'));
            
            const response = await fetch(`${endpoint}/vision/v3.2/ocr`, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                    'Content-Type': 'application/octet-stream'
                },
                body: blob
            });
            
            if (response.ok) {
                alert('✅ Success! Azure API connection is working.\n\nYour Sign Reader is ready to use!');
                this.speak('Azure connection successful! Sign reader is ready.');
                this.saveSettings(); // Auto-save on successful test
            } else {
                const error = await response.text();
                alert('❌ Connection failed!\n\nError: ' + response.status + '\n\nPlease check your API key and endpoint.');
                this.speak('Connection failed. Please check your credentials.');
                console.error('Azure test failed:', error);
            }
        } catch (error) {
            alert('❌ Connection error!\n\n' + error.message + '\n\nPlease check your endpoint URL format.');
            this.speak('Connection error. Please check your endpoint format.');
            console.error('Azure test error:', error);
        }
    }
}

// ============================================================================
// APP INITIALIZATION
// ============================================================================

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mediCareApp = new MediCareApp();
    });
} else {
    window.mediCareApp = new MediCareApp();
}
