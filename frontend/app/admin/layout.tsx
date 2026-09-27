'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import '../../index.css';
import ToastContainer from '@/components/toast/toast-container';
import AdminSidebar from '@/components/layout/admin-sidebar';
import AdminHeader from '@/components/layout/admin-header';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const auth = useSelector((state: any) => state.auth);
    const { isAdminUser } = useAdminPermissions();

    useEffect(() => {
        if (!auth?.isAuthenticated) {
            router.replace('/');
        } else if (!isAdminUser) {
            router.replace('/');
        }
    }, [auth?.isAuthenticated, isAdminUser, router]);

    if (!auth?.isAuthenticated || !isAdminUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
                        <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-foreground font-semibold">Kiểm tra quyền truy cập...</p>
                    <p className="text-muted-foreground text-sm">Bạn đang được chuyển hướng</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <ToastContainer />
            <AdminSidebar />
            <div className="flex-1 flex flex-col min-w-0 ml-[240px]">
                <AdminHeader />
                <main className="flex-1 p-6 mt-14 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
