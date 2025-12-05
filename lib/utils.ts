import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// Helper to strip markdown formatting for clean display
export function stripMarkdown(text: string): string {
	return text
		.replace(/[#*_`~>[\]()]/g, "") // Remove markdown symbols
		.replace(/\n+/g, " ") // Replace newlines with space
		.replace(/\s+/g, " ") // Collapse multiple spaces
		.trim();
}

// Generic type for items with date fields
interface DateGroupable {
	updatedAt: Date;
}

// Helper to group items by date
export function groupByDate<T extends DateGroupable>(items: T[]) {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
	const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

	const groups: { label: string; items: T[] }[] = [
		{ label: "Today", items: [] },
		{ label: "Yesterday", items: [] },
		{ label: "Previous 7 Days", items: [] },
		{ label: "Older", items: [] },
	];

	items.forEach((item) => {
		const date = new Date(item.updatedAt);
		if (date >= today) {
			groups[0].items.push(item);
		} else if (date >= yesterday) {
			groups[1].items.push(item);
		} else if (date >= lastWeek) {
			groups[2].items.push(item);
		} else {
			groups[3].items.push(item);
		}
	});

	return groups.filter((g) => g.items.length > 0);
}
