"use client";

import { userData } from "@/app/data";
import React, { useEffect, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { Sidebar } from "../sidebar";
import { Chat } from "./chat";
import { ChatService } from "@/service/chatService";
import { MessageService } from "@/service/messageService";
import { MessageData } from "./chat-list";

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function ChatLayout({
  defaultLayout = [320, 480],
  defaultCollapsed = false,
  navCollapsedSize,
}: ChatLayoutProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [selectedUser, setSelectedUser] = React.useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [toggleSidebarAndChat, setIsToggleSidebarAndChat] = useState(true);
  const [message, setMessage] = useState<MessageData[]>([]);

  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);

  const [allChats, setAllChats] = useState([]);

   

  const chatService = new ChatService();
  const messageService = new MessageService();

  useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  const handleToggleSidebar = () => {
     
    setIsToggleSidebarAndChat(!toggleSidebarAndChat);
  };

  const handleChatClick = async (user: any) => {
    try {
      const response = await messageService.getAllMessages(user.chatId);

      setMessage(response.data.messages);
      setIsToggleSidebarAndChat(!toggleSidebarAndChat);
      // Pass the full user object with recipientUsers data
      setSelectedUser({
        ...user,
        recipientUsers: user.recipientUsers,
      });
    } catch (error) {
      console.error({ error });
    }
  };

  const fetchChats = async () => {
    try {
      const response = await chatService.getAllChats();
      setAllChats(response.data?.chats);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  const handleChatInitiate = async (user: any) => {
    try {
      const response = chatService.createChat(user.user_id);

      setIsSearchUserOpen(false);
      await fetchChats();
    } catch (error) {}
  };

  return (
    <div className="z-10 h-full text-sm md:flex">
      {(!isMobile || !toggleSidebarAndChat) && (
        <div className="md:border-r md:border-slate-200 md:max-w-[350px] w-full">
          <Sidebar
            isCollapsed={isCollapsed || isMobile}
            links={allChats.map((user: any) => ({
              name: user.recipientUsers.username,
              messages: [],
              avatar: user.recipientUsers.profile_picture,
              // variant: selectedUser.name === user.name ? "grey" : "ghost",
              variant: "grey",
              chatId: user.chat_id,
              recipientUsers: user.recipientUsers, // Pass the full recipient data
            }))}
            handleChatClick={handleChatClick}
            isMobile={isMobile}
            setSelectedUser={setSelectedUser}
            handleChatInitiate={handleChatInitiate}
            isSearchUserOpen={isSearchUserOpen}
            setIsSearchUserOpen={setIsSearchUserOpen}
          />
        </div>
      )}

      <div className={cn(toggleSidebarAndChat ? "flex flex-1" : "hidden")}>
        <Chat
          messages={message}
          selectedUser={selectedUser}
          isMobile={isMobile}
          toggleSidebarAndChat={toggleSidebarAndChat}
          handleToggleSidebar={handleToggleSidebar}
          setMessage={setMessage}
        />
      </div>
    </div>
  );
}
