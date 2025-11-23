/**
 * SessionManager stores session-specific data like PDF context
 * Keyed by room code
 */
export class SessionManager {
    private static pdfContextMap: Map<string, string> = new Map()

    /**
     * Store PDF context for a session
     */
    public static setContext(roomCode: string, pdfText: string): void {
        this.pdfContextMap.set(roomCode, pdfText)
        console.log(`PDF context stored for room: ${roomCode} (${pdfText.length} characters)`)
    }

    /**
     * Retrieve PDF context for a session
     */
    public static getContext(roomCode: string): string {
        return this.pdfContextMap.get(roomCode) || ''
    }

    /**
     * Clear PDF context for a session
     */
    public static clearContext(roomCode: string): void {
        this.pdfContextMap.delete(roomCode)
        console.log(`PDF context cleared for room: ${roomCode}`)
    }

    /**
     * Clear all contexts
     */
    public static clearAll(): void {
        this.pdfContextMap.clear()
        console.log('All PDF contexts cleared')
    }
}
