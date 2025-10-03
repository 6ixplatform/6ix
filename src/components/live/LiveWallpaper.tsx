'use client';
import React from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import MatrixRain from './MatrixRain';

export default function LiveWallpaper() {
    const { anim } = useTheme();

    return (
        <>
            {/* CSS/video backgrounds are toggled via data-anim in applyAnim().
Mount components here only for the ones that need DOM nodes. */}
            {anim === 'matrix' && <MatrixRain active />}
            {/* add other component-based anims here later */}
        </>
    );
}