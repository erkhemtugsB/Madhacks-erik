import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import express from 'express'
import { DiscoveryService } from './services/discovery.service'
import { ExportService } from './services/export.service'
import { SocketService } from './services/socket.service'
import { AudioManager } from './services/audio.service'
import { TranscriptProcessor } from './services/transcript.service'
import { DbService } from './services/db.service'
import { PDFService } from './services/pdf.service'
import { SessionManager } from './services/session.service'
import os from 'os'
import fs from 'fs'
import dotenv from 'dotenv'
// ES module polyfills for __dirname and __filename
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let socketService: SocketService
let audioManager: AudioManager
let transcriptProcessor: TranscriptProcessor
let dbService: DbService
let discoveryService: DiscoveryService
let exportService: ExportService
let pdfService: PDFService
let currentPdfPath: string | null = null
let currentRoomCode: string | null = null

// ...

function getLocalIp(): string {
    const interfaces = os.networkInterfaces()
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if ('IPv4' !== iface.family || iface.internal) {
                continue
            }
            return iface.address
        }
    }
    return '127.0.0.1'
}

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        win.loadFile(path.join(process.env.DIST as string, 'index.html'))
    }
}

function initServices() {
    // Express App for Guest UI & File Serving
    const expressApp = express()
    const httpServer = createServer(expressApp)

    // Enable CORS
    expressApp.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
        next()
    })

    // Serve static files from dist
    const distPath = path.join(__dirname, '../dist')
    expressApp.use(express.static(distPath))

    // Serve uploads
    const uploadsDir = path.join(app.getPath('userData'), 'uploads')
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
    }
    expressApp.use('/uploads', express.static(uploadsDir))

    // Fallback for SPA routing
    expressApp.use((_req: any, res: any, next: any) => {
        if (_req.path.startsWith('/uploads')) return next()
        res.sendFile(path.join(distPath, 'index.html'))
    })

    socketService = new SocketService(httpServer)

    // Listen on all interfaces
    httpServer.listen(3000, '0.0.0.0', () => {
        console.log('Socket.io server running on port 3000')
    })

    httpServer.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error('Port 3000 is already in use. Please kill the process running on port 3000.')
        } else {
            console.error('HTTP Server error:', err)
        }
    })

    // Services
    const deepgramKey = process.env.DEEPGRAM_API_KEY || ''
    const geminiKey = process.env.GEMINI_API_KEY || ''

    audioManager = new AudioManager(deepgramKey)
    transcriptProcessor = new TranscriptProcessor(geminiKey)
    dbService = new DbService()
    discoveryService = new DiscoveryService()
    exportService = new ExportService()
    pdfService = new PDFService()

    socketService.setAudioManager(audioManager)

    // Wiring
    audioManager.on('transcript', (data) => {
        const speakerLabel = `Speaker ${data.speaker ?? 0}`
        socketService.broadcastTranscript(data.text, data.isFinal, speakerLabel)
        transcriptProcessor.addTranscript(data.text, data.isFinal)
        win?.webContents.send('transcript-update', data.text, data.isFinal, speakerLabel)
    })

    transcriptProcessor.on('note', async (noteData) => {
        const note = await dbService.createNote(noteData.content, noteData.pageNumber)
        socketService.broadcastNote(note)
        win?.webContents.send('note-created', note) // Added this line based on the provided snippet
    })

    discoveryService.on('host-found', (data) => {
        win?.webContents.send('host-found', data)
    })

    // IPC Handlers
    ipcMain.on('start-audio', () => {
        audioManager.start()
    })

    ipcMain.on('stop-audio', () => {
        audioManager.stop()
    })

    ipcMain.on('get-notes', async (event) => {
        const notes = await dbService.getNotes()
        event.reply('notes-list', notes)
    })

    ipcMain.on('change-mode', (event, data) => {
        const { mode } = data
        if (audioManager) {
            audioManager.setMode(mode)
            console.log('Mode changed to:', mode)
        }
    })

    // New IPC Handlers for Unified Architecture
    ipcMain.on('start-host', (event, { roomCode }) => {
        currentRoomCode = roomCode
        discoveryService.startHost(roomCode)
    })

    ipcMain.on('join-meeting', (event, { roomCode }) => {
        discoveryService.startGuest(roomCode)
    })

    ipcMain.on('end-meeting', async () => {
        try {
            console.log('Ending meeting...')

            // Step 1: Stop & Flush
            await transcriptProcessor.forceFlush()
            audioManager.stop()
            discoveryService.stop()

            // Step 2: Data Retrieval
            const notes = await dbService.getNotes()

            if (currentPdfPath && notes.length > 0) {
                // Step 3: Export Annotated PDF (page-specific notes only)
                const pdfPath = await exportService.generateMeetingSummary(currentPdfPath, notes)

                // Step 4: Export Markdown Summary (orphaned + backup)
                const mdPath = exportService.generateMarkdownSummary(notes, currentPdfPath)

                // Step 5: Finalize - Open file explorer
                const exportDir = path.dirname(pdfPath)
                shell.openPath(exportDir)

                console.log('Meeting ended successfully. Exports:', { pdfPath, mdPath })

                // Step 6: Cleanup & Purge (ONLY after successful export)
                try {
                    // Delete all notes from database
                    await dbService.deleteAllNotes()

                    // Delete original PDF from uploads directory
                    if (fs.existsSync(currentPdfPath)) {
                        fs.unlinkSync(currentPdfPath)
                        console.log('Original PDF deleted from uploads:', currentPdfPath)
                    }

                    console.log('Session data purged successfully.')
                } catch (cleanupError) {
                    console.error('Cleanup failed (non-critical):', cleanupError)
                }
            } else {
                console.log('No PDF or notes to export')
            }

            // Cleanup in-memory state
            if (currentRoomCode) {
                SessionManager.clearContext(currentRoomCode)
            }
            currentPdfPath = null
            currentRoomCode = null

        } catch (error) {
            console.error('End meeting failed:', error)
        }
    })

    ipcMain.on('leave-meeting', () => {
        discoveryService.stop()
    })

    // PDF upload
    ipcMain.on('upload-pdf', async (event, data) => {
        const { filename, data: fileData } = data
        try {
            const filePath = path.join(uploadsDir, filename)
            const buffer = Buffer.from(fileData)
            fs.writeFileSync(filePath, buffer)

            currentPdfPath = filePath

            // Parse PDF and store context
            if (currentRoomCode) {
                try {
                    const pdfText = await pdfService.parsePdf(filePath)
                    SessionManager.setContext(currentRoomCode, pdfText)
                    transcriptProcessor.setPdfContext(pdfText)
                } catch (error) {
                    console.error('Failed to parse PDF:', error)
                }
            }

            // Use localhost URL instead of file:// for browser compatibility
            const fileUrl = `http://localhost:3000/uploads/${encodeURIComponent(filename)}`
            socketService.broadcastFile(fileUrl)

            event.reply('pdf-uploaded', { success: true, path: fileUrl }) // Updated path to fileUrl
        } catch (error: any) {
            event.reply('pdf-uploaded', { success: false, error: error.message })
        }
    })
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    createWindow()
    initServices()
})
