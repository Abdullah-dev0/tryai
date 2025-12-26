"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { signOutAction } from "@/app/actions/authActions";
import { Button } from "@/components/ui/button";
import { FaGoogle, FaGithub } from "react-icons/fa";
import { useState } from "react";

export function SignInButtons() {
	const [isLoading, setIsLoading] = useState<"google" | "github" | null>(null);

	const handleSignIn = async (provider: "google" | "github") => {
		setIsLoading(provider);
		try {
			await signIn.social({ provider, callbackURL: "/" });
		} catch (error) {
			console.error("Sign in error:", error);
			setIsLoading(null);
		}
	};

	return (
		<div className="flex flex-col gap-6 py-7">
			<Button
				variant="outline"
				size="lg"
				className="w-full h-12 gap-3"
				onClick={() => handleSignIn("google")}
				disabled={isLoading !== null}>
				{isLoading === "google" ? (
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
				) : (
					<FaGoogle className="h-5 w-5" />
				)}
				<span className="font-medium">Continue with Google</span>
			</Button>

			<Button
				variant="outline"
				size="lg"
				className="w-full h-12 gap-3"
				onClick={() => handleSignIn("github")}
				disabled={isLoading !== null}>
				{isLoading === "github" ? (
					<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
				) : (
					<FaGithub className="h-5 w-5" />
				)}
				<span className="font-medium">Continue with GitHub</span>
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
			<span className="text-sm text-muted-foreground">{session.user.name ?? session.user.email}</span>
			<form action={signOutAction}>
				<Button type="submit" variant="outline" size="sm">
					Sign Out
				</Button>
			</form>
		</div>
	);
}
