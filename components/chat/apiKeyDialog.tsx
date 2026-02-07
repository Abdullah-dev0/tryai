"use client";

import * as React from "react";
import { Key, Eye, EyeOff, ExternalLink, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useApiKey } from "@/contexts/apiKeyContext";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function ApiKeyDialog({ isLoading }: { isLoading: boolean }) {
	const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();
	const [open, setOpen] = React.useState(false);
	const [inputValue, setInputValue] = React.useState("");
	const [showKey, setShowKey] = React.useState(false);

	React.useEffect(() => {
		if (open && apiKey) {
			setInputValue(apiKey);
		} else if (!open) {
			setInputValue("");
			setShowKey(false);
		}
	}, [open, apiKey]);

	const handleSave = () => {
		if (inputValue.trim()) {
			setApiKey(inputValue.trim());
			setOpen(false);
		}
	};

	const handleClear = () => {
		clearApiKey();
		setInputValue("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSave();
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					disabled={isLoading}
					variant="ghost"
					size="icon"
					className={cn(
						"h-8 w-8 transition-colors",
						hasApiKey ? "text-green-500 hover:text-green-600" : "text-muted-foreground hover:text-foreground",
					)}
					title={hasApiKey ? "API key configured" : "Set your API key"}>
					<Key className="h-4 w-4" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Key className="h-5 w-5" />
						OpenRouter API Key
					</DialogTitle>
					<DialogDescription>
						Bring your own API key to bypass rate limits. Your key is stored locally in your browser and never sent to
						our servers.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{hasApiKey && (
						<div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
							<Check className="h-4 w-4" />
							<span>API key is configured</span>
						</div>
					)}

					<div className="space-y-2">
						<label htmlFor="api-key" className="text-sm font-medium">
							API Key
						</label>
						<div className="relative mt-2">
							<Input
								id="api-key"
								type={showKey ? "text" : "password"}
								placeholder="sk-or-..."
								value={inputValue}
								onChange={(e) => setInputValue(e.target.value)}
								onKeyDown={handleKeyDown}
								className="pr-10"
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
								onClick={() => setShowKey(!showKey)}>
								{showKey ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</Button>
						</div>
					</div>

					<Link
						href="https://openrouter.ai/keys"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
						<ExternalLink className="h-3.5 w-3.5" />
						Get your API key from OpenRouter
					</Link>
				</div>

				<DialogFooter className="gap-5">
					{hasApiKey && (
						<Button type="button" variant="outline" onClick={handleClear} className="gap-1.5">
							<X className="h-4 w-4" />
							Clear Key
						</Button>
					)}
					<Button type="button" onClick={handleSave} disabled={!inputValue.trim()} className="gap-1.5">
						<Check className="h-4 w-4" />
						Save Key
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
