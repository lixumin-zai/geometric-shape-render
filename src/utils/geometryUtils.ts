import { Point, Line } from '../types/geometryTypes';

// 查找现有点
export const findExistingPoint = (
  x: number, 
  y: number, 
  points: Point[]
): Point | null => {
  const clickRadius = 10; // 点击容差半径
  for (const point of points) {
    const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
    if (distance <= clickRadius) {
      return point;
    }
  }
  return null;
};

// 查找线段
export const findLineNearPoint = (
  x: number, 
  y: number, 
  lines: Line[]
): Line | null => {
  const threshold = 5; // 点到线段的最大距离
  
  for (const line of lines) {
    // 计算点到线段的距离
    const A = x - line.start.x;
    const B = y - line.start.y;
    const C = line.end.x - line.start.x;
    const D = line.end.y - line.start.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = line.start.x;
      yy = line.start.y;
    } else if (param > 1) {
      xx = line.end.x;
      yy = line.end.y;
    } else {
      xx = line.start.x + param * C;
      yy = line.start.y + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < threshold) {
      return line;
    }
  }
  
  return null;
};

// 计算两点之间的距离
export const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};