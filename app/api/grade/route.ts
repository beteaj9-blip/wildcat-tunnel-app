import { NextResponse } from 'next/server';
import { decrypt, getHmacHeaders, encryptPayload } from '@/lib/crypto-utils';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        const hmac = getHmacHeaders("GET");

        const res = await fetch("https://rg-cit-u-staging-004-wa-014.azurewebsites.net/api/studentgradefile/student/27388/department/10000", {
            method: 'GET',
            headers: { 
                "Accept": "application/json, text/plain, */*",
                "Authorization": authHeader || '', 
                ...hmac,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0",
                "Origin": "https://student.cituwits.com",
                "Referer": "https://student.cituwits.com/"
            }
        });

        const rawText = await res.text();
        const citData = decrypt(rawText);

        if (!citData) return NextResponse.json({ error: "Access Denied" }, { status: 500 });

        return NextResponse.json({ payload: encryptPayload(citData) });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}