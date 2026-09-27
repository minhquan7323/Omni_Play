'use client';

import { HEADER_HEIGHT } from '@/constants/layout.constant';
import { BoardRole } from '@/services/whiteboard/whiteboard.constant';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import {
    createTLStore,
    defaultShapeUtils,
    Editor,
    Tldraw,
    TLUiComponents,
} from 'tldraw';
import 'tldraw/tldraw.css';
import BoardShareModal from './board-share-modal';
import { WhiteboardHeader } from './whiteboard-header';
import { MAIN_SIDEBAR_CONFIG } from '@/constants/sidebar.constant';

interface ActiveUser {
    userId: string;
    fullName?: string;
    role: string;
    socketId: string;
}

interface WhiteboardCanvasProps {
    boardId: string;
    boardName?: string;
}

const WhiteboardCanvas = ({ boardId, boardName }: WhiteboardCanvasProps) => {
    const auth = useSelector((state: any) => state.auth);
    const sidebar = useSelector((state: any) => state.sidebar);

    const editorRef = useRef<Editor | null>(null);
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
    const [myRole, setMyRole] = useState<string>(BoardRole.VIEWER);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    const [store] = useState(() =>
        createTLStore({ shapeUtils: defaultShapeUtils }),
    );
    const sidebarWidth = sidebar.isPinned ? sidebar.width : MAIN_SIDEBAR_CONFIG.COLLAPSED_WIDTH;

    const uploadThumbnail = useCallback(
        async (editor: Editor) => {
            if (myRole === BoardRole.VIEWER) return;

            const shapeIds = Array.from(editor.getCurrentPageShapeIds());
            if (shapeIds.length === 0) return;

            try {
                const result = await editor.toImage(shapeIds, {
                    format: 'png',
                    scale: 0.5,
                    background: true,
                });

                if (!result || !result.blob) return;

                const formData = new FormData();
                formData.append(
                    'file',
                    result.blob,
                    `thumbnail_${boardId}.png`,
                );

                await axios.patch(
                    `http://localhost:3001/api/whiteboards/${boardId}/thumbnail`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${auth.accessToken}`,
                            'Content-Type': 'multipart/form-data',
                        },
                    },
                );
            } catch (error) {
                console.error('Lỗi khi tự động upload thumbnail:', error);
            }
        },
        [boardId, auth.accessToken, myRole],
    );

    const customComponents = useMemo<Partial<TLUiComponents>>(() => {
        if (myRole === BoardRole.VIEWER) {
            return {
                Toolbar: null,
                StylePanel: null,
                ContextMenu: null,
                PageMenu: null,
            };
        }
        return {};
    }, [myRole]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        if (myRole === BoardRole.VIEWER) {
            editor.updateInstanceState({ isReadonly: true });
            editor.setCurrentTool('hand');
            editor.selectNone();

            const cleanup = editor.sideEffects.registerAfterChangeHandler(
                'instance_page_state',
                () => {
                    if (editor.getSelectedShapeIds().length > 0) {
                        editor.selectNone();
                    }
                },
            );
            return () => cleanup();
        } else {
            editor.updateInstanceState({ isReadonly: false });
            editor.setCurrentTool('select');
        }
    }, [myRole]);

    useEffect(() => {
        if (!boardId || !auth?.accessToken) return;

        const socket: Socket = io('http://localhost:3001/whiteboard', {
            query: { boardId, token: auth.accessToken },
        });

        socket.on('init-board', ({ records, role }) => {
            setMyRole(role);
            if (records && Object.keys(records).length > 0) {
                store.put(Object.values(records));
            }
        });

        socket.on('presence-update', (users: ActiveUser[]) => {
            setActiveUsers(users);
        });

        socket.on('role-changed', ({ newRole }) => {
            setMyRole(newRole);
        });

        socket.on('kicked', ({ reason }) => {
            alert(`Bạn đã bị mời ra khỏi phòng: ${reason}`);
            window.location.href = '/whiteboard';
        });

        socket.on('changes-updated', ({ changes }) => {
            store.mergeRemoteChanges(() => {
                if (changes.added) store.put(Object.values(changes.added));
                if (changes.updated) {
                    Object.values(changes.updated).forEach(([, next]: any) =>
                        store.put([next]),
                    );
                }
            });
        });

        let timeoutId: NodeJS.Timeout;

        const cleanup = store.listen(
            ({ changes }) => {
                if (myRole !== BoardRole.VIEWER) {
                    socket.emit('update-changes', { changes });

                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        if (editorRef.current) {
                            uploadThumbnail(editorRef.current);
                        }
                    }, 3000);
                }
            },
            { source: 'user', scope: 'document' },
        );

        return () => {
            clearTimeout(timeoutId);
            cleanup();
            socket.disconnect();
        };
    }, [store, boardId, auth?.accessToken, myRole, uploadThumbnail]);

    return (
        <motion.div
            initial={false}
            animate={{ left: sidebarWidth }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed',
                top: `${HEADER_HEIGHT}px`,
                right: 0,
                bottom: 0,
                zIndex: 10,
            }}
            className="flex flex-col overflow-hidden border-t border-l border-border/40 relative"
        >
            <WhiteboardHeader
                boardName={boardName}
                activeUsers={activeUsers}
                myRole={myRole}
                onOpenShareModal={() => setIsShareModalOpen(true)}
            />

            <div className="flex-1 w-full h-full relative overflow-hidden">
                <Tldraw
                    store={store}
                    components={customComponents}
                    onMount={(editor) => {
                        editorRef.current = editor;
                        if (myRole === BoardRole.VIEWER) {
                            editor.updateInstanceState({ isReadonly: true });
                            editor.setCurrentTool('hand');
                            editor.selectNone();
                        }
                    }}
                />
            </div>

            <BoardShareModal
                boardId={boardId}
                currentUserRole={myRole}
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
            />
        </motion.div>
    );
};

export default WhiteboardCanvas;
