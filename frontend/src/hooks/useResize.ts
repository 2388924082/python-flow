import { useState, useCallback, useRef, useEffect } from 'react';

type LogCallback = (message: string, level: 'debug' | 'info' | 'warn' | 'error') => void;

interface UseResizeOptions {
  minSize: number;
  maxSize: number;
  initialSize: number;
  direction: 'horizontal' | 'vertical';
  side?: 'left' | 'right' | 'top' | 'bottom';
  onLog?: LogCallback;
}

export function useResize({ minSize, maxSize, initialSize, direction, side = 'right', onLog }: UseResizeOptions) {
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(size);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizeRef.current = size;
    onLog?.(`[${direction}] resize start, side=${side}, startPos=${startPosRef.current}`, 'debug');
  }, [direction, size, side, onLog]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPosRef.current;

      let newSize: number;
      if (direction === 'horizontal') {
        onLog?.(`horizontal delta: ${delta}, side: ${side}`, 'debug');
        if (side === 'right') {
          newSize = startSizeRef.current + delta;
          onLog?.(`horizontal right newSize: ${newSize}`, 'debug');
        } else {
          newSize = startSizeRef.current - delta;
          onLog?.(`horizontal left newSize: ${newSize}`, 'debug');
        }
      } else {
        newSize = startSizeRef.current - delta;
      }

      setSize(Math.min(Math.max(newSize, minSize), maxSize));
    };

    const handleMouseUp = () => {
      onLog?.(`[${direction}] resize end, final size: ${size}`, 'debug');
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, direction, minSize, maxSize, side, onLog, size]);

  return { size, isDragging, handleMouseDown };
}
