import React from 'react';

/**
 * Skeleton component to show a pulsing placeholder during loading states.
 * Premium "shimmer" effect defined in index.css.
 */
const Skeleton = ({ className = '', height = '1rem', width = '100%', borderRadius = '0.5rem' }) => {
  return (
    <div 
      className={`shimmer-effect bg-slate-200 ${className}`}
      style={{ 
        height, 
        width, 
        borderRadius,
        display: 'inline-block' 
      }}
    />
  );
};

export const CardSkeleton = () => (
  <div className="p-6 bg-white rounded-3xl border border-slate-100 flex flex-col gap-4 w-full">
    <div className="flex items-center gap-4">
      <Skeleton width="48px" height="48px" borderRadius="12px" />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton width="40%" height="0.75rem" />
        <Skeleton width="20%" height="0.5rem" />
      </div>
    </div>
    <div className="flex flex-col gap-2 mt-2">
      <Skeleton width="90%" height="0.5rem" />
      <Skeleton width="100%" height="0.5rem" />
      <Skeleton width="80%" height="0.5rem" />
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 py-4 px-6 border-b border-slate-50 w-full">
    <Skeleton width="40px" height="40px" borderRadius="10px" />
    <Skeleton width="150px" height="1rem" />
    <Skeleton width="100px" height="1rem" />
    <div className="ml-auto">
      <Skeleton width="80px" height="1.5rem" borderRadius="2rem" />
    </div>
  </div>
);

export default Skeleton;
