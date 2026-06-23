import React from 'react';
import './Minimap.css';

const MINIMAP_WIDTH = 220; 
const MINIMAP_HEIGHT = 160; 
const NODE_W = 32;  
const NODE_H = 18;  
const SPACING_FACTOR = 1.3; 
// 🔍 Lower ZOOM_SCALE to zoom out, higher to zoom in!
const ZOOM_SCALE = 0.15; 

function isSecret(node) {
  const tags = String(node.data?.tags || '').split(',').map(t => t.trim().toLowerCase());
  return tags.includes('secreto') || tags.includes('secret');
}

// Logic: Acts as a camera that centers on the active node
function getCameraCenteredPositions(nodes, currentNodeId) {
  if (nodes.length === 0) return {};
  
  // 1. Find the focal point (the active node)
  let targetNode = nodes.find(n => n.id === currentNodeId);
  
  // If no active node is found, fallback to the first visible node
  if (!targetNode) {
    targetNode = nodes[0];
  }
  
  const targetOrigX = targetNode?.position?.x ?? 0;
  const targetOrigY = targetNode?.position?.y ?? 0;

  const positions = {};
  
  nodes.forEach(node => {
    const origX = node.position?.x ?? 0;
    const origY = node.position?.y ?? 0;
    
    // 2. Calculate distance from the camera center (active node)
    const dx = (origX - targetOrigX) * SPACING_FACTOR;
    const dy = (origY - targetOrigY) * SPACING_FACTOR;
    
    // 3. Apply zoom scale and place in the exact center of the minimap
    positions[node.id] = {
      x: (dx * ZOOM_SCALE) + (MINIMAP_WIDTH / 2) - (NODE_W / 2),
      y: (dy * ZOOM_SCALE) + (MINIMAP_HEIGHT / 2) - (NODE_H / 2)
    };
  });
  
  return positions;
}

export default function Minimap({ nodes, edges, currentNodeId, hoveredOptionTargets }) {
  const visibleNodes = nodes.filter(n => !isSecret(n) && n.type !== 'zone' && n.data?.nodeType !== 'zone');
  const nodePositions = getCameraCenteredPositions(visibleNodes, currentNodeId);
  
  // Checking both 'from/to' and 'source/target' just in case of library mismatches
  const visibleEdges = edges.filter(e => {
    const fromId = e.from || e.source;
    const toId = e.to || e.target;
    return nodePositions[fromId] && nodePositions[toId];
  });

  return (
    <div className="minimap-container" style={{ 
      width: MINIMAP_WIDTH, 
      height: MINIMAP_HEIGHT, 
      backgroundColor: '#181A1F', 
      borderRadius: '8px',
      overflow: 'hidden' // Ensures lines don't bleed outside the box
    }}>
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} className="minimap-svg">
        
        {/* Draw edges */}
        {visibleEdges.map((edge, i) => {
          const fromId = edge.from || edge.source;
          const toId = edge.to || edge.target;
          
          const from = nodePositions[fromId];
          const to = nodePositions[toId];
          
          if (!from || !to) return null;

          // ⭐ --- Highlighting Logic --- ⭐
          // The edge is highlighted if:
          // 1. Its source is the current node
          // 2. Its target is in the list of nodes targeted by the hovered option
          const isEdgeHighlighted = fromId === currentNodeId && hoveredOptionTargets && hoveredOptionTargets.includes(toId);

          // Default style
          let edgeStroke = "#555F77"; // Slightly darker default
          let edgeWidth = "1.5";
          let edgeOpacity = "0.7";

          // Highlighted style
          if (isEdgeHighlighted) {
            edgeStroke = '#FF9800'; // Bright orange to match the node hover
            edgeWidth = "3"; // Extra width for emphasis
            edgeOpacity = "1";
          }

          // Define curve points
          // Start at the right side (lower half)
          const startX = from.x + NODE_W;
          const startY = from.y + (NODE_H * 0.7); 
          
          // End at the top center
          const endX = to.x + (NODE_W / 2);
          const endY = to.y;

          const distanceX = Math.abs(endX - startX);
          const offset = Math.max(distanceX * 0.4, 15);

          const pathData = `M ${startX} ${startY} C ${startX + offset} ${startY}, ${endX} ${endY - offset}, ${endX} ${endY}`;

          return (
            <path 
              key={`edge-${i}`} 
              d={pathData}
              fill="none"
              stroke={edgeStroke} 
              strokeWidth={edgeWidth}
              opacity={edgeOpacity}
              style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease' }} // Smooth transition
            />
          );
        })}

        {/* Draw nodes */}
        {visibleNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;
          const { x, y } = pos;
          
          // Default Styles
          let fill = '#282C34';
          let stroke = '#4B5363';
          let strokeWidth = 1.5;
          let portColor = '#9CA3AF';

          // Active/Hover States
          if (node.id === currentNodeId) {
            fill = '#1E3A2F'; 
            stroke = '#4CAF50'; 
            strokeWidth = 2;
            portColor = '#4CAF50';
          } else if (hoveredOptionTargets && hoveredOptionTargets.includes(node.id)) {
            fill = '#4A3219'; // Subtle orange tint
            stroke = '#FF9800'; // Bright orange border
            strokeWidth = 2;
            portColor = '#FF9800';
          }
          
          return (
            <g key={node.id}>
              {/* Node Body */}
              <rect 
                x={x} 
                y={y} 
                width={NODE_W} 
                height={NODE_H} 
                rx={3} 
                fill={fill} 
                stroke={stroke} 
                strokeWidth={strokeWidth} 
                style={{ transition: 'fill 0.2s ease, stroke 0.2s ease' }} // Smooth transition
              />
              
              {/* Node Header Separator Line */}
              <line 
                x1={x} 
                y1={y + (NODE_H * 0.4)} 
                x2={x + NODE_W} 
                y2={y + (NODE_H * 0.4)} 
                stroke={stroke} 
                strokeWidth="1" 
                opacity="0.5" 
              />

              {/* Input Port (Top Center) */}
              <circle 
                cx={x + (NODE_W / 2)} 
                cy={y} 
                r={2} 
                fill={portColor} 
                stroke="#181A1F" 
                strokeWidth="0.5" 
                style={{ transition: 'fill 0.2s ease' }} // Smooth transition
              />
              
              {/* Output Port (Right side, lower half) */}
              <circle 
                cx={x + NODE_W} 
                cy={y + (NODE_H * 0.7)} 
                r={2} 
                fill={portColor} 
                stroke="#181A1F" 
                strokeWidth="0.5" 
                style={{ transition: 'fill 0.2s ease' }} // Smooth transition
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}