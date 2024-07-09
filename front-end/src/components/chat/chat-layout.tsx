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
  const [selectedUser, setSelectedUser] = React.useState(userData[0]);
  const [isMobile, setIsMobile] = useState(false);
  const [toggleSidebarAndChat, setIsToggleSidebarAndChat] = useState(true);

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

  const handleChatClick = () => {
    console.log("sdfaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    setIsToggleSidebarAndChat(!toggleSidebarAndChat);
  };

  return (
    <div className="z-10 h-full text-sm md:flex">
      {(!isMobile || !toggleSidebarAndChat) && (
        <div className="md:border-r md:border-slate-200 md:max-w-[350px] w-full">
          <Sidebar
            isCollapsed={isCollapsed || isMobile}
            links={userData.map((user) => ({
              name: user.name,
              messages: user.messages ?? [],
              avatar: user.avatar,
              variant: selectedUser.name === user.name ? "grey" : "ghost",
            }))}
            handleChatClick={handleChatClick}
            isMobile={isMobile}
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
