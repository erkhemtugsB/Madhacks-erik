import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai"

const SYSTEM_PROMPT = `
You are an intelligent academic meeting assistant.
Input: A stream of conversation transcript + A simplified index of a PDF document.
Output: Strict JSON format.

Your Goal:
1. Analyze the input buffer.
2. Determine if the speaker has completed a distinct logical thought/segment.
3. If NOT complete, return { "status": "WAIT" }.
4. If COMPLETE:
   - Extract the content into a concise Markdown note.
   - Identify the specific PDF Page Number being discussed (if matched).
   - Extract any math formulas into LaTeX format wrapped in $$.
   - Return { "status": "COMMIT", "note": { "content": "...", "pageNumber": 123 }, "remaining_text": "..." }.
`

export class LLMService {
    private genAI: GoogleGenerativeAI
    private model: any

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey)
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ]
        })
    }

    public async analyzeTranscript(transcript: string, pdfContext: string = ''): Promise<any> {
        try {
            const result = await this.model.generateContent({
                systemInstruction: SYSTEM_PROMPT,
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `PDF Context: ${pdfContext}\n\nTranscript: ${transcript}` }]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })

            const text = result.response.text()
            try {
                return JSON.parse(text)
            } catch (e) {
                console.error('Failed to parse LLM response:', text)
                return { status: 'WAIT' }
            }
        } catch (error) {
            console.error('LLM Error:', error)
            return { status: 'WAIT' }
        }
    }
}
