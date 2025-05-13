import React, { useRef, useEffect } from 'react';
import './CanvasBoard.css';
import { useGeometryState } from '../hooks/useGeometryState';
import { useInteraction } from '../hooks/useInteraction';
import { useAnimation } from '../hooks/useAnimation';
import { findExistingPoint, findLineNearPoint } from '../utils/geometryUtils';
import { 
  drawPoint, 
  drawLine, 
  drawAngle, 
  drawCircle, 
  drawTempLine, 
  drawTempAngle, 
  drawTempCircle 
} from '../utils/renderUtils';
import { Tool } from '../types/geometryTypes';

const CanvasBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 使用几何状态钩子
  const {
    tool,
    setTool,
    points,
    lines,
    angles,
    circles,
    tempPoints,
    setTempPoints,
    addPoint,
    addLine,
    addAngle,
    addCircle,
    updatePointPosition,
    clearAll
  } = useGeometryState();
  
  // 使用动画钩子
  const {
    animationActive,
    animationOffset,
    selectedLineId,
    toggleLineAnimation
  } = useAnimation();
  
  // 使用交互钩子
  const {
    mousePosition,
    hoveredPointId,
    isDragging,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseLeave
  } = useInteraction(points, updatePointPosition);
  
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
      const isAnimated = line.id === selectedLineId;
      drawLine(ctx, { ...line, animated: isAnimated }, animationOffset);
    });

    // 绘制所有角度
    angles.forEach(angle => {
      drawAngle(ctx, angle);
    });

    // 绘制所有圆
    circles.forEach(circle => {
      drawCircle(ctx, circle);
    });

    // 绘制临时图形
    if (mousePosition && tempPoints.length > 0) {
      switch (tool) {
        case 'line':
          if (tempPoints.length === 1) {
            drawTempLine(ctx, tempPoints[0], mousePosition);
          }
          break;
        case 'angle':
          drawTempAngle(ctx, tempPoints, mousePosition);
          break;
        case 'circle':
          if (tempPoints.length === 1) {
            drawTempCircle(ctx, tempPoints[0], mousePosition);
          }
          break;
      }
    }
  }, [
    points, 
    lines, 
    angles, 
    circles, 
    tempPoints, 
    mousePosition, 
    hoveredPointId, 
    tool, 
    animationOffset, 
    selectedLineId, 
    animationActive
  ]);

  // 处理鼠标移动
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleMouseMove(x, y);
  };

  // 处理鼠标点击
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 如果正在拖拽，不处理点击事件
    if (isDragging) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 在点工具模式下检查是否点击了线段
    if (tool === 'point') {
      const clickedLine = findLineNearPoint(x, y, lines);
      if (clickedLine) {
        toggleLineAnimation(clickedLine.id);
        return;
      }
    }
    
    // 检查是否点击了已有的点
    const existingPoint = findExistingPoint(x, y, points);
    
    switch (tool) {
      case 'point':
        if (!existingPoint) {
          addPoint(x, y);
        }
        break;
      case 'line':
        setTempPoints(prevTempPoints => {
          if (prevTempPoints.length === 0) {
            // 第一个点
            const startPoint = existingPoint || addPoint(x, y);
            return [startPoint];
          } else {
            // 第二个点
            const startPoint = prevTempPoints[0];
            // 避免连接到同一个点
            if (existingPoint && startPoint.id === existingPoint.id) {
              return prevTempPoints;
            }
            
            const endPoint = existingPoint || addPoint(x, y);
            addLine(startPoint, endPoint);
            return [];
          }
        });
        break;
      case 'angle':
        setTempPoints(prevTempPoints => {
          if (prevTempPoints.length === 0) {
            // 第一个点
            const point = existingPoint || addPoint(x, y);
            return [point];
          } else if (prevTempPoints.length === 1) {
            // 第二个点 (顶点)
            const firstPoint = prevTempPoints[0];
            // 避免选择同一个点
            if (existingPoint && firstPoint.id === existingPoint.id) {
              return prevTempPoints;
            }
            
            const vertex = existingPoint || addPoint(x, y);
            return [...prevTempPoints, vertex];
          } else {
            // 第三个点
            const firstPoint = prevTempPoints[0];
            const vertex = prevTempPoints[1];
            
            // 避免选择同一个点
            if (existingPoint && (vertex.id === existingPoint.id || firstPoint.id === existingPoint.id)) {
              return prevTempPoints;
            }
            
            const thirdPoint = existingPoint || addPoint(x, y);
            
            // 创建两条线
            const line1 = addLine(vertex, firstPoint);
            const line2 = addLine(vertex, thirdPoint);
            
            // 创建角度
            addAngle(vertex, line1, line2);
            
            return [];
          }
        });
        break;
      case 'circle':
        setTempPoints(prevTempPoints => {
          if (prevTempPoints.length === 0) {
            // 圆心
            const center = existingPoint || addPoint(x, y);
            return [center];
          } else {
            // 圆上一点
            const center = prevTempPoints[0];
            const radiusPoint = existingPoint || addPoint(x, y);
            
            const radius = Math.sqrt(
              Math.pow(radiusPoint.x - center.x, 2) + Math.pow(radiusPoint.y - center.y, 2)
            );
            
            addCircle(center, radius);
            return [];
          }
        });
        break;
    }
  };

  // 切换工具
  const handleToolChange = (newTool: Tool) => {
    setTool(newTool);
    setTempPoints([]);
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
        <button className="clear-btn" onClick={clearAll}>
          清除
        </button>
      </div>
      
      <div className="status-bar">
        {isDragging ? (
          <span className="dragging-info">正在拖拽点 #{hoveredPointId}</span>
        ) : (
          <span>
            当前工具: {
              tool === 'point' ? '点' : 
              tool === 'line' ? '线段' : 
              tool === 'angle' ? '角度' : '圆'
            } | 
            {mousePosition 
              ? `坐标: (${mousePosition.x.toFixed(0)}, ${mousePosition.y.toFixed(0)})` 
              : '移动鼠标查看坐标'}
          </span>
        )}
      </div>
      
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        width={800}
        height={600}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleCanvasClick}
      />
      
      <div className="info-panel">
        <div>点: {points.length}</div>
        <div>线段: {lines.length}</div>
        <div>角度: {angles.length}</div>
        <div>圆: {circles.length}</div>
        {animationActive && <div>动画激活: 线段 #{selectedLineId}</div>}
      </div>
    </div>
  );
};

export default CanvasBoard;