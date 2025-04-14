import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import './CanvasBoard.css';

type Point = {
  x: number;
  y: number;
  id: number;
};

type Line = {
  start: Point;
  end: Point;
  id: number;
};

type Angle = {
  point1: Point;
  vertex: Point;
  point2: Point;
  id: number;
};

type Circle = {
  center: Point;
  radius: number;
  id: number;
};

type Tool = 'point' | 'line' | 'angle' | 'circle';

const CanvasBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('point');
  const [points, setPoints] = useState<Point[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [angles, setAngles] = useState<Angle[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [tempPoints, setTempPoints] = useState<Point[]>([]);
  const [nextId, setNextId] = useState(1);
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const [hoveredPointId, setHoveredPointId] = useState<number | null>(null);

  // 绘制所有图形
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制所有点
    points.forEach(point => {
      drawPoint(ctx, point, hoveredPointId === point.id);
    });

    // 绘制所有线
    lines.forEach(line => {
      drawLine(ctx, line);
    });

    // 绘制所有角度
    angles.forEach(angle => {
      drawAngle(ctx, angle);
    });

    // 绘制所有圆
    circles.forEach(circle => {
      drawCircle(ctx, circle);
    });

    // 绘制临时连接线
    if (tool === 'line' && tempPoints.length === 1 && mousePosition) {
      ctx.beginPath();
      ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]); // 设置虚线样式
      ctx.stroke();
      ctx.setLineDash([]); // 重置为实线
      ctx.closePath();
    }
  }, [points, lines, angles, circles, tempPoints, mousePosition, hoveredPointId]);

  // 绘制点
  const drawPoint = (ctx: CanvasRenderingContext2D, point: Point, isHovered: boolean = false) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, isHovered ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#ff9800' : '#3498db';
    ctx.fill();
    ctx.closePath();
    
    // 绘制点的ID
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`${point.id}`, point.x + 8, point.y - 8);
  };

  // 绘制线
  const drawLine = (ctx: CanvasRenderingContext2D, line: Line) => {
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  };

  // 绘制角度
  const drawAngle = (ctx: CanvasRenderingContext2D, angle: Angle) => {
    // 绘制两条线段
    ctx.beginPath();
    ctx.moveTo(angle.vertex.x, angle.vertex.y);
    ctx.lineTo(angle.point1.x, angle.point1.y);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(angle.vertex.x, angle.vertex.y);
    ctx.lineTo(angle.point2.x, angle.point2.y);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // 计算角度
    const angle1 = Math.atan2(angle.point1.y - angle.vertex.y, angle.point1.x - angle.vertex.x);
    const angle2 = Math.atan2(angle.point2.y - angle.vertex.y, angle.point2.x - angle.vertex.x);
    let angleDiff = Math.abs(angle1 - angle2) * (180 / Math.PI);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;

    // 绘制角度弧
    const radius = 20;
    ctx.beginPath();
    ctx.arc(angle.vertex.x, angle.vertex.y, radius, Math.min(angle1, angle2), Math.max(angle1, angle2));
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // 显示角度值
    const midAngle = (angle1 + angle2) / 2;
    const textX = angle.vertex.x + (radius + 10) * Math.cos(midAngle);
    const textY = angle.vertex.y + (radius + 10) * Math.sin(midAngle);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`${angleDiff.toFixed(1)}°`, textX, textY);
  };

  // 绘制圆
  const drawCircle = (ctx: CanvasRenderingContext2D, circle: Circle) => {
    ctx.beginPath();
    ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#9b59b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  };

  // 检查是否点击了已有的点
  const findExistingPoint = (x: number, y: number): Point | null => {
    const clickRadius = 10; // 点击容差半径
    for (const point of points) {
      const distance = Math.sqrt(Math.pow(point.x - x, 2) + Math.pow(point.y - y, 2));
      if (distance <= clickRadius) {
        return point;
      }
    }
    return null;
  };

  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
    
    // 检查鼠标是否悬停在点上
    const hoveredPoint = findExistingPoint(x, y);
    setHoveredPointId(hoveredPoint ? hoveredPoint.id : null);
  };

  // 处理鼠标离开画布
  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredPointId(null);
  };

  // 处理画布点击事件
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击了已有的点
    const existingPoint = findExistingPoint(x, y);
    let clickedPoint: Point;
    
    if (existingPoint) {
      // 使用已有的点
      clickedPoint = existingPoint;
    } else {
      // 创建新点
      clickedPoint = { x, y, id: nextId };
      if (tool === 'point') {
        setPoints(prevPoints => [...prevPoints, clickedPoint]);
      }
      setNextId(prevId => prevId + 1);
    }

    switch (tool) {
      case 'point':
        if (!existingPoint) {
          // 已在上面创建了新点
        }
        break;
      case 'line':
        setTempPoints(prevTempPoints => {
          if (prevTempPoints.length === 0) {
            return [clickedPoint];
          } else {
            const startPoint = prevTempPoints[0];
            // 避免连接到同一个点
            if (startPoint.id === clickedPoint.id) {
              return prevTempPoints;
            }
            const newLine = {
              start: startPoint,
              end: clickedPoint,
              id: nextId
            };
            setLines(prevLines => [...prevLines, newLine]);
            setNextId(prevId => prevId + 1);
            return [];
          }
        });
        break;
      case 'angle':
        setTempPoints(prevTempPoints => {
          if (prevTempPoints.length === 0) {
            return [clickedPoint];
          } else if (prevTempPoints.length === 1) {
            // 避免选择同一个点
            if (prevTempPoints[0].id === clickedPoint.id) {
              return prevTempPoints;
            }
            return [...prevTempPoints, clickedPoint];
          } else {
            const point1 = prevTempPoints[0];
            const vertex = prevTempPoints[1];
            // 避免选择同一个点
            if (vertex.id === clickedPoint.id || point1.id === clickedPoint.id) {
              return prevTempPoints;
            }
            const newAngle = {
              point1,
              vertex,
              point2: clickedPoint,
              id: nextId
            };
            setAngles(prevAngles => [...prevAngles, newAngle]);
            setNextId(prevId => prevId + 1);
            return [];
          }
        });
        break;
      case 'circle':
        setTempPoints(prevTempPoints => {
          if (prevTempPoints.length === 0) {
            return [clickedPoint];
          } else {
            const center = prevTempPoints[0];
            const radius = Math.sqrt(
              Math.pow(clickedPoint.x - center.x, 2) + Math.pow(clickedPoint.y - center.y, 2)
            );
            const newCircle = {
              center,
              radius,
              id: nextId
            };
            setCircles(prevCircles => [...prevCircles, newCircle]);
            setNextId(prevId => prevId + 1);
            return [];
          }
        });
        break;
    }
  };

  // 切换工具
  const handleToolChange = (selectedTool: Tool) => {
    setTool(selectedTool);
    setTempPoints([]);
  };

  // 清空画布
  const handleClear = () => {
    setPoints([]);
    setLines([]);
    setAngles([]);
    setCircles([]);
    setTempPoints([]);
    setNextId(1);
  };

  return (
    <div className="canvas-container">
      <div className="toolbar">
        <button 
          className={`tool-btn ${tool === 'point' ? 'active' : ''}`} 
          onClick={() => handleToolChange('point')}
        >
          点
        </button>
        <button 
          className={`tool-btn ${tool === 'line' ? 'active' : ''}`} 
          onClick={() => handleToolChange('line')}
        >
          线段
        </button>
        <button 
          className={`tool-btn ${tool === 'angle' ? 'active' : ''}`} 
          onClick={() => handleToolChange('angle')}
        >
          角度
        </button>
        <button 
          className={`tool-btn ${tool === 'circle' ? 'active' : ''}`} 
          onClick={() => handleToolChange('circle')}
        >
          圆
        </button>
        <button className="clear-btn" onClick={handleClear}>清空</button>
      </div>
      <div className="status-bar">
        {tool === 'point' && '点击画布添加点，或点击已有的点选择它'}
        {tool === 'line' && (tempPoints.length === 0 
          ? '点击已有点或创建新点作为起点' 
          : `从点 ${tempPoints[0].id} 开始，点击已有点或创建新点作为终点`)}
        {tool === 'angle' && (
          tempPoints.length === 0 
            ? '点击已有点或创建新点作为第一个点' 
            : tempPoints.length === 1 
              ? `从点 ${tempPoints[0].id} 开始，点击已有点或创建新点作为顶点` 
              : `从点 ${tempPoints[0].id} 经过顶点 ${tempPoints[1].id}，点击已有点或创建新点作为第三个点`
        )}
        {tool === 'circle' && (tempPoints.length === 0 
          ? '点击已有点或创建新点作为圆心' 
          : `以点 ${tempPoints[0].id} 为圆心，点击确定半径`)}
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="drawing-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div className="info-panel">
        <div>点: {points.length}</div>
        <div>线段: {lines.length}</div>
        <div>角度: {angles.length}</div>
        <div>圆: {circles.length}</div>
      </div>
    </div>
  );
};

export default CanvasBoard;