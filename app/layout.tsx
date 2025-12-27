import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
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
			<body className={`${inter.variable} font-sans antialiased h-screen overflow-hidden`}>{children}</body>
		</html>
	);
}
