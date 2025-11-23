export type AudioMode = 'OFFLINE_COLLAB' | 'OFFLINE_LECTURE' | 'ONLINE_MEETING'

export interface Guest {
    id: string
    name: string
    deviceId: string
}

export interface Note {
    id: number
    content: string
    pageNumber?: number
    createdAt: Date
}

export interface ServerToClientEvents {
    'transcript-update': (text: string, isFinal: boolean, speaker?: string) => void
    'note-created': (note: Note) => void
    'mode-changed': (mode: AudioMode) => void
    'guest-joined': (guest: Guest) => void
    'guest-left': (guestId: string) => void
    'error': (message: string) => void
    'file-shared': (url: string) => void
}

export interface ClientToServerEvents {
    'join': (guest: Omit<Guest, 'id'>) => void
    'audio-chunk': (data: ArrayBuffer) => void
    'control-signal': (type: 'push-to-talk-start' | 'push-to-talk-end') => void
}
