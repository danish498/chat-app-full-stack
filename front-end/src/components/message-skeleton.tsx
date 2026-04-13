import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

export function MessageSkeleton() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full overflow-y-auto overflow-x-hidden h-full flex flex-col p-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex w-full mb-2",
              i % 2 === 0 ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "flex items-end gap-2 max-w-[80%] md:max-w-[70%]",
                i % 2 === 0 ? "flex-row" : "flex-row-reverse"
              )}
            >
              {i % 2 === 0 && (
                <Skeleton className="w-8 h-8 rounded-full border shadow-sm flex-shrink-0" />
              )}
              <div className="flex flex-col gap-1">
                <Skeleton
                  className={cn(
                    "h-10 w-[150px] md:w-[250px] rounded-2xl",
                    i % 2 === 0 ? "rounded-tl-none" : "rounded-tr-none"
                  )}
                />
                <Skeleton
                  className={cn(
                    "h-3 w-12",
                    i % 2 === 0 ? "self-start" : "self-end"
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
