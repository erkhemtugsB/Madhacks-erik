import { PrismaClient } from '@prisma/client'
import { Note } from '../../src/shared/types'

export class DbService {
    private prisma: PrismaClient

    constructor() {
        this.prisma = new PrismaClient()
    }

    public async createNote(content: string, pageNumber?: number): Promise<Note> {
        const note = await this.prisma.note.create({
            data: {
                content,
                pageNumber,
            }
        })
        return {
            id: note.id,
            content: note.content,
            pageNumber: note.pageNumber || undefined,
            createdAt: note.createdAt
        }
    }

    public async getNotes(): Promise<Note[]> {
        const notes = await this.prisma.note.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return notes.map(n => ({
            id: n.id,
            content: n.content,
            pageNumber: n.pageNumber || undefined,
            createdAt: n.createdAt
        }))
    }

    public async deleteAllNotes(): Promise<void> {
        await this.prisma.note.deleteMany({})
        console.log('All notes deleted from database')
    }
}
