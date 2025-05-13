import { useState } from 'react';
import { Point } from '../types/geometryTypes';
import { findExistingPoint } from '../utils/geometryUtils';

export const useInteraction = (
  points: Point[],
  updatePointPosition: (pointId: number, x: number, y: number) => void
) => {
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointId, setDraggedPointId] = useState<number | null>(null);

  // 处理鼠标移动
  const handleMouseMove = (x: number, y: number) => {
    setMousePosition({ x, y });
    
    // 如果正在拖拽点
    if (isDragging && draggedPointId !== null) {
      updatePointPosition(draggedPointId, x, y);
      return;
    }
    
    // 检查鼠标是否悬停在点上
    const hoveredPoint = findExistingPoint(x, y, points);
    setHoveredPointId(hoveredPoint ? hoveredPoint.id : null);
  };

  // 处理鼠标按下
  const handleMouseDown = () => {
    if (hoveredPointId !== null) {
      setIsDragging(true);
      setDraggedPointId(hoveredPointId);
    }
  };

  // 处理鼠标抬起
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedPointId(null);
    }
  };

  // 处理鼠标离开
  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredPointId(null);
    if (isDragging) {
      setIsDragging(false);
      setDraggedPointId(null);
    }
  };

  return {
    mousePosition,
    hoveredPointId,
    isDragging,
    draggedPointId,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave
  };
};