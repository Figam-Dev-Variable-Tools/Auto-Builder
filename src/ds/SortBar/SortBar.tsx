import type { ReactNode } from 'react'
import { ListToolbar } from '../ListToolbar/ListToolbar'
import type { SelectOption } from '../Select/Select'

/**
 * SortBar — ListToolbar(layout='site')의 얇은 파사드.
 *
 * 실제 렌더·CSS는 전부 ListToolbar.tsx/.module.css로 옮겼다(중복 유지 금지) — 이 파일은
 * 이름·prop 표면만 남긴다. 그대로 두는 이유는 둘:
 *   1) ShopPage 등 기존 호출부가 이 이름/타입을 그대로 쓴다.
 *   2) Figma 세트 DS/SortBar(figma-plugin/src/generators/site.ts)가 이 타입의 prop 이름
 *      (total·totalLabel·totalSuffix·selects·leadingActions·actions)을 그대로 검증 기준으로 삼는다 —
 *      이름을 바꾸거나 파일을 지우면 verify-naming의 ALLOWLIST(SortBar 항목)가 무효(stale)가 된다.
 */
export type SortBarSelect = {
  /** React key 겸 식별자 */
  key: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export type SortBarProps = {
  /** 총 개수 — 없으면 좌측 문구를 그리지 않고 컨트롤만 우측에 붙는다 */
  total?: number
  /** 총 개수 앞 라벨. 기본 '전체' → "전체 6개" */
  totalLabel?: string
  /** 총 개수 뒤 문구. 예: '의 상품이 있습니다.' → "총 24개의 상품이 있습니다." */
  totalSuffix?: string
  selects?: SortBarSelect[]
  /** Select **왼쪽** 액션(뷰 전환 등) — 레퍼런스처럼 뷰 스위치가 정렬 Select 앞에 설 때 쓴다 */
  leadingActions?: ReactNode
  /** Select 오른쪽 추가 액션(버튼 등) */
  actions?: ReactNode
}

export function SortBar({ total, totalLabel, totalSuffix, selects, leadingActions, actions }: SortBarProps) {
  return (
    <ListToolbar
      layout="site"
      total={total}
      totalLabel={totalLabel}
      totalSuffix={totalSuffix}
      selects={selects}
      leadingActions={leadingActions}
      actions={actions}
    />
  )
}
