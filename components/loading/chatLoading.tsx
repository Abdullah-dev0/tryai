import { Skeleton } from "@/components/ui/skeleton";

export function ChatLoading() {
	return (
		<div className="flex h-full flex-col bg-background">
			<main className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-2xl px-4 py-8">
					<div className="flex flex-col gap-4 p-4">
						<div className="flex gap-4 justify-end">
							<Skeleton className="h-16 w-3/4 rounded-2xl" />
							<Skeleton className="h-8 w-8 rounded-full" />
						</div>
						{/* Assistant message skeleton */}
						<div className="flex gap-4 justify-start">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-24 w-3/4 rounded-2xl" />
						</div>
						{/* Another user message */}
						<div className="flex gap-4 justify-end">
							<Skeleton className="h-12 w-2/3 rounded-2xl" />
							<Skeleton className="h-8 w-8 rounded-full" />
						</div>
						{/* Another assistant message */}
						<div className="flex gap-4 justify-start">
							<Skeleton className="h-8 w-8 rounded-full" />
							<Skeleton className="h-32 w-3/4 rounded-2xl" />
						</div>
					</div>
				</div>
			</main>

			{/* Input Skeleton */}
			<footer className="border-t p-4">
				<div className="mx-auto max-w-2xl">
					<Skeleton className="h-14 w-full rounded-lg" />
				</div>
			</footer>
		</div>
	);
}
