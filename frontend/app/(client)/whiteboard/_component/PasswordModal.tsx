'use client';

import { X, ShieldAlert } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { closeModal } from '@/store/slices/modal.slice';

interface PasswordModalProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    isPending: boolean;
}

// ─── Password Modal ───────────────────────────────────────────────────────────
export function PasswordModal({ value, onChange, onSubmit, isPending }: PasswordModalProps) {
    const dispatch = useDispatch();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between text-amber-500">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6" />
                        <h3 className="text-base font-bold">Bảng Yêu Cầu Mật Khẩu</h3>
                    </div>
                    <button
                        onClick={() => dispatch(closeModal())}
                        className="p-1 rounded-lg text-foreground hover:bg-muted"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <input
                    type="password"
                    placeholder="Nhập mật khẩu truy cập..."
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />

                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={() => dispatch(closeModal())}
                        className="px-4 py-2 text-xs font-semibold rounded-xl hover:bg-muted"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isPending}
                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isPending ? 'Đang xác nhận...' : 'Xác Nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
}
