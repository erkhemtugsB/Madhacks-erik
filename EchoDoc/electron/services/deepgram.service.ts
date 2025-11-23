import { createClient, LiveClient, LiveTranscriptionEvents } from '@deepgram/sdk'
import { EventEmitter } from 'events'

export class DeepgramService extends EventEmitter {
    private deepgram: any
    private live: LiveClient | null = null

    constructor(apiKey: string) {
        super()
        this.deepgram = createClient(apiKey)
    }

    public startStream() {
        if (this.live) return

        this.live = this.deepgram.listen.live({
            model: 'nova-2',
            smart_format: true,
            diarize: true,
            interim_results: true,
            keepAlive: true,
        })

        this.live?.on(LiveTranscriptionEvents.Open, () => {
            console.log('Deepgram connection opened')
            this.emit('open')
        })

        this.live?.on(LiveTranscriptionEvents.Close, (closeEvent: any) => {
            console.log('Deepgram connection closed. Event:', JSON.stringify(closeEvent))
            this.emit('close')
        })

        this.live?.on(LiveTranscriptionEvents.Transcript, (data: any) => {
            // console.log('Deepgram Event:', data.type)
            const transcript = data.channel?.alternatives?.[0]?.transcript

            if (transcript && transcript.trim().length > 0) {
                this.emit('transcript', data)
            }
        })

        this.live?.on(LiveTranscriptionEvents.Error, (error: any) => {
            console.error('Deepgram error:', error)
            this.emit('error', error)
        })

        this.live?.on(LiveTranscriptionEvents.Metadata, (metadata: any) => {
            console.log('Deepgram metadata:', metadata)
        })
    }

    public sendAudio(buffer: Buffer) {
        if (this.live) {
            const state = this.live.getReadyState()
            if (state === 1) {
                this.live.send(buffer as any)
            } else {
                console.warn('Deepgram not ready. State:', state)
            }
        } else {
            console.warn('Deepgram live client is null')
        }
    }

    public stopStream() {
        if (this.live) {
            this.live.finish()
            this.live = null
        }
    }
}
