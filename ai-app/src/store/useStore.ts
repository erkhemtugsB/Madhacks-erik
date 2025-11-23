import { create } from 'zustand'
import type { Note, AudioMode } from '../shared/types'

interface AppState {
    notes: Note[]
    mode: AudioMode
    pdfPage: number
    role: 'host' | 'guest' | null
    roomCode: string | null
    meetingStatus: 'idle' | 'active' | 'ended'
    addNote: (note: Note) => void
    setNotes: (notes: Note[]) => void
    setMode: (mode: AudioMode) => void
    setPdfPage: (page: number) => void
    setRole: (role: 'host' | 'guest' | null) => void
    setRoomCode: (code: string | null) => void
    setMeetingStatus: (status: 'idle' | 'active' | 'ended') => void
}

export const useStore = create<AppState>((set) => ({
    notes: [],
    mode: 'OFFLINE_COLLAB',
    pdfPage: 1,
    role: null,
    roomCode: null,
    meetingStatus: 'idle',
    addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
    setNotes: (notes) => set({ notes }),
    setMode: (mode) => set({ mode }),
    setPdfPage: (page) => set({ pdfPage: page }),
    setRole: (role) => set({ role }),
    setRoomCode: (roomCode) => set({ roomCode }),
    setMeetingStatus: (meetingStatus) => set({ meetingStatus }),
}))
