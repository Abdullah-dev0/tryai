import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SidebarSkeleton() {
	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* New Chat Button Skeleton */}
			<div className="px-3 pb-2">
				<Skeleton className="h-9 w-full rounded-lg" />
			</div>

			{/* Search Skeleton */}
			<div className="px-3 pb-3">
				<div className="relative">
					<Skeleton className="h-9 w-full rounded-lg" />
				</div>
			</div>

			{/* Conversations Skeleton */}
			<ScrollArea className="flex-1 px-2">
				<div className="space-y-4 pb-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i}>
							<Skeleton className="ml-3 h-3 w-20 mb-2 opacity-50" />
							<div className="space-y-0.5">
								{Array.from({ length: 4 }).map((_, j) => (
									<div key={j} className="flex items-center gap-2.5 rounded-lg px-3 py-2.5">
										<Skeleton className="h-4 w-4 shrink-0 opacity-40" />
										<Skeleton className="h-4 flex-1 opacity-40" />
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}
