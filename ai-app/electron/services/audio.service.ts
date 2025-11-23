import { DeepgramService } from './deepgram.service'
import { AudioMode } from '../../src/shared/types'
import { EventEmitter } from 'events'

export class AudioManager extends EventEmitter {
    private mode: AudioMode = 'OFFLINE_COLLAB'
    private deepgram: DeepgramService

    constructor(deepgramApiKey: string) {
        super()
        this.deepgram = new DeepgramService(deepgramApiKey)
        this.deepgram.on('transcript', (data) => this.handleTranscript(data))
    }

    public setMode(mode: AudioMode) {
        this.mode = mode
        console.log('Audio mode set to:', mode)
        // TODO: Reconfigure streams based on mode
    }

    public processAudioChunk(guestId: string, chunk: ArrayBuffer) {
        if (this.mode === 'OFFLINE_COLLAB') {
            console.log('Processing audio chunk from', guestId, chunk.byteLength)
            this.deepgram.sendAudio(Buffer.from(chunk))
        }
    }

    private handleTranscript(data: any) {
        // Only process final transcripts
        if (!data.is_final) return

        const transcript = data.channel?.alternatives?.[0]?.transcript

        if (transcript && transcript.trim().length > 0) {
            // Extract speaker from the first word
            const speaker = data.channel?.alternatives?.[0]?.words?.[0]?.speaker ?? 0
            console.log('Transcript received:', transcript, 'Speaker:', speaker)

            this.emit('transcript', {
                text: transcript,
                isFinal: data.is_final,
                speaker: speaker
            })
        }
    }

    public start() {
        this.deepgram.startStream()
    }

    public stop() {
        this.deepgram.stopStream()
    }
}
