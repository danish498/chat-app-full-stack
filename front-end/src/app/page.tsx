

import { cookies } from "next/headers";
import { Chat } from "@/components/chat";

export default function Home() {
  const layout = cookies().get("react-resizable-panels:layout");
  const defaultLayout = layout ? JSON.parse(layout.value) : undefined;






  return (
    <main className="flex h-screen w-full">
      <Chat defaultLayout={defaultLayout} navCollapsedSize={8} />
    </main>
  );
}
