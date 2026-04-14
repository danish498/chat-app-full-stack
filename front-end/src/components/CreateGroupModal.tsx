"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Loader2, UserPlus, Users } from "lucide-react";
import useSWR from "swr";
import userService from "@/services/user.service";
import { useDebounce } from "@/hooks/useDebounce";
import { User } from "@/services/auth.service";
import { cn } from "@/lib/utils";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, participantIds: string[]) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  isSubmitting = false,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { data: searchResults, isLoading: isSearching } = useSWR(
    debouncedSearchQuery ? ["search-users-group", debouncedSearchQuery] : null,
    () => userService.searchUsers(debouncedSearchQuery)
  );

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    await onCreateGroup(
      groupName,
      selectedUsers.map((u) => u.id)
    );
    // Reset state on success
    setGroupName("");
    setSelectedUsers([]);
    setSearchQuery("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-none bg-white dark:bg-zinc-950 shadow-2xl">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Create New Group
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-sm mt-1">
              Connect with multiple people at once. Set a name and add members.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Group Name
            </Label>
            <Input
              id="groupName"
              placeholder="Ex: Project Alpha, Weekend Squad..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-11 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Add Members ({selectedUsers.length})
            </Label>

            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto p-1">
                {selectedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 pl-1.5 pr-1 py-1 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800 animate-in fade-in zoom-in duration-200"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="text-[10px] bg-indigo-200 dark:bg-indigo-800">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[80px] truncate">{user.username}</span>
                    <button
                      onClick={() => removeUser(user.id)}
                      className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search users to add..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-10 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl"
              />
            </div>

            <div className="space-y-1 mt-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                </div>
              ) : searchResults?.data?.length ? (
                searchResults.data.map((user: User) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border border-transparent",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800"
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-white dark:border-zinc-900 shadow-sm">
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800">
                            {user.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">@{user.username}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                        isSelected
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "border-zinc-300 dark:border-zinc-700"
                      )}>
                        {isSelected && <UserPlus className="h-3 w-3" />}
                      </div>
                    </div>
                  );
                })
              ) : searchQuery && !isSearching ? (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-500">No users found matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : !searchQuery && (
                <div className="text-center py-6">
                  <p className="text-sm text-zinc-500">Search for users to add them to the group</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedUsers.length === 0 || isSubmitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-medium shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Group"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
