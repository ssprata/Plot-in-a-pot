import React from 'react';
import { NodeResizer } from 'reactflow';

export default function ZoneNode({ data, selected }) {
  // Default values
  const color = data.color || '#f59e0b'; // Default to amber

  return (
    <div 
      className="w-full h-full border-4 border-gray-900 dark:border-gray-200 select-none flex flex-col relative pointer-events-none"
      style={{
        backgroundColor: `${color}15`, // ~8% opacity
        borderColor: color,
      }}
    >
      {/* NodeResizer handles scaling */}
      <NodeResizer 
        minWidth={150} 
        minHeight={100} 
        isVisible={selected}
        lineClassName="!border-dashed !border-gray-900 dark:!border-white !pointer-events-auto"
        handleClassName="!w-3.5 !h-3.5 !bg-white !border-2 !border-gray-900 !rounded-none !pointer-events-auto"
      />
      
      {/* Header bar showing the Zone label */}
      <div 
        className="p-1 px-2 border-b-4 border-gray-900 dark:border-gray-200 font-black text-[10px] uppercase tracking-wider text-gray-900 select-none flex items-center gap-1.5 pointer-events-auto"
        style={{
          backgroundColor: color,
        }}
      >
        <span>📁</span>
        <span className="truncate">{data.label}</span>
      </div>
      
      <div className="flex-1" />
    </div>
  );
}
