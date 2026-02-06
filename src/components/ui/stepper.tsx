'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  Children,
  useRef,
  useLayoutEffect,
  HTMLAttributes,
  ReactNode,
  forwardRef,
} from 'react'
import { motion, AnimatePresence, Variants } from 'motion/react'
import { cn } from '@/lib/utils'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, type ButtonProps } from '@/components/ui/button'

// ============================================================================
// Types & Interfaces
// ============================================================================

export type StepStatus = 'complete' | 'active' | 'inactive'
export type StepperVariant = 'default' | 'minimal' | 'pills' | 'numbered'
export type StepperOrientation = 'horizontal' | 'vertical'

export interface StepConfig {
  id: string
  label: string
  description?: string
  icon?: ReactNode
  isOptional?: boolean
  isDisabled?: boolean
}

export interface StepperContextValue {
  // State
  currentStep: number
  totalSteps: number
  direction: number
  isCompleted: boolean
  isFirstStep: boolean
  isLastStep: boolean
  steps: StepConfig[]
  completedSteps: Set<number>
  
  // Actions
  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  completeStep: (step?: number) => void
  resetSteps: () => void
  
  // Validation
  canGoNext: boolean
  canGoPrev: boolean
  setCanGoNext: (can: boolean) => void
  
  // Config
  variant: StepperVariant
  orientation: StepperOrientation
  allowClickNavigation: boolean
}

// ============================================================================
// Context
// ============================================================================

const StepperContext = createContext<StepperContextValue | null>(null)

export function useStepper() {
  const context = useContext(StepperContext)
  if (!context) {
    throw new Error('useStepper must be used within a StepperProvider')
  }
  return context
}

// ============================================================================
// Root Stepper Component
// ============================================================================

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  
  /** Step configuration (auto-detected from children or passed explicitly) */
  steps?: StepConfig[]
  
  /** Controlled mode - current step index (0-based) */
  currentStep?: number
  onStepChange?: (step: number, direction: number) => void
  
  /** Uncontrolled mode - initial step index (0-based) */
  initialStep?: number
  
  /** Events */
  onComplete?: () => void
  onBeforeStepChange?: (from: number, to: number) => boolean | Promise<boolean>
  
  /** Visual variant */
  variant?: StepperVariant
  orientation?: StepperOrientation
  
  /** Allow clicking on step indicators to navigate */
  allowClickNavigation?: boolean
}

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      children,
      steps: stepsProp,
      currentStep: controlledStep,
      onStepChange,
      initialStep = 0,
      onComplete,
      onBeforeStepChange,
      variant = 'default',
      orientation = 'horizontal',
      allowClickNavigation = true,
      className,
      ...rest
    },
    ref
  ) => {
    const [internalStep, setInternalStep] = useState(initialStep)
    const [direction, setDirection] = useState(0)
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
    const [canGoNext, setCanGoNext] = useState(true)
    
    const isControlled = controlledStep !== undefined
    const currentStep = isControlled ? controlledStep : internalStep
    
    // Extract steps from children or use provided steps
    const stepsArray = useMemo(() => {
      if (stepsProp) return stepsProp
      
      const childArray = Children.toArray(children)
      return childArray
        .filter((child): child is React.ReactElement<StepperStepProps> => 
          React.isValidElement(child) && (child.type as any)?.displayName === 'StepperStep'
        )
        .map((child, index) => {
          const props = child.props as StepperStepProps
          return {
            id: props.id || `step-${index}`,
            label: props.label || `Step ${index + 1}`,
            description: props.description,
            icon: props.icon,
            isOptional: props.isOptional,
            isDisabled: props.isDisabled,
          }
        })
    }, [stepsProp, children])
    
    const totalSteps = stepsArray.length
    const isCompleted = currentStep >= totalSteps
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === totalSteps - 1
    
    const goToStep = useCallback(async (newStep: number) => {
      if (newStep < 0 || newStep > totalSteps) return
      if (newStep === currentStep) return
      if (stepsArray[newStep]?.isDisabled) return
      
      if (onBeforeStepChange) {
        const canProceed = await onBeforeStepChange(currentStep, newStep)
        if (!canProceed) return
      }
      
      const newDirection = newStep > currentStep ? 1 : -1
      setDirection(newDirection)
      
      if (isControlled) {
        onStepChange?.(newStep, newDirection)
      } else {
        setInternalStep(newStep)
        onStepChange?.(newStep, newDirection)
      }
      
      if (newStep >= totalSteps) {
        onComplete?.()
      }
    }, [currentStep, totalSteps, stepsArray, onBeforeStepChange, isControlled, onStepChange, onComplete])
    
    const nextStep = useCallback(() => {
      if (!canGoNext) return
      goToStep(currentStep + 1)
    }, [goToStep, currentStep, canGoNext])
    
    const prevStep = useCallback(() => {
      goToStep(currentStep - 1)
    }, [goToStep, currentStep])
    
    const completeStep = useCallback((step?: number) => {
      const stepToComplete = step ?? currentStep
      setCompletedSteps(prev => new Set(prev).add(stepToComplete))
    }, [currentStep])
    
    const resetSteps = useCallback(() => {
      setCompletedSteps(new Set())
      if (!isControlled) {
        setInternalStep(initialStep)
      }
    }, [isControlled, initialStep])
    
    const contextValue = useMemo<StepperContextValue>(() => ({
      currentStep,
      totalSteps,
      direction,
      isCompleted,
      isFirstStep,
      isLastStep,
      steps: stepsArray,
      completedSteps,
      goToStep,
      nextStep,
      prevStep,
      completeStep,
      resetSteps,
      canGoNext,
      canGoPrev: !isFirstStep,
      setCanGoNext,
      variant,
      orientation,
      allowClickNavigation,
    }), [
      currentStep, totalSteps, direction, isCompleted, isFirstStep, isLastStep,
      stepsArray, completedSteps, goToStep, nextStep, prevStep, completeStep, resetSteps,
      canGoNext, variant, orientation, allowClickNavigation
    ])
    
    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            'w-full',
            orientation === 'vertical' && 'flex gap-6',
            className
          )}
          data-orientation={orientation}
          data-variant={variant}
          {...rest}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = 'Stepper'

// ============================================================================
// Stepper Header (Step Indicators)
// ============================================================================

export interface StepperHeaderProps extends HTMLAttributes<HTMLDivElement> {
  showConnectors?: boolean
  showLabels?: boolean
  showDescriptions?: boolean
}

export const StepperHeader = forwardRef<HTMLDivElement, StepperHeaderProps>(
  ({ showConnectors = true, showLabels = true, showDescriptions = false, className, ...props }, ref) => {
    const { steps, currentStep, completedSteps, goToStep, orientation, allowClickNavigation } = useStepper()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          orientation === 'horizontal' ? 'w-full justify-between' : 'flex-col items-start gap-2',
          className
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const status: StepStatus = 
            completedSteps.has(index) || index < currentStep ? 'complete' : 
            index === currentStep ? 'active' : 'inactive'
          const isLast = index === steps.length - 1
          
          return (
            <React.Fragment key={step.id}>
              <StepIndicator
                step={index}
                status={status}
                config={step}
                showLabel={showLabels}
                showDescription={showDescriptions}
                onClick={() => allowClickNavigation && goToStep(index)}
                disabled={step.isDisabled || (!allowClickNavigation && status === 'inactive')}
              />
              {showConnectors && !isLast && orientation === 'horizontal' && (
                <StepConnector isComplete={status === 'complete' || index < currentStep} />
              )}
            </React.Fragment>
          )
        })}
      </div>
    )
  }
)
StepperHeader.displayName = 'StepperHeader'

// ============================================================================
// Step Indicator
// ============================================================================

export interface StepIndicatorRenderProps {
  step: number
  status: StepStatus
  config: StepConfig
}

export interface StepIndicatorProps extends HTMLAttributes<HTMLDivElement> {
  step: number
  status: StepStatus
  config: StepConfig
  showLabel?: boolean
  showDescription?: boolean
  disabled?: boolean
}

export const StepIndicator = forwardRef<HTMLDivElement, StepIndicatorProps>(
  ({ step, status, config, showLabel = true, showDescription = false, disabled, onClick, className, ...props }, ref) => {
    const { variant } = useStepper()
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center gap-2 transition-all duration-300',
          !disabled && 'cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        <motion.div
          animate={status}
          initial={false}
          className={cn(
            'relative flex items-center justify-center rounded-xl transition-all duration-300',
            variant === 'minimal' && 'w-3 h-3 rounded-full',
            variant === 'pills' && 'w-10 h-10',
            variant === 'numbered' && 'w-10 h-10',
            variant === 'default' && 'w-11 h-11',
          )}
        >
          <motion.div
            variants={{
              inactive: { 
                scale: 1, 
                backgroundColor: 'hsl(var(--muted))',
              },
              active: { 
                scale: 1.05, 
                backgroundColor: 'hsl(var(--primary))',
              },
              complete: { 
                scale: 1, 
                backgroundColor: 'hsl(var(--primary))',
              },
            }}
            transition={{ duration: 0.3 }}
            className={cn(
              'flex h-full w-full items-center justify-center rounded-xl font-semibold shadow-sm',
              status === 'active' && 'shadow-lg shadow-primary/30',
              status === 'complete' && 'shadow-md shadow-primary/20',
            )}
          >
            {config.icon ? (
              <span className={cn(
                status === 'inactive' ? 'text-muted-foreground' : 'text-primary-foreground'
              )}>
                {config.icon}
              </span>
            ) : status === 'complete' ? (
              <Check className="h-5 w-5 text-primary-foreground" strokeWidth={3} />
            ) : status === 'active' && variant === 'default' ? (
              <div className="h-3 w-3 rounded-full bg-primary-foreground/90" />
            ) : (
              <span className={cn(
                'text-sm font-bold',
                status === 'inactive' ? 'text-muted-foreground' : 'text-primary-foreground'
              )}>
                {step + 1}
              </span>
            )}
          </motion.div>
        </motion.div>
        
        {(showLabel || showDescription) && (
          <div className="text-center min-w-0">
            {showLabel && (
              <p className={cn(
                'text-sm font-medium transition-colors',
                status === 'active' && 'text-primary',
                status === 'complete' && 'text-primary',
                status === 'inactive' && 'text-muted-foreground',
              )}>
                {config.label}
                {config.isOptional && (
                  <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
                )}
              </p>
            )}
            {showDescription && config.description && (
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                {config.description}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
StepIndicator.displayName = 'StepIndicator'

// ============================================================================
// Step Connector
// ============================================================================

export interface StepConnectorRenderProps {
  isComplete: boolean
}

export interface StepConnectorProps extends HTMLAttributes<HTMLDivElement> {
  isComplete: boolean
}

export const StepConnector = forwardRef<HTMLDivElement, StepConnectorProps>(
  ({ isComplete, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative mx-2 h-1 flex-1 overflow-hidden rounded-full bg-muted',
          className
        )}
        {...props}
      >
        <motion.div
          className="absolute left-0 top-0 h-full bg-primary rounded-full"
          initial={false}
          animate={{ width: isComplete ? '100%' : '0%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    )
  }
)
StepConnector.displayName = 'StepConnector'

// ============================================================================
// Stepper Content (Step Panels)
// ============================================================================

export interface StepperContentProps extends HTMLAttributes<HTMLDivElement> {
  animated?: boolean
}

export const StepperContent = forwardRef<HTMLDivElement, StepperContentProps>(
  ({ animated = true, children, className, ...props }, ref) => {
    const { currentStep, direction, isCompleted } = useStepper()
    const childArray = Children.toArray(children)
    
    if (!animated) {
      return (
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {childArray[currentStep]}
        </div>
      )
    }
    
    return (
      <StepContentWrapper
        ref={ref}
        isCompleted={isCompleted}
        currentStep={currentStep}
        direction={direction}
        className={className}
        {...props}
      >
        {childArray[currentStep]}
      </StepContentWrapper>
    )
  }
)
StepperContent.displayName = 'StepperContent'

// ============================================================================
// Individual Step (for auto-detection)
// ============================================================================

export interface StepperStepProps extends HTMLAttributes<HTMLDivElement> {
  id?: string
  label?: string
  description?: string
  icon?: ReactNode
  isOptional?: boolean
  isDisabled?: boolean
}

export const StepperStep = forwardRef<HTMLDivElement, StepperStepProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {children}
      </div>
    )
  }
)
StepperStep.displayName = 'StepperStep'

// ============================================================================
// Stepper Navigation
// ============================================================================

export interface StepperNavigationProps extends HTMLAttributes<HTMLDivElement> {
  backLabel?: string
  nextLabel?: string
  completeLabel?: string
  backButtonProps?: ButtonProps
  nextButtonProps?: ButtonProps
  completeButtonProps?: ButtonProps
  showBack?: boolean
  showNext?: boolean
  renderBack?: (props: { onClick: () => void; disabled: boolean }) => ReactNode
  renderNext?: (props: { onClick: () => void; disabled: boolean; isLast: boolean }) => ReactNode
}

export const StepperNavigation = forwardRef<HTMLDivElement, StepperNavigationProps>(
  ({
    backLabel = 'Back',
    nextLabel = 'Continue',
    completeLabel = 'Complete',
    backButtonProps,
    nextButtonProps,
    completeButtonProps,
    showBack = true,
    showNext = true,
    renderBack,
    renderNext,
    className,
    children,
    ...props
  }, ref) => {
    const { isFirstStep, isLastStep, nextStep, prevStep, canGoNext, isCompleted } = useStepper()
    
    if (isCompleted) return null
    
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-3 mt-6 pt-4 border-t border-border',
          isFirstStep ? 'justify-end' : 'justify-between',
          className
        )}
        {...props}
      >
        {children ? children : (
          <>
            {showBack && !isFirstStep && (
              renderBack ? (
                renderBack({ onClick: prevStep, disabled: isFirstStep })
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  {...backButtonProps}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {backLabel}
                </Button>
              )
            )}
            
            {showNext && (
              renderNext ? (
                renderNext({ onClick: nextStep, disabled: !canGoNext, isLast: isLastStep })
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canGoNext}
                  {...(isLastStep ? completeButtonProps : nextButtonProps)}
                >
                  {isLastStep ? completeLabel : nextLabel}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              )
            )}
          </>
        )}
      </div>
    )
  }
)
StepperNavigation.displayName = 'StepperNavigation'

// ============================================================================
// Animated Content Wrapper (Internal)
// ============================================================================

interface StepContentWrapperProps extends HTMLAttributes<HTMLDivElement> {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: ReactNode
}

const StepContentWrapper = forwardRef<HTMLDivElement, StepContentWrapperProps>(
  ({ isCompleted, currentStep, direction, children, className }, ref) => {
    const [parentHeight, setParentHeight] = useState<number>(0)
    
    return (
      <motion.div
        ref={ref}
        style={{ position: 'relative', overflow: 'hidden' }}
        animate={{ height: isCompleted ? 0 : parentHeight }}
        transition={{ type: 'spring', duration: 0.4 }}
        className={className}
      >
        <AnimatePresence initial={false} mode="sync" custom={direction}>
          {!isCompleted && (
            <SlideTransition
              key={currentStep}
              direction={direction}
              onHeightReady={setParentHeight}
            >
              {children}
            </SlideTransition>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }
)
StepContentWrapper.displayName = 'StepContentWrapper'

// ============================================================================
// Slide Transition (Internal)
// ============================================================================

interface SlideTransitionProps {
  children: ReactNode
  direction: number
  onHeightReady: (height: number) => void
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight)
    }
  }, [children, onHeightReady])
  
  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

const slideVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-50%' : '50%',
    opacity: 0,
  }),
}

// ============================================================================
// Legacy exports for backwards compatibility
// ============================================================================

/** @deprecated Use StepperStep instead */
export const Step = StepperStep
