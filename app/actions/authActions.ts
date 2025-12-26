"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server actions for authentication mutations.
 * For read-only session data, use lib/data/auth.ts
 */

/**
 * Sign out the current user and redirect to home.
 */
export async function signOutAction() {
	await auth.api.signOut({
		headers: await headers(),
	});
	redirect("/");
}
