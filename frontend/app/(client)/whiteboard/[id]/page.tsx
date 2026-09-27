'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const WhiteboardCanvas = dynamic(
    () =>
        import('@/app/(client)/whiteboard/[id]/_components/whiteboard-canvas'),
    { ssr: false },
);

const WhiteboardDetailPage = () => {
    const params = useParams();
    const boardId = params?.id as string;

    return <WhiteboardCanvas boardId={boardId} />;
};

export default WhiteboardDetailPage;
