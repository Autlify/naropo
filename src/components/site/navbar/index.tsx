"use client";

import { cn } from "@/lib/utils";
import { BarChart, BookOpen, Boxes, ChevronDown, Contact, Zap } from "lucide-react";
import Link from "next/link";
// Direct path imports (barrel removed)
import { ModeToggle, ModeButton } from '@/components/global/mode-toggle';
import { UserButton } from '@/components/global/user-button';
import LiquidGlass from "@/components/ui/liquid-glass";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Geist } from "next/font/google";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { AccessibilityPanel, AccessibilityTrigger } from "@/components/panels/accessibility-panel";
import { Button } from "../../ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// Hook to detect background brightness behind navbar using html2canvas-like pixel sampling
const useBackgroundContrast = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [isDarkBackground, setIsDarkBackground] = useState(true)

  useEffect(() => {
    const checkBackgroundBrightness = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const navbarY = rect.top + rect.height / 2
      const navBarHeight = rect.height
      

      // Sample multiple points horizontally across navbar
      const samplePoints = [
        rect.left + rect.width * 0.25,
        rect.left + rect.width * 0.5,
        rect.left + rect.width * 0.75,
      ]

      let totalLuminance = 0
      let sampleCount = 0

      for (const x of samplePoints) {
        // Get all elements at this point, excluding navbar
        const elements = document.elementsFromPoint(x, navbarY)

        for (const el of elements) {
          if (el === containerRef.current || containerRef.current?.contains(el)) continue

          const styles = window.getComputedStyle(el)
          const bgColor = styles.backgroundColor
          const bgImage = styles.backgroundImage

          // Check for solid background color
          if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
            const rgb = bgColor.match(/\d+/g)
            if (rgb && rgb.length >= 3) {
              const [r, g, b] = rgb.map(Number)
              // Skip if fully transparent
              if (rgb.length === 4 && Number(rgb[3]) === 0) continue

              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
              totalLuminance += luminance
              sampleCount++
              break // Found a solid background, stop checking this point
            }
          }

          // Check for gradient backgrounds (parse first color)
          if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
            const gradientColors = bgImage.match(/rgba?\([^)]+\)/g)
            if (gradientColors && gradientColors.length > 0) {
              const firstColor = gradientColors[0]
              const rgb = firstColor.match(/\d+/g)
              if (rgb && rgb.length >= 3) {
                const [r, g, b] = rgb.map(Number)
                const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
                totalLuminance += luminance
                sampleCount++
                break
              }
            }
          }
        }
      }

      // Default to dark if no samples (for images, assume dark since hero usually is)
      if (sampleCount === 0) {
        // Check scroll position as fallback - light sections typically appear after hero
        const scrollY = window.scrollY
        const viewportHeight = window.innerHeight

        // Assume: top of page = dark, scrolled past hero = check for light sections
        if (scrollY > viewportHeight * 0.3) {
          // Past the hero - more likely to be on light background
          setIsDarkBackground(false)
        } else {
          setIsDarkBackground(true)
        }
        return
      }

      const avgLuminance = totalLuminance / sampleCount
      setIsDarkBackground(avgLuminance < 0.5)
    }

    // Debounce for performance
    let rafId: number
    const debouncedCheck = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(checkBackgroundBrightness)
    }

    // Check on mount and scroll
    checkBackgroundBrightness()
    window.addEventListener('scroll', debouncedCheck, { passive: true })
    window.addEventListener('resize', debouncedCheck, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', debouncedCheck)
      window.removeEventListener('resize', debouncedCheck)
    }
  }, [containerRef])

  return isDarkBackground
}

type NavbarOptions = {
  label: string;
  href: string;
  onClick?: () => void;
  active?: boolean;
  external?: boolean;
  target?: string;
  rel?: string;
  icon?: React.ReactNode;
}

const navbarOptions: NavbarOptions[] = [
  { label: "Home", href: "/site" },
  { label: "Features", href: "/site/features" },
  { label: "Pricing", href: "/site/pricing" },
  { label: "Docs", href: "/site/docs" },
  { label: "Blog", href: "/site/blog" },
  { label: "About", href: "/site/about" },
  { label: "Contact", href: "/site/contact" },
]

// Shared NavItem component to avoid duplication
interface NavItemProps {
  option: NavbarOptions;
  isActive: boolean;
  useLightText: boolean;
  optionHovered: string | null;
  setOptionHovered: (label: string | null) => void;
  isMobile?: boolean;
  onItemClick?: () => void;
}

function NavItem({
  option,
  isActive,
  useLightText,
  optionHovered,
  setOptionHovered,
  isMobile = false,
  onItemClick
}: NavItemProps) {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || resolvedTheme === 'premium';
  const baseClasses = cn(
    "group relative flex items-center rounded-md m-[4px] mx-2 text-sm  font-medium transition-colors whitespace-nowrap",
    isActive
      ? useLightText ? "text-blue-600" : "text-foreground" // left col = isActive + useLightText | right col = isActive + !useLightText
      : useLightText
        ?  isDarkMode ? "text-white/90 hover:text-white": "text-muted-foreground" // Light text for dark backgrounds
        : isDarkMode ? "text-gray-400 hover:text-gray-600" : "text-zinc-500 hover:text-gray-600"  // Dark text for light backgrounds
  );

  const handleClick = () => {
    if (onItemClick) onItemClick();
    if (option.onClick) option.onClick();
  };

  return (
    <Link
      href={option.href}
      className={baseClasses}
      onClick={handleClick}
      rel={option.rel}
      onMouseEnter={() => setOptionHovered(option.label)}
    >
      {option.icon ? (
        <span className={cn("flex items-center mr-2", baseClasses)}>
          {option.icon}
          <span className="ml-1">{option.label}</span>
        </span>
      ) : (
        <span className={baseClasses}>{option.label}</span>
      )}
      {}

      {/* Animated underline for active state */}
      {isActive && (
        <motion.div
          layoutId={isMobile ? "mobile-navbar-underline" : "navbar-underline"}
          className={cn(
            "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full",
            useLightText
              ? "bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"
              : "bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600"
          )}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30
          }}
        />
      )}

      {/* Sliding hover effect */}
      {optionHovered === option.label && (
        <motion.div
          layoutId={isMobile ? "mobile-navbar-hover" : "navbar-hover"}
          className={cn(
            "absolute inset-0 rounded-md -z-0",
            useLightText ? "bg-white/10" : "bg-gray-200/50"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 30
          }}
        />
      )}
    </Link>
  );
}

export function Navbar() {
  const [displacementScale, setDisplacementScale] = useState(140) // Effect: It creates a wavy, distorted effect on the glass surface.
  const [blurAmount, setBlurAmount] = useState(0.5) // Effect: It controls the amount of blur applied to the background seen through the glass.
  const [saturation, setSaturation] = useState(140) // Effect: It adjusts the color intensity of the background seen through the glass.
  const [aberrationIntensity, setAberrationIntensity] = useState(2) // Effect: It adds a chromatic aberration effect, causing color fringing around the edges of objects seen through the glass.
  const [elasticity, setElasticity] = useState(0)
  const [cornerRadius, setCornerRadius] = useState(32)
  const [overLight, setOverLight] = useState(true)
  const [mode, setMode] = useState<"standard" | "polar" | "prominent" | "shader">("prominent")
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const [scroll, setScroll] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [onHover, setOnHover] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const pathname = usePathname();
  const { theme } = useTheme();
  const [optionHovered, setOptionHovered] = useState<string | null>(null);

  // Use dynamic background contrast detection
  const isDarkBackground = useBackgroundContrast(containerRef)

  // Determine if we should use light text (dark theme or dark background)
  const useLightText = theme === 'dark' || theme === 'premium' || isDarkBackground;

  const buttonClasses = cn(useLightText
    ? "text-muted-foreground hover:border-primary hover:bg-muted focus:border-primary hover:text-muted-foreground"
    : "text-foreground hover:border-primary hover:bg-muted focus:border-border hover:text-muted-foreground"
    , "border transition-colors duration-200");

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResourcesOpen(false);
      }
      // Close mobile menu when clicking outside (but not when clicking the toggle button)
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        mobileMenuButtonRef.current &&
        !mobileMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  useEffect(() => {
    const updateScroll = () => {
      const scroll = window.scrollY || document.documentElement.scrollTop;
      setScroll(scroll);
      setIsScrolled(scroll > 10);
    };
    window.addEventListener("scroll", updateScroll);
    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      const scroll = window.scrollY || document.documentElement.scrollTop;
      setScroll(scroll);
      setIsScrolled(scroll > 10);
    })
  }


  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDisplacementScale(window.innerWidth > 768 ? 100 : 70)
      }
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Set overLight based on scroll position (over bright background)
  useEffect(() => {
    if (scroll > 230 && scroll < 500) {
      setOverLight(true)
    } else {
      setOverLight(false)
    }
  }, [scroll])

  const scrollingOverBrightSection = scroll > 230 && scroll < 500

  const handleMouseEnter = (option: NavbarOptions) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }

  const handleMouseLeave = () => {
    // Add delay before hiding dropdown
    const timeout = setTimeout(() => {
      setIsResourcesOpen(false);
    }, 300); // 300ms delay

    setHoverTimeout(timeout);
  }

  const handleDropdownMouseEnter = () => {
    // Clear timeout when mouse enters dropdown
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  }

  const handleDropdownMouseLeave = () => {
    // Hide dropdown when mouse leaves dropdown area
    setIsResourcesOpen(false);
  }

  return (
    <div className={`${geistSans.className} md:w-full min-w-screen justify-between`}>
      {/*  Glass Effect Demo */}
      <div className="-z-10 w-full flex flex-1" ref={containerRef} onScroll={handleScroll}>
        <LiquidGlass
          displacementScale={displacementScale}
          blurAmount={blurAmount}
          saturation={saturation}
          aberrationIntensity={aberrationIntensity}
          elasticity={elasticity}
          cornerRadius={5}
          mouseContainer={containerRef}
          overLight={scrollingOverBrightSection || overLight}
          className={cn("flex items-center justify-center cursor-pointer", "w-full z-100")}
          mode={mode}
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
        >
          <div className="min-w-screen md:max-w-xl flex flex-row items-center md:items-start justify-between gap-4 top-2 md:top-2 lg:top-4 pr-8 md:pr-0 relative overflow-visible min-h-[64px]">
            {/* Logo Section */}
            <div className="flex items-center shrink-0 mr-2 relative h-full">
              <Link
                href="/"
                className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl transition-all"
                aria-label="Go to homepage"
              >
                {/* <div
                  className={cn(
                    "w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/25",
                    "flex items-center justify-center",
                    "group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-200"
                  )}> */}
                {/* Autlify Logo */}
                {/* <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">A</text>
                  </svg> */}
                <Image
                  src="/assets/autlify-logo.svg"
                  alt="Autlify Logo"
                  width={48}
                  height={48}
                  className="object-contain"
                />
                {/* </div> */}
                <span className={cn(
                  "text-xl font-bold select-none transition-colors",
                  useLightText ? "text-white" : "text-gray-900"
                )}>Autlify</span>
              </Link>
            </div>
            {/* Navigation Section - Centered with flex-1 */}
            <nav
              className="hidden md:flex flex-1 min-w-0 items-center justify-center"
              onMouseLeave={() => setOptionHovered(null)}
            >
              <div className="flex items-center gap-1 lg:gap-4 relative">
                <AnimatePresence>
                  {navbarOptions.map((option) => (
                    <NavItem
                      key={option.label}
                      option={option}
                      isActive={pathname === option.href}
                      useLightText={useLightText}
                      optionHovered={optionHovered}
                      setOptionHovered={setOptionHovered}
                    />
                  ))}
                </AnimatePresence> 
              </div>
            </nav>
            {/* Buttons Section */}
            <div className={cn("flex items-center gap-3 md:gap-3 shrink-0 pr-8 items-center justify-center relative")}>
              {/* Login - hidden on mobile, shown in mobile menu */}
              <Button
                variant={useLightText ? "default" : "default"}
                size="sm"
                className={cn(
                  "hidden md:flex px-5 h-8 py-1 rounded-xl text-sm font-semibold",
                  !useLightText && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                asChild
              >
                <Link href="/agency" aria-label="Login to your account" >
                  Login
                </Link>
              </Button>
              <UserButton className={buttonClasses} />
              <ModeButton className={buttonClasses} />

              {/* Mobile Menu Button - far right on mobile */}
              <button
                ref={mobileMenuButtonRef}
                className={cn(
                  "md:hidden shrink-0 flex items-center justify-center w-10 h-10 rounded-md transition-colors duration-200 border border-transparent",
                  isMobileMenuOpen ? "bg-primary/20 text-primary border-primary/30" : buttonClasses
                )}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
                aria-expanded={isMobileMenuOpen}
              >
                <svg
                  className="w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMobileMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2} 
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </LiquidGlass>
      </div >

      {/* Mobile Menu Dropdown - Outside LiquidGlass for proper visibility */}
      {isMobileMenuOpen && (
        <motion.div
          ref={mobileMenuRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="md:hidden fixed top-20 left-4 right-4 p-4 rounded-xl bg-background/95 backdrop-blur-lg border border-border shadow-xl"
          style={{ zIndex: 9999 }}
        >
          <nav
            className="flex flex-col gap-2"
            onMouseLeave={() => setOptionHovered(null)}
          >
            <AnimatePresence>
              {navbarOptions.map((option) => (
                <NavItem
                  key={option.label}
                  option={option}
                  isActive={pathname === option.href}
                  useLightText={useLightText}
                  optionHovered={optionHovered}
                  setOptionHovered={setOptionHovered}
                  isMobile={true}
                  onItemClick={() => setIsMobileMenuOpen(false)}
                />
              ))}
            </AnimatePresence>
          </nav>
        </motion.div>
      )}
    </div >
  )

}
 