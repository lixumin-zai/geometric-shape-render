import { useState } from 'react';
import { Point, Line, Angle, Circle, Tool } from '../types/geometryTypes';

export const useGeometryState = () => {
  const [tool, setTool] = useState<Tool>('point');
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [angles, setAngles] = useState<Angle[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [nextId, setNextId] = useState(1);
  
  // 创建默认点
  const createDefaultPoint = (x: number, y: number): Point => {
    return {
      id: nextId,
      x,
      y,
      label: `P${nextId}`,
      size: 5,
      color: '#3498db',
      showLabel: true,
      movable: true
    };
  };
  
  // 创建默认线
  const createDefaultLine = (start: Point, end: Point): Line => {
    return {
      id: nextId,
      start,
      end,
      color: '#2c3e50',
      width: 2,
      style: 'solid',
      label: `L${nextId}`,
      showLabel: true,
      animated: false
    };
  };
  
  // 创建默认角度
  const createDefaultAngle = (vertex: Point, line1: Line, line2: Line): Angle => {
    return {
      id: nextId,
      vertex,
      line1,
      line2,
      color: '#e74c3c',
      radius: 20,
      showArc: true,
      showDegree: true,
      label: `A${nextId}`,
      showLabel: true
    };
  };
  
  // 创建默认圆
  const createDefaultCircle = (center: Point, radius: number): Circle => {
    return {
      id: nextId,
      center,
      radius,
      color: '#9b59b6',
      width: 2,
      style: 'solid',
      fill: false,
      fillColor: 'rgba(155, 89, 182, 0.2)',
      label: `C${nextId}`,
      showLabel: true
    };
  };
  
  // 添加点
  const addPoint = (x: number, y: number) => {
    const point = createDefaultPoint(x, y);
    setPoints(prevPoints => [...prevPoints, point]);
    setNextId(prevId => prevId + 1);
    return point;
  };
  
  // 添加线
  const addLine = (start: Point, end: Point) => {
    const line = createDefaultLine(start, end);
    setLines(prevLines => [...prevLines, line]);
    setNextId(prevId => prevId + 1);
    return line;
  };
  
  // 添加角度
  const addAngle = (vertex: Point, line1: Line, line2: Line) => {
    const angle = createDefaultAngle(vertex, line1, line2);
    setAngles(prevAngles => [...prevAngles, angle]);
    setNextId(prevId => prevId + 1);
    return angle;
  };
  
  // 添加圆
  const addCircle = (center: Point, radius: number) => {
    const circle = createDefaultCircle(center, radius);
    setCircles(prevCircles => [...prevCircles, circle]);
    setNextId(prevId => prevId + 1);
    return circle;
  };
  
  // 更新点位置
  const updatePointPosition = (pointId: number, x: number, y: number) => {
    // 更新点的位置
    setPoints(prevPoints => 
      prevPoints.map(point => 
        point.id === pointId 
          ? { ...point, x, y } 
          : point
      )
    );
    
    // 更新使用该点的线段
    setLines(prevLines => 
      prevLines.map(line => {
        if (line.start.id === pointId) {
          return { ...line, start: { ...line.start, x, y } };
        } else if (line.end.id === pointId) {
          return { ...line, end: { ...line.end, x, y } };
        }
        return line;
      })
    );
    
    // 更新使用该点的角度
    setAngles(prevAngles => 
      prevAngles.map(angle => {
        let updatedAngle = { ...angle };
        
        // 更新顶点
        if (angle.vertex.id === pointId) {
          updatedAngle.vertex = { ...angle.vertex, x, y };
        }
        
        // 更新线段1中的点
        if (angle.line1.start.id === pointId) {
          updatedAngle.line1 = { 
            ...angle.line1, 
            start: { ...angle.line1.start, x, y } 
          };
        } else if (angle.line1.end.id === pointId) {
          updatedAngle.line1 = { 
            ...angle.line1, 
            end: { ...angle.line1.end, x, y } 
          };
        }
        
        // 更新线段2中的点
        if (angle.line2.start.id === pointId) {
          updatedAngle.line2 = { 
            ...angle.line2, 
            start: { ...angle.line2.start, x, y } 
          };
        } else if (angle.line2.end.id === pointId) {
          updatedAngle.line2 = { 
            ...angle.line2, 
            end: { ...angle.line2.end, x, y } 
          };
        }
        
        return updatedAngle;
      })
    );
    
    // 更新使用该点的圆
    setCircles(prevCircles => 
      prevCircles.map(circle => {
        if (circle.center.id === pointId) {
          return { ...circle, center: { ...circle.center, x, y } };
        }
        return circle;
      })
    );
  };
  
  // 清除所有图形
  const clearAll = () => {
    setPoints([]);
    setLines([]);
    setAngles([]);
    setCircles([]);
    setTempPoints([]);
    setNextId(1);
  };
  
  return {
    tool,
    setTool,
    points,
    setPoints,
    lines,
    setLines,
    angles,
    setAngles,
    circles,
    setCircles,
    tempPoints,
    setTempPoints,
    nextId,
    setNextId,
    createDefaultPoint,
    createDefaultLine,
    createDefaultAngle,
    createDefaultCircle,
    addPoint,
    addLine,
    addAngle,
    addCircle,
    updatePointPosition,
    clearAll
  };
};