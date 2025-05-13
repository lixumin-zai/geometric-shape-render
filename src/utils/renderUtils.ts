import { Point, Line, Angle, Circle } from '../types/geometryTypes';

// 计算标签的最佳位置
export const calculateBestLabelPosition = (point: Point): { x: number; y: number } => {
  // 默认在点的右上方显示
  return {
    x: point.x + 10,
    y: point.y - 10
  };
};

// 绘制点
export const drawPoint = (
  ctx: CanvasRenderingContext2D, 
  point: Point, 
  isHovered: boolean = false
) => {
  ctx.beginPath();
  ctx.arc(point.x, point.y, isHovered ? point.size * 1.2 : point.size, 0, Math.PI * 2);
  ctx.fillStyle = isHovered ? '#ff9800' : point.color;
  ctx.fill();
  ctx.closePath();
  
  // 如果需要显示标签
  if (point.showLabel) {
    // 计算标签的最佳位置
    const labelPosition = calculateBestLabelPosition(point);
    
    // 绘制点的标签
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(point.label || `${point.id}`, labelPosition.x, labelPosition.y);
  }
};

// 绘制线
export const drawLine = (
  ctx: CanvasRenderingContext2D, 
  line: Line, 
  animOffset: number = 0
) => {
  ctx.beginPath();
  ctx.moveTo(line.start.x, line.start.y);
  ctx.lineTo(line.end.x, line.end.y);
  
  // 设置线条样式
  ctx.strokeStyle = line.color;
  ctx.lineWidth = line.width;
  
  // 根据线条样式设置虚线
  if (line.style === 'dashed') {
    ctx.setLineDash([8, 4]);
  } else if (line.style === 'dotted') {
    ctx.setLineDash([2, 2]);
  } else {
    ctx.setLineDash([]);
  }
  
  if (line.animated) {
    // 创建流水动画效果
    ctx.lineDashOffset = -animOffset;
    ctx.stroke();
    
    // 添加第二层动画效果（可选）
    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.strokeStyle = '#3498db'; // 第二层动画颜色
    ctx.lineWidth = line.width * 0.8;
    ctx.setLineDash([4, 12]);
    ctx.lineDashOffset = -animOffset * 1.5; // 不同的偏移速度
    ctx.stroke();
  } else {
    ctx.stroke();
  }
  
  // 重置虚线设置
  ctx.setLineDash([]);
  ctx.closePath();
  
  // 如果需要显示标签
  if (line.showLabel) {
    // 计算标签位置（线段中点）
    const midX = (line.start.x + line.end.x) / 2;
    const midY = (line.start.y + line.end.y) / 2;
    
    // 绘制线的标签
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(line.label || `${line.id}`, midX + 5, midY - 5);
  }
};

// 绘制角度
export const drawAngle = (ctx: CanvasRenderingContext2D, angle: Angle) => {
  // 绘制两条线段
  // 注意：这里我们不直接调用drawLine，因为我们只需要绘制线段本身，不需要标签等
  
  // 绘制第一条线段
  ctx.beginPath();
  ctx.moveTo(angle.vertex.x, angle.vertex.y);
  ctx.lineTo(angle.line1.end.x, angle.line1.end.y);
  ctx.strokeStyle = angle.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  // 绘制第二条线段
  ctx.beginPath();
  ctx.moveTo(angle.vertex.x, angle.vertex.y);
  ctx.lineTo(angle.line2.end.x, angle.line2.end.y);
  ctx.strokeStyle = angle.color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  // 计算角度
  const angle1 = Math.atan2(angle.line1.end.y - angle.vertex.y, angle.line1.end.x - angle.vertex.x);
  const angle2 = Math.atan2(angle.line2.end.y - angle.vertex.y, angle.line2.end.x - angle.vertex.x);
  let angleDiff = Math.abs(angle1 - angle2) * (180 / Math.PI);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  // 如果需要显示弧
  if (angle.showArc) {
    // 绘制角度弧
    ctx.beginPath();
    ctx.arc(angle.vertex.x, angle.vertex.y, angle.radius, Math.min(angle1, angle2), Math.max(angle1, angle2));
    ctx.strokeStyle = angle.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
  }

  // 如果需要显示角度值
  if (angle.showDegree) {
    // 显示角度值
    const midAngle = (angle1 + angle2) / 2;
    const textX = angle.vertex.x + (angle.radius + 10) * Math.cos(midAngle);
    const textY = angle.vertex.y + (angle.radius + 10) * Math.sin(midAngle);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`${angleDiff.toFixed(1)}°`, textX, textY);
  }
  
  // 如果需要显示标签
  if (angle.showLabel) {
    // 计算标签位置
    const midAngle = (angle1 + angle2) / 2;
    const labelX = angle.vertex.x + (angle.radius + 20) * Math.cos(midAngle);
    const labelY = angle.vertex.y + (angle.radius + 20) * Math.sin(midAngle);
    
    // 绘制角度的标签
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(angle.label || `${angle.id}`, labelX, labelY);
  }
};

// 绘制圆
export const drawCircle = (ctx: CanvasRenderingContext2D, circle: Circle) => {
  ctx.beginPath();
  ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
  
  // 设置圆的样式
  ctx.strokeStyle = circle.color;
  ctx.lineWidth = circle.width;
  
  // 根据线条样式设置虚线
  if (circle.style === 'dashed') {
    ctx.setLineDash([8, 4]);
  } else if (circle.style === 'dotted') {
    ctx.setLineDash([2, 2]);
  } else {
    ctx.setLineDash([]);
  }
  
  // 绘制圆的轮廓
  ctx.stroke();
  
  // 如果需要填充
  if (circle.fill) {
    ctx.fillStyle = circle.fillColor;
    ctx.fill();
  }
  
  // 重置虚线设置
  ctx.setLineDash([]);
  ctx.closePath();
  
  // 如果需要显示标签
  if (circle.showLabel) {
    // 计算标签位置（圆的右侧）
    const labelX = circle.center.x + circle.radius + 5;
    const labelY = circle.center.y;
    
    // 绘制圆的标签
    ctx.font = '10px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(circle.label || `${circle.id}`, labelX, labelY);
  }
};

// 绘制临时线段
export const drawTempLine = (
  ctx: CanvasRenderingContext2D,
  startPoint: Point,
  mousePosition: {x: number, y: number},
  style: {color: string, width: number} = {color: '#2ecc71', width: 2}
) => {
  ctx.beginPath();
  ctx.moveTo(startPoint.x, startPoint.y);
  ctx.lineTo(mousePosition.x, mousePosition.y);
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.setLineDash([5, 3]); // 设置虚线样式
  ctx.stroke();
  ctx.setLineDash([]); // 重置为实线
  ctx.closePath();
};

// 绘制临时角度
export const drawTempAngle = (
  ctx: CanvasRenderingContext2D,
  tempPoints: Point[],
  mousePosition: {x: number, y: number},
  style: {color: string, radius: number} = {color: '#e74c3c', radius: 20}
) => {
  if (tempPoints.length === 1) {
    // 绘制第一条临时线
    drawTempLine(ctx, tempPoints[0], mousePosition, {color: style.color, width: 2});
  } else if (tempPoints.length === 2) {
    // 绘制两条临时线和角度
    const point1 = tempPoints[0];
    const vertex = tempPoints[1];
    
    // 第一条线 (固定)
    ctx.beginPath();
    ctx.moveTo(vertex.x, vertex.y);
    ctx.lineTo(point1.x, point1.y);
    ctx.strokeStyle = style.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
    
    // 第二条线 (临时)
    ctx.beginPath();
    ctx.moveTo(vertex.x, vertex.y);
    ctx.lineTo(mousePosition.x, mousePosition.y);
    ctx.strokeStyle = style.color;
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
    ctx.beginPath();
    ctx.arc(vertex.x, vertex.y, style.radius, Math.min(angle1, angle2), Math.max(angle1, angle2));
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.closePath();
    
    // 显示临时角度值
    const midAngle = (angle1 + angle2) / 2;
    const textX = vertex.x + (style.radius + 10) * Math.cos(midAngle);
    const textY = vertex.y + (style.radius + 10) * Math.sin(midAngle);
    ctx.font = '12px Arial';
    ctx.fillStyle = '#000';
    ctx.fillText(`${angleDiff.toFixed(1)}°`, textX, textY);
  }
};

// 绘制临时圆
export const drawTempCircle = (
  ctx: CanvasRenderingContext2D,
  center: Point,
  mousePosition: {x: number, y: number},
  style: {color: string, width: number} = {color: '#9b59b6', width: 2}
) => {
  const radius = Math.sqrt(
    Math.pow(mousePosition.x - center.x, 2) + Math.pow(mousePosition.y - center.y, 2)
  );
  
  // 绘制临时圆
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.setLineDash([5, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.closePath();
  
  // 绘制半径线
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(mousePosition.x, mousePosition.y);
  ctx.strokeStyle = style.color;
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
};