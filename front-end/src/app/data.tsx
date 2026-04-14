export const userData = [
    {
        id: "1",
        avatar: '/User1.png',
        messages: [
            {
                id: "1",
                chatId: "40d218b6-cd70-494b-a04b-2195dffca672",
                senderId: "f9c5e798-0410-4e6e-ba97-83d290819f2b",
                content: 'Hey, Jakob',
                messageType: "text" as const,
                fileUrl: null,
                createdAt: "2026-03-30T23:38:44.664Z",
                isEdited: false,
                replyToId: null,
                isMe: false,
                avatar: '/User1.png',
                name: 'Jane Doe',
            },
            {
                id: "2",
                chatId: "40d218b6-cd70-494b-a04b-2195dffca672",
                senderId: "0fb12d01-cfd0-464f-b1c6-41bfb27b0c05",
                content: 'Hey!',
                messageType: "text" as const,
                fileUrl: null,
                createdAt: "2026-03-31T15:44:43.759Z",
                isEdited: false,
                replyToId: null,
                isMe: true,
                avatar: '/LoggedInUser.jpg',
                name: 'Jakob Hoeg',
            },
            {
                id: "3",
                chatId: "40d218b6-cd70-494b-a04b-2195dffca672",
                senderId: "f9c5e798-0410-4e6e-ba97-83d290819f2b",
                content: 'How are you?',
                messageType: "text" as const,
                fileUrl: null,
                createdAt: "2026-03-31T19:36:29.882Z",
                isEdited: false,
                replyToId: null,
                isMe: false,
                avatar: '/User1.png',
                name: 'Jane Doe',
            },
            {
                id: "4",
                chatId: "40d218b6-cd70-494b-a04b-2195dffca672",
                senderId: "0fb12d01-cfd0-464f-b1c6-41bfb27b0c05",
                content: 'I am good, you?',
                messageType: "text" as const,
                fileUrl: null,
                createdAt: "2026-03-31T22:08:51.436Z",
                isEdited: false,
                replyToId: null,
                isMe: true,
                avatar: '/LoggedInUser.jpg',
                name: 'Jakob Hoeg',
            },
            {
                id: "5",
                chatId: "40d218b6-cd70-494b-a04b-2195dffca672",
                senderId: "f9c5e798-0410-4e6e-ba97-83d290819f2b",
                content: 'I am good too!',
                messageType: "text" as const,
                fileUrl: null,
                createdAt: "2026-04-01T00:40:54.311Z",
                isEdited: false,
                replyToId: null,
                isMe: false,
                avatar: '/User1.png',
                name: 'Jane Doe',
            },
            {
                id: "6",
                chatId: "40d218b6-cd70-494b-a04b-2195dffca672",
                senderId: "0fb12d01-cfd0-464f-b1c6-41bfb27b0c05",
                content: 'That is good to hear!',
                messageType: "text" as const,
                fileUrl: null,
                createdAt: "2026-04-01T14:29:10.117Z",
                isEdited: false,
                replyToId: null,
                isMe: true,
                avatar: '/LoggedInUser.jpg',
                name: 'Jakob Hoeg',
            }
        ],
        name: 'Jane Doe',
    },
    {
        id: "2",
        avatar: '/User2.png',
        name: 'John Doe',
    },
    {
        id: "3",
        avatar: '/User3.png',
        name: 'Elizabeth Smith',
    },
    {
        id: "4",
        avatar: '/User4.png',
        name: 'John Smith',
    }
];

export type UserData = (typeof userData)[number];

export const loggedInUserData = {
    id: "5",
    avatar: '/LoggedInUser.jpg',
    name: 'Jakob Hoeg',
};

export type LoggedInUserData = (typeof loggedInUserData);

export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    content: string;
    nonce?: string;
    isEncrypted?: boolean;
    messageType: "text" | "image" | "file";
    fileUrl: string | null;
    createdAt: string;
    isEdited: boolean;
    replyToId: string | null;
    isMe?: boolean;
    // Keep these for backward compatibility if needed, but we should transition
    avatar?: string;
    name?: string;
}

export interface User {
    id: string | number;
    avatar: string;
    messages: Message[];
    name: string;
}