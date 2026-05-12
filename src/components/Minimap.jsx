import React from 'react';
import './Minimap.css';

const MINIMAP_WIDTH = 220;  // Back to original size
const MINIMAP_HEIGHT = 160; // Back to original size
const PADDING = 16;
const NODE_W = 20;  // Slightly smaller to fit better
const NODE_H = 12;  // Slightly smaller to fit better
const SPACING_FACTOR = 1.3; // Subtle spacing increase

function isSecret(node) {
  const tags = String(node.data?.tags || '').split(',').map(t => t.trim().toLowerCase());
  return tags.includes('secreto') || tags.includes('secret');
}

function getScaledPositions(nodes) {
  if (nodes.length === 0) return {};
  
  // Find bounds of the graph
  const xs = nodes.map(n => n.position?.x ?? 0);
  const ys = nodes.map(n => n.position?.y ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  
  // Calculate center of the graph
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // Apply spacing factor to expand from center
  let expandedMinX = Infinity;
  let expandedMaxX = -Infinity;
  let expandedMinY = Infinity;
  let expandedMaxY = -Infinity;
  
  const expandedPositions = {};
  
  nodes.forEach(node => {
    const origX = node.position?.x ?? 0;
    const origY = node.position?.y ?? 0;
    
    // Expand from center
    const dx = (origX - centerX) * SPACING_FACTOR;
    const dy = (origY - centerY) * SPACING_FACTOR;
    const expandedX = centerX + dx;
    const expandedY = centerY + dy;
    
    expandedPositions[node.id] = { x: expandedX, y: expandedY };
    
    expandedMinX = Math.min(expandedMinX, expandedX);
    expandedMaxX = Math.max(expandedMaxX, expandedX);
    expandedMinY = Math.min(expandedMinY, expandedY);
    expandedMaxY = Math.max(expandedMaxY, expandedY);
  });
  
  // Add padding for node sizes
  const graphW = (expandedMaxX - expandedMinX) + NODE_W;
  const graphH = (expandedMaxY - expandedMinY) + NODE_H;
  
  // Calculate scale to fit in minimap
  const scale = Math.min(
    (MINIMAP_WIDTH - 2 * PADDING) / graphW,
    (MINIMAP_HEIGHT - 2 * PADDING) / graphH
  );
  
  // Center the graph in the minimap
  const offsetX = PADDING + (MINIMAP_WIDTH - 2 * PADDING - graphW * scale) / 2;
  const offsetY = PADDING + (MINIMAP_HEIGHT - 2 * PADDING - graphH * scale) / 2;
  
  // Convert to minimap coordinates
  const positions = {};
  nodes.forEach(node => {
    const expanded = expandedPositions[node.id];
    positions[node.id] = {
      x: (expanded.x - expandedMinX) * scale + offsetX,
      y: (expanded.y - expandedMinY) * scale + offsetY
    };
  });
  
  return positions;
}

export default function Minimap({ nodes, edges, currentNodeId, hoveredOptionTargets }) {
  const visibleNodes = nodes.filter(n => !isSecret(n));
  const nodePositions = getScaledPositions(visibleNodes);
  const visibleEdges = edges.filter(e => nodePositions[e.from] && nodePositions[e.to]);

  return (
    <div className="minimap-container" style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}>
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} className="minimap-svg">
        {/* Draw edges */}
        {visibleEdges.map((edge, i) => {
          const from = nodePositions[edge.from];
          const to = nodePositions[edge.to];
          if (!from || !to) return null;
          return (
            <line 
              key={i} 
              x1={from.x + NODE_W/2} 
              y1={from.y + NODE_H/2} 
              x2={to.x + NODE_W/2} 
              y2={to.y + NODE_H/2} 
              stroke="#aaa" 
              strokeWidth="1"
            />
          );
        })}
        {/* Draw nodes */}
        {visibleNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const { x, y } = pos;
          let stroke = '#333';
          let strokeWidth = 1.5;
          
          if (node.id === currentNodeId) {
            stroke = 'green';
            strokeWidth = 2.5;
          } else if (hoveredOptionTargets && hoveredOptionTargets.includes(node.id)) {
            stroke = 'orange';
            strokeWidth = 2.5;
          }
          
          return (
            <g key={node.id}>
              <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={3} fill="#23272e" stroke={stroke} strokeWidth={strokeWidth} />
              <circle cx={x} cy={y + NODE_H/2} r={2.5} fill="#888" />
              <circle cx={x + NODE_W} cy={y + NODE_H/2} r={2.5} fill="#888" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}