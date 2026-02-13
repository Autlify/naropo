import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
         "flex h-10 w-full rounded-md border-2 border-line-secondary bg-background px-3 py-2 text-sm text-fg-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-fg-quaternary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 read-only:cursor-not-allowed read-only:focus-visible:ring-0 read-only:bg-bg-secondary/50 read-only:text-fg-tertiary transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
