# EchoDoc v2.1

EchoDoc is a unified Electron application for real-time meeting collaboration, featuring offline discovery, file broadcasting, and AI-powered note-taking.

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### 2. Installation
Run this command once to install all dependencies:
```bash
npm install
```

### 3. Database Setup
Initialize the local SQLite database. You only need to do this once (or if you change the database schema):
```bash
npx prisma db push
```

### 4. Running the App
Start the application in development mode:
```bash
npm run dev
```

---

## 🛠️ Development Workflow

### Do I need to run `npm install` every time?
**No.** You only need to run `npm install` if you:
- Clone the project for the first time.
- Add a new package (e.g., `npm install some-library`).
- Pull changes from git that include updates to `package.json`.

### Do I need to run `npx prisma db push` every time?
**No.** You only need to run this if you modify `prisma/schema.prisma` to change the database structure.

### Hot Reloading
When you run `npm run dev`, the app supports **Hot Module Replacement (HMR)**.
- **Frontend changes** (`src/**/*`): Update instantly without reloading.
- **Backend changes** (`electron/**/*`): The app will automatically restart.

---

## 📦 Features (v2.1)

- **Unified Interface**: Single app for both Hosts and Guests.
- **Mode A (Offline Collaboration)**:
    - **Host**: Create a room, upload PDFs, and broadcast audio/notes.
    - **Guest**: Join via Room Code, auto-discover host on local network (UDP), and receive files/notes.
- **AI-Powered Notes**: Uses Gemini 2.0 Flash to transcribe and summarize meetings in real-time.
- **Auto-Export**: Automatically generates an annotated PDF summary when the meeting ends.

## 🔑 Environment Variables
Ensure you have a `.env` file in the root directory with:
```env
DATABASE_URL="file:./dev.db"
DEEPGRAM_API_KEY="your_key_here"
GEMINI_API_KEY="your_key_here"
```
