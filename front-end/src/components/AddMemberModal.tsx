"use client";

import * as React from "react";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { mutate } from "swr";
import { Loader2, Plus, Search } from "lucide-react";

import chatService from "@/services/chat.service";
import { getApiErrorMessage } from "@/services/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

type SearchUser = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  isAlreadyMember?: boolean;
};

export function AddMemberModal({
  open,
  onOpenChange,
  chatId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
}) {
  const [q, setQ] = React.useState("");
  const debouncedQ = useDebounce(q, 400);

  const { data: searchRes, isLoading: isSearching } = useSWR(
    debouncedQ ? ["chat-members-search", chatId, debouncedQ] : null,
    () => chatService.getChatMembers(chatId, debouncedQ),
  );

  const { trigger: addMember, isMutating: isAdding } = useSWRMutation(
    chatId ? ["add-member", chatId] : null,
    async (_key: any, { arg }: { arg: { userId: string } }) => {
      return chatService.addMember(chatId, arg.userId, "member");
    },
  );

  const users: SearchUser[] = (searchRes?.data ?? []) as any;

  const handleAdd = async (userId: string) => {
    try {
      await addMember({ userId });
      mutate(["get-chat-by-id", chatId]);
      mutate("user-chats");
      toast.success("Member added");
    } catch (err) {

        console.log({err});

      toast.error(getApiErrorMessage(err, "Failed to add member"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <div className="p-6 pb-3">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>Search a user and add them to this group.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by username or name…"
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[360px] px-2 pb-2">
          {!debouncedQ ? (
            <div className="px-4 pb-4 text-sm text-muted-foreground">Type to search users.</div>
          ) : isSearching ? (
            <div className="px-4 pb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 pb-4 text-sm text-muted-foreground">No users found.</div>
          ) : (
            <div className="px-2 pb-2 space-y-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-2 hover:bg-muted/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={u.avatarUrl ?? ""} alt={u.username} />
                      <AvatarFallback>{(u.displayName || u.username || "U")[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.displayName || u.username}</div>
                      <div className="text-xs text-muted-foreground truncate">@{u.username}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(u.id)}
                    disabled={isAdding || !!u.isAlreadyMember}
                    className="shrink-0"
                  >
                    {u.isAlreadyMember ? (
                      <span>Added</span>
                    ) : isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {!u.isAlreadyMember && <span className="ml-2">Add</span>}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isAdding}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

