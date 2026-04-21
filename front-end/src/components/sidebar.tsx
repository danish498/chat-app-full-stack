"use client";

import React from "react";
import {
  MoreHorizontal,
  Search,
  Loader2,
  CircleDashed,
  Filter,
  Users,
  Settings,
  LogOut,
  WifiOff,
  Wifi,
  Sun,
  Moon,
  Laptop,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Message, UserData } from "@/app/data";
import { User } from "@/services/auth.service";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useTheme } from "next-themes";
import authService from "@/services/auth.service";
import Link from "next/link";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  ACCENT_THEMES,
  applyAccentTheme,
  getStoredAccentThemeId,
  storeAccentThemeId,
} from "../lib/accentTheme";

interface SidebarProps {
  links: {
    id: string;
    name: string;
    messages: Message[];
    avatar: string;
    variant: "grey" | "ghost";
    type: "group" | "direct" | (string & {});
    status?: string | null;
    lastSeen?: string | null;
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

export const Sidebar = React.memo(function Sidebar({
  links,
  onSelectUser,
  onSelectChat,
  selectedUser,
  onSearch,
  searchResults,
  searchLoading,
  searchPerformed,
  currentUser,
  onCreateGroupClick,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const ws = useWebSocket();
  const [accentId, setAccentId] = React.useState<string>(() =>
    getStoredAccentThemeId(),
  );
  const [mounted, setMounted] = React.useState(false);

  const mapUserToSidebarUser = React.useCallback(
    (user: User): UserData =>
      ({
        id: user.id,
        name: user.displayName || user.username,
        lastSeen: user.lastSeen,
        avatar: user.avatarUrl || "https://avatars.githubusercontent.com/u/79553845",
        messages: [],
      }) as any,
    [],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    applyAccentTheme(accentId);
    storeAccentThemeId(accentId);
  }, [accentId]);

  const getChatTypeLabel = (type: SidebarProps["links"][number]["type"]) => {
    if (!type) return "Direct";
    const normalized = String(type).toLowerCase();
    if (normalized === "group") return "Group";
    if (normalized === "direct") return "Direct";
    return String(type);
  };

  const isWsConnected =
    ws.status === "connected" ||
    ws.status === "connecting" ||
    ws.status === "reconnecting";

  return (
    <div className="relative group flex flex-col h-full bg-background">
      <div className="flex justify-between px-4 py-3 items-center bg-zinc-50 dark:bg-zinc-800/50 h-20 border-b">
        <div className="flex gap-2 items-center">
          <p className="font-bold text-xl">Chat Hive</p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 cursor-pointer rounded-full",
            )}
          >
            <CircleDashed size={20} className="text-muted-foreground" />
          </div>

          <div
            onClick={onCreateGroupClick}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 cursor-pointer rounded-full",
            )}
          >
            <Users size={20} className="text-muted-foreground" />
          </div>

          <div
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-8 w-8 cursor-pointer rounded-full",
            )}
          >
            <MoreHorizontal size={20} className="text-muted-foreground" />
          </div>

          <Link href="/profile">
            <Avatar className="h-8 w-8 cursor-pointer border ml-1 hover:opacity-80 transition-opacity">
              <AvatarImage
                src={
                  currentUser?.avatarUrl ||
                  "https://avatars.githubusercontent.com/u/79553845"
                }
                alt={currentUser?.username || "Me"}
              />
              <AvatarFallback>
                {currentUser?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
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
        <div
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "h-8 w-8",
          )}
        >
          <Filter size={18} className="text-muted-foreground" />
        </div>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-2">
        {searchPerformed ? (
          <div className="flex flex-col gap-1">
            <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Search Results
            </p>
            {searchResults && searchResults.length > 0
              ? searchResults.map((user) => (
                  <div
                    key={`search-${user.id}`}
                    onClick={() => {
                      onSelectUser(mapUserToSidebarUser(user));
                    }}
                    className={cn(
                      "flex items-stretch gap-3 pl-3 pr-4 cursor-pointer transition-all duration-200",
                      selectedUser?.id === user.id
                        ? "bg-zinc-200/80 dark:bg-zinc-700/50 border-l-4 border-l-primary"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent",
                    )}
                  >
                    <div className="relative shrink-0 flex items-center py-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={
                            user.avatarUrl ||
                            "https://avatars.githubusercontent.com/u/79553845"
                          }
                          alt={user.username}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {(user.displayName || user.username)[0]}
                        </AvatarFallback>
                      </Avatar>
                      {user.status === "online" && (
                        <span className="absolute bottom-3 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex flex-col flex-1 min-w-0 justify-center border-b border-zinc-100 dark:border-zinc-800",
                        selectedUser?.id === user.id && "border-b-transparent",
                      )}
                    >
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-base truncate">
                          {user.displayName || user.username}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wider",
                            selectedUser?.id === user.id
                              ? "text-primary font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          User
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={cn(
                            "text-xs truncate",
                            selectedUser?.id === user.id
                              ? "text-zinc-700 dark:text-zinc-300 font-medium"
                              : "text-zinc-500 dark:text-zinc-400",
                          )}
                        >
                          @{user.username}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              : !searchLoading && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found
                  </div>
                )}
          </div>
        ) : (
          <div className="flex flex-col">
            {links.map((link) => (
              <div
                key={link.id}
                onClick={() => {
                  onSelectChat(link.id);
                }}
                className={cn(
                  "flex items-stretch gap-3 pl-3 pr-4 cursor-pointer transition-all duration-200",
                  link.variant === "grey"
                    ? "bg-zinc-200/80 dark:bg-zinc-700/50 border-l-4 border-l-primary"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent",
                )}
              >
                <div className="relative shrink-0 flex items-center py-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={link.avatar}
                      alt={link.name}
                      className="object-cover"
                    />
                    <AvatarFallback>{link?.name?.[0] || "U"}</AvatarFallback>
                  </Avatar>
                  {link.type === "direct" && link.status === "online" && (
                    <span className="absolute bottom-3 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div
                  className={cn(
                    "flex flex-col flex-1 min-w-0 justify-center border-b border-zinc-100 dark:border-zinc-800",
                    link.variant === "grey" && "border-b-transparent",
                  )}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-[15px] truncate w-1/2">
                      {link.name}
                    </span>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border",
                          link.variant === "grey"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200/70 dark:border-zinc-700/70",
                        )}
                      >
                        {getChatTypeLabel(link.type)}
                      </span>
                      <span
                        className={cn(
                          "text-[11px]",
                          link.variant === "grey"
                            ? "text-primary font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {link.messages.length > 0
                          ? new Date(
                              link.messages[link.messages.length - 1].createdAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={cn(
                        "text-[13px] truncate pr-2",
                        link.variant === "grey"
                          ? "text-zinc-700 dark:text-zinc-300 font-medium"
                          : "text-zinc-500 dark:text-zinc-400",
                      )}
                    >
                      {link.messages.length > 0 ? (
                        <>
                          {link.messages[link.messages.length - 1].isMe
                            ? "You: "
                            : ""}
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

      {/* Fixed bottom bar */}
      <div className="shrink-0 border-t bg-background/80 backdrop-blur-md">
        <div className="px-3 py-2 flex items-center justify-between gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Settings</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-3">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Palette className="h-4 w-4" />
                  Theme
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => setTheme("light")}
                    disabled={!mounted}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    type="button"
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => setTheme("dark")}
                    disabled={!mounted}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                  <Button
                    type="button"
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => setTheme("system")}
                    disabled={!mounted}
                  >
                    <Laptop className="h-4 w-4" />
                    System
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Accent color</div>
                  <div className="text-xs text-muted-foreground">
                    Applies instantly
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {ACCENT_THEMES.map((t: (typeof ACCENT_THEMES)[number]) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAccentId(t.id)}
                      className={cn(
                        "h-9 w-9 rounded-md border transition-shadow",
                        accentId === t.id
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-sm"
                          : "hover:shadow-sm",
                      )}
                      style={{ backgroundColor: t.previewHex }}
                      aria-label={`Set accent color: ${t.label}`}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                if (isWsConnected) {
                  ws.disconnect();
                } else {
                  ws.connect();
                }
              }}
              title={isWsConnected ? "Go offline" : "Go online"}
            >
              {isWsConnected ? (
                <WifiOff className="h-4 w-4" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              onClick={() => authService.logout()}
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
