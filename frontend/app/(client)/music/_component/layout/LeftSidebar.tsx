import { Modal } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';
import { MUSIC_LEFT_SIDEBAR_CONFIG, SidebarId } from '@/constants/sidebar.constant';
import { useResizable } from '@/hooks/useResizable';
import { MusicService } from '@/services';
import { setWidth } from '@/store/slices/sidebar.slice';
import { addToast } from '@/store/slices/toast.slice';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Library, ListFilter, Loader2, PanelLeftClose, PanelLeftOpen, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { musicKeys } from '../../_constants/music.keys';
import { APP_ROUTES } from '../../../../../constants/routes.constant';
import { LIBRARY_ITEM_TYPE } from '../../_constants/types';
import { PlaylistCard } from '../cards/playlist.card';
import { PlaylistContextMenu, PlaylistContextMenuState } from '../ui/PlaylistContextMenu';
export function LeftSidebar() {
    const [isHovered, setIsHovered] = useState(false);

    const queryClient = useQueryClient();
    const dispatch = useDispatch();

    const sidebar = useSelector((state: any) => state.sidebar?.[SidebarId.MUSIC_LEFT]);
    const auth = useSelector((state: any) => state.auth);
    const { isResizing, startResizing } = useResizable({
        direction: 'right',
        min: MUSIC_LEFT_SIDEBAR_CONFIG.MIN_WIDTH,
        max: MUSIC_LEFT_SIDEBAR_CONFIG.MAX_WIDTH,
        currentSize: sidebar.width,
        onResize: (newWidth) => dispatch(setWidth({ id: SidebarId.MUSIC_LEFT, width: newWidth })),
    });

    const isCollapsed = sidebar.width <= MUSIC_LEFT_SIDEBAR_CONFIG.MIN_WIDTH;
    const currentWidth = isCollapsed ? MUSIC_LEFT_SIDEBAR_CONFIG.COLLAPSED_WIDTH : sidebar.width;

    const handleToggleCollapse = () => {
        dispatch(setWidth({ id: SidebarId.MUSIC_LEFT, width: isCollapsed ? MUSIC_LEFT_SIDEBAR_CONFIG.INIT_WIDTH : MUSIC_LEFT_SIDEBAR_CONFIG.COLLAPSED_WIDTH }));
    };

    const { data: userPlaylists, isLoading: isLoadingUserPlaylists } = useQuery({
        queryKey: musicKeys.userPlaylists(),
        queryFn: () => MusicService.getUserPlaylists(),
        enabled: auth.isAuthenticated,
    });

    const [contextMenu, setContextMenu] = useState<PlaylistContextMenuState | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPlaylist, setSelectedPlaylist] = useState<any>(null);

    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'recents' | 'alphabetical'>('recents');
    const [filterType, setFilterType] = useState<'all' | 'playlist' | 'album' | 'artist'>('all');

    const initFormData = {
        name: '',
        description: '',
        image: null,
    }

    const [formData, setFormData] = useState(initFormData);

    const handleContextMenu = (e: React.MouseEvent, item: any, type: LIBRARY_ITEM_TYPE) => {
        e.preventDefault();
        setContextMenu({
            playlist: item,
            x: e.clientX,
            y: e.clientY,
            type
        });
    };

    const handleMoreClick = (e: React.MouseEvent, item: any, type: LIBRARY_ITEM_TYPE) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            playlist: item,
            x: e.clientX,
            y: e.clientY,
            type
        });
    };

    const createPlaylistMutation = useMutation({
        mutationFn: (formData: FormData) => MusicService.createPlaylist(formData),
        onSuccess: (res: any) => {
            dispatch(addToast({ type: 'success', message: res?.message }));
            queryClient.invalidateQueries({ queryKey: musicKeys.userPlaylists() });
            setIsCreateModalOpen(false);
            setFormData({
                name: '',
                description: '',
                image: null,
            });
        },
        onError: (res) => {
            dispatch(addToast({ type: 'error', message: res?.message }));
        },
    });

    const updatePlaylistMutation = useMutation({
        mutationFn: ({ id, formData }: { id: string; formData: FormData }) => MusicService.updatePlaylist(id, formData),
        onSuccess: (res: any) => {
            dispatch(addToast({ type: 'success', message: res?.message }));
            queryClient.invalidateQueries({ queryKey: musicKeys.userPlaylists() });
            setIsEditModalOpen(false);
            setSelectedPlaylist(null);
            setFormData(initFormData);
        },
        onError: (res) => {
            dispatch(addToast({ type: 'error', message: res?.message }));
        },
    });

    const deletePlaylistMutation = useMutation({
        mutationFn: (id: string) => MusicService.deletePlaylist(id),
        onSuccess: (res: any) => {
            dispatch(addToast({ type: 'success', message: res?.message }));
            queryClient.invalidateQueries({ queryKey: musicKeys.userPlaylists() });
        },
        onError: (res) => {
            dispatch(addToast({ type: 'error', message: res?.message }));
        },
    });

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        if (formData.image) submitData.append('imageFile', formData.image);

        createPlaylistMutation.mutate(submitData);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPlaylist) return;

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('description', formData.description);
        if (formData.image) submitData.append('imageFile', formData.image);

        updatePlaylistMutation.mutate({ id: selectedPlaylist.id, formData: submitData });
    };

    const handleDeletePlaylist = (playlist: any) => {
        if (confirm(`Are you sure you want to delete ${playlist.name}?`)) {
            deletePlaylistMutation.mutate(playlist.id);
        }
    };

    const openEditModal = (playlist: any) => {
        setSelectedPlaylist(playlist);
        setFormData({
            name: playlist.name || '',
            description: playlist.description || '',
            image: null,
        });
        setIsEditModalOpen(true);
    };

    const isLoading = createPlaylistMutation.isPending || updatePlaylistMutation.isPending || deletePlaylistMutation.isPending;

    const displayedPlaylists = useMemo(() => {
        let items = userPlaylists?.data?.items || [];
        if (!items.length) return [];

        let result = [...items];

        if (filterType !== 'all') {
            result = result.filter((item: any) => {
                if (filterType === 'playlist') return item.type === 'CUSTOM' || item.type === 'FAVORITE_TRACK';
                if (filterType === 'album') return item.type === 'FAVORITE_ALBUM';
                if (filterType === 'artist') return item.type === 'FAVORITE_ARTIST';
                return true;
            });
        }

        if (searchQuery.trim()) {
            result = result.filter((item: any) => item.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (sortBy === 'alphabetical') {
            result.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'recents') {
            result.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [userPlaylists?.data?.items, searchQuery, sortBy, filterType]);

    return (
        <>
            <motion.aside
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                animate={{ width: currentWidth }}
                transition={
                    isResizing ? { duration: 0 } : { type: 'spring', bounce: 0, duration: 0.4 }
                }
                className="flex h-full flex-col gap-2 shrink-0 relative"
            >
                <div className="flex-1 bg-popover rounded-lg flex flex-col overflow-hidden">
                    <div className="flex flex-col mb-2 text-foreground/60 transition-colors">
                        <div className="flex-1 space-y-1 scrollbar-none p-1">
                            <div className="relative flex items-center w-full">
                                <button
                                    onClick={handleToggleCollapse}
                                    className={`flex items-center gap-3 ${isCollapsed ? 'p-[6px] m-[4px]' : 'm-[10px]'} rounded-md hover:bg-accent cursor-pointer transition-all overflow-hidden`}
                                >
                                    <div className="relative w-12 h-12 shrink-0 flex items-center justify-center text-foreground">
                                        <Library className={`absolute w-7 h-7 transition-all duration-200 ${isHovered ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
                                        <PanelLeftClose className={`absolute w-7 h-7 transition-all duration-200 ${isHovered && !isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                                        <PanelLeftOpen className={`absolute w-7 h-7 transition-all duration-200 ${isHovered && isCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                                    </div>

                                    <AnimatePresence>
                                        {!isCollapsed && (
                                            <motion.div
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                className="flex-1 pr-4 min-w-0 overflow-hidden whitespace-nowrap text-left font-medium"
                                            >
                                                Your Library
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>

                                <AnimatePresence>
                                    {!isCollapsed && auth.isAuthenticated && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            className="absolute right-2 shrink-0 flex items-center"
                                        >
                                            <button onClick={() => setIsCreateModalOpen(true)} className="hover:bg-accent p-2 rounded-full hover:text-foreground transition-all shrink-0">
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <AnimatePresence>
                            {isCollapsed && auth.isAuthenticated && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex justify-center py-1 w-full">
                                        <button onClick={() => setIsCreateModalOpen(true)} className="p-2 rounded-full hover:bg-accent hover:text-foreground hover:scale-105 transition-all">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="flex gap-2 px-4 py-1.5 mx-2 text-xs font-medium pb-2 overflow-x-auto scrollbar-none">
                                        <button
                                            onClick={() => setFilterType(filterType === 'playlist' ? 'all' : 'playlist')}
                                            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterType === 'playlist' ? 'bg-primary text-primary-foreground' : 'bg-accent/50 text-foreground hover:bg-accent'}`}
                                        >
                                            Playlists
                                        </button>
                                        <button
                                            onClick={() => setFilterType(filterType === 'album' ? 'all' : 'album')}
                                            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterType === 'album' ? 'bg-primary text-primary-foreground' : 'bg-accent/50 text-foreground hover:bg-accent'}`}
                                        >
                                            Albums
                                        </button>
                                        <button
                                            onClick={() => setFilterType(filterType === 'artist' ? 'all' : 'artist')}
                                            className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${filterType === 'artist' ? 'bg-primary text-primary-foreground' : 'bg-accent/50 text-foreground hover:bg-accent'}`}
                                        >
                                            Artists
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center px-4 py-1 text-xs text-foreground/60 w-full min-h-[36px]">
                                        {isSearching ? (
                                            <div className="flex items-center gap-2 bg-accent/50 rounded-md px-2 py-1.5 w-full relative">
                                                <Search className="w-4 h-4 shrink-0" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder="Search in Your Library"
                                                    className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-foreground/50 text-xs"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onBlur={() => { if (!searchQuery) setIsSearching(false); }}
                                                />
                                                {searchQuery && (
                                                    <button onMouseDown={(e) => { e.preventDefault(); setSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-foreground">
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setIsSearching(true)}
                                                    className="hover:bg-accent p-2 rounded-full hover:text-foreground transition-all shrink-0"
                                                >
                                                    <Search className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setSortBy(prev => prev === 'recents' ? 'alphabetical' : 'recents')}
                                                    className="flex items-center gap-1 hover:text-foreground transition-all shrink-0"
                                                >
                                                    <span>{sortBy === 'recents' ? 'Recents' : 'A-Z'}</span>
                                                    <ListFilter className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <div className={`pl-[10px] ${isCollapsed ? '' : 'pr-[10px]'} flex-1 overflow-y-auto space-y-2 mt-1 pb-2 custom-scrollbar`}>
                        {displayedPlaylists.length > 0 ? (
                            displayedPlaylists.map((item: any) => (
                                <Tooltip key={item.id} title={item.name} subtitle={item.description} disabled={!isCollapsed} position="right">
                                    <PlaylistCard
                                        item={item}
                                        isCollapsed={isCollapsed}
                                        onContextMenu={(e, item) => handleContextMenu(e, item, item.type)}
                                        onMoreClick={(e, item) => handleMoreClick(e, item, item.type)}
                                    />
                                </Tooltip>
                            ))
                        ) : (
                            !isCollapsed && (
                                <div className="flex flex-col items-center justify-center h-40 text-center px-4 text-foreground/60">
                                    <p className="text-sm font-medium">There's nothing here</p>
                                </div>
                            )
                        )}
                    </div>
                </div >

                <div
                    onMouseDown={startResizing}
                    onTouchStart={startResizing}
                    className={`absolute right-[-5.1px] top-1/2 -translate-y-1/2 w-1 h-[96%] rounded-full cursor-col-resize z-10 transition-colors ${isResizing ? 'bg-foreground/60' : 'hover:bg-foreground/80'}`}
                />
            </motion.aside >

            <PlaylistContextMenu
                contextMenu={contextMenu}
                onClose={() => setContextMenu(null)}
                onEdit={openEditModal}
                onDelete={handleDeletePlaylist}
            />

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Playlist"
            >
                <form onSubmit={handleCreateSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-secondary text-foreground p-2 rounded-md outline-none focus:ring-1 focus:ring-primary border border-transparent"
                            placeholder="My awesome playlist"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-secondary text-foreground p-2 rounded-md outline-none focus:ring-1 focus:ring-primary border border-transparent resize-none h-24"
                            placeholder="Add an optional description"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cover Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button disabled={createPlaylistMutation.isPending} type="submit" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {createPlaylistMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                            Create
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Playlist"
            >
                <form onSubmit={handleEditSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Name</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-secondary text-foreground p-2 rounded-md outline-none focus:ring-1 focus:ring-primary border border-transparent"
                            placeholder="My awesome playlist"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-secondary text-foreground p-2 rounded-md outline-none focus:ring-1 focus:ring-primary border border-transparent resize-none h-24"
                            placeholder="Add an optional description"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Cover Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            disabled={isLoading}
                            onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-4 py-2 rounded-md font-semibold hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Save
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}