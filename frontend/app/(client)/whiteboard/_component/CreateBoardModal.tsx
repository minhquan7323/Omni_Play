'use client';

import { X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { closeModal } from '@/store/slices/modal.slice';

interface BoardInfo {
    name: string;
    isPrivate: boolean;
    password: string;
}

interface CreateBoardModalProps {
    boardInfo: BoardInfo;
    onChange: (info: BoardInfo) => void;
    onSubmit: () => void;
    isPending: boolean;
}

// ─── Create Board Modal ───────────────────────────────────────────────────────
export function CreateBoardModal({ boardInfo, onChange, onSubmit, isPending }: CreateBoardModalProps) {
    const dispatch = useDispatch();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Tạo Whiteboard Mới</h3>
                    <button onClick={() => dispatch(closeModal())} className="p-1 rounded-lg hover:bg-muted">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Tên Bảng Vẽ</label>
                    <input
                        type="text"
                        placeholder="Nhập tên bảng vẽ (Ví dụ: Brainstorming Project...)"
                        value={boardInfo.name}
                        onChange={e => onChange({ ...boardInfo, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
                    <span className="text-sm font-medium">Chế độ Riêng tư (Private)</span>
                    <input
                        type="checkbox"
                        checked={boardInfo.isPrivate}
                        onChange={e => onChange({ ...boardInfo, isPrivate: e.target.checked })}
                        className="w-4 h-4 accent-primary cursor-pointer"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                        Mật khẩu bảo vệ (Tùy chọn)
                    </label>
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu nếu muốn..."
                        value={boardInfo.password}
                        onChange={e => onChange({ ...boardInfo, password: e.target.value })}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

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
                        {isPending ? 'Đang tạo...' : 'Tạo Ngay'}
                    </button>
                </div>
            </div>
        </div>
    );
}
