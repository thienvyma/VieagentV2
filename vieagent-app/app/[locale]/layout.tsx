import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Adjust path if needed, usually Next.js handles fonts globally? Fonts are imported from next/font/google
import "../globals.css"; // Relative path from [locale]/layout.tsx -> app/globals.css? No, it's ../globals.css
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/core/ui/sonner"
import { SiteHeader } from "@/components/site-header"
import { HeaderWrapper } from "@/components/header-wrapper"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "VieAgent V2 - AI Workforce",
    description: "Hire AI Employees, Don't Build Them.",
};

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Validate locale
    if (!['en', 'vi'].includes(locale)) {
        notFound();
    }

    // Provide messages
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <HeaderWrapper>
                            <SiteHeader />
                        </HeaderWrapper>
                        <div className="flex-1">
                            {children}
                        </div>
                        <Toaster />
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
