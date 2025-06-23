import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { Chat } from '../../../models/Chat';

export async function GET(
    request: Request
) {
    try {
        const { searchParams } = new URL(request.url);
        const passcode = searchParams.get('passcode');
        const chatId = searchParams.get('chatId');

        if (!chatId) {
            return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
        }

        if (!passcode || passcode !== process.env.CHAT_PASSCODE) {
            return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 });
        }

        // Look up chat metadata in MongoDB
        await connectDB();
        const chatDoc = await Chat.findOne({ chatId });

        if (!chatDoc) {
            return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
        }

        const chatData = chatDoc.toObject();
        removeIdRecursively(chatData);
        return NextResponse.json(chatData);
    } catch (error) {
        console.error('Error in load_chat:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

const removeIdRecursively = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(removeIdRecursively);
    } else if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            if (key !== '_id') {
                newObj[key] = removeIdRecursively(obj[key]);
            }
        }
        return newObj;
    }
    return obj;
}
