import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

/**
 * Blog Landing Page - Linear-inspired Design
 * 
 * Blog posts list with categories and featured content
 */

export default function BlogPage() {
  // Placeholder blog posts
  const featuredPost = {
    title: "Introducing Autlify: Built for modern agency teams",
    excerpt: "After years of frustration with existing project management tools, we decided to build something better. Here's why we created Autlify and what makes it different.",
    date: "Jan 15, 2026",
    readTime: "5 min read",
    category: "Product",
    slug: "introducing-autlify"
  }

  const blogPosts = [
    {
      title: "How we built a keyboard-first interface",
      excerpt: "Speed is a feature. Learn how we optimized Autlify for keyboard shortcuts and why it matters for productivity.",
      date: "Jan 12, 2026",
      readTime: "4 min read",
      category: "Engineering",
      slug: "keyboard-first-interface"
    },
    {
      title: "The principles behind our design system",
      excerpt: "A deep dive into the design decisions that make Autlify feel fast, minimal, and delightful to use.",
      date: "Jan 8, 2026",
      readTime: "6 min read",
      category: "Design",
      slug: "design-system-principles"
    },
    {
      title: "Why we chose to focus on agencies",
      excerpt: "Not all project management is the same. Here's why we're specifically optimizing for agency workflows.",
      date: "Jan 5, 2026",
      readTime: "3 min read",
      category: "Product",
      slug: "focus-on-agencies"
    },
    {
      title: "Building a collaborative roadmap",
      excerpt: "How teams can use Autlify to align stakeholders and maintain a shared vision for their products.",
      date: "Dec 28, 2025",
      readTime: "5 min read",
      category: "Guides",
      slug: "collaborative-roadmap"
    },
    {
      title: "The importance of iteration speed",
      excerpt: "Why moving fast matters and how we've optimized Autlify to help teams ship faster.",
      date: "Dec 20, 2025",
      readTime: "4 min read",
      category: "Product",
      slug: "iteration-speed"
    },
    {
      title: "Migrating from other tools to Autlify",
      excerpt: "A step-by-step guide to importing your data and transitioning your team to Autlify.",
      date: "Dec 15, 2025",
      readTime: "7 min read",
      category: "Guides",
      slug: "migration-guide"
    }
  ]

  const categories = ["All", "Product", "Engineering", "Design", "Guides"]

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-bg-primary text-fg-primary">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--line-quaternary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--line-quaternary))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" aria-hidden="true" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--accent-base))_0%,transparent_60%)] opacity-[0.08] blur-3xl" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative px-4 pt-16 sm:pt-28">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="h-12 md:h-16" aria-hidden="true" />

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold max-w-4xl mx-auto leading-[1.1] tracking-[-0.022em]">
            <span className="bg-gradient-to-b from-fg-primary via-fg-primary to-fg-secondary bg-clip-text text-transparent">
              Blog
            </span>
          </h1>

          <div className="h-6" aria-hidden="true" />

          <p className="text-lg md:text-xl text-fg-secondary max-w-2xl mx-auto leading-[1.6]">
            Updates, insights, and stories from the Autlify team.
          </p>
        </div>
      </section>

      <div className="h-20 md:h-28" aria-hidden="true" />

      {/* Categories */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${category === "All"
                    ? "bg-accent-tint text-accent-base border border-accent-base/20"
                    : "bg-bg-secondary text-fg-tertiary border border-line-tertiary hover:border-accent-tint hover:text-accent-base"
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="h-12" aria-hidden="true" />

      {/* Featured Post */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <Link
            href={`/site/blog/${featuredPost.slug}`}
            className="group relative block rounded-xl border border-line-secondary bg-bg-secondary p-8 shadow-[var(--color-shadow-md)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-lg)] hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-base/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent-base mb-4">
                <span className="inline-block px-2.5 py-1 rounded-md bg-accent-tint border border-accent-base/20">
                  Featured
                </span>
                <span>{featuredPost.category}</span>
              </div>

              <h2 className="text-3xl font-semibold text-fg-primary group-hover:text-accent-hover transition-colors mb-4">
                {featuredPost.title}
              </h2>

              <p className="text-lg text-fg-secondary leading-[1.6] mb-6 max-w-3xl">
                {featuredPost.excerpt}
              </p>

              <div className="flex items-center gap-6 text-sm text-fg-tertiary">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{featuredPost.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{featuredPost.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <div className="h-16" aria-hidden="true" />

      {/* Blog Posts Grid */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {blogPosts.map((post, index) => (
              <Link
                key={index}
                href={`/site/blog/${post.slug}`}
                className="group relative flex flex-col gap-4 rounded-xl border border-line-secondary bg-bg-secondary p-6 shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-md)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-base/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

                <div className="relative">
                  <span className="inline-block text-[10px] font-medium uppercase tracking-[0.08em] text-accent-base mb-3">
                    {post.category}
                  </span>

                  <h3 className="text-xl font-semibold text-fg-primary group-hover:text-accent-hover transition-colors mb-3">
                    {post.title}
                  </h3>

                  <p className="text-sm text-fg-tertiary leading-[1.5] mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-fg-quaternary">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* Newsletter CTA */}
      <section className="relative">
        <div className="mx-auto max-w-[800px] px-6 text-center lg:px-8">
          <div className="rounded-xl border border-line-secondary bg-bg-secondary p-12 shadow-[var(--color-shadow-md)]">
            <h2 className="text-2xl font-semibold text-fg-primary mb-3">
              Stay updated
            </h2>
            <p className="text-fg-secondary mb-8">
              Get the latest posts delivered right to your inbox.
            </p>
            <form className="flex gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 h-11 px-4 rounded-lg border border-line-secondary bg-bg-tertiary text-fg-primary placeholder:text-fg-quaternary focus:outline-none focus:border-accent-tint focus:ring-1 focus:ring-accent-tint transition-all"
              />
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[image:var(--color-button-primary-bg-gradient)] px-6 font-medium text-button-primary-text shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_20px_-8px_hsl(var(--accent-base))] transition-all hover:bg-[image:var(--color-button-primary-bg-gradient-hover)] hover:shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_24px_-6px_hsl(var(--accent-base))] active:scale-[0.98]"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="h-40 md:h-56" aria-hidden="true" />
    </div>
  )
}
