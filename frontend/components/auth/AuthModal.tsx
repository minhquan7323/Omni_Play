'use client';

import { AuthService } from '@/services';
import { setCredentials } from '@/store/slices/auth.slice';
import { closeModal, ModalEnum } from '@/store/slices/modal.slice';
import { addToast } from '@/store/slices/toast.slice';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlidingPillNav, { NavItem } from '../ui/SlidingPillNav';

const NAV_ITEMS: NavItem[] = [
    { id: 'login', label: 'Đăng nhập' },
    { id: 'register', label: 'Đăng ký' },
];

const AuthModal = () => {
    const dispatch = useDispatch();
    const modal = useSelector((state: any) => state.modal);

    const [activeTab, setActiveTab] = useState('login');

    const isOpen = modal.activeModal === ModalEnum.AUTH;

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        passwordConfirm: '',
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') dispatch(closeModal());
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, dispatch]);

    const handleClose = () => {
        setErrorMsg('');
        dispatch(closeModal());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const loginMutation = useMutation({
        mutationFn: () =>
            AuthService.login({
                email: formData.email,
                password: formData.password,
            }),
        onSuccess: (response: any) => {
            dispatch(
                setCredentials({
                    accessToken: response.data.accessToken,
                    user: response.data.user,
                }),
            );
            dispatch(
                addToast({
                    type: 'success',
                    message: response.message,
                }),
            );
            handleClose();
        },
        onError: (err: any) => {
            dispatch(
                addToast({
                    type: 'error',
                    message: err?.message,
                }),
            );
        },
    });

    const registerMutation = useMutation({
        mutationFn: () => AuthService.register(formData),
        onSuccess: (response: any) => {
            dispatch(
                setCredentials({
                    accessToken: response.accessToken,
                    user: response.user,
                }),
            );
            dispatch(
                addToast({
                    type: 'success',
                    message: response?.message || 'Đăng ký thành công!',
                }),
            );
            handleClose();
        },
        onError: (err: any) => setErrorMsg(err?.message),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (activeTab === 'login') {
            loginMutation.mutate();
        } else {
            if (formData.password !== formData.passwordConfirm) {
                setErrorMsg('Mật khẩu xác nhận không trùng khớp!');
                return;
            }
            registerMutation.mutate();
        }
    };

    const isLoading = loginMutation.isPending || registerMutation.isPending;

    if (typeof window === 'undefined') return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-background/60 backdrop-blur-md"
                    />

                    <div className="min-h-full flex items-center justify-center p-4 sm:p-6 text-center">
                        {/* MODAL CARD */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0, y: -16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0, y: -16 }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 300,
                                mass: 0.8,
                            }}
                            style={{
                                transformOrigin: 'center center',
                            }}
                            className="relative w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/60 rounded-3xl p-6 sm:p-8 z-10 text-left shadow-2xl my-8 overflow-hidden"
                        >
                            {/* CLOSE BUTTON */}
                            <button
                                type="button"
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* HEADER TITLE */}
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold tracking-tight text-foreground">
                                    {activeTab === 'login'
                                        ? 'Chào mừng quay trở lại!'
                                        : 'Tạo tài khoản mới'}
                                </h2>
                            </div>

                            {/* TABS SLIDING PILL */}
                            <div className="rounded-xl mb-6">
                                <SlidingPillNav
                                    layoutId="auth-sliding-pill"
                                    items={NAV_ITEMS}
                                    activeId={activeTab}
                                    center={true}
                                    onSelect={setActiveTab}
                                    orientation="horizontal"
                                    className="p-1 bg-muted/20 rounded-xl"
                                    itemClassName="px-4 py-1.5"
                                    pillClassName="bg-primary text-primary-foreground rounded-xl"
                                    activePillClassName="bg-primary/20 rounded-xl"
                                />
                            </div>

                            {errorMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium"
                                >
                                    {errorMsg}
                                </motion.div>
                            )}

                            {/* FORM CONTENT ANIMATION */}
                            <AnimatePresence mode="wait">
                                <motion.form
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.15 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-3.5"
                                >
                                    {activeTab === 'register' && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-muted-foreground">
                                                Họ và tên
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    required
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    placeholder="Nguyễn Văn A"
                                                    className="w-full pl-9 pr-4 py-2.5 bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* EMAIL */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-medium text-muted-foreground">
                                            Địa chỉ Email
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="name@example.com"
                                                className="w-full pl-9 pr-4 py-2.5 bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* PASSWORD */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-medium text-muted-foreground">
                                                Mật khẩu
                                            </label>
                                            {activeTab === 'login' && (
                                                <button
                                                    type="button"
                                                    className="text-[10px] font-medium text-primary hover:underline"
                                                >
                                                    Quên mật khẩu?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                name="password"
                                                required
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="••••••••"
                                                className="w-full pl-9 pr-10 py-2.5 bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {activeTab === 'register' && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-medium text-muted-foreground">
                                                Xác nhận mật khẩu
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type={
                                                        showConfirmPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    name="passwordConfirm"
                                                    required
                                                    value={
                                                        formData.passwordConfirm
                                                    }
                                                    onChange={handleInputChange}
                                                    placeholder="••••••••"
                                                    className="w-full pl-9 pr-10 py-2.5 bg-muted/20 border border-border/60 rounded-xl text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowConfirmPassword(
                                                            !showConfirmPassword,
                                                        )
                                                    }
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="w-4 h-4" />
                                                    ) : (
                                                        <Eye className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* SUBMIT BUTTON */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 py-3 px-4 bg-primary text-primary-foreground font-semibold text-xs rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        {isLoading ? (
                                            <span>Đang xử lý...</span>
                                        ) : (
                                            <>
                                                <span>
                                                    {activeTab === 'login'
                                                        ? 'Đăng nhập'
                                                        : 'Tạo tài khoản'}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
