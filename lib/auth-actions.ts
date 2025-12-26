"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current session in a server component or server action.
 * Returns null if no session exists.
 */
export async function getSession() {
	return await auth.api.getSession({
		headers: await headers(),
	});
}

/**
 * Get the current session or redirect to sign-in page.
 * Use this in protected pages/routes.
 */
export async function requireSession() {
	const session = await getSession();
	if (!session) {
		redirect("/sign-in");
	}
	return session;
}

/**
 * Sign out the current user and redirect to home.
 */
export async function signOutAction() {
	await auth.api.signOut({
		headers: await headers(),
	});
	redirect("/");
}
