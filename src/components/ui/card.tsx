import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Responsive to screen sizes
      "bg-card rounded-lg border bg-level-0 text-card-foreground shadow-sm",
      // rounded-lg border bg-card text-card-foreground shadow-sm
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((
  { className, ...props }, ref
) => (
  <div
    ref={ref}
    className={cn(
      // Responsive padding and spacing to screen sizes
      "flex flex-col space-y-1.5 p-6 sm:p-8 sm:space-y-2",
         // "flex flex-col space-y-1.5 p-6",
      className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((
  { className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Responsive design to screen sizes
      "lg:text-2xl font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((
  { className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((
  { className, ...props }, ref) => (
    // Responsive padding to screen sizes
  <div ref={ref} className={cn("p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"


const CardHighlight = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((
  { className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "from-muted/30 via-muted/20 to-muted/30 border-border/50 relative overflow-hidden rounded-xl border bg-gradient-to-r p-3 sm:p-4",
      className
    )}
    {...props}
  />
))
CardHighlight.displayName = "CardHighlight"





const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((
  { className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardHighlight }
