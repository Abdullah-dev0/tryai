import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
	return (
		<div role="status" aria-label="Loading chats" className="flex flex-1 flex-col gap-3 overflow-hidden px-3">
			<Skeleton className="h-11 w-full rounded-xl" />
			<Skeleton className="h-11 w-full rounded-xl" />
			<div className="flex flex-col">
				{["w-4/5", "w-3/5", "w-5/6", "w-2/3", "w-3/4"].map((width, i) => (
					<div key={i} className="flex h-11 items-center px-3">
						<Skeleton className={`h-3 ${width}`} />
					</div>
				))}
			</div>
		</div>
	);
}
