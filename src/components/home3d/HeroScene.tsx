import React from 'react';
import FptPanoViewer from './FptPanoViewer';

interface HeroSceneProps {
  className?: string;
  style?: React.CSSProperties;
  onExploreExams?: () => void;
}

export default function HeroScene({ className, style, onExploreExams }: HeroSceneProps) {
  return (
    <FptPanoViewer
      className={className}
      style={style}
      onExploreExams={onExploreExams}
    />
  );
}
