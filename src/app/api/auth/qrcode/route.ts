// ✅ File: app/api/auth/mfa/setup/route.ts

import { NextResponse } from "next/server"
import { TOTP, TOTPOptions, generateURI } from "otplib"
import { URIOptions } from '@otplib/uri'
import qrcode from "qrcode"

/**
 * @method POST
 * @description Generate TOTP secret and otpauth URI with QR code data URL
 * @body { email: string }
 * @response { secret: string, otpauthURI: string, qrCodeDataURL: string }
 */


export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Configure TOTP
        const uriOptions: URIOptions = {
            issuer: "Autlify",
            label: email,
            secret: new TOTP().generateSecret(),
            algorithm: 'sha256',
            digits: 6,
            period: 30,
        }

        const secret = uriOptions.secret
        const otpauthURI = generateURI({
            strategy: 'totp',
            label: uriOptions.label!,
            secret: uriOptions.secret,
            issuer: uriOptions.issuer!,
            algorithm: uriOptions.algorithm,
            digits: uriOptions.digits,
            period: uriOptions.period,
                
        })
        const qrCodeDataURL = await qrcode.toDataURL(otpauthURI)

        return NextResponse.json({
            secret,
            otpauthURI,
            qrCodeDataURL,
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}





