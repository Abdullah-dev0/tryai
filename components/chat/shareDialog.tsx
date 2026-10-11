"use client";

import * as React from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { setConversationPublic } from "@/app/actions/conversationActions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareDialogProps {
	id: string;
	initialIsPublic: boolean;
}

export function ShareDialog({ id, initialIsPublic }: ShareDialogProps) {
	const [isPublic, setIsPublic] = React.useState(initialIsPublic);
	const [copied, setCopied] = React.useState(false);
	const [pending, startTransition] = React.useTransition();
	const link = typeof window === "undefined" ? "" : `${window.location.origin}/share/${id}`;

	const updateSharing = (next: boolean) => {
		startTransition(async () => {
			try {
				await setConversationPublic(id, next);
				setIsPublic(next);
			} catch {
				toast.error("Could not update sharing");
			}
		});
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(link);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Could not copy to clipboard");
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground">
					<Share2 className="h-3.5 w-3.5" />
					{isPublic ? "Shared" : "Share"}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Link2 className="h-5 w-5" />
						Share conversation
					</DialogTitle>
					<DialogDescription>
						{isPublic
							? "Anyone with this link can read this conversation, including messages you add later."
							: "Create a public read-only link. Anyone with the link can read this conversation."}
					</DialogDescription>
				</DialogHeader>

				{isPublic && (
					<div className="flex items-center gap-2">
						<Input readOnly value={link} onFocus={(e) => e.target.select()} className="text-sm" />
						<Button type="button" variant="outline" size="icon" onClick={handleCopy} title="Copy link" className="shrink-0">
							{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
						</Button>
					</div>
				)}

				<DialogFooter>
					{isPublic ? (
						<Button type="button" variant="outline" disabled={pending} onClick={() => updateSharing(false)}>
							Stop sharing
						</Button>
					) : (
						<Button type="button" disabled={pending} onClick={() => updateSharing(true)}>
							Create public link
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
