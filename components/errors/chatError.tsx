"use client";

import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ChatError() {
	const router = useRouter();

	return (
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<header className="flex h-14 items-center justify-between border-b px-4">
				<h1 className="text-sm font-medium text-muted-foreground">Chat</h1>
			</header>

			{/* Error Content */}
			<main className="flex flex-1 items-center justify-center">
				<div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
					<AlertCircle className="h-12 w-12 text-destructive" />
					<div>
						<h2 className="text-lg font-semibold">Failed to load conversation</h2>
						<p className="text-sm text-muted-foreground mt-1">
							We couldn&apos;t load this conversation. It may have been deleted or there was a network error.
						</p>
					</div>
					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => router.refresh()}
							className="gap-2"
						>
							<RotateCcw className="h-4 w-4" />
							Retry
						</Button>
						<Button asChild>
							<Link href="/" className="gap-2">
								<Home className="h-4 w-4" />
								Go Home
							</Link>
						</Button>
					</div>
				</div>
			</main>

			{/* Empty Footer */}
			<footer className="border-t p-4">
				<div className="mx-auto max-w-2xl h-14" />
			</footer>
		</div>
	);
}
