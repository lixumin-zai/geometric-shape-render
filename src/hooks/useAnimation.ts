import { useState, useRef, useCallback, useEffect } from 'react';

export const useAnimation = () => {
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

  // 切换线段动画
  const toggleLineAnimation = (lineId: number) => {
    if (selectedLineId === lineId) {
      setSelectedLineId(null);
      setAnimationActive(false);
    } else {
      setSelectedLineId(lineId);
      setAnimationActive(true);
    }
  };

  return {
    animationActive,
    animationOffset,
    selectedLineId,
    toggleLineAnimation
  };
};