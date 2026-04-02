import type { ReactNode } from 'react';
import { ResizeHandle } from './ResizeHandle';

interface ResizeState {
  size: number;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
}

interface LayoutProps {
  toolbox: ReactNode;
  configPanel: ReactNode;
  canvas: ReactNode;
  bottomPanel: ReactNode;
  toolboxResize: ResizeState;
  configPanelResize: ResizeState;
  bottomPanelResize: ResizeState;
  tabBar?: ReactNode;
}

export function Layout({
  toolbox,
  configPanel,
  canvas,
  bottomPanel,
  toolboxResize,
  configPanelResize,
  bottomPanelResize,
  tabBar,
}: LayoutProps) {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ position: 'relative', width: toolboxResize.size, flexShrink: 0 }}>
        {toolbox}
        <ResizeHandle
          direction="horizontal"
          onMouseDown={toolboxResize.handleMouseDown}
          isDragging={toolboxResize.isDragging}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tabBar}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {canvas}
        </div>

        <div
          style={{
            height: 4,
            flexShrink: 0,
            cursor: 'row-resize',
            background: bottomPanelResize.isDragging ? 'var(--accent-color)' : 'var(--border-color)',
            transition: bottomPanelResize.isDragging ? 'none' : 'background 0.15s',
          }}
          onMouseDown={bottomPanelResize.handleMouseDown}
        />

        {bottomPanel}
      </div>

      <div style={{ width: configPanelResize.size, flexShrink: 0, position: 'relative' }}>
        <ResizeHandle
          direction="horizontal"
          onMouseDown={configPanelResize.handleMouseDown}
          isDragging={configPanelResize.isDragging}
          side="left"
        />
        {configPanel}
      </div>
    </div>
  );
}
