import React from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import { UserData } from "@/app/data";
import { Info, Phone, Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn, formatLastSeen } from "@/lib/utils";
import { buttonVariants } from "./ui/button";

interface MessageTopbarProps {
  selectedUser: UserData;
  onBack?: () => void;
  onUserClick?: () => void;
  isTyping?: boolean;
  isOnline?: boolean;
  chatType?: "direct" | "group";
  memberCount?: number | null;
}

export const TopbarIcons = [{ icon: Phone }, { icon: Video }];

export default function MessageTopbar({
  selectedUser,
  onBack,
  onUserClick,
  isTyping,
  isOnline,
  chatType,
  memberCount,
}: MessageTopbarProps) {
  return (
    <div className="w-full h-20 flex p-1 justify-between items-center border-b sticky top-0 z-10 bg-background/95 backdrop-blur-md shrink-0">
      <div className="flex items-center gap-1.5">
        {onBack && (
          <div
            onClick={onBack}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9 cursor-pointer md:hidden",
            )}
          >
            <ArrowLeft size={20} />
          </div>
        )}
        <button
          type="button"
          onClick={onUserClick}
          disabled={!onUserClick}
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1 text-left",
            onUserClick &&
              "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer",
            !onUserClick && "cursor-default",
          )}
          aria-label={`Open ${selectedUser.name}`}
        >
          <Avatar className="flex justify-center items-center">
            <AvatarImage
              src={selectedUser.avatar}
              alt={selectedUser.name}
              width={6}
              height={6}
              className="w-10 h-10"
            />
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{selectedUser.name}</span>
            <span className="text-xs">
              {chatType === "group"
                ? memberCount !== null
                  ? `${memberCount} online`
                  : "Group Chat"
                : isTyping
                  ? "Typing..."
                  : isOnline
                    ? "Online"
                    : selectedUser.lastSeen
                      ? `Active ${formatLastSeen(selectedUser.lastSeen)}`
                      : "Offline"}
            </span>
          </div>
        </button>
      </div>

      <div className="flex gap-1">
        {TopbarIcons.map((icon, index) => (
          <Link
            key={index}
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
            )}
          >
            <icon.icon size={20} className="text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
