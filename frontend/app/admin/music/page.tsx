'use client';

import { formatTime } from '@/app/(client)/music/_utils/music.util';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import adminApi from '@/services/api/admin.api';
import { MusicService } from '@/services/music/music.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Album,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Disc3,
    FolderOpen,
    Link2,
    Mic2,
    Music,
    Music2,
    Pencil,
    Plus,
    Search,
    Trash2,
    Unlink,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { DynamicFormModal, FormField } from '../_components/dynamic.modal';
import { adminKeys } from '../_constants/admin.keys';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SearchableSelect({ label, value, onChange, placeholder, options = [], isMulti = false }: any) {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selectedIds = isMulti
        ? (value || '').split(',').map((s: string) => s.trim()).filter(Boolean)
        : [value].filter(Boolean);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleOption = (id: string) => {
        if (isMulti) {
            const next = selectedIds.includes(id)
                ? selectedIds.filter((x: string) => x !== id)
                : [...selectedIds, id];
            onChange(next.join(', '));
        } else {
            onChange(id);
            setIsOpen(false);
        }
    };

    const selectedLabels = options
        .filter((o: any) => selectedIds.includes(o.id))
        .map((o: any) => o.name || o.title)
        .join(', ');

    return (
        <div ref={ref} className="relative">
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <div
                className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm cursor-pointer min-h-[42px] flex items-center justify-between gap-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="truncate text-sm">{selectedLabels || <span className="text-muted-foreground">{placeholder}</span>}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl p-2 max-h-52 overflow-y-auto">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full px-3 py-2 mb-2 bg-muted/30 border border-border rounded-lg text-sm focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="space-y-0.5">
                        {options
                            .filter((opt: any) => (opt.name || opt.title || '').toLowerCase().includes(search.toLowerCase()))
                            .map((opt: any) => (
                                <div
                                    key={opt.id}
                                    onClick={() => toggleOption(opt.id)}
                                    className={`px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-muted/50 flex items-center gap-2 ${selectedIds.includes(opt.id) ? 'bg-primary/15 text-primary font-medium' : ''}`}
                                >
                                    {(opt.image || opt.thumbnailUrl) && (
                                        <img src={opt.image || opt.thumbnailUrl} className="w-6 h-6 rounded-md object-cover shrink-0" alt="" />
                                    )}
                                    <span className="truncate">{opt.name || opt.title}</span>
                                </div>
                            ))}
                        {options.filter((opt: any) => (opt.name || opt.title || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
                            <div className="text-center text-xs text-muted-foreground py-3">Không tìm thấy</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
                <p className="text-sm text-foreground mb-5">{message}</p>
                <div className="flex gap-2">
                    <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted/50">Hủy</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Xác nhận xóa</button>
                </div>
            </motion.div>
        </div>
    );
}

// ─── Artist List Sidebar ───────────────────────────────────────────────────────

function ArtistSidebar({
    selectedId,
    onSelect,
}: {
    selectedId: string | null;
    onSelect: (artist: any) => void;
}) {
    const { canAccess } = useAdminPermissions();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [modalData, setModalData] = useState<{ isEdit: boolean; data?: any } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<any>(null);

    const { data, isLoading } = useQuery({
        queryKey: adminKeys.adminArtists({ search, page }),
        queryFn: () => adminApi.getArtists({ search: search || undefined, page, limit: 20 }),
        select: (res: any) => res?.data ?? res,
    });

    const mutation = useMutation({
        mutationFn: (form: Record<string, any>) => {
            const formData = new FormData();
            formData.append('name', form.name);
            if (form.description) formData.append('description', form.description);
            if (form.imageFile instanceof File) formData.append('imageFile', form.imageFile);
            return modalData?.isEdit
                ? MusicService.updateArtist(modalData.data.id, formData)
                : MusicService.createArtist(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.adminArtists({ search, page }) });
            toast.success(modalData?.isEdit ? 'Đã cập nhật nghệ sĩ' : 'Đã thêm nghệ sĩ');
            setModalData(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi thực thi'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => MusicService.deleteArtist(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: adminKeys.adminArtists({ search, page }) });
            toast.success('Đã xóa nghệ sĩ');
            setConfirmDelete(null);
        },
        onError: (e: any) => {
            toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi xóa');
            setConfirmDelete(null);
        },
    });

    const artists: any[] = data?.data ?? [];
    const totalPages: number = data?.totalPages ?? 1;

    const artistFields: FormField[] = [
        { name: 'name', label: 'Tên nghệ sĩ', type: 'text' },
        { name: 'description', label: 'Tiểu sử / Mô tả', type: 'textarea', rows: 3 },
        { name: 'imageFile', label: modalData?.isEdit ? 'Ảnh mới (Tùy chọn)' : 'Ảnh nghệ sĩ', type: 'file', accept: 'image/*' },
    ];

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence>
                {modalData && (
                    <DynamicFormModal
                        title={modalData.isEdit ? 'Chỉnh sửa Nghệ sĩ' : 'Thêm Nghệ sĩ'}
                        fields={artistFields}
                        initialData={{
                            name: modalData.data?.name ?? '',
                            description: modalData.data?.description ?? '',
                            imageFile: modalData.data?.image ?? null,
                        }}
                        onSubmit={mutation.mutate}
                        onClose={() => setModalData(null)}
                        isPending={mutation.isPending}
                    />
                )}
                {confirmDelete && (
                    <ConfirmDialog
                        message={`Xóa nghệ sĩ "${confirmDelete.name}"? Hành động này không thể hoàn tác.`}
                        onConfirm={() => deleteMutation.mutate(confirmDelete.id)}
                        onCancel={() => setConfirmDelete(null)}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="p-4 border-b border-border space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <Mic2 className="w-4 h-4 text-primary" /> Nghệ sĩ
                    </h2>
                    {canAccess.musicArtistCreate && (
                        <button
                            onClick={() => setModalData({ isEdit: false })}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title="Thêm nghệ sĩ"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Tìm nghệ sĩ..."
                        className="w-full pl-8 pr-3 py-2 bg-muted/40 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading
                    ? Array(6).fill(0).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 border-b border-border/50">
                            <div className="w-10 h-10 rounded-full bg-muted/50 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-muted/50 rounded animate-pulse w-3/4" />
                                <div className="h-2.5 bg-muted/40 rounded animate-pulse w-1/2" />
                            </div>
                        </div>
                    ))
                    : artists.map((artist) => (
                        <div
                            key={artist.id}
                            onClick={() => onSelect(artist)}
                            className={`flex items-center gap-3 p-3 border-b border-border/50 cursor-pointer hover:bg-muted/20 transition-colors group ${selectedId === artist.id ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-muted/30 overflow-hidden shrink-0">
                                {artist.image
                                    ? <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center"><Mic2 className="w-4 h-4 text-muted-foreground" /></div>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${selectedId === artist.id ? 'text-primary' : 'text-foreground'}`}>
                                    {artist.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    {artist._count?.tracks ?? 0} tracks · {artist._count?.albums ?? 0} albums
                                </p>
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {canAccess.musicArtistUpdate && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setModalData({ isEdit: true, data: artist }); }}
                                        className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                )}
                                {canAccess.musicArtistDelete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setConfirmDelete(artist); }}
                                        className="p-1 rounded-md hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 py-2 border-t border-border shrink-0">
                    <span className="text-[11px] text-muted-foreground">{page}/{totalPages}</span>
                    <div className="flex gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1 rounded-md border border-border disabled:opacity-40 hover:bg-muted/50">
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1 rounded-md border border-border disabled:opacity-40 hover:bg-muted/50">
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Track Row ────────────────────────────────────────────────────────────────

function TrackRow({
    track,
    albums,
    artists,
    onEdit,
    onDelete,
    onAssignAlbum,
    onUnassignAlbum,
    canEdit,
    canDelete,
}: {
    track: any;
    albums: any[];
    artists: any[];
    onEdit: () => void;
    onDelete: () => void;
    onAssignAlbum: (albumId: string) => void;
    onUnassignAlbum: () => void;
    canEdit: boolean;
    canDelete: boolean;
}) {
    const [showAlbumPicker, setShowAlbumPicker] = useState(false);
    const [pickerAlbumId, setPickerAlbumId] = useState(track.albumId ?? '');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setShowAlbumPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="flex items-center gap-3 py-2.5 px-4 hover:bg-muted/10 rounded-xl group transition-colors">
            <div className="w-8 h-8 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                {track.thumbnailUrl
                    ? <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><Music className="w-3.5 h-3.5 text-muted-foreground" /></div>
                }
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">{formatTime(track.duration)}</span>
                    {track.album && (
                        <span className="text-[11px] text-primary/70 flex items-center gap-0.5">
                            <Disc3 className="w-2.5 h-2.5" /> {track.album.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Album assign picker */}
            <div ref={ref} className="relative">
                <button
                    onClick={() => setShowAlbumPicker(v => !v)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border"
                >
                    <Link2 className="w-3 h-3" />
                    {track.albumId ? 'Đổi album' : 'Gán album'}
                </button>
                {showAlbumPicker && (
                    <div className="absolute right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-xl p-2 w-52">
                        <p className="text-[11px] text-muted-foreground px-2 mb-2">Chọn album để gán</p>
                        {track.albumId && (
                            <div
                                onClick={() => { onUnassignAlbum(); setShowAlbumPicker(false); }}
                                className="px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-red-400/10 text-red-400 flex items-center gap-1.5 mb-1"
                            >
                                <Unlink className="w-3 h-3" /> Gỡ khỏi album
                            </div>
                        )}
                        <div className="space-y-0.5 max-h-40 overflow-y-auto">
                            {albums.map((album: any) => (
                                <div
                                    key={album.id}
                                    onClick={() => { onAssignAlbum(album.id); setShowAlbumPicker(false); }}
                                    className={`px-3 py-2 rounded-lg text-xs cursor-pointer hover:bg-muted/50 flex items-center gap-2 ${track.albumId === album.id ? 'bg-primary/15 text-primary font-medium' : ''}`}
                                >
                                    {album.image && <img src={album.image} className="w-5 h-5 rounded object-cover" alt="" />}
                                    <span className="truncate">{album.name}</span>
                                </div>
                            ))}
                            {albums.length === 0 && <div className="text-center text-xs text-muted-foreground py-2">Chưa có album</div>}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                {canEdit && (
                    <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                        <Pencil className="w-3 h-3" />
                    </button>
                )}
                {canDelete && (
                    <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Album Section ─────────────────────────────────────────────────────────────

function AlbumSection({
    album,
    tracks,
    allAlbums,
    allArtists,
    artistId,
    canEdit,
    canDelete,
    onEditAlbum,
    onDeleteAlbum,
    onEditTrack,
    onDeleteTrack,
    onAssignTrackAlbum,
}: {
    album: any;
    tracks: any[];
    allAlbums: any[];
    allArtists: any[];
    artistId: string;
    canEdit: boolean;
    canDelete: boolean;
    onEditAlbum: () => void;
    onDeleteAlbum: () => void;
    onEditTrack: (track: any) => void;
    onDeleteTrack: (track: any) => void;
    onAssignTrackAlbum: (trackId: string, albumId: string | null) => void;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Album Header */}
            <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="w-11 h-11 rounded-xl bg-muted/30 overflow-hidden shrink-0">
                    {album.image
                        ? <img src={album.image} alt={album.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Album className="w-4 h-4 text-muted-foreground" /></div>
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{album.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                        {tracks.length} bài hát
                        {album.releaseDate && ` · ${new Date(album.releaseDate).getFullYear()}`}
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {canEdit && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEditAlbum(); }}
                            className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {canDelete && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteAlbum(); }}
                            className="p-1.5 rounded-lg hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ml-1 ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Tracks in album */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border/50"
                    >
                        <div className="p-2">
                            {tracks.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">Chưa có bài hát trong album này</p>
                            ) : (
                                tracks.map((track: any) => (
                                    <TrackRow
                                        key={track.id}
                                        track={track}
                                        albums={allAlbums}
                                        artists={allArtists}
                                        onEdit={() => onEditTrack(track)}
                                        onDelete={() => onDeleteTrack(track)}
                                        onAssignAlbum={(albumId) => onAssignTrackAlbum(track.id, albumId)}
                                        onUnassignAlbum={() => onAssignTrackAlbum(track.id, null)}
                                        canEdit={canEdit}
                                        canDelete={canDelete}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Artist Detail Panel ───────────────────────────────────────────────────────

function ArtistDetailPanel({ artist, onClose }: { artist: any; onClose: () => void }) {
    const { canAccess } = useAdminPermissions();
    const queryClient = useQueryClient();

    // Modals
    const [trackModal, setTrackModal] = useState<{ isEdit: boolean; data?: any } | null>(null);
    const [albumModal, setAlbumModal] = useState<{ isEdit: boolean; data?: any } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ type: 'track' | 'album'; data: any } | null>(null);

    // Queries
    const { data: detailData, isLoading } = useQuery({
        queryKey: ['artist-detail-panel', artist.id],
        queryFn: () => MusicService.getArtistDetail(artist.id),
        select: (res: any) => res?.data,
        staleTime: 0,
    });

    const { data: albumsData } = useQuery({
        queryKey: ['artist-albums-panel', artist.id],
        queryFn: () => MusicService.getArtistAlbums(artist.id, { page: 1, limit: 100 }),
        select: (res: any) => res?.data,
        staleTime: 0,
    });

    const allArtistsQuery = useQuery({
        queryKey: adminKeys.adminArtists({ search: '', page: 1 }),
        queryFn: () => adminApi.getArtists({ page: 1, limit: 100 }),
        select: (res: any) => res?.data?.data ?? [],
    });

    const tracks: any[] = detailData?.tracks ?? [];
    const albums: any[] = albumsData?.albums ?? [];
    const allArtists: any[] = allArtistsQuery.data ?? [];

    // Group tracks by album
    const tracksInAlbum = (albumId: string) => tracks.filter((t: any) => t.albumId === albumId);
    const freeTracksForArtist = tracks.filter((t: any) => !t.albumId);

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['artist-detail-panel', artist.id] });
        queryClient.invalidateQueries({ queryKey: ['artist-albums-panel', artist.id] });
        queryClient.invalidateQueries({ queryKey: adminKeys.adminArtists({ search: '', page: 1 }) });
        queryClient.invalidateQueries({ queryKey: adminKeys.adminTracks({ search: '', page: 1 }) });
        queryClient.invalidateQueries({ queryKey: adminKeys.adminAlbums({ search: '', page: 1 }) });
    };

    // Track mutations
    const trackMutation = useMutation({
        mutationFn: (form: Record<string, any>) => {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('duration', form.duration);
            if (form.lyrics) formData.append('lyrics', form.lyrics);
            if (form.albumId) formData.append('albumId', form.albumId);
            if (form.audioFile instanceof File) formData.append('audioFile', form.audioFile);
            if (form.thumbnailFile instanceof File) formData.append('thumbnailFile', form.thumbnailFile);
            const ids = (form.artistIds || artist.id).split(',').map((s: string) => s.trim()).filter(Boolean);
            ids.forEach((id: string) => formData.append('artistIds[]', id));
            return trackModal?.isEdit
                ? MusicService.updateTrack(trackModal.data.id, formData)
                : MusicService.createTrack(formData);
        },
        onSuccess: () => {
            invalidateAll();
            toast.success(trackModal?.isEdit ? 'Đã cập nhật bài hát' : 'Đã thêm bài hát');
            setTrackModal(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi thực thi'),
    });

    const deleteTrackMutation = useMutation({
        mutationFn: (id: string) => MusicService.deleteTracks([id]),
        onSuccess: () => { invalidateAll(); toast.success('Đã xóa bài hát'); setConfirmDelete(null); },
        onError: (e: any) => { toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi xóa'); setConfirmDelete(null); },
    });

    // Album mutations
    const albumMutation = useMutation({
        mutationFn: (form: Record<string, any>) => {
            const formData = new FormData();
            formData.append('name', form.name);
            if (form.releaseDate) formData.append('releaseDate', new Date(form.releaseDate).toISOString());
            if (form.imageFile instanceof File) formData.append('imageFile', form.imageFile);
            // Always include the current artist
            const ids = form.artistIds
                ? form.artistIds.split(',').map((s: string) => s.trim()).filter(Boolean)
                : [artist.id];
            if (!ids.includes(artist.id)) ids.unshift(artist.id);
            ids.forEach((id: string) => formData.append('artistIds[]', id));
            return albumModal?.isEdit
                ? MusicService.updateAlbum(albumModal.data.id, formData)
                : MusicService.createAlbum(formData);
        },
        onSuccess: () => {
            invalidateAll();
            toast.success(albumModal?.isEdit ? 'Đã cập nhật album' : 'Đã thêm album');
            setAlbumModal(null);
        },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi thực thi'),
    });

    const deleteAlbumMutation = useMutation({
        mutationFn: (id: string) => MusicService.deleteAlbum(id),
        onSuccess: () => { invalidateAll(); toast.success('Đã xóa album'); setConfirmDelete(null); },
        onError: (e: any) => { toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi xóa'); setConfirmDelete(null); },
    });

    // Assign track to album
    const assignTrackMutation = useMutation({
        mutationFn: ({ trackId, albumId }: { trackId: string; albumId: string | null }) => {
            const track = tracks.find((t: any) => t.id === trackId);
            if (!track) throw new Error('Track not found');
            const formData = new FormData();
            formData.append('title', track.title);
            formData.append('duration', track.duration.toString());
            if (albumId) formData.append('albumId', albumId);
            // Preserve all artists
            (track.artists || []).forEach((a: any) => formData.append('artistIds[]', a.id));
            return MusicService.updateTrack(trackId, formData);
        },
        onSuccess: () => { invalidateAll(); toast.success('Đã cập nhật album của bài hát'); },
        onError: (e: any) => toast.error(e?.response?.data?.message ?? e.message ?? 'Lỗi cập nhật'),
    });

    // Form fields
    const trackFields: FormField[] = [
        { name: 'title', label: 'Tên bài hát', type: 'text' },
        {
            name: 'albumId', label: 'Album (Tùy chọn)', type: 'searchable-select',
            options: albums, isMulti: false, placeholder: 'Chọn album...'
        },
        {
            name: 'duration', label: 'Thời lượng', type: 'readonly',
            renderValue: (val) => val ? formatTime(Number(val)) : 'Chưa có file audio'
        },
        {
            name: 'artistIds', label: 'Nghệ sĩ tham gia', type: 'searchable-select',
            options: allArtists, isMulti: true, placeholder: 'Chọn nghệ sĩ...'
        },
        {
            name: 'lyrics', label: 'Lyrics (Định dạng LRC)', type: 'textarea', rows: 4,
            placeholder: '[00:12.00]Tâm hồn anh lúc đó nó thật đẹp\n[00:17.50]Anh vui cuộc đời anh...',
            helperText: 'Time-synced lyrics'
        },
        {
            name: 'audioFile',
            label: trackModal?.isEdit ? 'Audio mới (Tùy chọn)' : 'File Audio',
            type: 'file', accept: 'audio/*',
            onChangeSideEffect: (file: File | null, setForm) => {
                if (file) {
                    const audio = new Audio(URL.createObjectURL(file));
                    audio.onloadedmetadata = () => setForm({ duration: Math.floor(audio.duration).toString() });
                }
            }
        },
        { name: 'thumbnailFile', label: trackModal?.isEdit ? 'Thumbnail mới (Tùy chọn)' : 'Thumbnail', type: 'file', accept: 'image/*' },
    ];

    const albumFields: FormField[] = [
        { name: 'name', label: 'Tên album', type: 'text' },
        { name: 'releaseDate', label: 'Ngày phát hành', type: 'date' },
        {
            name: 'artistIds', label: 'Nghệ sĩ (đã gán mặc định)', type: 'searchable-select',
            options: allArtists, isMulti: true, placeholder: 'Thêm nghệ sĩ khác...'
        },
        { name: 'imageFile', label: albumModal?.isEdit ? 'Ảnh bìa mới (Tùy chọn)' : 'Ảnh bìa', type: 'file', accept: 'image/*' },
    ];

    return (
        <div className="flex flex-col h-full">
            <AnimatePresence>
                {trackModal && (
                    <DynamicFormModal
                        title={trackModal.isEdit ? 'Chỉnh sửa Bài hát' : `Thêm bài hát cho ${artist.name}`}
                        fields={trackFields}
                        initialData={{
                            title: trackModal.data?.title ?? '',
                            duration: trackModal.data?.duration?.toString() ?? '',
                            lyrics: typeof trackModal.data?.lyrics === 'object'
                                ? JSON.stringify(trackModal.data.lyrics, null, 2)
                                : (trackModal.data?.lyrics ?? ''),
                            albumId: trackModal.data?.albumId ?? '',
                            artistIds: trackModal.data?.artists?.map((a: any) => a.id).join(', ') ?? artist.id,
                            audioFile: trackModal.data?.audioUrl ?? null,
                            thumbnailFile: trackModal.data?.thumbnailUrl ?? null,
                        }}
                        onSubmit={trackMutation.mutate}
                        onClose={() => setTrackModal(null)}
                        isPending={trackMutation.isPending}
                    />
                )}
                {albumModal && (
                    <DynamicFormModal
                        title={albumModal.isEdit ? 'Chỉnh sửa Album' : `Tạo album cho ${artist.name}`}
                        fields={albumFields}
                        initialData={{
                            name: albumModal.data?.name ?? '',
                            releaseDate: albumModal.data?.releaseDate
                                ? new Date(albumModal.data.releaseDate).toISOString().split('T')[0]
                                : '',
                            artistIds: albumModal.data?.artists?.map((a: any) => a.id).join(', ') ?? artist.id,
                            imageFile: albumModal.data?.image ?? null,
                        }}
                        onSubmit={albumMutation.mutate}
                        onClose={() => setAlbumModal(null)}
                        isPending={albumMutation.isPending}
                    />
                )}
                {confirmDelete && (
                    <ConfirmDialog
                        message={
                            confirmDelete.type === 'track'
                                ? `Xóa bài hát "${confirmDelete.data.title}"?`
                                : `Xóa album "${confirmDelete.data.name}"? Các bài hát trong album sẽ không bị xóa.`
                        }
                        onConfirm={() =>
                            confirmDelete.type === 'track'
                                ? deleteTrackMutation.mutate(confirmDelete.data.id)
                                : deleteAlbumMutation.mutate(confirmDelete.data.id)
                        }
                        onCancel={() => setConfirmDelete(null)}
                    />
                )}
            </AnimatePresence>

            {/* Artist header */}
            <div className="p-5 border-b border-border shrink-0">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted/30 overflow-hidden shrink-0 ring-2 ring-primary/20">
                        {artist.image
                            ? <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Mic2 className="w-6 h-6 text-muted-foreground" /></div>
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-black text-foreground truncate">{artist.name}</h2>
                        {artist.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{artist.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{tracks.length}</span> bài hát
                            </span>
                            <span className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{albums.length}</span> albums
                            </span>
                            <span className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{(artist.followers ?? 0).toLocaleString()}</span> followers
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground shrink-0 lg:hidden">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                    {canAccess.musicAlbumCreate && (
                        <button
                            onClick={() => setAlbumModal({ isEdit: false })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/10 text-violet-400 rounded-xl text-xs font-semibold hover:bg-violet-500/20 transition-colors border border-violet-500/20"
                        >
                            <Disc3 className="w-3.5 h-3.5" /> Tạo album
                        </button>
                    )}
                    {canAccess.musicTrackCreate && (
                        <button
                            onClick={() => setTrackModal({ isEdit: false })}
                            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors border border-primary/20"
                        >
                            <Music2 className="w-3.5 h-3.5" /> Thêm bài hát
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array(3).fill(0).map((_, i) => (
                            <div key={i} className="h-24 bg-muted/30 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Albums section */}
                        {albums.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Disc3 className="w-4 h-4 text-violet-400" />
                                    <h3 className="text-sm font-bold text-foreground">Albums</h3>
                                    <span className="text-xs text-muted-foreground">({albums.length})</span>
                                </div>
                                {albums.map((album: any) => (
                                    <AlbumSection
                                        key={album.id}
                                        album={album}
                                        tracks={tracksInAlbum(album.id)}
                                        allAlbums={albums}
                                        allArtists={allArtists}
                                        artistId={artist.id}
                                        canEdit={canAccess.musicAlbumUpdate}
                                        canDelete={canAccess.musicAlbumDelete}
                                        onEditAlbum={() => setAlbumModal({ isEdit: true, data: album })}
                                        onDeleteAlbum={() => setConfirmDelete({ type: 'album', data: album })}
                                        onEditTrack={(track) => setTrackModal({ isEdit: true, data: track })}
                                        onDeleteTrack={(track) => setConfirmDelete({ type: 'track', data: track })}
                                        onAssignTrackAlbum={(trackId, albumId) => assignTrackMutation.mutate({ trackId, albumId })}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Free tracks (no album) */}
                        {freeTracksForArtist.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FolderOpen className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-sm font-bold text-foreground">Bài hát chưa có album</h3>
                                    <span className="text-xs text-muted-foreground">({freeTracksForArtist.length})</span>
                                </div>
                                <div className="bg-card border border-border rounded-2xl overflow-hidden p-2 space-y-0.5">
                                    {freeTracksForArtist.map((track: any) => (
                                        <TrackRow
                                            key={track.id}
                                            track={track}
                                            albums={albums}
                                            artists={allArtists}
                                            onEdit={() => setTrackModal({ isEdit: true, data: track })}
                                            onDelete={() => setConfirmDelete({ type: 'track', data: track })}
                                            onAssignAlbum={(albumId) => assignTrackMutation.mutate({ trackId: track.id, albumId })}
                                            onUnassignAlbum={() => assignTrackMutation.mutate({ trackId: track.id, albumId: null })}
                                            canEdit={canAccess.musicTrackUpdate}
                                            canDelete={canAccess.musicTrackDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty state */}
                        {tracks.length === 0 && albums.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                                    <Music className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-semibold text-foreground">Chưa có nội dung</p>
                                <p className="text-xs text-muted-foreground mt-1">Tạo album hoặc thêm bài hát cho nghệ sĩ này</p>
                                <div className="flex gap-2 mt-4">
                                    {canAccess.musicAlbumCreate && (
                                        <button
                                            onClick={() => setAlbumModal({ isEdit: false })}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-violet-500/10 text-violet-400 rounded-xl text-xs font-semibold hover:bg-violet-500/20 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Tạo album
                                        </button>
                                    )}
                                    {canAccess.musicTrackCreate && (
                                        <button
                                            onClick={() => setTrackModal({ isEdit: false })}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-semibold hover:bg-primary/20 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Thêm bài hát
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminMusicPage() {
    const [selectedArtist, setSelectedArtist] = useState<any>(null);

    const { data: stats } = useQuery({
        queryKey: ['admin-music-stats'],
        queryFn: () => adminApi.getMusicStats(),
        select: (res: any) => res?.data ?? res,
    });

    return (
        <div className="flex flex-col h-full space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-foreground">Music CMS</h1>
                <p className="text-muted-foreground text-sm mt-1">Quản lý nội dung âm nhạc theo nghệ sĩ</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                {[
                    { label: 'Bài hát', value: stats?.totalTracks ?? 0, icon: Music, color: 'text-blue-400 bg-blue-400/10' },
                    { label: 'Albums', value: stats?.totalAlbums ?? 0, icon: Disc3, color: 'text-violet-400 bg-violet-400/10' },
                    { label: 'Nghệ sĩ', value: stats?.totalArtists ?? 0, icon: Mic2, color: 'text-pink-400 bg-pink-400/10' },
                    { label: 'Mới tuần này', value: stats?.newTracksThisWeek ?? 0, icon: UserPlus, color: 'text-green-400 bg-green-400/10' },
                ].map((s) => (
                    <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                            <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-black text-foreground">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main 2-column layout */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
                {/* Sidebar */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
                    <ArtistSidebar
                        selectedId={selectedArtist?.id ?? null}
                        onSelect={setSelectedArtist}
                    />
                </div>

                {/* Detail panel */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
                    <AnimatePresence mode="wait">
                        {selectedArtist ? (
                            <motion.div
                                key={selectedArtist.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col h-full"
                            >
                                <ArtistDetailPanel
                                    artist={selectedArtist}
                                    onClose={() => setSelectedArtist(null)}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center p-8"
                            >
                                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-4">
                                    <Mic2 className="w-9 h-9 text-primary/60" />
                                </div>
                                <p className="font-bold text-foreground text-lg">Chọn một nghệ sĩ</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                                    Click vào nghệ sĩ ở danh sách bên trái để xem và quản lý album, bài hát của họ
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
