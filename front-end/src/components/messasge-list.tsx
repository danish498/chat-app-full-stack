import { Message, UserData } from "@/app/data";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import MessageBottombar from "./message-bottombar";
import { AnimatePresence, motion } from "framer-motion";

interface MessageListProps {
  messages?: Message[];
  selectedUser: UserData;
}

export function MessageList({
  messages,
  selectedUser,
}: MessageListProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);


  React.useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col p-4 gap-4"
      >
        <AnimatePresence initial={false}>
          {messages?.map((message, index) => (
            <motion.div
              key={message.id || index}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.3,
              }}
              className={cn(
                "flex w-full mb-2",
                message.isMe ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "flex items-end gap-2 max-w-[80%] md:max-w-[70%]",
                  message.isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {!message.isMe && (
                  <Avatar className="w-8 h-8 border shadow-sm flex-shrink-0">
                    <AvatarImage
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                    />
                  </Avatar>
                )}

                <div className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "relative px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-all hover:shadow-md",
                      message.isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none bg-gradient-to-br from-primary to-primary/90"
                        : "bg-muted text-foreground rounded-tl-none border border-border/50"
                    )}
                  >
                    {message.content}
                    <div
                      className={cn(
                        "text-[10px] mt-1 opacity-70 font-medium",
                        message.isMe ? "text-right" : "text-left"
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
