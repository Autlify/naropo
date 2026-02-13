'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Github, Twitter, Linkedin, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { ThemeProvider } from '@/providers/theme-provider';


export function Footer() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // Get current palette colors 
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);
  const footerLinks = {
    product: [
      { name: 'Features', href: '/site/features' },
      { name: 'Pricing', href: '/site/pricing' },
      { name: 'Documentation', href: '/site/docs' },
      { name: 'Blog', href: '/site/blog' }
    ],
    company: [
      { name: 'About', href: '/site/about' },
      { name: 'Contact', href: '/site/contact' },
      { name: 'Careers', href: '#' },
      { name: 'Press Kit', href: '#' }
    ],
    support: [
      { name: 'Help Center', href: '/site/docs' },
      { name: 'Community', href: '#' },
      { name: 'Status', href: '#' },
      { name: 'Security', href: '#' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/docs/legal/privacy-policy' },
      { name: 'Terms of Service', href: '/docs/legal/terms-of-service' },
      { name: 'Cookie Policy', href: '/docs/legal/cookie-policy' },
      { name: 'DPA', href: '/docs/legal/data-processing-agreement' }
    ]
  };

  const socialLinks = [
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'LinkedIn', href: '#', icon: Linkedin }
  ];

  if (!mounted) {
    return (
      <footer className="border-t border-border/40 bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="grid grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-4 w-20 bg-muted rounded" />
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-3 w-24 bg-muted rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <motion.footer
      className="border-t border-border/40 bg-background/95 backdrop-blur relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, 
          hsl(${'bg-background'}) 0%, 
          hsl(${'bg-muted'}/0.3) 50%, 
          hsl(${'bg-background'}) 100%)`,
        borderTop: `1px solid hsl(${'border'}/0.3)`
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      {/* Vibrancy background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-5"
          style={{ backgroundColor: `hsl(${'primary'})` }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-5"
          style={{ backgroundColor: `hsl(${'accent'})` }}
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            {/* Brand Section */}
            <motion.div
              className="lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="flex items-center gap-2 mb-4 group">
                <motion.div
                  className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, 
                      hsl(${'primary'}) 0%, 
                      hsl(${'accent'}) 100%)`,
                    boxShadow: `0 4px 16px hsl(${'primary'}/0.2)`
                  }}
                  whileHover={{
                    scale: 1.1,
                    rotate: 5,
                    boxShadow: `0 8px 24px hsl(${'primary'}/0.3)`
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Building2 className="h-5 w-5 text-primary-foreground" />

                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 4,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
                <span className="font-bold text-lg bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Autlify
                </span>
              </Link>

              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                The most comprehensive multi-tenant platform for modern businesses with enterprise-grade features.
              </p>

              <div className="flex items-center gap-4">
                {socialLinks.map((social, index) => (
                  <motion.div
                    key={social.name}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href={social.href}
                      className="relative group"
                    >
                      <motion.div
                        className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200"
                        style={{
                          background: `linear-gradient(135deg, 
                            hsl(${'muted'}/0.5) 0%, 
                            hsl(${'background'}) 100%)`,
                          border: `1px solid hsl(${'border'}/0.3)`
                        }}
                        whileHover={{
                          scale: 1.1,
                          background: `linear-gradient(135deg, 
                            hsl(${'primary'}/0.1) 0%, 
                            hsl(${'accent'}/0.1) 100())`,
                          borderColor: `hsl(${'primary'}/0.5)`
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <social.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-8 lg:col-span-4 lg:grid-cols-4">
              {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                  viewport={{ once: true }}
                >
                  <h3 className="font-semibold mb-4 text-foreground capitalize">
                    {category}
                  </h3>
                  <ul className="space-y-3">

                    {links.map((link, linkIndex) => (
                      <motion.li
                        key={link.name}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: categoryIndex * 0.1 + linkIndex * 0.05
                        }}
                        viewport={{ once: true }}
                      >
                        <Link
                          href={link.href}
                          className="relative text-sm text-muted-foreground hover:text-foreground transition-all duration-200 group inline-block"
                        >
                          <span className="relative z-10">{link.name}</span>

                          {/* Hover underline effect */}
                          <motion.div
                            className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300"
                            style={{
                              background: `linear-gradient(90deg, 
                                hsl(${'primary'}) 0%, 
                                hsl(${'accent'}) 100%)`
                            }}
                          />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        {/* <motion.div
          className="mb-6 relative"
          style={{ borderTop: `1px solid hsl(${'border'}/0.3)` }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <motion.p
              className="text-sm text-muted-foreground"
              whileHover={{ scale: 1.02 }}
            >
              © 2024 Autlify. All rights reserved.
            </motion.p>

            <motion.div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              whileHover={{ scale: 1.02 }}
            >
              <span>Built with</span>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  color: [`hsl(${'muted'})`, `hsl(${'primary'})`, `hsl(${'muted'})`]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Heart className="h-4 w-4 fill-current" />
              </motion.div>
              <span>Next.js, Tailwind CSS, and Framer Motion</span>
            </motion.div>
          </div>
        </motion.div> */}
      </div>
    </motion.footer>
  );
}
