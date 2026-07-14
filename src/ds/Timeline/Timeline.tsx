import type { ReactNode } from 'react'
import { Check, Minus } from 'lucide-react'
import styles from './Timeline.module.css'

export type TimelineItem = {
  id: string
  title: string
  description?: string
  time?: string
  status?: 'done' | 'active' | 'pending'
}

export type TimelineProps = {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => {
        const status = item.status ?? 'pending'
        return (
          <li key={item.id} className={[styles.item, styles[status]].join(' ')}>
            <span className={styles.dot} aria-hidden="true">
              {status === 'done' && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2.5 6.5L5 9L9.5 3.5" />
                </svg>
              )}
            </span>
            <div className={styles.content}>
              <div className={styles.head}>
                <span className={styles.title}>{item.title}</span>
                {item.time != null && <span className={styles.time}>{item.time}</span>}
              </div>
              {item.description != null && <p className={styles.description}>{item.description}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// TimelineProgress — 구 StatusTimeline 흡수. Timeline과 시각 언어(20px 점 · 2px 연결선 ·
// done=success 체크 · current=primary 링)는 같지만 역할이 다르다:
//   - Timeline         : 시간순 **이벤트 로그**. items가 계속 쌓이고 순서가 곧 시간이다.
//   - TimelineProgress : 정해진 **단계 진행**. steps 수가 고정이고, 건너뛴 단계(skipped)와
//                        가로 진행 표시(direction)가 필요하다.
//
// Timeline과 다른 export로 남기는 이유(같은 컴포넌트에 얹지 않는 이유):
// Figma DS/Timeline 세트는 items[]만 검증 대상으로 삼는다(scripts/lib/ds-props.mjs는 파일당
// 첫 export type ...Props만 그 세트의 코드 짝으로 읽는다). TimelineProgress의 축(direction·showMeta·
// doneIcon·skippedIcon)을 Timeline의 props에 얹으면 기존 DS/Timeline 세트가 그 축들을 표현하지 못해
// naming 게이트가 깨진다 — 대신 CSS Module과 파일만 공유하고 컴포넌트/타입은 분리해 둔다
// (StatusTimeline은 이 컴포넌트의 파사드다).
// ══════════════════════════════════════════════════════════════════════════

export type TimelineStep = {
  key: string
  label: string
  /** 처리 시각 */
  at?: string
  /** 처리 담당자 */
  by?: string
  state: 'done' | 'current' | 'todo' | 'skipped'
}

export type TimelineProgressProps = {
  steps: TimelineStep[]
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

/** progress 단계 상태 → CSS 클래스. styles[key] 동적 접근 대신 명시 맵으로 오타를 막는다. */
const PROGRESS_STATE_CLASS: Record<TimelineStep['state'], string> = {
  done: styles.progressDone,
  current: styles.progressCurrent,
  todo: styles.progressTodo,
  skipped: styles.progressSkipped,
}

export function TimelineProgress({
  steps,
  direction = 'vertical',
  showMeta = true,
  doneIcon,
  skippedIcon,
}: TimelineProgressProps) {
  const directionClass = direction === 'horizontal' ? styles.progressHorizontal : styles.progressVertical
  const rootClassName = [styles.progressRoot, directionClass].join(' ')

  return (
    <ol className={rootClassName}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        // 연결선은 "이 단계에서 다음 단계로" 가는 구간 — 이 단계가 done일 때만 채운다
        const connectorClassName = [
          styles.progressConnector,
          step.state === 'done' ? styles.progressConnectorDone : '',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <li key={step.key} className={[styles.progressStep, PROGRESS_STATE_CLASS[step.state]].join(' ')}>
            <div className={styles.progressMarker}>
              <span className={styles.progressDot} aria-hidden="true">
                {step.state === 'done' && (doneIcon ?? <Check size={12} strokeWidth={3} />)}
                {step.state === 'skipped' && (skippedIcon ?? <Minus size={12} strokeWidth={3} />)}
              </span>
              {!isLast && <span className={connectorClassName} aria-hidden="true" />}
            </div>

            <div className={styles.progressContent}>
              <span className={styles.progressLabel} title={step.label}>
                {step.label}
              </span>
              {showMeta && (step.at != null || step.by != null) && (
                <span className={styles.progressMeta}>
                  {step.at != null && <span className={styles.progressAt}>{step.at}</span>}
                  {step.at != null && step.by != null && (
                    <span className={styles.progressSep} aria-hidden="true">
                      ·
                    </span>
                  )}
                  {step.by != null && <span className={styles.progressBy}>{step.by}</span>}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
