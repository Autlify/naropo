"use client";

import { cn } from "@/lib/utils";
import { BarChart, BookOpen, Boxes, ChevronDown, Contact, LogIn, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
// Direct path imports (barrel removed)
import { UserButton } from '@/components/global/user-button'
import { ModeToggle } from '@/components/global/mode-toggle'
import { AnimatePresence, motion } from "framer-motion";
import LiquidGlass from "liquid-glass-react";
import LiquidGlassComponent from "@/components/ui/liquid-glass";
import { Geist } from "next/font/google";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import React, { useEffect, useRef, useState } from "react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// Hook to detect background brightness behind navbar
const useBackgroundContrast = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const [isDarkBackground, setIsDarkBackground] = useState(true)

  useEffect(() => {
    const checkBackgroundBrightness = () => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2

      // Create a temporary canvas to sample pixel color
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')

      if (!ctx) return

      // Get the element behind the navbar at center point
      const elements = document.elementsFromPoint(x, y)
      const backgroundElement = elements.find(el =>
        el !== containerRef.current &&
        !containerRef.current?.contains(el)
      )

      if (backgroundElement) {
        const styles = window.getComputedStyle(backgroundElement)
        const bgColor = styles.backgroundColor

        // Parse RGB values
        const rgb = bgColor.match(/\d+/g)
        if (rgb && rgb.length >= 3) {
          const [r, g, b] = rgb.map(Number)

          // Calculate relative luminance (WCAG formula)
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

          // Consider background dark if luminance < 0.5
          setIsDarkBackground(luminance < 0.5)
        }
      }
    }

    // Check on mount and scroll
    checkBackgroundBrightness()
    window.addEventListener('scroll', checkBackgroundBrightness)
    window.addEventListener('resize', checkBackgroundBrightness)

    return () => {
      window.removeEventListener('scroll', checkBackgroundBrightness)
      window.removeEventListener('resize', checkBackgroundBrightness)
    }
  }, [containerRef])

  return isDarkBackground
}

type TabItem = {
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  className?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  external?: boolean;
}


interface NavItem extends NavChildItem {
  children?: NavChildItem[];
  active?: boolean;
  className?: string;
  onClick?: () => void;
}

interface NavChildItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  external?: boolean;
}

const resourcesChildItems: NavChildItem[] = [
  { icon: <BookOpen className="w-5 h-5" />, label: "Documentation", href: "/resources/docs" },
  { icon: <BookOpen className="w-5 h-5" />, label: "API Reference", href: "/resources/api" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Tutorials", href: "/resources/tutorials" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Blog", href: "/resources/blog" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Support", href: "/resources/support" },
]

const navItems: NavItem[] = [
  { icon: <Zap className="w-5 h-5" />, label: "Features", href: "/features" },
  { icon: <BarChart className="w-5 h-5" />, label: "Pricing", href: "/pricing" },
  { icon: <BookOpen className="w-5 h-5" />, label: "Resources", href: "/resources", children: resourcesChildItems },
  { icon: <Boxes className="w-5 h-5" />, label: "Products", href: "/products" },
  { icon: <Contact className="w-5 h-5" />, label: "Contact", href: "/contacts" },
];

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
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/site/pricing" },
  { label: "About", href: "/site/about" },
  { label: "Documentation", href: "/site/documentation" },
  { label: "Features", href: "/site/features" },
]

type LiquidGlassProps = React.ComponentProps<typeof LiquidGlass>;
function Base(props: LiquidGlassProps) {
  return (
    <LiquidGlass
      displacementScale={100}
      blurAmount={0.5}
      saturation={140}
      aberrationIntensity={2}
      cornerRadius={5}
      mode="prominent"
      padding="8px 16px"
      elasticity={0}
      style={{
        ...props.style,
        position: "fixed",
        top: "2.8%",
        left: "50%",
        width: 'calc(var(--spacing) * 12) + 100vw',

        height: "calc(var(--spacing) * 12)px",
        transform: "translateX(-50%) translateY(-50%)",
        zIndex: 100,
        display: "inline-flex",
        alignItems: "baseline",
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}
      mouseContainer={props.mouseContainer}
    >
      {props.children}
    </LiquidGlass>
  );
}

export function SiteHeader() {
  const [displacementScale, setDisplacementScale] = useState(100)
  const [blurAmount, setBlurAmount] = useState(0.5)
  const [saturation, setSaturation] = useState(140)
  const [aberrationIntensity, setAberrationIntensity] = useState(2)
  const [elasticity, setElasticity] = useState(0)
  const [cornerRadius, setCornerRadius] = useState(32)
  const [overLight, setOverLight] = useState(false)
  const [mode, setMode] = useState<"standard" | "polar" | "prominent" | "shader">("standard")
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState(0)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isResourcesOpen, setIsResourcesOpen] = useState(false)
  const [onHover, setOnHover] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const pathname = usePathname();
  const { theme } = useTheme();

  // Use dynamic background contrast detection
  const isDarkBackground = useBackgroundContrast(containerRef)
  
  // Determine if we should use light text (dark theme or dark background)
  const useLightText = theme === 'dark' || isDarkBackground;

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsResourcesOpen(false);
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

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    requestAnimationFrame(() => {
      setScroll((event?.target as any)?.scrollTop)
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
    <div className={`${geistSans.className} min-w-screen justify-between`}>
      {/*  Glass Effect Demo */}
      <div className="w-full flex flex-1" ref={containerRef} onScroll={handleScroll}>
        <LiquidGlassComponent
          displacementScale={displacementScale}
          blurAmount={blurAmount}
          saturation={saturation}
          aberrationIntensity={aberrationIntensity}
          elasticity={elasticity}
          cornerRadius={5}
          mouseContainer={containerRef}
          overLight={scrollingOverBrightSection || overLight}
          className={cn("flex items-center justify-center cursor-pointer", "w-screen")}
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
          <div className="w-screen flex flex-row items-center justify-between gap-4 px-4 pr-8 relative overflow-visible min-h-[64px]">
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0 mr-2 relative h-full">
              <Link
                href="/"
                className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg p-2"
                aria-label="Go to homepage"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-2xl bg-transparent",
                    "flex items-center justify-center",
                    "group-hover:scale-105 transition-transform duration-200"
                  )}>
                  {/* Autlify Logo */}
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" rx="8" fill="url(#gradient)" />
                    <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="system-ui">A</text>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e3a8a" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="text-xl font-semibold text-white select-none">Autlify</span>
              </Link>
            </div>
            {/* Navigation Section - Centered with flex-1 */}
            <nav className="hidden md:flex flex-1 items-center justify-center">
              <div className="flex items-center gap-6 relative">
                {navbarOptions.map((option) => {
                  const isActive = pathname === option.href;

                  if (option.label === "Resources") {
                    return (
                      <div key={option.label} className="relative">
                        <button
                          onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                          className={cn(
                            "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                            isResourcesOpen || isActive
                              ? useLightText ? "text-white" : "text-gray-900"
                              : useLightText
                                ? "text-gray-300 hover:text-white"
                                : "text-gray-600 hover:text-gray-900"
                          )}
                          onMouseEnter={() => handleMouseEnter(option)}
                          onMouseLeave={handleMouseLeave}
                        >

                          <span className="flex items-center gap-2 relative z-10">
                            {option.icon && (
                              <span className="flex items-center">
                                {option.icon}
                              </span>
                            )}
                            {option.label}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-200 ml-1",
                              isResourcesOpen ? "rotate-180" : "",
                              useLightText ? "text-gray-300" : "text-gray-600"
                            )}
                          />
                          {/* Animated underline */}
                          {isActive && (
                            <motion.div
                              layoutId="navbar-underline"
                              className={cn(
                                "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full",
                                useLightText
                                  ? "bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400"
                                  : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"
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
                          {/* Hover effect */}
                          <motion.div
                            className={cn(
                              "absolute inset-0 rounded-md -z-0",
                              useLightText ? "bg-white/10" : "bg-gray-200/50"
                            )}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileHover={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        </button>
                      </div>
                    );
                  } else if (option.external) {
                    return (
                      <a
                        key={option.label}
                        href={option.href}
                        target={option.target}
                        rel={option.rel}
                        className={cn(
                          "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? useLightText ? "text-white" : "text-gray-900"
                            : useLightText
                              ? "text-gray-300 hover:text-white"
                              : "text-gray-600 hover:text-gray-900"
                        )}
                      >
                        <span className="flex items-center gap-2 relative">
                          {option.icon && (
                            <span className="flex items-center">
                              {option.icon}
                            </span>
                          )}
                          {option.label}
                        </span>
                        {/* Animated underline */}
                        {isActive && (
                          <motion.div
                            layoutId="navbar-underline"
                            className={cn(
                              "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full",
                              useLightText
                                ? "bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400"
                                : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"
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
                        {/* Hover effect */}
                        <motion.div
                          className={cn(
                            "absolute inset-0 rounded-md -z-0",
                            useLightText ? "bg-white/10" : "bg-gray-200/50"
                          )}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </a>
                    );
                  } else {
                    return (
                      <Link
                        key={option.label}
                        href={option.href}
                        className={cn(
                          "group relative flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? useLightText ? "text-white" : "text-gray-900"
                            : useLightText
                              ? "text-gray-300 hover:text-white"
                              : "text-gray-600 hover:text-gray-900"
                        )}
                        onClick={option.onClick}
                        // target={option.target}
                        rel={option.rel}
                      >

                        {option.label}

                        {/* Animated underline */}
                        {isActive && (
                          <motion.div
                            layoutId="navbar-underline"
                            className={cn(
                              "absolute -bottom-1 left-0 right-0 h-0.5 rounded-full",
                              useLightText
                                ? "bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400"
                                : "bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600"
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
                        {/* Hover effect */}
                        <motion.div
                          className={cn(
                            isActive ? "" : "absolute inset-0 rounded-md -z-0",
                            useLightText ? "bg-white/10" : "bg-gray-200/50"
                          )}
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      </Link>
                    );
                  }
                })}
              </div>
            </nav>
            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
            {/* Buttons Section - Fixed width */}
            <div className="flex items-center gap-2 w-48 justify-end">
              <Link
                href={'/agency'}
                className="bg-primary text-white p-2 px-4 rounded-md hover:bg-primary/80"
              >
                Login
              </Link>
              <UserButton />
              <ModeToggle />
            </div>
          </div>
        </LiquidGlassComponent>
      </div >
    </div >
  )

}
