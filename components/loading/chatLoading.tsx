import { Skeleton } from "@/components/ui/skeleton";

export function ChatLoading() {
	return (
		<div role="status" aria-label="Loading messages" className="flex h-full flex-col bg-background px-6 pb-6 pt-7">
			<div className="mx-auto flex w-full max-w-[740px] flex-1 flex-col gap-7">
				<Skeleton className="h-7 w-80 max-w-full rounded-lg" />
				<div className="flex flex-1 flex-col gap-6">
					<Skeleton className="h-12 w-1/2 self-end rounded-[18px] rounded-br-sm" />
					<div className="flex flex-col gap-3">
						<Skeleton className="h-3 w-[96%]" />
						<Skeleton className="h-3 w-[88%]" />
						<Skeleton className="h-3 w-3/5" />
						<Skeleton className="h-28 w-full rounded-2xl" />
					</div>
					<Skeleton className="h-12 w-1/3 self-end rounded-[18px] rounded-br-sm" />
					<div className="flex flex-col gap-3">
						<Skeleton className="h-3 w-[90%]" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				</div>
				<Skeleton className="h-[116px] w-full rounded-[22px]" />
			</div>
		</div>
	);
}
