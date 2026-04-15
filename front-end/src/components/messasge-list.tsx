import { Message, UserData } from "@/app/data";
import { cn } from "@/lib/utils";
import React, { useRef } from "react";
import { Avatar, AvatarImage } from "./ui/avatar";
import MessageBottombar from "./message-bottombar";
import { AnimatePresence, motion } from "framer-motion";

interface MessageListProps {
  messages?: Message[];
  selectedUser: UserData;
  isLoadingMore?: boolean;
  onScroll?: React.UIEventHandler<HTMLDivElement>;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function MessageList({
  messages,
  selectedUser,
  isLoadingMore,
  onScroll,
  containerRef,
}: MessageListProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = containerRef ?? internalRef;

  const shouldAutoScrollRef = React.useRef(true);

  React.useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    if (!shouldAutoScrollRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, messagesContainerRef]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isVideoUrl = (url: string) =>
    /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(url);

  const renderMedia = (message: Message) => {
    const { fileUrl, messageType, content } = message;

    if (!fileUrl) return <>{content}</>;

    const isImage = messageType === "image";
    const isVideo = messageType === "video" ? isVideoUrl(fileUrl) : false;

    return (
      <div className="flex flex-col gap-1.5">
        {isImage && (
          <img
            src={fileUrl}
            alt="shared image"
            className="max-w-[260px] w-full rounded-xl object-cover shadow-md cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => window.open(fileUrl, "_blank")}
          />
        )}

        {isVideo && (
          <video
            src={fileUrl}
            controls
            className="max-w-[280px] w-full rounded-xl shadow-md"
          />
        )}

        {!isImage && !isVideo && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
          >
            📎 {fileUrl.split("/").pop() ?? "Download file"}
          </a>
        )}

        {content && messageType == "text" && (
          <span>{content}</span>
        )}
      </div>
    );
  };

  return (
    <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col">
      <div
        ref={messagesContainerRef}
        onScroll={(e) => {
          const el = messagesContainerRef.current;
          if (el) {
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            // consider user "at bottom" if within 120px
            shouldAutoScrollRef.current = distanceFromBottom < 120;
          }
          onScroll?.(e);
        }}
        className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col p-4 gap-4"
      >
        {isLoadingMore && (
          <div className="w-full flex flex-col gap-3 pb-2">
            <div className="mx-auto h-4 w-32 rounded-full bg-muted/70 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-10 w-64 max-w-[70%] rounded-2xl bg-muted/60 animate-pulse" />
            </div>
            <div className="flex justify-end">
              <div className="h-10 w-52 max-w-[70%] rounded-2xl bg-muted/60 animate-pulse" />
            </div>
          </div>
        )}
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
                    {renderMedia(message)}
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
