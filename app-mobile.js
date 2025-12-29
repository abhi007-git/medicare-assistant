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
        document.querySelector('#nav-set-destination-btn')?.addEventListener('click', () => this.listRooms());
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
        // Stop command - interrupt speech immediately
        if (command.includes('stop') || command.includes('quiet')) {
            window.speechSynthesis.cancel();
            return;
        }
        
        // Global commands (work from any screen)
        if (command.includes('help')) {
            this.speakHelp();
            return;
        }
        
        if (command.includes('go home') || command.includes('home screen')) {
            this.navigateTo('home');
            return;
        }
        
        if (command.includes('voice form') || command.includes('form filling') || command.includes('form')) {
            this.navigateTo('form');
            return;
        }
        
        if (command.includes('queue') || command.includes('token')) {
            this.navigateTo('queue');
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
            Say Voice Form to fill registration form.
            Say Queue to check your queue status.
            Say Navigate to get hospital directions.
            Say Read or Reader to scan signs.
            Say Go Home to return to main screen.
            Say Stop to stop speech.
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
                this.speak('Voice form screen. Say Start Form Filling to begin.');
                break;
            case 'queue':
                this.initQueue();
                break;
            case 'navigation':
                this.initNavigation();
                break;
            case 'reader':
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
        if (command.includes('start form') || command.includes('begin') || command.includes('filling')) {
            this.startForm();
        } else if (command.includes('yes') && this.waitingForOptionalConfirmation) {
            this.waitingForOptionalConfirmation = false;
            this.speak('Please provide the information.');
        } else if (command.includes('no') && this.waitingForOptionalConfirmation) {
            this.waitingForOptionalConfirmation = false;
            this.speak('Okay, skipping.');
            this.currentFieldIndex++;
            setTimeout(() => this.askFormQuestion(), 1000);
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
        if (command.includes('room') || command.includes('ward') || command.includes('department')) {
            // Extract room number
            const roomMatch = command.match(/room ?(one|two|three|four|five|six|1|2|3|4|5|6)|cardiology|orthopedics|pediatrics|neurology|emergency|radiology/i);
            if (roomMatch) {
                const input = roomMatch[0].toLowerCase();
                const roomNumbers = { 
                    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5', 'six': '6',
                    'cardiology': '1', 'orthopedics': '2', 'pediatrics': '3', 
                    'neurology': '4', 'emergency': '5', 'radiology': '6'
                };
                const room = roomNumbers[input] || input;
                this.setNavDestination(room);
            }
        } else if (command.includes('list') || command.includes('rooms') || command.includes('departments')) {
            this.listRooms();
        } else if (command.includes('reset')) {
            this.resetNavigation();
        }
    }
    
    initNavigation() {
        // Define hospital rooms
        this.hospitalRooms = {
            '1': { name: 'Cardiology Ward', floor: '2nd Floor, Left Wing' },
            '2': { name: 'Orthopedics Ward', floor: '2nd Floor, Right Wing' },
            '3': { name: 'Pediatrics Ward', floor: '3rd Floor, Left Wing' },
            '4': { name: 'Neurology Ward', floor: '3rd Floor, Right Wing' },
            '5': { name: 'Emergency Department', floor: 'Ground Floor' },
            '6': { name: 'Radiology Department', floor: '1st Floor' }
        };
        
        this.listRooms();
    }
    
    listRooms() {
        let message = 'Available departments: ';
        message += 'Room One: Cardiology Ward. ';
        message += 'Room Two: Orthopedics Ward. ';
        message += 'Room Three: Pediatrics Ward. ';
        message += 'Room Four: Neurology Ward. ';
        message += 'Room Five: Emergency Department. ';
        message += 'Room Six: Radiology Department. ';
        message += 'Say the room number or department name you want to go to.';
        
        this.speak(message, true);
    }
    
    setNavDestination(roomNum) {
        if (!this.hospitalRooms[roomNum]) {
            this.speak('Invalid room. Please say a room number from one to six.');
            return;
        }
        
        const room = this.hospitalRooms[roomNum];
        this.navDestination = roomNum;
        this.navCurrentStep = 0;
        
        // Define navigation steps based on room
        this.navSteps = this.getNavigationSteps(roomNum);
        
        document.querySelector('#nav-destination').textContent = room.name;
        document.querySelector('#nav-instruction-text').textContent = this.navSteps[0];
        
        this.speak(`Destination set to ${room.name}, ${room.floor}. ${this.navSteps[0]}`, true);
    }
    
    getNavigationSteps(roomNum) {
        const steps = {
            '1': [
                'Go to elevator. Take elevator to 2nd floor.',
                'Exit elevator, turn left.',
                'Walk straight for 20 meters.',
                'You have arrived at Cardiology Ward.'
            ],
            '2': [
                'Go to elevator. Take elevator to 2nd floor.',
                'Exit elevator, turn right.',
                'Walk straight for 20 meters.',
                'You have arrived at Orthopedics Ward.'
            ],
            '3': [
                'Go to elevator. Take elevator to 3rd floor.',
                'Exit elevator, turn left.',
                'Walk straight for 15 meters.',
                'You have arrived at Pediatrics Ward.'
            ],
            '4': [
                'Go to elevator. Take elevator to 3rd floor.',
                'Exit elevator, turn right.',
                'Walk straight for 15 meters.',
                'You have arrived at Neurology Ward.'
            ],
            '5': [
                'From entrance, turn right.',
                'Walk straight for 10 meters.',
                'You have arrived at Emergency Department.'
            ],
            '6': [
                'Go to elevator. Take elevator to 1st floor.',
                'Exit elevator, go straight.',
                'Walk for 12 meters.',
                'You have arrived at Radiology Department.'
            ]
        };
        
        return steps[roomNum] || ['Navigation not available.'];
    }
    
    processQRNavigation(qrData) {
        if (!this.navDestination) {
            this.speak('Please set a destination first. Say the room number you want to visit.');
            return;
        }
        
        // Simulate QR code scanning progress
        if (this.navCurrentStep < this.navSteps.length - 1) {
            this.navCurrentStep++;
            const instruction = this.navSteps[this.navCurrentStep];
            document.querySelector('#nav-instruction-text').textContent = instruction;
            this.speak(instruction, true);
        } else {
            this.speak('You have reached your destination.', true);
            this.navDestination = null;
        }
    }
    
    resetNavigation() {
        this.navDestination = null;
        this.navCurrentStep = 0;
        this.navSteps = [];
        document.querySelector('#nav-destination').textContent = 'Not Set';
        document.querySelector('#nav-instruction-text').textContent = 'Say a room number to set destination';
        this.speak('Navigation reset.');
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
            const video = document.querySelector('#reader-camera');
            this.readerStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            video.srcObject = this.readerStream;
            
            this.readerActive = true;
            document.querySelector('#reader-toggle-btn').innerHTML = '<span class="material-symbols-outlined">stop</span> Stop Scanning';
            document.querySelector('#reader-status-badge').innerHTML = '<span class="text-success">Scanning</span>';
            
            this.speak('Camera activated. Point at signs or text. I will read them aloud automatically.');
            
            // Simulate OCR detection (replace with actual OCR API)
            this.startOCRDetection();
        } catch (error) {
            console.error('Camera error:', error);
            this.speak('Unable to access camera. Please check permissions.');
        }
    }
    
    stopReader() {
        if (this.readerStream) {
            this.readerStream.getTracks().forEach(track => track.stop());
            this.readerStream = null;
        }
        
        this.readerActive = false;
        document.querySelector('#reader-toggle-btn').innerHTML = '<span class="material-symbols-outlined">photo_camera</span> Start Scanning';
        document.querySelector('#reader-status-badge').innerHTML = '<span class="text-text-muted">Idle</span>';
        
        this.speak('Scanning stopped.');
    }
    
    startOCRDetection() {
        // Simulate text detection every 4 seconds
        if (!this.readerActive) return;
        
        setTimeout(() => {
            if (this.readerActive) {
                // Hospital-specific terminology only
                const hospitalTexts = [
                    'Radiology Department',
                    'Emergency Exit',
                    'Pharmacy',
                    'Cardiology Ward',
                    'Registration Counter',
                    'Waiting Area',
                    'Orthopedics Department',
                    'Pediatrics Ward',
                    'Neurology Department',
                    'ICU - Intensive Care Unit',
                    'Operation Theater',
                    'Laboratory',
                    'Blood Bank',
                    'X-Ray Room',
                    'CT Scan Room',
                    'MRI Room',
                    'Consultation Room',
                    'Vaccination Center',
                    'Cafeteria',
                    'Restrooms',
                    'Elevator',
                    'Stairs',
                    'Reception Desk',
                    'Ambulance Entrance',
                    'Visitor Parking'
                ];
                
                const detected = hospitalTexts[Math.floor(Math.random() * hospitalTexts.length)];
                this.handleDetectedText(detected);
                
                this.startOCRDetection(); // Continue detection
            }
        }, 4000);
    }
    
    handleDetectedText(text) {
        // Filter: Only announce hospital-related text
        const hospitalKeywords = [
            'department', 'ward', 'room', 'emergency', 'radiology', 'cardiology',
            'orthopedics', 'pediatrics', 'neurology', 'pharmacy', 'laboratory',
            'reception', 'registration', 'icu', 'operation', 'theater', 'exit',
            'entrance', 'waiting', 'consultation', 'vaccination', 'blood bank',
            'x-ray', 'ct scan', 'mri', 'ambulance', 'cafeteria', 'restroom',
            'elevator', 'stairs', 'parking'
        ];
        
        const lowerText = text.toLowerCase();
        const isHospitalRelated = hospitalKeywords.some(keyword => lowerText.includes(keyword));
        
        if (isHospitalRelated) {
            document.querySelector('#reader-text').textContent = text;
            this.speak(text, true);
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
        }
    }
    
    saveSettings() {
        const settings = {
            voiceSpeed: this.voiceSpeed,
            voiceVolume: this.voiceVolume
        };
        localStorage.setItem('mediCareSettings', JSON.stringify(settings));
        this.speak('Settings saved.');
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
