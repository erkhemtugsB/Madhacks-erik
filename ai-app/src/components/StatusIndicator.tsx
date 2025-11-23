interface StatusIndicatorProps {
    status: 'disconnected' | 'connecting' | 'connected'
    label?: string
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
    const statusText = status.charAt(0).toUpperCase() + status.slice(1)

    return (
        <span className="inline-flex items-center gap-2" title={statusText}>
            <span className={`status-dot ${status}`} aria-hidden="true"></span>
            {label && <span className="text-sm text-gray-600">{label}</span>}
        </span>
    )
}
