'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import FilmInfiniteGrid from '../_component/FilmInfiniteGrid';
import { Tag } from 'lucide-react';
import { FilmFetchMode } from '../_hooks/useInfiniteFilms';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const [pageTitle, setPageTitle] = useState('');

    const currentFilters = useMemo(() => {
        const keyword =
            searchParams.get('keyword') || searchParams.get('q') || '';
        const category = searchParams.get('category') || undefined;
        const country = searchParams.get('country') || undefined;
        const year = searchParams.get('year') || undefined;
        const type = searchParams.get('type') || undefined;
        const sort_field = searchParams.get('sort_field') as any;
        const sort_type = searchParams.get('sort_type') as any;
        const sort_lang = searchParams.get('sort_lang') as any;

        return {
            keyword,
            category,
            country,
            year,
            type,
            sort_field,
            sort_type,
            sort_lang,
        };
    }, [searchParams]);

    const fetchMode = useMemo<FilmFetchMode>(
        () => ({
            mode: 'search',
            filters: currentFilters,
        }),
        [currentFilters],
    );

    const computedTitle = useMemo(() => {
        if (currentFilters.keyword)
            return `Kết quả tìm kiếm: "${currentFilters.keyword}"`;
        if (currentFilters.category)
            return `Thể loại: ${currentFilters.category}`;
        if (currentFilters.country)
            return `Quốc gia: ${currentFilters.country}`;
        if (pageTitle) return `Danh sách ${pageTitle}`;
        return 'Khám phá phim';
    }, [currentFilters, pageTitle]);

    return (
        <div className="max-w-screen-2xl mx-auto px-4">
            <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-400" />
                <h1 className="text-xl font-bold text-white tracking-wide">
                    {computedTitle}
                </h1>
            </div>

            <FilmInfiniteGrid
                key={JSON.stringify(currentFilters)}
                fetchMode={fetchMode}
                onTitleLoaded={setPageTitle}
            />
        </div>
    );
}
