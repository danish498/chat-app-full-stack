"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  SquarePen,
  Users,
  EllipsisVertical,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Message } from "@/app/data";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Popover, PopoverTrigger } from "@radix-ui/react-popover";
import { PopoverContent } from "./ui/popover";
import { useEffect, useState } from "react";
import { UserService } from "@/service/userService";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useSocket } from "@/context/SocketContext";

interface SidebarProps {
  isCollapsed: boolean;
  links: {
    name: string;
    messages: Message[];
    avatar: string;
    variant: "grey" | "ghost";
  }[];
  handleChatClick?: (user: any) => void;
  isMobile: boolean;
}

export function Sidebar({
  links,
  isCollapsed,
  isMobile,
  handleChatClick,
  setSelectedUser,
  handleChatInitiate,
  isSearchUserOpen,
  setIsSearchUserOpen,
}: any) {
  const userService = new UserService();
  const router = useRouter();
  const { isUserOnline } = useSocket();

  const [getAllUsers, setGetAllUsers] = useState([]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        setGetAllUsers(response.data);
      } catch (error) {}
    };
    fetchAllUsers();
  }, []);

  const handleLogout = async () => {
    try {
      await userService.logoutUser();
      toast.success("Logged out successfully!");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if the API call fails, clear local storage and redirect
      localStorage.removeItem("token");
      document.cookie = "token=; path=/; max-age=0";
      router.push("/login");
    }
  };

  return (
    <div
      data-collapsed={isMobile}
      className="relative group flex flex-col h-full gap-4 p-2 data-[collapsed=true]:p-2 "
    >
      <div className="flex justify-between p-2 items-center">
        <div className="flex gap-2 items-center text-2xl">
          <p className="font-medium">Chats</p>
          <span className="text-zinc-300">({links.length})</span>
        </div>

        <div>
          <button
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9"
            )}
          >
            <Dialog>
              {/* <Button variant="outline">Edit Profile</Button> */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Users />
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a group</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-center">
                    Create a Group Chat
                  </DialogTitle>
                  {/* <DialogDescription>
                      Make changes to your profile here. Click save when you're
                      done.
                    </DialogDescription> */}
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Input
                      id="name"
                      className="col-span-4"
                      placeholder="Enter you group name"
                    />
                    <div className="col-span-4">
                      <Input id="username" placeholder="Enter username" />
                      <Badge className="pr-1">
                        Danish <X size={16} className="ml-1" />
                      </Badge>

                      <Badge>Daniyal</Badge>
                      <Badge>Daniyal</Badge>
                    </div>

                    {links.map((link: any, index: any) => (
                      <nav
                        className="col-span-4  group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
                        key={index}
                      >
                        <button
                          key={index}
                          className="justify-start gap-4 flex items-center w-full h-auto text-left py-2 px-3 shadow-none bg-white border border-transparent hover:bg-slate-100"
                        >
                          <Avatar className="flex justify-center items-center">
                            <AvatarImage
                              src={link.avatar}
                              alt={link.avatar}
                              width={6}
                              height={6}
                              className="w-10 h-10 "
                            />
                          </Avatar>
                          <div className="flex flex-col ">
                            <span>{link.name}</span>
                            {/* <span>{`Email: danish@gmail.com`}</span> */}
                          </div>
                        </button>
                      </nav>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </button>

          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "h-9 w-9"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger>
                <EllipsisVertical />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Link>
        </div>
      </div>

      <Popover open={isSearchUserOpen} onOpenChange={setIsSearchUserOpen}>
        <PopoverTrigger>
          <Input placeholder="Search the user..." />
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex flex-col gap-3">
            {getAllUsers.map((user: any) => (
              <div
                key={user.id}
                className="px-4 py-2 bg-gray-100 rounded-lg font-medium cursor-pointer"
                onClick={() => handleChatInitiate(user)}
              >
                {user?.username}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Tabs
        defaultValue="all"
        className="space-y-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
      >
        <TabsList className="flex w-full">
          <TabsTrigger className="w-full" value="all">
            All
          </TabsTrigger>
          <TabsTrigger className="w-full" value="group">
            Group
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <nav className="space-y-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
            {links.map((link: any, index: any) => {
              const isOnline = link.recipientUsers?.user_id
                ? isUserOnline(link.recipientUsers.user_id.toString())
                : false;

              return (
                <button
                  key={index}
                  onClick={() => handleChatClick(link)}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "xl" }),
                    link.variant === "grey" &&
                      "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink border-slate-200 bg-slate-200 ",
                    "justify-start gap-4 flex items-center w-full h-auto text-left py-2 px-3 shadow-none bg-white border border-transparent hover:bg-slate-100"
                  )}
                >
                  <div className="relative">
                    <Avatar className="flex justify-center items-center">
                      <AvatarImage
                        src={link.avatar}
                        alt={link.avatar}
                        width={6}
                        height={6}
                        className="w-10 h-10"
                      />
                    </Avatar>
                    {/* Online status indicator */}
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="max-w-[calc(100%-56px)]">
                    <span className="block text-black font-medium text-sm">
                      {link.name}
                    </span>
                    {link.messages.length > 0 && (
                      <span className="text-slate-500 text-xs truncate block">
                        {
                          link.messages[link.messages.length - 1].name.split(
                            " "
                          )[0]
                        }
                        : {link.messages[link.messages.length - 1].message}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </TabsContent>
        <TabsContent value="group">No Group Chat</TabsContent>
      </Tabs>
    </div>
  );
}
