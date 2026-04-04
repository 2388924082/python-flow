import { ref, type Ref } from 'vue'

export interface ResizeState {
  size: Ref<number>
  isDragging: Ref<boolean>
  handleMouseDown: (e: MouseEvent) => void
}

export function useResize(options: {
  minSize: number
  maxSize: number
  initialSize: number
  direction: 'horizontal' | 'vertical'
}): ResizeState {
  const { minSize, maxSize, initialSize, direction } = options

  const size = ref(initialSize)
  const isDragging = ref(false)
  let startPos = 0
  let startSize = 0

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.value = true
    startPos = direction === 'horizontal' ? e.clientX : e.clientY
    startSize = size.value
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
    const delta = currentPos - startPos
    const newSize = Math.min(Math.max(startSize + delta, minSize), maxSize)
    size.value = newSize
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  return {
    size,
    isDragging,
    handleMouseDown
  }
}
