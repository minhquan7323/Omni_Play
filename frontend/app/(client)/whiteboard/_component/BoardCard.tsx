'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Lock, Globe, KeyRound } from 'lucide-react';

interface BoardCardProps {
    board: any;
    onClick: (board: any, e: React.MouseEvent) => void;
}

// ─── Board Card ───────────────────────────────────────────────────────────────
export function BoardCard({ board, onClick }: BoardCardProps) {
    return (
        <Link
            href={`/whiteboard/${board.boardId}`}
            onClick={(e) => onClick(board, e)}
            className="group p-3 rounded-2xl border border-border/60 bg-card hover:border-primary transition-all cursor-pointer shadow-sm flex flex-col gap-3 relative overflow-hidden"
        >
            {board.thumbnailUrl && (
                <div className="relative w-full h-36 bg-muted/20 rounded-lg overflow-hidden border border-border/40">
                    <Image
                        src={board.thumbnailUrl}
                        alt={board.name}
                        fill
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </div>
            )}

            <div className="px-1 flex items-center justify-between">
                <div>
                    <h2 className="font-semibold text-sm text-foreground truncate max-w-[200px] group-hover:text-primary transition-colors">
                        {board.name}
                    </h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Created by:{' '}
                        <span className="font-medium text-foreground/80">{board.ownerName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-1.5">
                    {board.isPrivate ? (
                        <span title="Bảng riêng tư" className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
                            <Lock className="w-3.5 h-3.5" />
                        </span>
                    ) : (
                        <span title="Bảng công khai" className="p-1.5 bg-green-500/10 text-green-400 rounded-lg">
                            <Globe className="w-3.5 h-3.5" />
                        </span>
                    )}
                    {board.password && (
                        <span title="Yêu cầu mật khẩu" className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                            <KeyRound className="w-3.5 h-3.5" />
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
