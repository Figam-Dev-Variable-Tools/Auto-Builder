import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Button } from '../../Button/Button'
import styles from './KrSignaturePad.module.css'

// 전자서명 패드 (§9 기타) — 포인터 이벤트 기반 캔버스 서명. 마우스·터치·펜을 모두 지원하고
// devicePixelRatio로 backing store를 스케일해 선을 선명하게 그린다. 스트로크는 ref에 보관해
// 되돌리기(undo) 시 전체를 다시 그린다. 프로덕션에서는 접근성을 위해 텍스트 입력 대체 수단을
// 함께 제공해야 한다(스토리 참고).

type Point = { x: number; y: number }

export type KrSignaturePadProps = {
  width?: number
  height?: number
  disabled?: boolean
  onChange?: (dataUrl: string | null) => void
}

export function KrSignaturePad({
  width = 320,
  height = 160,
  disabled = false,
  onChange,
}: KrSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Point[][]>([])
  const currentRef = useRef<Point[] | null>(null)
  const drawingRef = useRef(false)
  const [isEmpty, setIsEmpty] = useState(true)

  // 그릴 때 현재 프리셋의 --ds-color-text를 읽어 프리셋 전환에 맞춘다
  function strokeColor(canvas: HTMLCanvasElement): string {
    const v = getComputedStyle(canvas).getPropertyValue('--ds-color-text').trim()
    return v || 'rgb(0, 0, 0)'
  }

  function drawStroke(ctx: CanvasRenderingContext2D, points: Point[]) {
    if (points.length === 0) return
    if (points.length === 1) {
      ctx.beginPath()
      ctx.arc(points[0].x, points[0].y, ctx.lineWidth / 2, 0, Math.PI * 2)
      ctx.fill()
      return
    }
    // 중점 기준 2차 베지어로 부드럽게 연결
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2
      const midY = (points[i].y + points[i + 1].y) / 2
      ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
    }
    const last = points[points.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
  }

  function paint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const color = strokeColor(canvas)
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const strokes = currentRef.current
      ? [...strokesRef.current, currentRef.current]
      : strokesRef.current
    for (const s of strokes) drawStroke(ctx, s)
  }

  // 캔버스 backing store를 dpr에 맞춰 잡고 다시 그린다
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    paint()
  }, [width, height])

  function posFromEvent(e: ReactPointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = true
    currentRef.current = [posFromEvent(e)]
    paint()
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || currentRef.current == null) return
    e.preventDefault()
    currentRef.current.push(posFromEvent(e))
    paint()
  }

  function endStroke(e: ReactPointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    const points = currentRef.current
    currentRef.current = null
    if (points && points.length > 0) {
      strokesRef.current = [...strokesRef.current, points]
      setIsEmpty(false)
      paint()
      emit()
    }
  }

  function emit() {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange?.(canvas.toDataURL('image/png'))
  }

  function clear() {
    strokesRef.current = []
    currentRef.current = null
    drawingRef.current = false
    setIsEmpty(true)
    paint()
    onChange?.(null)
  }

  function undo() {
    if (strokesRef.current.length === 0) return
    strokesRef.current = strokesRef.current.slice(0, -1)
    const empty = strokesRef.current.length === 0
    setIsEmpty(empty)
    paint()
    if (empty) onChange?.(null)
    else emit()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="전자서명 입력 영역"
          className={[styles.canvas, disabled ? styles.disabled : ''].filter(Boolean).join(' ')}
          style={{ width, height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
        />
        {isEmpty && (
          <div className={styles.overlay} aria-hidden="true">
            <span className={styles.guide} />
            <span className={styles.placeholder}>여기에 서명해 주세요</span>
          </div>
        )}
      </div>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          size="sm"
          label="되돌리기"
          disabled={disabled || isEmpty}
          onClick={undo}
        />
        <Button
          variant="secondary"
          size="sm"
          label="지우기"
          disabled={disabled || isEmpty}
          onClick={clear}
        />
      </div>
    </div>
  )
}
