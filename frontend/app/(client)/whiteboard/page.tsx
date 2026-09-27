'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Plus } from 'lucide-react';
import { Whiteboard } from '@/services';
import { ModalEnum, openModal, closeModal } from '@/store/slices/modal.slice';
import { BoardCard } from './_component/BoardCard';
import { CreateBoardModal } from './_component/CreateBoardModal';
import { PasswordModal } from './_component/PasswordModal';

// ─── Initial board form state ─────────────────────────────────────────────────
const INIT_BOARD = { name: '', isPrivate: false, password: '' };

// ─── Whiteboard List Page ─────────────────────────────────────────────────────
export default function WhiteboardPage() {
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const router = useRouter();

    const modal = useSelector((state: any) => state.modal);
    const isCreateModalOpen = modal.activeModal === ModalEnum.WHITEBOARD_CREATE;
    const isPasswordModalOpen = modal.activeModal === ModalEnum.WHITEBOARD_PASSWORD;

    const [selectedBoardId, setSelectedBoardId] = useState('');
    const [passwordInput, setPasswordInput] = useState('');
    const [boardInfo, setBoardInfo] = useState(INIT_BOARD);

    const { data: boards, isLoading } = useQuery({
        queryKey: ['boards'],
        queryFn: Whiteboard.findAll,
    });

    const createBoardMutation = useMutation({
        mutationFn: async () => {
            const res = await Whiteboard.create({
                name: boardInfo.name,
                isPrivate: boardInfo.isPrivate,
                password: boardInfo.password,
            });
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            router.push(`/whiteboard/${data.boardId}`);
            dispatch(closeModal());
            setBoardInfo(INIT_BOARD);
        },
    });

    const verifyPasswordMutation = useMutation({
        mutationFn: async () => {
            await Whiteboard.verifyPassword(selectedBoardId, passwordInput);
        },
        onSuccess: () => {
            dispatch(closeModal());
            setPasswordInput('');
            router.push(`/whiteboard/${selectedBoardId}`);
        },
    });

    const handleBoardClick = (board: any, e: React.MouseEvent) => {
        if (board.password) {
            e.preventDefault();
            setSelectedBoardId(board.boardId);
            dispatch(openModal({ type: ModalEnum.WHITEBOARD_PASSWORD }));
        }
    };

    const handleOpenCreateModal = () => {
        dispatch(openModal({ type: ModalEnum.WHITEBOARD_CREATE }));
        setBoardInfo(INIT_BOARD);
    };

    if (isLoading) {
        return <div className="p-6 text-sm">Đang tải danh sách bảng...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Danh sách Whiteboard</h1>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold text-xs rounded-xl shadow-md hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Tạo Bảng Vẽ Mới
                </button>
            </div>

            {/* Board grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {boards?.data?.map((board: any) => (
                    <BoardCard key={board.boardId} board={board} onClick={handleBoardClick} />
                ))}
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateBoardModal
                    boardInfo={boardInfo}
                    onChange={setBoardInfo}
                    onSubmit={() => createBoardMutation.mutate()}
                    isPending={createBoardMutation.isPending}
                />
            )}
            {isPasswordModalOpen && (
                <PasswordModal
                    value={passwordInput}
                    onChange={setPasswordInput}
                    onSubmit={() => verifyPasswordMutation.mutate()}
                    isPending={verifyPasswordMutation.isPending}
                />
            )}
        </div>
    );
}
