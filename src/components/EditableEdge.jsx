import React from 'react';
import { getBezierPath, useStore } from 'reactflow';

export default function EditableEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    data,
    interactionWidth = 20
}) {
    // Recuperamos a função de zoom e transformação do canvas para manter os pontos com tamanho consistente
    const transform = useStore((s) => s.transform);
    const zoom = transform[2];

    const waypoints = data?.waypoints || [];

        // Converte uma sequência de pontos numa spline Catmull-Rom expressa em Bézier cúbico
    const catmullRomPath = (points) => {
        if (points.length < 2) return '';

        let path = `M ${points[0].x},${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(i - 1, 0)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(i + 2, points.length - 1)];

            // Pontos de controlo derivados dos vizinhos — cria a tangente suave
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
        }

        return path;
    };

    // Algoritmo de geração de caminho segmentado baseado nos waypoints customizados
    let edgePath = '';

    if (waypoints.length === 0) {
        [edgePath] = getBezierPath({
            sourceX, sourceY, sourcePosition,
            targetX, targetY, targetPosition,
        });
    } else {
        const allPoints = [
            { x: sourceX, y: sourceY },
            ...waypoints,
            { x: targetX, y: targetY }
        ];
        edgePath = catmullRomPath(allPoints);
    }

    // Despoleta o evento global de drag de um ponto de controlo específico
    const handleWaypointMouseDown = (e, index) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;
        const startY = e.clientY;
        const initialWpX = waypoints[index].x;
        const initialWpY = waypoints[index].y;

        const handleMouseMove = (moveEvent) => {
            // ✅ Ambos dividem por zoom
            const deltaX = (moveEvent.clientX - startX) / zoom;
            const deltaY = (moveEvent.clientY - startY) / zoom; // era / startY

            const updatedWaypoints = [...waypoints];
            updatedWaypoints[index] = {
                x: initialWpX + deltaX,
                y: initialWpY + deltaY
            };

            window.dispatchEvent(new CustomEvent('updateEdgeWaypoints', {
                detail: { edgeId: id, waypoints: updatedWaypoints }
            }));
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <>
            {/* Linha invisível mais larga para capturar cliques e interações com maior facilidade */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={interactionWidth}
                className="react-flow__edge-interaction cursor-pointer"
            />

            {/* Aresta visual principal Neo-Brutalista */}
            <path
                id={id}
                d={edgePath}
                fill="none"
                stroke={selected ? '#eab308' : '#64748b'} // Amarelo se selecionada, cinza se padrão
                strokeWidth={selected ? 4 : 3}
                className="react-flow__edge-path transition-colors"
            />

            {/* Renderização dos Control Points Quadrados (Estilo Miro / deVinci) */}
            {selected && waypoints.map((wp, index) => (
                <g key={index} transform={`translate(${wp.x}, ${wp.y})`}>
                    <rect
                        x={-6}
                        y={-6}
                        width={12}
                        height={12}
                        className="fill-yellow-400 stroke-gray-900 stroke-2 cursor-move hover:fill-black transition-colors"
                        style={{ shapeRendering: 'crispEdges' }}
                        pointerEvents="all"           // ✅ garante que o SVG captura o evento
                        onMouseDown={(e) => handleWaypointMouseDown(e, index)}
                    />
                </g>
            ))}
        </>
    );
}