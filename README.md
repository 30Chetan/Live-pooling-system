# Intervue Live Polling System

A real-time, interactive Live Polling System built to connect Teachers and Students via seamless live web socket communication. The platform allows educators to create real-time questionnaires, broadcast them instantly to active participants, monitor live visual results, manage classroom participants, and review historical polling data. 

**Note:** This application was rapidly developed to strictly mirror high-fidelity Figma mockups, implementing an interactive, pixel-perfect frontend coupled tightly with a stable, reactive backend.

## 🚀 Features

* **Role-Based Workspaces**: Users securely identify themselves as either a **Teacher** or **Student** prior to entering the poll room.
* **Real-time Live Polling**:
  * Teachers can actively author polls with dynamic durations (10s, 30s, 60s, 90s) and multiple options, while defining precise correct answers.
  * Students natively receive the broadcast and make a single, verified selection.
  * The frontend dynamically renders live percentage shifts and visually alerts users with a synchronized countdown timer.
* **Live Chat & Participant Management**:
  * Persistent, built-in global chat system connecting the classroom.
  * Teachers possess an exclusive **Participants Tab** allowing them to monitor active student IDs and explicitly **Kick out** disruptive accounts in real-time. (Students instantly receive a full-screen notice upon removal).
* **Poll History & Analytics**:
  * Teachers can quickly toggle to view all natively completed polls containing exact voting ratios and participant aggregates.
  * Upon poll expiration, Students are forcibly redirected to a locked Final Results screen to review correct analytics alongside their peers.

## 🛠 Tech Stack

**Frontend Framework:**
* React (TypeScript) via Vite
* Tailwind CSS (Customized for strict Figma adherence)
* CSS Custom Properties & Dynamic SVGs
* `socket.io-client` 

**Backend Infrastructure:**
* Node.js & Express API
* TypeScript compiled environment
* `socket.io` (Real-time Websocket event brokering)
* MongoDB & Mongoose (State persistence & Database tracking)

---

## 💻 Running the Application Locally

### Prerequisites
* **Node.js**: `v16.0` or higher
* **MongoDB**: A running local instance (`mongodb://127.0.0.1:27017`) or Cloud Atlas URI

### 1. Starting the Backend Server
```bash
cd backend
npm install
# Create an environment file if not available
# echo "MONGO_URI=mongodb://127.0.0.1:27017/poll-system" > .env
# echo "PORT=3000" >> .env
# echo "FRONTEND_URL=http://localhost:5173" >> .env
npm run dev
```

### 2. Starting the Frontend Client
```bash
cd frontend
npm install
npm run dev
```

### Architecture Notes
This system extensively utilizes **React Context & Custom State Hooks** (e.g., `useSocket`, `usePollTimer`) relying heavily on standard Observer patterns to prevent duplicate WebSocket listener initialization that can degrade standard real-time interfaces.

---

### *Authored for Exact Visual Replication*
Extensive hours were allocated specifically to ensuring strict visual alignment (colors, spacing boundaries, hover states, UI toggles) to the primary assignment mockups provided.
