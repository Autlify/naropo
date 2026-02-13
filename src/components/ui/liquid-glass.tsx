'use client'

import React from 'react'
import LiquidGlassBase from 'liquid-glass-react'
import { VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

type Props = React.ComponentProps<typeof LiquidGlassBase>;

const LiquidGlass = (props: Props) => {
  return (
    <LiquidGlassBase
     {...props}
     blurAmount={props.blurAmount}
      mouseContainer={props.mouseContainer}
    >
      {props.children}
    </LiquidGlassBase>
  );
}

LiquidGlass.displayName = 'LiquidGlass';

export default LiquidGlass;






type MercuryButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  displacementScale?: number;
  blurAmount?: number;
  saturation?: number;
  aberrationIntensity?: number;
  elasticity?: number;
  cornerRadius?: number;
  overLight?: boolean;
  mode?: 'standard' | 'polar' | 'prominent' | 'shader';
} & VariantProps<typeof LiquidGlassBase> & {
  asChild?: boolean;
}
// React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
const MercuryButton = React.forwardRef<HTMLButtonElement, MercuryButtonProps>(
  ({
    className, asChild = false, ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(className)}
        ref={ref}
      >

        <LiquidGlass
          displacementScale={props.displacementScale}
          blurAmount={props.blurAmount}
          saturation={props.saturation}
          aberrationIntensity={props.aberrationIntensity}
          elasticity={props.elasticity}
          cornerRadius={props.cornerRadius}
          mouseContainer={props.mouseContainer}
          overLight={props.overLight}
          className={cn("flex items-center justify-center cursor-pointer", "w-screen")}
          mode={props.mode}
          padding="8px 16px"
          style={{
            position: "fixed",
            top: "3%",
            left: "50%",
            width: '100%',
            height: "calc(var(--spacing) * 12)px",
            transform: "translateX(-50%) translateY(-50%)",
            zIndex: 100,
            display: "inline-flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
          {...props}
        />
      </Comp>
    )
  }
)
MercuryButton.displayName = "MercuryButton"


// const [displacementScale, setDisplacementScale] = useState(140) // Effect: It creates a wavy, distorted effect on the glass surface.
// const [blurAmount, setBlurAmount] = useState(0.5) // Effect: It controls the amount of blur applied to the background seen through the glass.
// const [saturation, setSaturation] = useState(140) // Effect: It adjusts the color intensity of the background seen through the glass.
// const [aberrationIntensity, setAberrationIntensity] = useState(2) // Effect: It adds a chromatic aberration effect, causing color fringing around the edges of objects seen through the glass.
// const [elasticity, setElasticity] = useState(0)
// const [cornerRadius, setCornerRadius] = useState(32)
// const [overLight, setOverLight] = useState(true)
// const [mode, setMode] = useState<"standard" | "polar" | "prominent" | "shader">("standard")
// const containerRef = useRef<HTMLDivElement>(null)
// const dropdownRef = useRef<HTMLDivElement>(null)
// const [scroll, setScroll] = useState(0)
// const [isScrolled, setIsScrolled] = useState(false)
// const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
// const [isResourcesOpen, setIsResourcesOpen] = useState(false)
// const [onHover, setOnHover] = useState(false)
// const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
// const pathname = usePathname();
// const { theme } = useTheme();