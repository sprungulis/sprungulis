'use client';

import { useEffect, useRef } from 'react';

export default function Game({
    position = [0, 0],
    gridSize = 4,
    ballPosition = [0, 0],
    pickedUp = false,
    walls = [],
    cellSize = 80,
    className = ""
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = gridSize * cellSize;
        const height = gridSize * cellSize;

        // Clear whole canvas
        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#0f172a'; // slate-900
        ctx.fillRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = '#334155'; // slate-700
        ctx.lineWidth = 2;

        for (let i = 0; i <= gridSize; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * cellSize, 0);
            ctx.lineTo(i * cellSize, height);
            ctx.stroke();

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * cellSize);
            ctx.lineTo(width, i * cellSize);
            ctx.stroke();
        }

        // Walls
        for (const wall of walls) {
            const [wx, wy] = wall;
            const wallX = wx * cellSize + 7.5;
            const wallY = wy * cellSize + 7.5;

            ctx.fillStyle = '#041545';
            ctx.fillRect(wallX, wallY, cellSize - 15, cellSize - 15);
        }

        // Ball / goal item
        // If picked up, render item at robot position
        const itemPos = pickedUp ? position : ballPosition;
        const itemX = itemPos[0] * cellSize + cellSize / 2;
        const itemY = itemPos[1] * cellSize + cellSize / 2;

        ctx.fillStyle = '#f6af3b';
        ctx.beginPath();
        ctx.arc(itemX, itemY, cellSize * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Robot
        const robotX = position[0] * cellSize + cellSize / 2;
        const robotY = position[1] * cellSize + cellSize / 2;

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(robotX, robotY, cellSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Robot face
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        // Eyes
        ctx.beginPath();
        ctx.arc(robotX - cellSize * 0.1, robotY - cellSize * 0.05, 2, 0, Math.PI * 2);
        ctx.arc(robotX + cellSize * 0.1, robotY - cellSize * 0.05, 2, 0, Math.PI * 2);
        ctx.stroke();

        // Smile
        ctx.beginPath();
        ctx.arc(robotX, robotY + cellSize * 0.05, cellSize * 0.1, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();

        // Optional: small carrying indicator
        if (pickedUp) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(robotX + cellSize * 0.18, robotY - cellSize * 0.18, cellSize * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }
    }, [position, gridSize, ballPosition, pickedUp, walls, cellSize]);

    return (
        <div
            className={`relative border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl ${className}`}
        >
            <canvas
                ref={canvasRef}
                width={gridSize * cellSize}
                height={gridSize * cellSize}
                className="block bg-slate-900"
            />
        </div>
    );
}