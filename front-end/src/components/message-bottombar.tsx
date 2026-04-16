import {
  FileImage,
  Mic,
  Paperclip,
  PlusCircle,
  SendHorizontal,
  Smile,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import React, { useRef, useState, useCallback } from "react";
import { buttonVariants } from "./ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { EmojiPicker } from "./emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import mediaService from "@/services/media.service";
import { toast } from "sonner";

interface MessageBottombarProps {
  sendMessage: (
    content: string,
    options?: { fileUrl?: string; messageType?: "text" | "image" | "file" | "video" }
  ) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const BottombarIcons = [
  { icon: FileImage, accept: "image/*", label: "Send Image", type: "image" as const },
  { icon: Paperclip, accept: "video/*,application/pdf,*/*", label: "Attach File", type: "file" as const },
];

export default function MessageBottombar({
  sendMessage,
  onTypingStart,
  onTypingStop,
}: MessageBottombarProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const triggerTypingStart = React.useCallback(() => {
    if (isTypingRef.current) return;
    isTypingRef.current = true;
    onTypingStart?.();
  }, [onTypingStart]);

  const triggerTypingStop = React.useCallback(() => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    onTypingStop?.();
  }, [onTypingStop]);

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleFileChange = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      iconType: "image" | "file"
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Reset so the same file can be re-selected
      event.target.value = "";

      setIsUploading(true);

      try {
        let uploadResponse;

        // Decide which endpoint to hit based on the icon slot and the actual
        // MIME type of the chosen file.
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");

        if (iconType === "image" && isImage) {
          uploadResponse = await mediaService.uploadImage(file);
        } else if (isVideo) {
          uploadResponse = await mediaService.uploadVideo(file);
        } else {
          // Generic file — treat as image slot fallback or future /file endpoint
          uploadResponse = await mediaService.uploadImage(file);
        }

        if (uploadResponse.success && uploadResponse.data?.url) {
          const fileUrl = uploadResponse.data.url;
          const messageType: "image" | "video" | "file" = isImage
            ? "image"
            : isVideo
            ? "video"
            : "file";

          // Send a message whose content is the URL and whose type signals the
          // media kind so the message renderer can display it correctly.
          sendMessage(fileUrl, { fileUrl, messageType });
            triggerTypingStop();
        } else {
          toast.error("Upload failed. Please try again.");
        }
      } catch (err) {
        console.error("File upload error:", err);
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    },
    [sendMessage, triggerTypingStop]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    setMessage(nextValue);

    const hasText = nextValue.trim().length > 0;

    if (!hasText) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      triggerTypingStop();
      return;
    }

    triggerTypingStart();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      triggerTypingStop();
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const handleThumbsUp = () => {
    sendMessage("👍");
    setMessage("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    triggerTypingStop();
  };

  const handleSend = () => {
    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      triggerTypingStop();

      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }

    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      setMessage((prev) => prev + "\n");
    }
  };

  /** Renders file-picker buttons. Used in both the default bar and the popover. */
  const renderFileButtons = () =>
    BottombarIcons.map((icon, index) => (
      <button
        key={index}
        type="button"
        aria-label={icon.label}
        disabled={isUploading}
        onClick={() => fileInputRefs.current[index]?.click()}
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-9 w-9",
          "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUploading ? (
          <Loader2 size={20} className="text-muted-foreground animate-spin" />
        ) : (
          <icon.icon size={20} className="text-muted-foreground" />
        )}
        <input
          ref={(el) => {
            fileInputRefs.current[index] = el;
          }}
          type="file"
          accept={icon.accept}
          className="hidden"
          onChange={(e) => handleFileChange(e, icon.type)}
        />
      </button>
    ));

  return (
    <div className="p-2 flex justify-between w-full items-center gap-2">
      <div className="flex gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "h-9 w-9",
                "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
              )}
            >
              <PlusCircle size={20} className="text-muted-foreground" />
            </Link>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-full p-2">
            {message.trim() ? (
              <div className="flex gap-2">
                <Link
                  href="#"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-9 w-9",
                    "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                  )}
                >
                  <Mic size={20} className="text-muted-foreground" />
                </Link>
                {renderFileButtons()}
              </div>
            ) : (
              <Link
                href="#"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "h-9 w-9",
                  "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
                )}
              >
                <Mic size={20} className="text-muted-foreground" />
              </Link>
            )}
          </PopoverContent>
        </Popover>

        {!message.trim() && (
          <div className="flex gap-1">{renderFileButtons()}</div>
        )}
      </div>

      <AnimatePresence initial={false}>
        <motion.div
          key="input"
          className="w-full relative"
          layout
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 0.05 },
            layout: {
              type: "spring",
              bounce: 0.15,
            },
          }}
        >
          <Textarea
            autoComplete="off"
            value={message}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            name="message"
            placeholder="Aa"
            className=" w-full border rounded-full flex items-center h-9 resize-none overflow-hidden bg-background"
          ></Textarea>
          <div className="absolute right-2 bottom-0.5  ">
            <EmojiPicker
              onChange={(value) => {
                setMessage(message + value);
                if (inputRef.current) {
                  inputRef.current.focus();
                }
              }}
            />
          </div>
        </motion.div>

        {message.trim() ? (
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            )}
            onClick={handleSend}
          >
            <SendHorizontal size={20} className="text-muted-foreground" />
          </Link>
        ) : (
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9",
              "dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white shrink-0"
            )}
            onClick={handleThumbsUp}
          >
            <ThumbsUp size={20} className="text-muted-foreground" />
          </Link>
        )}
      </AnimatePresence>
    </div>
  );
}
