"use client";

import { MoreHorizontal, SquarePen, Search, Loader2, CircleDashed, Filter, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Message, UserData, userData } from "@/app/data";
import { User } from "@/services/auth.service";
import { Input } from "./ui/input";

interface SidebarProps {
  links: {
    id: string;
    name: string;
    messages: Message[];
    avatar: string;
    variant: "grey" | "ghost";
    type: string;
  }[];
  isCollapsed?: boolean;
  onSelectUser: (user: UserData) => void;
  onSelectChat: (chatId: string) => void;
  selectedUser: UserData | null;
  onSearch: (query: string) => void;
  searchResults?: User[];
  searchLoading?: boolean;
  searchPerformed?: boolean;
  currentUser?: User | null;
  onCreateGroupClick?: () => void;
}

export function Sidebar({
  links,
  onSelectUser,
  onSelectChat,
  selectedUser,
  onSearch,
  searchResults,
  searchLoading,
  searchPerformed,
  currentUser,
  onCreateGroupClick
}: SidebarProps) {
  return (
    <div
      className="relative group flex flex-col h-full bg-background"
    >
      <div className="flex justify-between px-4 py-3 items-center bg-zinc-50 dark:bg-zinc-800/50 h-20 border-b">
        <div className="flex gap-2 items-center">
          <p className="font-bold text-xl">ChatApp</p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 cursor-pointer rounded-full"
            )}
          >
            <CircleDashed size={20} className="text-muted-foreground" />
          </div>

          <div
            onClick={onCreateGroupClick}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 cursor-pointer rounded-full"
            )}
          >
            <Users size={20} className="text-muted-foreground" />
          </div>

          <div
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 cursor-pointer rounded-full"
            )}
          >
            <MoreHorizontal size={20} className="text-muted-foreground" />
          </div>

          <Avatar className="h-8 w-8 cursor-pointer border ml-1">
            <AvatarImage
              src={currentUser?.avatarUrl || "https://avatars.githubusercontent.com/u/79553845"}
              alt={currentUser?.username || "Me"}
            />
            <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="px-3 py-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search or start new chat"
            className="h-9 pl-10 bg-zinc-100 dark:bg-zinc-800 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-lg text-sm"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}>
          <Filter size={18} className="text-muted-foreground" />
        </div>
      </div>

      <nav className=" gap-4 px-2 overflow-y-auto overflow-x-hidden">
        {searchPerformed ? (
          <div className="flex flex-col gap-1">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Search Results
            </p>
            {searchResults && searchResults.length > 0 ? (
              searchResults.map((user, index) => (
                <div
                  key={`search-${user.id}`}
                  onClick={() => {
                    onSelectUser({
                      id: user.id,
                      name: user.displayName || user.username,
                      avatar: user.avatarUrl || "https://avatars.githubusercontent.com/u/79553845",
                      messages: [],
                    } as any);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                    selectedUser?.id === user.id && "bg-zinc-100 dark:bg-zinc-800"
                  )}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage
                      src={user.avatarUrl || "https://avatars.githubusercontent.com/u/79553845"}
                      alt={user.username}
                      className="object-cover"
                    />
                    <AvatarFallback>{(user.displayName || user.username)[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 border-b border-zinc-100 dark:border-zinc-800 pb-3 h-full justify-center">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-base truncate">{user.displayName || user.username}</span>
                      <span className="text-[10px] text-muted-foreground">User</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 dark:text-zinc-400 text-xs truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : !searchLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col">
            {links.map((link, index) => (
              <div
                key={index}
                onClick={() => {
                  onSelectChat(link.id);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 ",
                  selectedUser?.name === link.name && "bg-zinc-100 dark:bg-zinc-800"
                )}
              >
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage
                    src={link.avatar}
                    alt={link.name}
                    className="object-cover"
                  />
                  <AvatarFallback>{link.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1 min-w-0 border-b border-zinc-100 dark:border-zinc-800 pb-3 h-full justify-center">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-[15px] truncate w-1/2">{link.name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {link.messages.length > 0 ? (
                        new Date(link.messages[link.messages.length - 1].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      ) : (
                        "12:45"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400 text-[13px] truncate pr-2">
                      {link.messages.length > 0 ? (
                        <>
                          {link.messages[link.messages.length - 1].isMe ? "You: " : ""}
                          {link.messages[link.messages.length - 1].content}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {searchLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </nav>
    </div>
  );
}
