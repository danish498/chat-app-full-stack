import { Message, UserData } from "@/app/data";
import ChatTopbar from "./chat-topbar";
import { ChatList } from "./chat-list";
import React from "react";
import { ChevronLeft, MoveLeft } from "lucide-react";
import { MessageService } from "@/service/messageService";

interface ChatProps {
  messages?: Message[];
  selectedUser: UserData;
  toggleSidebarAndChat: boolean;
  isMobile: boolean;
  handleToggleSidebar?: () => void;
}

export function Chat({
  messages,
  selectedUser,
  isMobile,
  handleToggleSidebar,
  toggleSidebarAndChat,
}: any) {
  console.log("🚀 ~ selectedUserrrrrrrrrrrrrr:", selectedUser);
  const [messagesState, setMessages] = React.useState<Message[]>(
    messages ?? []
  );

  const messageService = new MessageService();

  const sendMessage = async (newMessage: Message) => {
    console.log("🚀 ~ sendMessage ~ newMessage:", newMessage);

    try {
      const response = await messageService.sendMessage(
        selectedUser.chatId,
        newMessage.message
      );
      console.log("🚀 ~ sendMessage ~ response:", response)
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setMessages([...messagesState, newMessage]);
  };

  return (
    <div className="flex flex-col w-full max-h-screen h-full">
      <div className="flex justify-center items-center border-b">
        {isMobile && (
          <MoveLeft
            size={26}
            className="ml-2 cursor-pointer"
            onClick={handleToggleSidebar}
          />
        )}
        <ChatTopbar selectedUser={selectedUser} />
      </div>

      <ChatList
        messages={messagesState}
        selectedUser={selectedUser}
        sendMessage={sendMessage}
        isMobile={isMobile}
      />
    </div>
  );
}
