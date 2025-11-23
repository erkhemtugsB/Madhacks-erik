import { LLMService } from './llm.service'
import { EventEmitter } from 'events'

export class TranscriptProcessor extends EventEmitter {
    private buffer: string = ''
    private llm: LLMService
    private isProcessing: boolean = false
    private pdfContext: string = ''

    constructor(apiKey: string) {
        super()
        this.llm = new LLMService(apiKey)
    }

    public setPdfContext(pdfText: string) {
        this.pdfContext = pdfText
        console.log(`PDF context set in TranscriptProcessor (${pdfText.length} characters)`)
    }

    public async forceFlush(): Promise<void> {
        if (this.buffer.trim()) {
            console.log('Forcing final buffer flush before meeting end...')
            await this.processBuffer()
        }
    }

    public addTranscript(text: string, isFinal: boolean) {
        this.buffer += ' ' + text

        // Trigger analysis if buffer is long enough or speech is final
        // Simple token estimation: 1 word ~ 1.3 tokens. 200 tokens ~ 150 words.
        const wordCount = this.buffer.split(' ').length

        if (isFinal || wordCount > 200) {
            this.processBuffer()
        }
    }

    private async processBuffer() {
        if (this.isProcessing || !this.buffer.trim()) return
        this.isProcessing = true

        const currentBuffer = this.buffer
        // console.log('Processing buffer:', currentBuffer)

        const result = await this.llm.analyzeTranscript(currentBuffer, this.pdfContext)

        if (result.status === 'COMMIT') {
            this.emit('note', result.note)
            // If there's remaining text, keep it, otherwise clear processed part
            // The prompt says it returns "remaining_text".
            this.buffer = result.remaining_text || ''
        } else {
            // Keep buffer
        }

        this.isProcessing = false
    }
}
