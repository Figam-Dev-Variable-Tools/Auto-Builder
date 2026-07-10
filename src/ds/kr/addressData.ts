// KR 주소 샘플 데이터 (§9) — KrPostcodeSearch/KrAddressAutocomplete가 공유한다.
// 실제 서비스에서는 카카오(다음) 우편번호 서비스·주소 검색 API가 이 데이터를 대체한다.

export type KrAddress = {
  /** 우편번호 5자리 */
  postcode: string
  /** 도로명 주소 */
  road: string
  /** 지번 주소 */
  jibun: string
  /** 건물명 (선택) */
  building?: string
}

export const SAMPLE_ADDRESSES: KrAddress[] = [
  { postcode: '06236', road: '서울 강남구 테헤란로 152', jibun: '서울 강남구 역삼동 737', building: '강남파이낸스센터' },
  { postcode: '04524', road: '서울 중구 세종대로 110', jibun: '서울 중구 태평로1가 31', building: '서울특별시청' },
  { postcode: '03045', road: '서울 종로구 사직로 161', jibun: '서울 종로구 세종로 1-1', building: '경복궁' },
  { postcode: '07305', road: '서울 영등포구 여의대로 108', jibun: '서울 영등포구 여의도동 23', building: '파크원 타워1' },
  { postcode: '04763', road: '서울 성동구 왕십리로 222', jibun: '서울 성동구 사근동 산1-2', building: '한양대학교' },
  { postcode: '13529', road: '경기 성남시 분당구 판교역로 235', jibun: '경기 성남시 분당구 삼평동 681', building: '에이치스퀘어 N동' },
  { postcode: '16677', road: '경기 수원시 영통구 삼성로 129', jibun: '경기 수원시 영통구 매탄동 416', building: '삼성디지털시티' },
  { postcode: '48058', road: '부산 해운대구 센텀중앙로 79', jibun: '부산 해운대구 재송동 1209', building: '센텀사이언스파크' },
  { postcode: '21554', road: '인천 남동구 정각로 29', jibun: '인천 남동구 구월동 1138', building: '인천광역시청' },
  { postcode: '34126', road: '대전 유성구 대학로 99', jibun: '대전 유성구 궁동 220', building: '충남대학교' },
  { postcode: '63309', road: '제주 제주시 첨단로 242', jibun: '제주 제주시 영평동 2181', building: '카카오 본사' },
]

/** 공백 단위 토큰이 모두 포함되는 주소를 반환한다. 빈 질의는 전체 목록. */
export function searchAddresses(query: string): KrAddress[] {
  const tokens = query.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return SAMPLE_ADDRESSES
  return SAMPLE_ADDRESSES.filter((address) => {
    const haystack = `${address.postcode} ${address.road} ${address.jibun} ${address.building ?? ''}`
    return tokens.every((token) => haystack.includes(token))
  })
}
