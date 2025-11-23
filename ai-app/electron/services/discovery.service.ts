import dgram from 'dgram'
import os from 'os'
import { EventEmitter } from 'events'

const PORT = 41234
const BROADCAST_ADDR = '255.255.255.255'

export class DiscoveryService extends EventEmitter {
    private socket: dgram.Socket
    private isHost: boolean = false
    private roomCode: string | null = null

    constructor() {
        super()
        this.socket = dgram.createSocket('udp4')
        this.setupSocket()
    }

    private setupSocket() {
        this.socket.on('error', (err) => {
            console.error(`UDP Socket error:\n${err.stack}`)
            this.socket.close()
        })

        this.socket.on('message', (msg, rinfo) => {
            const message = msg.toString()
            console.log(`UDP received: ${message} from ${rinfo.address}:${rinfo.port}`)

            if (this.isHost && this.roomCode) {
                // Host Logic: Reply to DISCOVER
                if (message === `DISCOVER:${this.roomCode}`) {
                    const ip = this.getLocalIp()
                    const response = `OFFER:${this.roomCode}:${ip}:3000`
                    this.socket.send(response, rinfo.port, rinfo.address, (err) => {
                        if (err) console.error('Error sending OFFER:', err)
                        else console.log(`Sent OFFER to ${rinfo.address}`)
                    })
                }
            } else {
                // Guest Logic: Listen for OFFER
                if (message.startsWith('OFFER:') && this.roomCode) {
                    const parts = message.split(':')
                    // Format: OFFER:ROOMCODE:IP:PORT
                    if (parts.length === 4 && parts[1] === this.roomCode) {
                        const hostIp = parts[2]
                        const hostPort = parts[3]
                        console.log(`Found host at ${hostIp}:${hostPort}`)
                        this.emit('host-found', { ip: hostIp, port: hostPort })
                    }
                }
            }
        })

        this.socket.bind(PORT, () => {
            this.socket.setBroadcast(true)
            console.log(`UDP Socket listening on ${PORT}`)
        })
    }

    public startHost(roomCode: string) {
        this.isHost = true
        this.roomCode = roomCode
        console.log(`Started hosting room: ${roomCode}`)
    }

    public startGuest(roomCode: string) {
        this.isHost = false
        this.roomCode = roomCode
        console.log(`Searching for room: ${roomCode}`)

        // Broadcast DISCOVER every 2 seconds
        const message = `DISCOVER:${roomCode}`
        const interval = setInterval(() => {
            if (!this.roomCode) {
                clearInterval(interval)
                return
            }
            this.socket.send(message, PORT, BROADCAST_ADDR, (err) => {
                if (err) console.error('Error broadcasting DISCOVER:', err)
            })
        }, 2000)

        // Initial broadcast
        this.socket.send(message, PORT, BROADCAST_ADDR)
    }

    public stop() {
        this.roomCode = null
        // We don't close the socket, just stop responding/broadcasting logic
        // or we could close and recreate. For now, just clearing roomCode stops logic.
    }

    private getLocalIp(): string {
        const interfaces = os.networkInterfaces()
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]!) {
                // Skip internal and non-IPv4 addresses
                if ('IPv4' !== iface.family || iface.internal) {
                    continue
                }
                return iface.address
            }
        }
        return '127.0.0.1'
    }
}
