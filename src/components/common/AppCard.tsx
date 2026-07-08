import { cn } from "../../utils/cn";

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function AppCard({ className, children, ...props }: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppCardHeader({ className, children, ...props }: AppCardProps) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppCardTitle({ className, children, ...props }: AppCardProps) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function AppCardContent({ className, children, ...props }: AppCardProps) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props}>
      {children}
    </div>
  );
}
