import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { Chat } from '../../../models/Chat';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: Request
) {
    try {
        const { searchParams } = new URL(request.url);
        const passcode = searchParams.get('passcode');

        if (!passcode || passcode !== process.env.CHAT_PASSCODE) {
            return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
        }

        // Query MongoDB for chats, with optional dandiset filtering
        await connectDB();
        const query = {};
        const chats = await Chat.find(query).lean();

        // Transform results to remove MongoDB internals
        const transformedChats = chats.map(chat => {
            const { _id, __v, ...chatData } = chat;
            return chatData;
        });

        return NextResponse.json({ chats: transformedChats });
    } catch (error) {
        console.error('Error in list_chats:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
