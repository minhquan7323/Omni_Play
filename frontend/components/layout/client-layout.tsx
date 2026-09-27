'use client';

import {
    HEADER_HEIGHT
} from '../../constants/layout.constant';
import AuthModal from '../auth/AuthModal';
import Header from './header';
import Sidebar from './sidebar';

import { MAIN_SIDEBAR_CONFIG, SidebarId } from '@/constants/sidebar.constant';
import { useSelector } from 'react-redux';
import ToastContainer from '../toast/toast-container';

// import { useEffect, useState } from 'react';
// import { useSelector } from 'react-redux';
// import { usePathname, useRouter } from 'next/navigation';
// import Image from 'next/image';
// import Swal from "sweetalert2";

// import Loader from "../Loader/Loader";
// import SomethingWentWrong from "../SomethingWentWrong/SomethingWentWrong";

// import { loadSystemSettings } from "@/store/reducer/settingsSlice";
// import { loadCategories } from "@/store/reducer/momentSlice";
// import { protectedRoutes } from "@/routes/routes";
// import { translate } from "@/utils";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const sidebar = useSelector((state: any) => state.sidebar?.[SidebarId.MAIN]);

    const paddingLeftValue = sidebar.isPinned
        ? `${sidebar.width}px`
        : `${MAIN_SIDEBAR_CONFIG.COLLAPSED_WIDTH}px`;

    // const router = useRouter();
    // const pathname = usePathname();

    // const isLoggedIn = useSelector((state: any) => state.User_signup);
    // const userCurrentId = isLoggedIn?.data?.data?.id ?? null;

    // const [isLoading, setIsLoading] = useState(true);
    // const [hasError, setHasError] = useState(false);
    // const [settings, setSettings] = useState<any>(null);

    // 1. Tải Cấu hình Hệ thống & CSS Variables
    // useEffect(() => {
    //     loadSystemSettings({
    //         onSuccess: (res: any) => {
    //             const data = res?.data;
    //             setSettings(data);
    //             setIsLoading(false);

    //             if (data) {
    //                 const rootStyle = document.documentElement.style;
    //                 rootStyle.setProperty('--primary-color', data.system_color);
    //                 rootStyle.setProperty(
    //                     '--primary-category-background',
    //                     data.category_background,
    //                 );
    //                 rootStyle.setProperty(
    //                     '--primary-sell',
    //                     data.sell_web_color,
    //                 );
    //                 rootStyle.setProperty(
    //                     '--primary-rent',
    //                     data.rent_web_color,
    //                 );
    //                 rootStyle.setProperty(
    //                     '--primary-sell-bg',
    //                     data.sell_web_background_color,
    //                 );
    //                 rootStyle.setProperty(
    //                     '--primary-rent-bg',
    //                     data.rent_web_background_color,
    //                 );
    //             }
    //         },
    //         onError: (err: any) => {
    //             console.error('Lỗi hệ thống:', err);
    //             setIsLoading(false);
    //             setHasError(true);
    //         },
    //     });

    //     loadCategories();
    // }, [isLoggedIn]);

    // 2. Xử lý Bảo vệ Route (Auth Check)
    // useEffect(() => {
    //     const isProtectedRoute = protectedRoutes.includes(pathname);

    //     if (isProtectedRoute && !userCurrentId) {
    //         Swal.fire({
    //             icon: 'error',
    //             title: translate('opps'),
    //             text: translate('youHaveToLoginFirst'),
    //             allowOutsideClick: false,
    //             customClass: { confirmButton: 'Swal-confirm-buttons' },
    //         }).then((result) => {
    //             if (result.isConfirmed) {
    //                 router.push('/');
    //             }
    //         });
    //     }

    //     if (!userCurrentId && pathname === '/user-register') {
    //         router.push('/');
    //     }
    // }, [pathname, userCurrentId, router]);

    // --- RENDER CASES ---

    // Trạng thái 1: Đang tải dữ liệu ban đầu
    // if (isLoading) {
    //     return <Loader />;
    // }

    // Trạng thái 2: Lỗi hệ thống khi fetch settings
    // if (hasError) {
    //     return (
    //         <div className="min-h-screen flex items-center justify-center bg-slate-50">
    //             <SomethingWentWrong />
    //         </div>
    //     );
    // }

    // Trạng thái 3: Trang web đang bảo trì
    // if (settings?.web_maintenance_mode === '1') {
    //     return (
    //         <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
    //             <Image
    //                 src={underMaintainImg}
    //                 alt="Bảo trì hệ thống"
    //                 width={400}
    //                 height={400}
    //                 className="max-w-full h-auto mb-6"
    //                 priority
    //             />
    //             <h3 className="text-2xl font-bold text-slate-800 mb-2">
    //                 {translate('underMaintance')}
    //             </h3>
    //             <p className="text-slate-600">{translate('pleaseTryagain')}</p>
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <ToastContainer />
            <Sidebar />
            <div
                style={{ paddingLeft: paddingLeftValue }}
                className="flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-in-out"
            >
                <div className="sticky top-0 z-40 w-full">
                    <Header />
                </div>

                <main
                    style={{ paddingTop: `${HEADER_HEIGHT}px` }}
                    className="flex-1"
                >
                    <div className="mx-auto">{children}</div>
                </main>
                {/* <Footer /> */}
            </div>
            <AuthModal />
        </div>
    );
}
