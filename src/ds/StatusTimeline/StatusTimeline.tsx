import type { ReactNode } from 'react'
import { TimelineProgress } from '../Timeline/Timeline'

/**
 * StatusTimeline — TimelineProgress(Timeline.tsx에 함께 사는, 구 StatusTimeline 흡수 컴포넌트)의
 * 얇은 파사드.
 *
 * 실제 렌더·CSS는 전부 Timeline.tsx/.module.css(.progress* 클래스)로 옮겼다(중복 유지 금지) —
 * 이 파일은 이름·prop 표면만 남긴다. 그대로 두는 이유는 둘:
 *   1) ProductDetail·InquiryDetail·InquiryApplicationDetail 등 기존 호출부가 이 이름/타입을 그대로 쓴다.
 *   2) Figma 세트 DS/StatusTimeline(figma-plugin/src/generators/admin.ts)이 이 타입의 prop 이름
 *      (steps·direction·showMeta·doneIcon·skippedIcon)을 그대로 검증 기준으로 삼는다 — 이름을 바꾸거나
 *      파일을 지우면 verify-naming의 ALLOWLIST(StatusTimeline 항목)가 무효(stale)가 된다.
 */
export type StatusStep = {
  key: string
  label: string
  /** 처리 시각 */
  at?: string
  /** 처리 담당자 */
  by?: string
  state: 'done' | 'current' | 'todo' | 'skipped'
}

export type StatusTimelineProps = {
  steps: StatusStep[]
  direction?: 'horizontal' | 'vertical'
  /**
   * 시각·담당자 줄(at · by) 노출. 기본 true.
   * 좁은 aside나 헤더 요약처럼 '어디까지 왔는지'만 보이면 되는 자리에서 끄면
   * 단계 라벨만 남아 가로형이 짜부라지지 않는다.
   */
  showMeta?: boolean
  /**
   * done 단계의 점 안 마크. 기본 체크(Check).
   * 도메인마다 '완료'의 그림이 달라서(결제 완료=원화, 배송 완료=박스) 노드로 갈아끼울 수 있게 연다.
   */
  doneIcon?: ReactNode
  /** skipped 단계의 점 안 마크. 기본 빼기(Minus) — '건너뜀'을 그림으로도 알린다 */
  skippedIcon?: ReactNode
}

export function StatusTimeline({
  steps,
  direction,
  showMeta,
  doneIcon,
  skippedIcon,
}: StatusTimelineProps) {
  return (
    <TimelineProgress
      steps={steps}
      direction={direction}
      showMeta={showMeta}
      doneIcon={doneIcon}
      skippedIcon={skippedIcon}
    />
  )
}
