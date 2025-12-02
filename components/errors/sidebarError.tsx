"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SidebarError() {
	const router = useRouter();

	return (
		<div className="hidden w-64 flex-col border-r bg-card md:flex">
			{/* Header */}
			<div className="flex h-14 items-center border-b px-4">
				<span className="font-semibold">TryAI</span>
			</div>

			{/* Error State */}
			<div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
				<AlertCircle className="h-8 w-8 text-destructive" />
				<div>
					<p className="text-sm font-medium">Failed to load conversations</p>
					<p className="text-xs text-muted-foreground mt-1">
						Something went wrong
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.refresh()}
					className="gap-2"
				>
					<RotateCcw className="h-3 w-3" />
					Retry
				</Button>
			</div>
		</div>
	);
}
