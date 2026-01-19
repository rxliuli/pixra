import { useRef } from 'react'

export function Renderer(props: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handleMouseDown = (_ev: React.MouseEvent<HTMLCanvasElement>) => {}
  return (
    <canvas
      className={props.className}
      ref={canvasRef}
      onMouseDown={handleMouseDown}
    />
  )
}
