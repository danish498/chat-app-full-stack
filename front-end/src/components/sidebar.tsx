"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  SquarePen,
  Users,
  EllipsisVertical,
  X,
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

interface SidebarProps {
  isCollapsed: boolean;
  links: {
    name: string;
    messages: Message[];
    avatar: string;
    variant: "grey" | "ghost";
  }[];
  handleChatClick?: () => void;
  isMobile: boolean;
}

export function Sidebar({
  links,
  isCollapsed,
  isMobile,
  handleChatClick,
}: SidebarProps) {
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
                <Tooltip content="tooltip content">
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

                    {links.map((link, index) => (
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
                            <span>{`Email: danish@gmail.com`}</span>
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
                {/* <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator /> */}
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Link>
        </div>
      </div>
      <Input placeholder="Search the user..." />
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
            {links.map((link, index) => (
              <>
                <button
                  key={index}
                  onClick={handleChatClick}
                  className={cn(
                    buttonVariants({ variant: link.variant, size: "xl" }),
                    link.variant === "grey" &&
                      "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white shrink border-slate-200 bg-slate-200 ",
                    "justify-start gap-4 flex items-center w-full h-auto text-left py-2 px-3 shadow-none bg-white border border-transparent hover:bg-slate-100"
                  )}
                >
                  <Avatar className="flex justify-center items-center">
                    <AvatarImage
                      src={link.avatar}
                      alt={link.avatar}
                      width={6}
                      height={6}
                      className="w-10 h-10"
                    />
                  </Avatar>
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
              </>
            ))}
          </nav>
        </TabsContent>
        <TabsContent value="group">No Group Chat</TabsContent>
      </Tabs>
    </div>
  );
}
