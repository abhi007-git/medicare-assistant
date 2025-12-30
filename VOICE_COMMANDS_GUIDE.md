# Medicare Assistant - Voice Commands Guide

## Quick Reference: Voice Inputs & Outputs

### 🏠 General Commands

| Voice Input | Output/Action |
|------------|---------------|
| **"help"** | Lists all available voice commands |
| **"exit"** | Returns to home screen |
| **"stop"** | Stops all speech and processes immediately |

---

### 📝 Form Section

| Voice Input | Output/Action |
|------------|---------------|
| **"form"** | Goes to form section, says "Say start to begin filling" |
| **"start"** | Begins form filling process |
| - | App asks: "What is your name?" |
| Say your name | Records name, moves to next field |
| - | App asks: "What is your age?" |
| Say your age | Records age, moves to next field |
| - | App asks: "Do you want to provide phone? Yes or No" |
| **"yes"** | Waits for phone number input |
| **"no"** | Skips phone, moves to symptoms |
| - | App asks: "Do you want to describe symptoms? Yes or No" |
| **"yes"** | Waits for symptoms description |
| **"no"** | Skips symptoms, completes form |
| **"submit"** | Submits the completed form |

---

### 🎫 Queue/Token Section

| Voice Input | Output/Action |
|------------|---------------|
| **"queue"** or **"token"** | Goes to queue section and announces: |
| - | "Your token number is [number]" |
| - | "[X] patients ahead of you" |
| - | "Time left: approximately [X] minutes" |
| - | "Currently serving token [number]" |

---

### 🗺️ Navigation Section

| Voice Input | Output/Action |
|------------|---------------|
| **"navigate"** | Goes to navigation, lists all 6 rooms |
| - | "Number One: Cardiology Ward" |
| - | "Number Two: Orthopedics Ward" |
| - | "Number Three: Pediatrics Ward" |
| - | "Number Four: Neurology Ward" |
| - | "Number Five: Emergency Department" |
| - | "Number Six: Radiology Department" |
| **"one"** to **"six"** (or 1-6) | Provides turn-by-turn directions to that room |
| - | Announces department name, floor, and navigation steps |

---

### 👁️ Sign Reader Section

| Voice Input | Output/Action |
|------------|---------------|
| **"read"** or **"reader"** | Opens sign reader screen |
| **"start"** | Activates camera for text detection |
| - | **If hospital text detected:** Speaks the exact text shown |
| - | **If non-hospital text:** Says "Invalid. This is not a hospital sign." |
| - | **If no text detected:** Stays silent |
| **"stop"** | Stops scanning and closes camera |

---

## 🎯 Key Features

✅ **Always Listening** - App continuously listens for commands  
✅ **Auto-Reset** - Form clears every time you open it  
✅ **Auto-Updates** - Queue status updates every 30 seconds  
✅ **Hospital Filter** - Sign reader only reads medical terminology  
✅ **Instant Stop** - "Stop" command interrupts everything immediately  

---

## 📱 Usage Example

1. Open app → Tap "Activate Voice"
2. Say **"help"** → Hear all commands
3. Say **"form"** → Go to form
4. Say **"start"** → Begin filling (name → age → phone → symptoms)
5. Say **"token"** → Check queue status
6. Say **"navigate"** → Hear room list
7. Say **"three"** → Get directions to Pediatrics Ward
8. Say **"exit"** → Return home

---

**App Link:** https://abhi007-git.github.io/medicare-assistant/mobile-app.html
