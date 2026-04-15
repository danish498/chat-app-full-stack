"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AddMemberModal } from "@/components/AddMemberModal";

type Participant = {
  userId: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
  joinedAt?: string | null;
};

type ChatDetails = {
  id: string;
  name?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  type: "direct" | "group";
  createdAt?: string;
  participants?: Participant[];
  otherUser?: Participant | null;
  mySettings?: { role?: string | null };
};

export function ChatDetailsPanel({
  className,
  chat,
  onClose,
}: {
  className?: string;
  chat?: ChatDetails | null;
  onClose: () => void;
}) {
  const [addOpen, setAddOpen] = React.useState(false);

  const isGroup = chat?.type === "group";
  const isAdmin = (chat?.mySettings?.role ?? "").toLowerCase() === "admin";

  const title = isGroup
    ? (chat?.name ?? "Group")
    : (chat?.otherUser?.displayName || chat?.otherUser?.username || "User");

  const avatarUrl = isGroup ? chat?.avatarUrl : chat?.otherUser?.avatarUrl;

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      <div className="h-20 px-4 border-b flex items-center justify-between bg-background/95 backdrop-blur-md shrink-0">
        <div className="text-sm font-semibold">Chat details</div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {!chat ? (
        <div className="p-4 text-sm text-muted-foreground">Select a chat to see details.</div>
      ) : (
        <>
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={avatarUrl ?? ""} alt={title} />
                <AvatarFallback>{title?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold truncate">{title}</div>
                <div className="text-xs text-muted-foreground">
                  {isGroup ? "Group" : "Direct"} • {chat.id}
                </div>
              </div>
            </div>

            {isGroup && chat.description ? (
              <div className="mt-3 text-sm text-muted-foreground">{chat.description}</div>
            ) : null}

            {!isGroup && chat.otherUser ? (
              <div className="mt-3 text-sm text-muted-foreground space-y-1">
                <div className="truncate">
                  <span className="text-foreground">Username:</span> @{chat.otherUser.username}
                </div>
                {chat.otherUser.role ? (
                  <div className="truncate">
                    <span className="text-foreground">Role:</span> {chat.otherUser.role}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {isGroup ? (
            <div className="px-4 py-3 flex items-center justify-between border-b">
              <div className="text-sm font-medium">
                Participants{chat.participants ? ` (${chat.participants.length})` : ""}
              </div>
              {isAdmin ? (
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  Add
                </Button>
              ) : null}
            </div>
          ) : null}

          {isGroup ? (
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2">
                {(chat.participants ?? []).map((p) => {
                  const name = p.displayName || p.username;
                  return (
                    <div
                      key={p.userId}
                      className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-muted/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={p.avatarUrl ?? ""} alt={name} />
                          <AvatarFallback>{name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="text-xs text-muted-foreground truncate">@{p.username}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {(p.role ?? "member").toString()}
                      </div>
                    </div>
                  );
                })}
                {(chat.participants ?? []).length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">No participants.</div>
                ) : null}
              </div>
            </ScrollArea>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              This is a direct chat. Details show the other user above.
            </div>
          )}

          {isGroup && isAdmin ? (
            <AddMemberModal open={addOpen} onOpenChange={setAddOpen} chatId={chat.id} />
          ) : null}
        </>
      )}
    </div>
  );
}

