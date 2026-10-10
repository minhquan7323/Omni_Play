import type { Metadata } from 'next';
import ClientProviders from './ClientProviders';
import Script from 'next/script';

export const metadata: Metadata = {
    title: 'OmniPlay',
    description: 'A multi-functional web platform integrating real-time collaboration tools, interactive WebGL gaming, and robust media management',
    icons: {
        icon: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body className="antialiased">
                <ClientProviders>{children}</ClientProviders>
                <Script
                    src="https://kit.fontawesome.com/032554e44a.js"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
