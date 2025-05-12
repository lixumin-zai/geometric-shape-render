import React, { useState, useRef, useEffect, MouseEvent, useCallback } from 'react';
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
  animated?: boolean;
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
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointId, setDraggedPointId] = useState<number | null>(null);
  
  // 添加动画相关状态
  const [animationActive, setAnimationActive] = useState(false);
  const [animationOffset, setAnimationOffset] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  // 动画循环函数
  const animationLoop = useCallback(() => {
    setAnimationOffset(prev => (prev + 2) % 16); // 控制动画速度和模式
    animationFrameRef.current = requestAnimationFrame(animationLoop);
  }, []);

  // 启动/停止动画
  useEffect(() => {
    if (animationActive) {
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animationActive, animationLoop]);

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
      drawLine(ctx, line, line.id === selectedLineId, animationOffset);
    });

    // 绘制所有角度
    angles.forEach(angle => {
      drawAngle(ctx, angle);
    });

    // 绘制所有圆
    circles.forEach(circle => {
      drawCircle(ctx, circle);
    });

    // 绘制临时连接线 - 线段工具
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
    
    // 绘制角度工具的临时可视化
    if (tool === 'angle' && tempPoints.length > 0 && mousePosition) {
      if (tempPoints.length === 1) {
        // 绘制第一条临时线
        ctx.beginPath();
        ctx.moveTo(tempPoints[0].x, tempPoints[0].y);
        ctx.lineTo(mousePosition.x, mousePosition.y);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();
      } else if (tempPoints.length === 2) {
        // 绘制两条临时线和角度
        const point1 = tempPoints[0];
        const vertex = tempPoints[1];
        
        // 第一条线 (固定)
        ctx.beginPath();
        ctx.moveTo(vertex.x, vertex.y);
        ctx.lineTo(point1.x, point1.y);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // 第二条线 (临时)
        ctx.beginPath();
        ctx.moveTo(vertex.x, vertex.y);
        ctx.lineTo(mousePosition.x, mousePosition.y);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();
        
        // 计算临时角度
        const angle1 = Math.atan2(point1.y - vertex.y, point1.x - vertex.x);
        const angle2 = Math.atan2(mousePosition.y - vertex.y, mousePosition.x - vertex.x);
        let angleDiff = Math.abs(angle1 - angle2) * (180 / Math.PI);
        if (angleDiff > 180) angleDiff = 360 - angleDiff;
        
        // 绘制临时角度弧
        const radius = 20;
        ctx.beginPath();
        ctx.arc(vertex.x, vertex.y, radius, Math.min(angle1, angle2), Math.max(angle1, angle2));
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 2]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.closePath();
        
        // 显示临时角度值
        const midAngle = (angle1 + angle2) / 2;
        const textX = vertex.x + (radius + 10) * Math.cos(midAngle);
        const textY = vertex.y + (radius + 10) * Math.sin(midAngle);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#000';
        ctx.fillText(`${angleDiff.toFixed(1)}°`, textX, textY);
      }
    }
    
    // 绘制圆工具的临时可视化
    if (tool === 'circle' && tempPoints.length === 1 && mousePosition) {
      const center = tempPoints[0];
      const radius = Math.sqrt(
        Math.pow(mousePosition.x - center.x, 2) + Math.pow(mousePosition.y - center.y, 2)
      );
      
      // 绘制临时圆
      ctx.beginPath();
      ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.closePath();
      
      // 绘制半径线
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      ctx.lineTo(mousePosition.x, mousePosition.y);
      ctx.strokeStyle = '#9b59b6';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.closePath();
      
      // 显示半径值
      const midX = (center.x + mousePosition.x) / 2;
      const midY = (center.y + mousePosition.y) / 2;
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(`r = ${radius.toFixed(1)}`, midX, midY - 5);
    }
  }, [points, lines, angles, circles, tempPoints, mousePosition, hoveredPointId, tool, animationOffset, selectedLineId]);

  // 绘制点
  const drawPoint = (ctx: CanvasRenderingContext2D, point: Point, isHovered: boolean = false) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, isHovered ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#ff9800' : '#3498db';
    ctx.fill();
    ctx.closePath();
    
    // 计算标签的最佳位置
    const labelPosition = calculateBestLabelPosition(point);
    
    // 绘制点的ID
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`${point.id}`, labelPosition.x, labelPosition.y);
  };
  
  // 计算标签的最佳位置
  const calculateBestLabelPosition = (point: Point) => {
    // 定义8个可能的方向位置
    const positions = [
      { x: point.x + 8, y: point.y - 8 },    // 右上
      { x: point.x + 8, y: point.y + 15 },   // 右下
      { x: point.x - 15, y: point.y - 8 },   // 左上
      { x: point.x - 15, y: point.y + 15 },  // 左下
      { x: point.x + 15, y: point.y + 3 },   // 右
      { x: point.x - 15, y: point.y + 3 },   // 左
      { x: point.x, y: point.y - 15 },       // 上
      { x: point.x, y: point.y + 20 }        // 下
    ];
    
    // 计算每个位置的拥挤度分数
    const scores = positions.map(pos => {
      let score = 0;
      
      // 检查与其他点的距离
      points.forEach(p => {
        if (p.id !== point.id) {
          const distance = Math.sqrt(
            Math.pow(pos.x - p.x, 2) + Math.pow(pos.y - p.y, 2)
          );
          if (distance < 20) {
            score += (20 - distance);
          }
        }
      });
      
      // 检查与线段的距离
      lines.forEach(line => {
        const distance = pointToLineDistance(
          pos.x, pos.y,
          line.start.x, line.start.y,
          line.end.x, line.end.y
        );
        if (distance < 15) {
          score += (15 - distance);
        }
      });
      
      // 检查与角度标签的距离
      angles.forEach(angle => {
        const angle1 = Math.atan2(angle.point1.y - angle.vertex.y, angle.point1.x - angle.vertex.x);
        const angle2 = Math.atan2(angle.point2.y - angle.vertex.y, angle.point2.x - angle.vertex.x);
        const midAngle = (angle1 + angle2) / 2;
        const radius = 30;
        const labelX = angle.vertex.x + radius * Math.cos(midAngle);
        const labelY = angle.vertex.y + radius * Math.sin(midAngle);
        
        const distance = Math.sqrt(
          Math.pow(pos.x - labelX, 2) + Math.pow(pos.y - labelY, 2)
        );
        if (distance < 20) {
          score += (20 - distance);
        }
      });
      
      // 检查与圆的距离
      circles.forEach(circle => {
        // 检查与圆心的距离
        const distanceToCenter = Math.sqrt(
          Math.pow(pos.x - circle.center.x, 2) + Math.pow(pos.y - circle.center.y, 2)
        );
        
        // 检查与圆周的距离
        const distanceToCircumference = Math.abs(
          distanceToCenter - circle.radius
        );
        
        if (distanceToCenter < 20) {
          score += (20 - distanceToCenter);
        }
        
        if (distanceToCircumference < 10) {
          score += (10 - distanceToCircumference);
        }
      });
      
      // 避免标签超出画布边界
      const canvas = canvasRef.current;
      if (canvas) {
        if (pos.x < 15) score += 30;
        if (pos.y < 15) score += 30;
        if (pos.x > canvas.width - 15) score += 30;
        if (pos.y > canvas.height - 15) score += 30;
      }
      
      return score;
    });
    
    // 选择拥挤度最低的位置
    let minScore = Infinity;
    let bestIndex = 0;
    
    scores.forEach((score, index) => {
      if (score < minScore) {
        minScore = score;
        bestIndex = index;
      }
    });
    
    return positions[bestIndex];
  };

  // 绘制线 - 修改以支持动画
  const drawLine = (ctx: CanvasRenderingContext2D, line: Line, isAnimated: boolean = false, animOffset: number = 0) => {
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    
    if (isAnimated && animationActive) {
      // 创建流水动画效果
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]); // 设置虚线样式
      ctx.lineDashOffset = -animOffset; // 使用动画偏移量
      ctx.stroke();
      
      // 添加第二层动画效果
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 12]);
      ctx.lineDashOffset = -animOffset * 1.5; // 不同的偏移速度
      ctx.stroke();
      
      // 重置虚线设置
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
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
    
    // 如果正在拖拽点
    if (isDragging && draggedPointId !== null) {
      // 更新点的位置
      setPoints(prevPoints => 
        prevPoints.map(point => 
          point.id === draggedPointId 
            ? { ...point, x, y } 
            : point
        )
      );
      
      // 更新使用该点的线段
      setLines(prevLines => 
        prevLines.map(line => {
          if (line.start.id === draggedPointId) {
            return { ...line, start: { ...line.start, x, y } };
          } else if (line.end.id === draggedPointId) {
            return { ...line, end: { ...line.end, x, y } };
          }
          return line;
        })
      );
      
      // 更新使用该点的角度
      setAngles(prevAngles => 
        prevAngles.map(angle => {
          if (angle.point1.id === draggedPointId) {
            return { ...angle, point1: { ...angle.point1, x, y } };
          } else if (angle.vertex.id === draggedPointId) {
            return { ...angle, vertex: { ...angle.vertex, x, y } };
          } else if (angle.point2.id === draggedPointId) {
            return { ...angle, point2: { ...angle.point2, x, y } };
          }
          return angle;
        })
      );
      
      // 更新使用该点的圆
      setCircles(prevCircles => 
        prevCircles.map(circle => {
          if (circle.center.id === draggedPointId) {
            return { ...circle, center: { ...circle.center, x, y } };
          }
          return circle;
        })
      );
      
      return;
    }
    
    // 检查鼠标是否悬停在点上
    const hoveredPoint = findExistingPoint(x, y);
    setHoveredPointId(hoveredPoint ? hoveredPoint.id : null);
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredPointId !== null) {
      setIsDragging(true);
      setDraggedPointId(hoveredPointId);
    }
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedPointId(null);
    }
  };

  // 处理鼠标离开画布
  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredPointId(null);
    if (isDragging) {
      setIsDragging(false);
      setDraggedPointId(null);
    }
  };

  // 切换线段动画状态
  const toggleLineAnimation = (lineId: number) => {
    if (selectedLineId === lineId) {
      setSelectedLineId(null);
      setAnimationActive(false);
    } else {
      setSelectedLineId(lineId);
      setAnimationActive(true);
    }
  };

  // 查找点击位置附近的线段
  const findLineNearPoint = (x: number, y: number): Line | null => {
    const threshold = 10; // 点击容差
    
    for (const line of lines) {
      // 计算点到线段的距离
      const distance = pointToLineDistance(
        x, y,
        line.start.x, line.start.y,
        line.end.x, line.end.y
      );
      
      if (distance <= threshold) {
        return line;
      }
    }
    
    return null;
  };

  // 计算点到线段的距离
  const pointToLineDistance = (
    x: number, y: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 处理画布点击事件
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
      const clickedLine = findLineNearPoint(x, y);
      if (clickedLine) {
        toggleLineAnimation(clickedLine.id);
        return;
      }
    }
    
    // 检查是否点击了已有的点
    const existingPoint = findExistingPoint(x, y);
    let clickedPoint: Point;
    
    if (existingPoint) {
      // 使用已有的点
      clickedPoint = existingPoint;
    } else {
      // 创建新点
      clickedPoint = { x, y, id: nextId };
      // 只有在点工具或者需要创建新点的情况下才添加到点集合中
      if (tool === 'point') {
        setPoints(prevPoints => [...prevPoints, clickedPoint]);
        setNextId(prevId => prevId + 1);
      } else {
        // 对于其他工具，只有在实际使用这个点时才添加到点集合
        setNextId(prevId => prevId + 1);
      }
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
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
            }
            return [clickedPoint];
          } else {
            const startPoint = prevTempPoints[0];
            // 避免连接到同一个点
            if (startPoint.id === clickedPoint.id) {
              return prevTempPoints;
            }
            
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
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
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
            }
            return [clickedPoint];
          } else if (prevTempPoints.length === 1) {
            // 避免选择同一个点
            if (prevTempPoints[0].id === clickedPoint.id) {
              return prevTempPoints;
            }
            
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
            }
            
            return [...prevTempPoints, clickedPoint];
          } else {
            const point1 = prevTempPoints[0];
            const vertex = prevTempPoints[1];
            // 避免选择同一个点
            if (vertex.id === clickedPoint.id || point1.id === clickedPoint.id) {
              return prevTempPoints;
            }
            
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
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
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
            }
            return [clickedPoint];
          } else {
            const center = prevTempPoints[0];
            
            // 如果是新创建的点，添加到点集合
            if (!existingPoint) {
              setPoints(prevPoints => [...prevPoints, clickedPoint]);
            }
            
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
        {tool === 'point' && (selectedLineId 
          ? '点击线段可以切换动画效果，点击其他区域取消选择' 
          : '点击画布添加点，或点击已有的点选择它，点击线段可以激活动画')}
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
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      <div className="info-panel">
        <div>点: {points.length}</div>
        <div>线段: {lines.length}</div>
        <div>角度: {angles.length}</div>
        <div>圆: {circles.length}</div>
        {isDragging && <div className="dragging-info">正在移动点 {draggedPointId}</div>}
        {selectedLineId !== null && (
          <div className="animation-info">
            线段 {selectedLineId} 动画已激活
            <button 
              className="animation-toggle-btn" 
              onClick={() => setAnimationActive(!animationActive)}
            >
              {animationActive ? '暂停' : '播放'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasBoard;