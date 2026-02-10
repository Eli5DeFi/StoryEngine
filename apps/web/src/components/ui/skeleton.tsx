import { cn } from "@/lib/utils"

/**
 * Skeleton loader component for displaying loading states
 * Provides accessible and smooth loading experience
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
