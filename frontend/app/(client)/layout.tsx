import ClientLayout from '@/components/layout/client-layout';
import '../../index.css';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ClientLayout>{children}</ClientLayout>;
}
