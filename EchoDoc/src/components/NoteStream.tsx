import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import 'katex/dist/katex.min.css'
import type { Note } from '../shared/types'

interface NoteStreamProps {
    notes: Note[]
    onNoteClick: (page: number) => void
}

export function NoteStream({ notes = [], onNoteClick }: NoteStreamProps) {
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [notes])

    return (
        <div className="flex flex-col h-full bg-gray-50 border-l border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-white">
                <h2 className="font-bold text-gray-800">Live Notes</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notes.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p className="text-sm">No notes yet</p>
                        <p className="text-xs">Start speaking to generate notes</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => note.pageNumber && onNoteClick(note.pageNumber)}
                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md ${note.pageNumber ? 'cursor-pointer hover:border-indigo-200' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {note.pageNumber && (
                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Page {note.pageNumber}
                                    </span>
                                )}
                            </div>
                            <div className="prose prose-sm max-w-none text-gray-700">
                                <ReactMarkdown
                                    remarkPlugins={[remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {note.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    ))
                )}
                <div ref={endRef} />
            </div>
        </div>
    )
}
