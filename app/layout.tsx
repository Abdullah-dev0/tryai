import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
	variable: "--font-bricolage",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Mind - Modern AI Chat",
	description:
		"Mind is an intelligent AI chat application designed for seamless conversation, creative exploration, and efficient building. Experience the future of natural dialogue.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body
				className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} font-sans antialiased h-screen overflow-hidden`}>
				<Toaster />
				{children}
			</body>
		</html>
	);
}
