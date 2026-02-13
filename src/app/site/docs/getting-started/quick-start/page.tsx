import DocsLayout from '@/components/site/docs/docs-layout'
import Link from 'next/link'
import { ArrowRight, Terminal, CheckCircle2 } from 'lucide-react'

/**
 * Quick Start Guide - Sample Documentation Page
 * 
 * Demonstrates the docs layout with sidebar navigation and table of contents
 */

export default function QuickStartPage() {
  // Table of contents for right sidebar
  const tableOfContents = [
    { title: "Prerequisites", id: "prerequisites", level: 2 },
    { title: "Installation", id: "installation", level: 2 },
    { title: "Create Your Account", id: "create-account", level: 3 },
    { title: "Set Up Your Workspace", id: "setup-workspace", level: 3 },
    { title: "Create Your First Project", id: "first-project", level: 2 },
    { title: "Invite Team Members", id: "invite-team", level: 2 },
    { title: "Next Steps", id: "next-steps", level: 2 },
  ]

  return (
    <DocsLayout tableOfContents={tableOfContents}>
      <article className="prose prose-slate dark:prose-invert max-w-none">
        {/* Page Header */}
        <div className="mb-8 not-prose">
          <div className="mb-4">
            <Link 
              href="/site/docs"
              className="inline-flex items-center gap-1 text-sm text-fg-tertiary hover:text-fg-secondary transition-colors"
            >
              Documentation
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="text-fg-secondary">Quick Start</span>
            </Link>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-fg-primary mb-3">
            Quick Start Guide
          </h1>
          <p className="text-lg text-fg-secondary">
            Get up and running with Autlify in under 5 minutes.
          </p>
        </div>

        {/* Prerequisites */}
        <h2 id="prerequisites" className="text-2xl font-semibold text-fg-primary mt-12 mb-4 scroll-mt-20">
          Prerequisites
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-4">
          Before you begin, make sure you have:
        </p>
        <ul className="space-y-2 mb-8">
          <li className="text-fg-secondary">A valid email address</li>
          <li className="text-fg-secondary">Basic understanding of project management concepts</li>
          <li className="text-fg-secondary">Your team's email addresses (if inviting teammates)</li>
        </ul>

        {/* Installation */}
        <h2 id="installation" className="text-2xl font-semibold text-fg-primary mt-12 mb-4 scroll-mt-20">
          Installation
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-6">
          Autlify is a web-based platform that requires no installation. Simply create an account
          and start using it right away from your browser.
        </p>

        <h3 id="create-account" className="text-xl font-semibold text-fg-primary mt-8 mb-3 scroll-mt-20">
          Create Your Account
        </h3>
        <div className="not-prose rounded-lg border border-line-secondary bg-bg-secondary p-6 mb-6">
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-base">
                1
              </span>
              <div>
                <div className="font-medium text-fg-primary mb-1">Go to the signup page</div>
                <div className="text-sm text-fg-tertiary">
                  Navigate to{' '}
                  <Link href="/site/pricing" className="text-accent-base hover:text-accent-hover">
                    autlify.com/signup
                  </Link>
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-base">
                2
              </span>
              <div>
                <div className="font-medium text-fg-primary mb-1">Enter your details</div>
                <div className="text-sm text-fg-tertiary">
                  Provide your email, name, and choose a secure password
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-base">
                3
              </span>
              <div>
                <div className="font-medium text-fg-primary mb-1">Verify your email</div>
                <div className="text-sm text-fg-tertiary">
                  Check your inbox for a verification email and click the link
                </div>
              </div>
            </li>
          </ol>
        </div>

        <h3 id="setup-workspace" className="text-xl font-semibold text-fg-primary mt-8 mb-3 scroll-mt-20">
          Set Up Your Workspace
        </h3>
        <p className="text-fg-secondary leading-relaxed mb-4">
          After verifying your email, you'll be prompted to set up your workspace:
        </p>
        <ul className="space-y-2 mb-6">
          <li className="text-fg-secondary">Choose a workspace name (e.g., "Acme Inc")</li>
          <li className="text-fg-secondary">Select your team size</li>
          <li className="text-fg-secondary">Choose your primary use case</li>
        </ul>

        {/* Create First Project */}
        <h2 id="first-project" className="text-2xl font-semibold text-fg-primary mt-12 mb-4 scroll-mt-20">
          Create Your First Project
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-6">
          Now that your workspace is set up, let's create your first project.
        </p>

        <div className="not-prose rounded-lg border border-warning/20 bg-warning/5 p-5 mb-6">
          <div className="flex gap-3">
            <Terminal className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-warning-foreground mb-1">
                Tip: Use Templates
              </div>
              <div className="text-sm text-warning-foreground/90">
                Autlify offers pre-built templates for common workflows like Software Development,
                Marketing Campaigns, and Product Launches. Choose one to get started faster!
              </div>
            </div>
          </div>
        </div>

        <div className="not-prose rounded-lg border border-line-secondary bg-bg-secondary overflow-hidden mb-8">
          <div className="border-b border-line-secondary bg-bg-tertiary px-4 py-2">
            <div className="text-xs font-mono text-fg-tertiary">Project Creation Flow</div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-fg-primary text-sm mb-1">
                  Click "New Project" from the sidebar
                </div>
                <div className="text-sm text-fg-tertiary">
                  Or press <kbd className="px-1.5 py-0.5 text-xs border border-line-tertiary rounded bg-bg-tertiary">C</kbd> for quick create
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-fg-primary text-sm mb-1">
                  Choose a template or start from scratch
                </div>
                <div className="text-sm text-fg-tertiary">
                  Templates include pre-configured workflows and views
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-fg-primary text-sm mb-1">
                  Give your project a name and description
                </div>
                <div className="text-sm text-fg-tertiary">
                  Make it clear and descriptive for your team
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-fg-primary text-sm mb-1">
                  Configure initial settings
                </div>
                <div className="text-sm text-fg-tertiary">
                  Set project visibility, default assignees, and more
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Team */}
        <h2 id="invite-team" className="text-2xl font-semibold text-fg-primary mt-12 mb-4 scroll-mt-20">
          Invite Team Members
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-4">
          Collaboration is at the heart of Autlify. Invite your teammates to join your workspace:
        </p>
        <ol className="space-y-3 mb-6">
          <li className="text-fg-secondary">
            <strong className="text-fg-primary">Navigate to Settings</strong> - Click on your workspace name in the sidebar
          </li>
          <li className="text-fg-secondary">
            <strong className="text-fg-primary">Go to Team</strong> - Select the "Team" tab
          </li>
          <li className="text-fg-secondary">
            <strong className="text-fg-primary">Click "Invite Members"</strong> - Enter email addresses separated by commas
          </li>
          <li className="text-fg-secondary">
            <strong className="text-fg-primary">Set Roles</strong> - Choose Admin, Member, or Guest for each invitee
          </li>
          <li className="text-fg-secondary">
            <strong className="text-fg-primary">Send Invitations</strong> - Team members will receive an email invite
          </li>
        </ol>

        {/* Next Steps */}
        <h2 id="next-steps" className="text-2xl font-semibold text-fg-primary mt-12 mb-4 scroll-mt-20">
          Next Steps
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-6">
          Congratulations! You've successfully set up Autlify. Here's what to explore next:
        </p>

        <div className="not-prose grid gap-4 sm:grid-cols-2 mb-12">
          <Link
            href="/site/docs/concepts/projects"
            className="group rounded-lg border border-line-secondary bg-bg-secondary p-5 hover:border-accent-tint hover:bg-bg-tertiary transition-all"
          >
            <div className="font-semibold text-fg-primary mb-2 group-hover:text-accent-base transition-colors">
              Learn Core Concepts
            </div>
            <div className="text-sm text-fg-tertiary mb-3">
              Understand projects, workflows, and how everything fits together
            </div>
            <div className="text-sm text-accent-base flex items-center gap-1">
              Read guide
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/site/docs/guides/workflows"
            className="group rounded-lg border border-line-secondary bg-bg-secondary p-5 hover:border-accent-tint hover:bg-bg-tertiary transition-all"
          >
            <div className="font-semibold text-fg-primary mb-2 group-hover:text-accent-base transition-colors">
              Custom Workflows
            </div>
            <div className="text-sm text-fg-tertiary mb-3">
              Create workflows tailored to your team's unique processes
            </div>
            <div className="text-sm text-accent-base flex items-center gap-1">
              Read guide
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/site/docs/api/authentication"
            className="group rounded-lg border border-line-secondary bg-bg-secondary p-5 hover:border-accent-tint hover:bg-bg-tertiary transition-all"
          >
            <div className="font-semibold text-fg-primary mb-2 group-hover:text-accent-base transition-colors">
              API Integration
            </div>
            <div className="text-sm text-fg-tertiary mb-3">
              Connect Autlify with your existing tools and workflows
            </div>
            <div className="text-sm text-accent-base flex items-center gap-1">
              View API docs
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          <Link
            href="/site/docs/getting-started/shortcuts"
            className="group rounded-lg border border-line-secondary bg-bg-secondary p-5 hover:border-accent-tint hover:bg-bg-tertiary transition-all"
          >
            <div className="font-semibold text-fg-primary mb-2 group-hover:text-accent-base transition-colors">
              Keyboard Shortcuts
            </div>
            <div className="text-sm text-fg-tertiary mb-3">
              Work faster with keyboard-first navigation
            </div>
            <div className="text-sm text-accent-base flex items-center gap-1">
              See shortcuts
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        {/* Help callout */}
        <div className="not-prose rounded-lg border border-line-secondary bg-gradient-to-br from-accent-base/5 via-bg-secondary to-bg-secondary p-6">
          <div className="font-semibold text-fg-primary mb-2">
            Need more help?
          </div>
          <p className="text-sm text-fg-secondary mb-4">
            Check out our{' '}
            <Link href="/site/contact" className="text-accent-base hover:text-accent-hover">
              support resources
            </Link>{' '}
            or join our{' '}
            <Link href="#" className="text-accent-base hover:text-accent-hover">
              community forum
            </Link>
            {' '}to connect with other users.
          </p>
        </div>
      </article>
    </DocsLayout>
  )
}
