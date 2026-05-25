import { LoadingSpinner } from './LoadingSpinner'

export function FullScreenSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted">Loading FlowMind...</p>
      </div>
    </div>
  )
}
