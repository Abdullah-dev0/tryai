import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SidebarSkeleton() {
	return (
		<div className="hidden w-64 flex-col border-r bg-card md:flex">
			{/* Header */}
			<div className="flex h-14 items-center border-b px-4">
				<span className="font-semibold">TryAI</span>
			</div>

			{/* New Chat Button Skeleton */}
			<div className="p-3">
				<Skeleton className="h-9 w-full" />
			</div>

			{/* Conversations Skeleton */}
			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-1 p-2">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center gap-2 rounded-md px-3 py-2"
						>
							<Skeleton className="h-4 w-4 shrink-0" />
							<Skeleton className="h-4 flex-1" />
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
