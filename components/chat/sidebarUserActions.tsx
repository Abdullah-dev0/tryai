"use client";

import { LogOut } from "lucide-react";
import { ApiKeyDialog } from "./apiKeyDialog";
import { signOutAction } from "@/app/actions/authActions";
import React from "react";

export function SidebarUserActions() {
	const [pending, startTransition] = React.useTransition();
	return (
		<div className="flex items-center gap-1">
			<ApiKeyDialog isLoading={pending} />
			<button disabled={pending} onClick={() => startTransition(signOutAction)} title="Sign out" className="cursor-pointer hover:opacity-80 p-2">
				<LogOut className="h-4 w-4" color="red" />
			</button>
		</div>
	);
}
