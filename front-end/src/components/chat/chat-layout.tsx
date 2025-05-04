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

  const [isSearchUserOpen, setIsSearchUserOpen] = useState(false);

  const [allChats, setAllChats] = useState([]);

  console.log("sfsdfsdfsdfsdfsd", selectedUser);

  const chatService = new ChatService();

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
    console.log("check the data source");
    setIsToggleSidebarAndChat(!toggleSidebarAndChat);
  };

  const handleChatClick = (user: any) => {
    console.log("sdfaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", user);
    setIsToggleSidebarAndChat(!toggleSidebarAndChat);
    setSelectedUser(user);
  };

  const fetchChats = async () => {
    try {
      const response = await chatService.getAllChats();
      setAllChats(response.data?.chats);
      console.log("🚀 ~ fetchChats ~ response:", response);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  console.log("sfsdfsdfsdfsdfsdfsdfsdfsdfsdfsd", selectedUser);

  const handleChatInitiate = async (user: any) => {
    console.log("sfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdsdfsdfsd", user);
    try {
      const response = chatService.createChat(user.user_id);
      // setSelectedUser({
      //   name: response.data.recipientUsers.username,
      //   messages: [],
      //   avatar: "",
      //   // variant: selectedUser.name === user.name ? "grey" : "ghost",
      //   variant: "grey",
      //   chatId: response.data.chat.chat_id,
      // });
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
          messages={selectedUser.messages}
          selectedUser={selectedUser}
          isMobile={isMobile}
          toggleSidebarAndChat={toggleSidebarAndChat}
          handleToggleSidebar={handleToggleSidebar}
        />
      </div>
    </div>
  );
}
