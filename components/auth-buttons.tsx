"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { signOutAction } from "@/app/actions/authActions";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaGithub } from "react-icons/fa";

export function SignInButtons() {
	return (
		<div className="flex flex-col gap-3">
			<Button
				variant="outline"
				className="gap-2"
				onClick={() => signIn.social({ provider: "google", callbackURL: "/" })}>
				<FaGoogle className="h-4 w-4" />
				Continue with Google
			</Button>
			<Button
				variant="outline"
				className="gap-2"
				onClick={() => signIn.social({ provider: "github", callbackURL: "/" })}>
				<FaGithub className="h-4 w-4" />
				Continue with GitHub
			</Button>
		</div>
	);
}

export function UserMenu() {
	const { data: session, isPending } = useSession();

	if (isPending) {
		return <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />;
	}

	if (!session) {
		return <SignInButtons />;
	}

	return (
		<div className="flex items-center gap-3">
			<span className="text-sm text-muted-foreground">{session.user.name || session.user.email}</span>
			<form action={signOutAction}>
				<Button type="submit" variant="outline" size="sm">
					Sign Out
				</Button>
			</form>
		</div>
	);
}
