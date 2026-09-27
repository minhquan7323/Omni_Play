export interface SaveHistoryDto {
    externalFilmId: string;
    filmSlug?: string;
    filmTitle: string;
    posterUrl?: string;
    thumbUrl?: string;
    episodeSlug?: string;
    episodeTitle?: string;
    playbackPosition?: number;
    duration?: number;
    isCompleted?: boolean;
}
