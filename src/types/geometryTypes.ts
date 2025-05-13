// 几何图形类型定义

export type Point = {
  id: number;  // 自增ID
  x: number;   // x坐标
  y: number;   // y坐标
  label: string; // 标签文本
  size: number;  // 点大小
  color: string; // 点颜色
  showLabel: boolean; // 是否展示label标签
  movable: boolean;   // 是否可移动
};

export type Line = {
  id: number;      // 自增ID
  start: Point;    // 起点
  end: Point;      // 终点
  color: string;   // 线条颜色
  width: number;   // 线条宽度
  style: 'solid' | 'dashed' | 'dotted'; // 线条样式
  label: string;   // 标签文本
  showLabel: boolean; // 是否展示标签
  animated: boolean; // 是否动画效果
};

export type Angle = {
  id: number;      // 自增ID
  vertex: Point;   // 顶点
  line1: Line;     // 第一条线段
  line2: Line;     // 第二条线段
  color: string;   // 角度颜色
  radius: number;  // 角度弧的半径
  showArc: boolean; // 是否显示弧
  showDegree: boolean; // 是否显示角度值
  label: string;   // 标签文本
  showLabel: boolean; // 是否展示标签
};

export type Circle = {
  id: number;      // 自增ID
  center: Point;   // 圆心
  radius: number;  // 半径
  color: string;   // 圆的颜色
  width: number;   // 线条宽度
  style: 'solid' | 'dashed' | 'dotted'; // 线条样式
  fill: boolean;   // 是否填充
  fillColor: string; // 填充颜色
  label: string;   // 标签文本
  showLabel: boolean; // 是否展示标签
};

export type Tool = 'point' | 'line' | 'angle' | 'circle';