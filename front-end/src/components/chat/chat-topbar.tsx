import React, { useState, useEffect } from 'react'
import { Avatar, AvatarImage } from '../ui/avatar'
import { UserData } from '@/app/data';
import { Info, Phone, Video } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '../ui/button';
import { useSocket } from '@/context/SocketContext';

interface ChatTopbarProps {
    selectedUser: UserData;
    }
    
    export const TopbarIcons = [{ icon: Phone }, { icon: Video }, { icon: Info }];


export default function ChatTopbar({selectedUser}: any) {
  const [isTyping, setIsTyping] = useState(false);
  const { onUserTyping, offUserTyping, isUserOnline } = useSocket();

  useEffect(() => {
    const handleTypingStatus = (data: { chatId: number; userId: string; isTyping: boolean }) => {
      // Only show typing if it's from the selected chat and not from current user
      if (data.chatId === selectedUser.chatId) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          const currentUserId = user.user_id || user.id;
          
          // Show typing only if it's not the current user typing
          if (data.userId !== currentUserId.toString()) {
            setIsTyping(data.isTyping);
          }
        }
      }
    };

    onUserTyping(handleTypingStatus);

    return () => {
      offUserTyping(handleTypingStatus);
    };
  }, [selectedUser.chatId, onUserTyping, offUserTyping]);

  useEffect(() => {
    // Reset typing status when selected user changes
    setIsTyping(false);
  }, [selectedUser.chatId]);

  // Check if the selected user is online
  const recipientUserId = selectedUser?.recipientUsers?.user_id?.toString();
  const isOnline = recipientUserId ? isUserOnline(recipientUserId) : false;

  return (
    <div className="w-full h-20 flex p-4 justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Avatar className="flex justify-center items-center">
              <AvatarImage
                src={selectedUser.avatar}
                alt={selectedUser.name}
                width={6}
                height={6}
                className="w-10 h-10 "
              />
            </Avatar>
            {/* Online status indicator */}
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium">{selectedUser.name}</span>
            {isTyping ? (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <span className="animate-pulse">typing</span>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
              </span>
            ) : (
              <span className={`text-xs ${isOnline ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
        </div>

        <div>
          {TopbarIcons.map((icon, index) => (
            <Link
              key={index}
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
                "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
              )}
            >
              <icon.icon size={20} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
  )
}
