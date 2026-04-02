interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function ResizeHandle({ direction, onMouseDown, isDragging, side = 'right' }: ResizeHandleProps) {
  const baseStyle = {
    position: 'absolute' as const,
    background: isDragging ? 'var(--accent-color)' : 'var(--border-color)',
    transition: isDragging ? 'none' : 'background 0.15s',
    zIndex: 10,
  };

  const horizontalLeftStyle = {
    ...baseStyle,
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    cursor: 'col-resize' as const,
  };

  const horizontalRightStyle = {
    ...baseStyle,
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
    cursor: 'col-resize' as const,
  };

  const verticalStyle = {
    ...baseStyle,
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    cursor: 'row-resize' as const,
  };

  const getStyle = () => {
    if (direction === 'horizontal') {
      return side === 'left' ? horizontalLeftStyle : horizontalRightStyle;
    }
    return verticalStyle;
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={getStyle()}
    />
  );
}
