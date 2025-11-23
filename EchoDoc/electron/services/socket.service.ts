import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server } from 'http'
import { ClientToServerEvents, ServerToClientEvents, Guest } from '../../src/shared/types'
import { AudioManager } from './audio.service'

export class SocketService {
    private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>
    private guests: Map<string, Guest> = new Map()
    private audioManager: AudioManager | null = null

    constructor(httpServer: Server) {
        this.io = new SocketIOServer(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST']
            }
        })

        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id)
            this.handleConnection(socket)
        })
    }

    public setAudioManager(manager: AudioManager) {
        this.audioManager = manager
    }

    private handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents>) {
        socket.on('join', (guestData: Omit<Guest, 'id'>) => {
            const guest: Guest = { ...guestData, id: socket.id }
            this.guests.set(socket.id, guest)
            socket.broadcast.emit('guest-joined', guest)
            console.log('Guest joined:', guest.name)
        })

        socket.on('disconnect', () => {
            const guest = this.guests.get(socket.id)
            if (guest) {
                this.guests.delete(socket.id)
                this.io.emit('guest-left', socket.id)
                console.log('Guest left:', guest.name)
            }
        })

        socket.on('audio-chunk', (data: ArrayBuffer) => {
            if (this.audioManager) {
                // console.log('Received audio chunk from', socket.id, data.byteLength)
                this.audioManager.processAudioChunk(socket.id, data)
            }
        })

        socket.on('control-signal', (type: 'push-to-talk-start' | 'push-to-talk-end') => {
            console.log('Control signal from', socket.id, type)
            // TODO: Handle control signal
        })
    }

    public broadcastTranscript(text: string, isFinal: boolean, speaker?: string) {
        this.io.emit('transcript-update', text, isFinal, speaker)
    }

    public broadcastNote(note: any) {
        this.io.emit('note-created', note)
    }

    public broadcastFile(url: string) {
        this.io.emit('file-shared', url)
    }
}
