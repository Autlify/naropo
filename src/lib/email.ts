import nodemailer from 'nodemailer'
import { ConfidentialClientApplication } from "@azure/msal-node"
import { logger } from "@/lib/logger"


export type EmailParams = {
  email: string
  subject: string
  html: string
  text: string
}

type EmailResult = {
  success: boolean
  error?: any
  info?: any
}

export async function getGraphAccessToken(): Promise<string> {
  const requiredEnv = ["MICROSOFT_ENTRA_ID_TENANT", "MICROSOFT_ENTRA_ID_ID", "MICROSOFT_ENTRA_ID_SECRET", "SMTP_USER"]
  for (const env of requiredEnv) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`)
    }
  }

  const msalConfig = {
    auth: {
      clientId: process.env.MICROSOFT_ENTRA_ID_ID!,
      authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_ENTRA_ID_TENANT}`,
      clientSecret: process.env.MICROSOFT_ENTRA_ID_SECRET!,
    },
  }

  const cca = new ConfidentialClientApplication(msalConfig)
  const result = await cca.acquireTokenByClientCredential({
    scopes: ["https://graph.microsoft.com/.default"],
  })

  if (!result?.accessToken) {
    throw new Error("Failed to acquire Microsoft Graph access token")
  }

  return result.accessToken
}

export async function sendMicrosoftOAuthEmail({
  email,
  subject,
  text,
  html,
}: EmailParams): Promise<EmailResult> {
  try {
    const accessToken = await getGraphAccessToken()
    const graphBody = {
      message: {
        subject,
        from: {
          emailAddress: {
            address: process.env.SMTP_FROM!,
          },
        },
        body: {
          contentType: "HTML",
          content: html,
        },
        toRecipients: [
          {
            emailAddress: {
              address: email,
            },
          },
        ],
      }
    }
    const response = await fetch(`https://graph.microsoft.com/v1.0/users/${process.env.SMTP_USER}/sendMail`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error("Graph API email send failed", { error: errorText })
      return { success: false, error: errorText }
    }

    logger.info("Email sent successfully via Microsoft Graph API", {
      recipient: email,
      subject,
    })

    return { success: true }
  } catch (error) {
    logger.error("OAuth Email sending failed (Graph)", {
      recipient: email,
      subject,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return { success: false, error }
  }
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendVerificationEmail({
  email,
  token,
  name
}: {
  email: string
  token: string
  name: string
}): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  const verificationUrl = `${baseUrl}api/auth/register/confirm?token=${token}`

  const subject = "Email Verification"

  const text = `
    Hello ${name},

    Thank you for signing up for Autlify! Please verify your email address by clicking the link below:

    ${verificationUrl}

    If you did not sign up for an account, please ignore this email.

    The verification link will expire in 24 hours.

    Regards,
    The Autlify Team
  `

  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Email Verification</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          :root {
            color-scheme: light dark;
            --bg-light: #ffffff;
            --bg-dark: #0f0f0f;
            --text-light: #000000;
            --text-dark: #ffffff;
            --accent-verification: #14b8a6;
          }
          
          body {
            font-family: Inter, sans-serif;
            background-color: #0e0e0e;
            color: #ffffff;
            padding: 2rem;
          }
          .card {
            max-width: 600px;
            margin: auto;
            background: linear-gradient(to right, #181818, #1e1e1e);
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 0 12px rgba(0, 255, 255, 0.25);
          }

          .accent-verification {
            color: var(--accent-verification);
            font-weight: 600;
          }
          .btn {
            margin-top: 1.5rem;
            background-color: #06b6d4;
            color: white;
            padding: 0.75rem 1.25rem;
            border-radius: 9999px;
            text-decoration: none;
            font-weight: bold;
            display: inline-block;
          }
          .btn:focus {
            outline: none;
            box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
          }
          .btn:focus-visible {
            outline: 2px solid #06b6d4;
            outline-offset: 2px;
          }
          .btn:focus:not(:focus-visible) {
            outline: none;
          }
          .btn:active, .btn:focus {
            background-color: #04a3b4;
            box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
          }
          .btn:focus-visible {
            box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
          }
          .btn:focus:not(:focus-visible) {
            box-shadow: none;
          }
          .btn:focus-visible:hover {
            background-color: #06b6d4;
          }
          .btn:focus:not(:focus-visible):hover {
            background-color: #04a3b4;
          }
          .btn:focus-visible:active {
            background-color: #02899c;
          }
          .btn:focus:not(:focus-visible):active {
            background-color: #02899c;
          }
          .btn:hover {
            background-color: #04a3b4;
          }
          .btn:active {
            background-color: #02899c;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="font-size: 1.875rem; font-weight: bold;">📩 Verify Your Email</h2>
          <p style="margin-top: 0.5rem;">Hi  <span class="accent-verification">${name}</span>,</p>
          <p style="margin-top: 0.5rem;">To complete your registration and activate your account, please verify your email address.</p>
          <a href="${verificationUrl}" class="btn">Verify Email</a>
          <p style="margin-top: 2rem; font-size: 0.9rem; color: #aaa;">If you didn’t request this, please ignore this email.</p>
        </div>
      </body>
      </html>
  `

  console.log('Verification URL:', verificationUrl)
  return sendMicrosoftOAuthEmail({ email, subject, text, html })
}

export async function sendPasswordResetEmail({
  email,
  token,
  name
}: {
  email: string
  token: string
  name?: string
}): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  const resetUrl = `${baseUrl}agency/reset-password?token=${token}`

  const subject = "Reset Your Password"

  const text = `
    Hello${name ? ' ' + name : ''},

    You requested to reset your password. Please click the link below to set a new password:

    ${resetUrl}

    If you did not request this, please ignore this email.

    This link will expire in 1 hour.

    Regards,
    The Autlify Team
  `

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Reset Your Password</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        :root {
          color-scheme: light dark;
          --bg-light: #ffffff;
          --bg-dark: #0f0f0f;
          --text-light: #000000;
          --text-dark: #ffffff;
          --accent-reset: #f59e0b;
        }
        
        body {
          font-family: Inter, sans-serif;
          background-color: #0e0e0e;
          color: #ffffff;
          padding: 2rem;
        }
        
        .card {
          max-width: 600px;
          margin: auto;
          background: linear-gradient(to right, #181818, #1e1e1e);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.25);
        }
        
        .accent-reset {
          color: var(--accent-reset);
          font-weight: 600;
        }
        
        .btn {
          margin-top: 1.5rem;
          background-color: #06b6d4;
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
        }
        
        .btn:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
        }
        
        .btn:focus-visible {
          outline: 2px solid #06b6d4;
          outline-offset: 2px;
        }
        
        .btn:focus:not(:focus-visible) {
          outline: none;
        }
        
        .btn:active,
        .btn:focus {
          background-color: #04a3b4;
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
        }
        
        .btn:focus-visible {
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
        }
        
        .btn:focus:not(:focus-visible) {
          box-shadow: none;
        }
        
        .btn:focus-visible:hover {
          background-color: #06b6d4;
        }
        
        .btn:focus:not(:focus-visible):hover {
          background-color: #04a3b4;
        }
        
        .btn:focus-visible:active {
          background-color: #02899c;
        }
        
        .btn:focus:not(:focus-visible):active {
          background-color: #02899c;
        }
        
        .btn:hover {
          background-color: #04a3b4;
        }
        
        .btn:active {
          background-color: #02899c;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="font-size: 1.875rem; font-weight: bold;">🔐 Reset Your Password</h2>
        <p style="margin-top: 0.5rem;">Hi${name ? ' <span class="accent-reset">' + name + '</span>' : ''},</p>
        <p style="margin-top: 0.5rem;">You requested to reset your password. Click the button below to set a new password.</p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
        <p style="margin-top: 2rem; font-size: 0.9rem; color: #aaa;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    </body>
    </html>
  `

  return sendMicrosoftOAuthEmail({ email, subject, text, html })
}

export async function sendInvitationEmail({
  email,
  role,
  invitationId
}: {
  email: string
  role: string
  invitationId: string
}): Promise<EmailResult> {
  const baseUrl = process.env.NEXT_PUBLIC_URL
  const invitationUrl = `${baseUrl}agency/sign-up?invitation=${invitationId}`

  const subject = "You're invited to join Autlify!"

  const text = `
    Hello,

    You have been invited to join Autlify with the role: ${role}.

    To accept the invitation and create your account, please click the link below:

    ${invitationUrl}

    If you have any questions or need assistance, feel free to reach out to us at support@autlify.com.

    This invitation link will remain valid until you create your account.

    Regards,
    The Autlify Team
  `

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>You're invited to join Autlify!</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        :root {
          color-scheme: light dark;
          --bg-light: #ffffff;
          --bg-dark: #0f0f0f;
          --text-light: #000000;
          --text-dark: #ffffff;
          --accent-invitation: #14b8a6;
        }
        
        body {
          font-family: Inter, sans-serif;
          background-color: #0e0e0e;
          color: #ffffff;
          padding: 2rem;
        }
        
        .card {
          max-width: 600px;
          margin: auto;
          background: linear-gradient(to right, #181818, #1e1e1ec1);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.25);
        }
        
        .accent-invitation {
          color: var(--accent-invitation);
          font-weight: 600;
        }
        
        .btn {
          margin-top: 1.5rem;
          background-color: #06b6d4;
          color: white;
          padding: 0.75rem 1.25rem;
          border-radius: 9999px;
          text-decoration: none;
          font-weight: bold;
          display: inline-block;
        }
        
        .btn:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
        }
        
        .btn:focus-visible {
          outline: 2px solid #06b6d4;
          outline-offset: 2px;
        }
        
        .btn:focus:not(:focus-visible) {
          outline: none;
        }
        
        .btn:active,
        .btn:focus {
          background-color: #04a3b4;
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
        }
        
        .btn:focus-visible {
          box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
        }
        
        .btn:focus:not(:focus-visible) {
          box-shadow: none;
        }
        
        .btn:focus-visible:hover {
          background-color: #06b6d4;
        }
        
        .btn:focus:not(:focus-visible):hover {
          background-color: #04a3b4;
        }
        
        .btn:focus-visible:active {
          background-color: #02899c;
        }
        
        .btn:focus:not(:focus-visible):active {
          background-color: #02899c;
        }
        
        .btn:hover {
          background-color: #04a3b4;
        }
        
        .btn:active {
          background-color: #02899c;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 style="font-size: 1.875rem; font-weight: bold;">🎉 You're invited to join Autlify!</h2>
        <p style="margin-top: 0.5rem;">Hello,</p>
        <p style="margin-top: 0.5rem;">
          You have been invited to join our platform as <span class="accent-invitation">${role}</span>.
        </p>
        <p style="margin-top: 1rem;">To accept the invitation and create your account, please click the button below:</p>
        <a href="${invitationUrl}" class="btn">Accept Invitation</a>
        <p style="margin-top: 2rem; font-size: 0.9rem; color: #aaa;">
          If you have any questions or need assistance, feel free to reach out to us at 
          <a href="mailto:support@autlify.com" style="color: #06b6d4; text-decoration: none;">support@autlify.com</a>.
        </p>
      </div>
    </body>
    </html>
  `

  return sendMicrosoftOAuthEmail({ email, subject, text, html })
}
