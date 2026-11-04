'use client';

import { HEADER_HEIGHT } from '@/constants/layout.constant';
import { Unity, useUnityContext } from 'react-unity-webgl';

export default function HomePage() {
    const { unityProvider } = useUnityContext({
        loaderUrl: '/LiarsBar/LiarsBar.loader.js',
        dataUrl: '/LiarsBar/LiarsBar.data',
        frameworkUrl: '/LiarsBar/LiarsBar.framework.js',
        codeUrl: '/LiarsBar/LiarsBar.wasm',
    });
    return (
        <Unity
            unityProvider={unityProvider}
            className="w-screen h-screen"
            style={{ height: `calc(100vh - ${HEADER_HEIGHT + 8}px)` }} 
        />
    );
}
