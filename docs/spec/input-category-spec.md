# Input 카테고리 빌드 스펙 — Storybook → Figma

> 이 문서는 실제 `storybook-static/index.json`, `packages/figma-story-tools/snapshots/snapshots.json`,
> `src/ds/**` 소스를 직접 읽어 작성했다. 추측·창작 없음. 스토리에 없는 상태는 "스토리에 없음"으로 명시했다.

## 0. 후보군 검증

의뢰받은 15개 후보는 **전부 Storybook에 존재**한다 (`3. 컴포넌트/<Name>` 아래, 각 `Docs`/`Default`/`States|All Variants` 스토리 보유):

TextField, Textarea, Select, SearchField, EmailField, PasswordField, NumberField, OtpField, CurrencyField, MultiSelect, Autocomplete, Slider, Upload, FileUpload, ImageUpload — 드롭 대상 없음.

**후보군에서 누락된 input-유사 컴포넌트** (Storybook엔 존재, 이번 스펙 범위 밖):
- `DatePicker`, `DateRangePicker`, `TimePicker` — `label/value/onChange/error/helperText` 형태의 진짜 값-입력 필드(내부에 `Calendar` 임베드). 별도 "DateTime 입력" 카테고리로 다룰 것을 제안.
- `Dropdown`은 겉보기엔 Select와 비슷하지만 실제로는 `items: {label, onSelect, danger, divider}[]` 액션 메뉴(네비게이션 패턴)이며 값(value)을 갖지 않는다 — Input 카테고리 아님, 제외.

## 1. 개요 표 (단순 → 복합 순)

| # | 이름 | Story ID(s) | 스냅샷 파일 (뷰) | 분류 | Atomic | 한 줄 설명 |
|---|---|---|---|---|---|---|
| 1 | TextField | `textfield--default`, `--all-variants`, `--showcase` | `049-TextField.png` (All Variants) | 단순 | Molecule | 라벨·설명·헬퍼텍스트·글자수 카운터를 지원하는 기본 한 줄 텍스트 입력 |
| 2 | EmailField | `emailfield--default`, `--states` | `024-EmailField.png` (States) | 단순 | Molecule | 블러 시 이메일 형식을 자동 검증해 에러/성공을 표시하는 입력 |
| 3 | PasswordField | `passwordfield--default`, `--states` | `037-PasswordField.png` (States) | 단순 | Molecule | 표시/숨김 눈 아이콘 토글이 붙은 비밀번호 입력 |
| 4 | SearchField | `searchfield--default`, `--states` | `040-SearchField.png` (States) | 단순 | Molecule | 검색 아이콘 + 값이 있을 때만 나타나는 지우기(×) 버튼을 가진 검색창 |
| 5 | NumberField | `numberfield--default`, `--states` | `034-NumberField.png` (States) | 단순 | Molecule | 단위 표기 + 증감(−/+) 스테퍼가 붙은 숫자 입력 |
| 6 | CurrencyField | `currencyfield--default`, `--states` | `018-CurrencyField.png` (States) | 단순 | Molecule | 천단위 콤마 자동 포맷 + 통화 단위 표기가 붙은 금액 입력 |
| 7 | OtpField | `otpfield--default`, `--states` | `035-OtpField.png` (States) | 단순 | Molecule | 자릿수만큼 분리된 셀에 입력하는 인증번호(OTP) 필드 |
| 8 | Textarea | `textarea--default`, `--states` | `048-Textarea.png` (States) | 단순 | Molecule | 자동 높이 조절 + 글자수 카운터가 붙은 여러 줄 텍스트 입력 |
| 9 | Select | `select--default`, `--states` | `041-Select.png` (States) | 복합 | Organism | 옵션 목록에서 하나를 고르는 단일 선택 드롭다운 |
| 10 | MultiSelect | `multiselect--default`, `--states` | `032-MultiSelect.png` (States) | 복합 | Organism | 선택된 항목을 칩(chip)으로 트리거에 표시하는 다중 선택 드롭다운 |
| 11 | Autocomplete | `autocomplete--default`, `--states` | `007-Autocomplete.png` (States) | 복합 | Organism | 입력값에 매칭되는 후보를 하이라이트해 보여주는 자동완성 입력 |
| 12 | Slider | `slider--default`, `--states` | `043-Slider.png` (States) | 복합 | Molecule | 드래그로 수치를 조절하는 range 슬라이더 |
| 13 | Upload | `upload--default`, `--states` | `056-Upload.png` (States) | 복합 | Organism | 클릭/드래그앤드롭으로 파일을 선택하는 드롭존 (파일 목록 UI는 없음) |
| 14 | FileUpload | `fileupload--default`, `--states` | `025-FileUpload.png` (States) | 복합 | Organism | Upload 드롭존 + 아이콘·이름·용량·삭제버튼이 있는 파일 목록 |
| 15 | ImageUpload | `imageupload--default`, `--states` | `028-ImageUpload.png` (States) | 복합 | Organism | Upload 드롭존 + 이미지 썸네일 그리드(추가 타일 포함) |

모든 컴포넌트에 `docs` 스토리(`--docs`)도 존재하지만 렌더 대상이 아니므로 표에서 생략.

---

## 2. 단순 그룹 — TextField 계열 (단일 입력 + 라벨/설명/에러)

### 2.1 TextField
- Props: `label`(text) · `placeholder`(text) · `error`(boolean-variant) · `success`(boolean-variant, `error`가 있으면 무시됨) · `disabled`(boolean-variant) · `readOnly`(boolean-variant) · `description`(text) + `showDescription`(boolean-show) · `helperText`(text) · `maxLength`(number) + `showCounter`(boolean-show)
- 주의: 다른 필드들과 달리 `required` prop이 **없다** — 필수 표시(*) 상태를 만들지 말 것.
- 렌더할 상태 (All Variants + Showcase 스토리 기준):
  1. Default (빈 값, placeholder만)
  2. Filled + description (설명 텍스트 노출)
  3. Focus (Showcase 스토리는 CSS로 포커스 링만 흉내낸 데모 — 실제 `:focus` 스타일은 `TextField.module.css` 참조해 재현)
  4. Counter (maxLength + showCounter, 글자수 표시)
  5. Error (description 자리에 에러 문구, 또는 helperText 에러 문구)
  6. Success (helperText 성공 문구)
  7. Disabled
  8. **스토리에 없음** — ReadOnly (prop은 있으나 어떤 스토리도 사용 안 함, 수동 목업 필요)

### 2.2 EmailField
- Props: `label`(text, 기본 "이메일") · `placeholder`(text) · `validate`(boolean — 블러 시 자동 검증 on/off) · `disabled`(boolean-variant) · `required`(boolean-variant) · `helperText`(text)
- **error/success는 prop이 아니다** — 내부에서 `touched && valid/invalid`로 계산되어 blur 인터랙션 후에만 나타난다.
- 실제 States 스토리는 4개뿐이며 **에러/성공 상태를 시각적으로 보여주지 않는다** (정적 렌더라 touched=false 상태로 고정됨): 빈값+helper / 유효값+validate off / 유효값+disabled / 빈값+required.
- 렌더할 상태:
  1. Default (빈 값)
  2. Filled (유효 이메일, validate off — 스토리 그대로)
  3. Required (label에 * 없음 주의: asterisk는 CSS `styles.required`가 렌더하는지 InputBase 소스 확인 필요 — InputBase 기준으로는 required일 때 `*` 표시)
  4. Disabled
  5. **스토리에 없음, 수동 목업 필요** — Error (형식 불일치 시 "이메일 형식이 올바르지 않습니다." 헬퍼텍스트 + 빨간 보더)
  6. **스토리에 없음, 수동 목업 필요** — Success (유효 이메일 blur 후, 초록 보더)

### 2.3 PasswordField
- Props: `label`(text, 기본 "비밀번호") · `placeholder`(text) · `error`(boolean-variant) · `success`(boolean-variant) · `disabled`(boolean-variant) · `readOnly`(boolean-variant) · `required`(boolean-variant) · `helperText`(text) · `maxLength`(number) · `showToggle`(boolean-show, 기본 true — 눈 아이콘 표시/숨김)
- 렌더할 상태 (States 스토리 6개 그대로):
  1. Default + helper ("8자 이상…")
  2. Filled (마스킹된 값)
  3. Error (helper "비밀번호가 너무 짧습니다.")
  4. Success (helper "사용 가능한 비밀번호입니다.")
  5. Disabled
  6. Required (빈 값 + label)
- **스토리에 없음**: `showToggle=false`(눈 아이콘 숨김), ReadOnly, 눈 아이콘 클릭 후 평문 표시 상태(인터랙션 필요) — 필요 시 수동 목업.

### 2.4 SearchField
- Props: `label`(text, optional) · `placeholder`(text) · `disabled`(boolean-variant) · `showClear`(boolean-show, 기본 true)
- **error/success/required/readOnly 없음** — 검증 개념이 없는 순수 검색창.
- Clear(×) 버튼은 prop이 아니라 `showClear && value !== ''`로 **자동 파생**되는 상태 — "값 있음"과 "clear 버튼 노출"은 항상 함께 다닌다.
- 렌더할 상태 (States 스토리 4개):
  1. Empty (clear 버튼 없음)
  2. Filled ("디자인 토큰", clear 버튼 노출)
  3. Custom label + placeholder ("문서 검색" / "키워드")
  4. Disabled ("비활성")

### 2.5 NumberField
- Props: `label`(text) · `min`/`max`/`step`(number) · `unit`(text, trailing) · `disabled`(boolean-variant) · `readOnly`(boolean-variant) · `helperText`(text)
- **error/success 없음** — 컴포넌트 자체에 해당 prop이 없다. 에러/성공 프레임을 만들지 말 것.
- 증감(−/+) 버튼은 항상 렌더되며 `atMin`/`atMax`(값이 min/max에 도달) 시 자동으로 각각 비활성화됨 — 이것도 파생 상태.
- 렌더할 상태 (States 스토리 4개 + 파생):
  1. Default (수량 1, min0/max99, unit "개")
  2. Custom step/unit (할인율 10, step5, unit "%")
  3. At-min (−버튼 비활성 상태 목업 — 스토리엔 값=min인 예시 없음, 수동 구성)
  4. At-max (+버튼 비활성 상태 목업 — 스토리엔 없음, 수동 구성)
  5. ReadOnly (고정값 42)
  6. Disabled (0)

### 2.6 CurrencyField
- Props: `label`(text, 기본 "금액") · `currency`(text, trailing, 기본 "원") · `placeholder`(text) · `disabled`(boolean-variant) · `readOnly`(boolean-variant) · `error`(boolean-variant) · `helperText`(text) · `max`(number — 초과 입력 차단, 시각 상태 아님)
- **success 없음** — error만 있고 success prop은 없다.
- 값은 항상 3자리 콤마 포맷으로 표시(`toLocaleString('ko-KR')`).
- 렌더할 상태 (States 스토리 5개):
  1. Filled (1,500,000)
  2. Empty + max 한도 안내 helper ("최대 50,000원까지…")
  3. ReadOnly + custom currency ("₩", "구독료")
  4. Error (helper "잔액이 부족합니다.")
  5. Disabled (empty)

### 2.7 OtpField
- Props: `label`(text, 기본 "인증번호") · `length`(number, 기본 6, argTypes range 4~8 — 자릿수만큼 셀 개수 결정) · `error`(boolean-variant) · `disabled`(boolean-variant) · `helperText`(text)
- InputBase를 쓰지 않는 독립 컴포넌트(자체 CSS 모듈) — N개의 1자리 `<input>` 셀 그리드.
- **success/readOnly/required 없음**.
- 렌더할 상태 (States 스토리 5개):
  1. Empty (전부 빈 셀)
  2. Partially filled (6자리 중 3자리 채움 — 마지막 채운 셀까지 `filled` 스타일)
  3. Filled + Error (6자리 전부 채움 + 에러 보더 + helper "인증번호가 일치하지 않습니다.")
  4. Length variant (4자리 PIN, label "PIN", 2자리 채움)
  5. Disabled (empty)

### 2.8 Textarea
- Props: `label`(text) · `placeholder`(text) · `rows`(number) · `maxLength`(number) + `showCounter`(boolean-show) · `autoResize`(boolean, 높이만 바뀌는 동작이라 시각 variant는 아님) · `error`(boolean-variant) · `disabled`(boolean-variant) · `readOnly`(boolean-variant) · `required`(boolean-variant) · `helperText`(text)
- **success 없음** — error만 있다.
- 렌더할 상태 (States 스토리 5개):
  1. Default (empty)
  2. Filled + Counter (maxLength 100, showCounter)
  3. Error (짧은 내용 + helper "10자 이상 입력하세요.")
  4. ReadOnly (내용 채워짐)
  5. Disabled (empty, placeholder "입력 불가")
- **스토리에 없음**: Required(* 표시) — prop은 있으나 States 스토리 어디에도 `required` 예시 없음, 수동 목업.

---

## 3. 복합 그룹 — Select / MultiSelect / Autocomplete / Slider / Upload 계열

### 3.1 Select
- Props: `label`(text) · `options`(SelectOption[] = `{value, label, disabled?}`, Figma에서는 고정 리스트 콘텐츠로 취급) · `placeholder`(text) · `disabled`(boolean-variant) · `error`(boolean-variant) · `helperText`(text)
- **success 없음**.
- ⚠️ **열림(open) 패널 상태가 어떤 스토리에도 없다.** `open`을 강제로 켜는 prop이 없고 States 스토리 4개는 전부 닫힌 트리거만 보여준다. 옵션 패널(선택됨 체크 아이콘, 비활성 옵션 회색 처리)은 `Select.module.css`의 `.panel/.option/.optionSelected/.optionDisabled` 클래스를 참고해 **수동으로 구성**해야 함.
- 렌더할 상태 (States 스토리 4개 + 수동 1개):
  1. Default (닫힘, placeholder "선택하세요")
  2. Selected (닫힘, "개발" 선택됨)
  3. Error (닫힘, helper "필수 항목입니다.")
  4. Disabled (닫힘, "디자인" 선택된 채 비활성)
  5. **수동 목업** — Open (트리거 아래 옵션 패널: 5개 옵션 중 1개 선택 체크 표시, 1개 비활성("기타 (비활성)") 옵션 회색 처리)

### 3.2 MultiSelect
- Props: `label`(text) · `options`(SelectOption[]) · `placeholder`(text) · `maxSelected`(number, 기능적 한도 — 시각 variant 아님) · `disabled`(boolean-variant) · `helperText`(text)
- **error/success 둘 다 없음** — Select와 달리 검증 상태 표현 수단이 아예 없다.
- 선택된 항목은 트리거 안에 제거 가능한 칩(chip)으로 렌더.
- ⚠️ Select와 마찬가지로 **열림 패널 상태가 스토리에 없음** — 체크박스형 옵션 리스트(`.checkbox/.checkboxChecked`)를 수동 구성해야 함.
- 렌더할 상태 (States 스토리 3개 + 수동 1개):
  1. Default (empty, placeholder)
  2. Selected (칩 2개: React, Svelte)
  3. Disabled (값 1개 있는 채 비활성)
  4. **수동 목업** — Open (체크박스 리스트 패널, 선택된 항목 체크됨, 비활성 옵션 표시)

### 3.3 Autocomplete
- Props: `label`(text) · `options`(string[]) · `placeholder`(text) · `disabled`(boolean-variant) · `error`(boolean-variant) · `helperText`(text) · `emptyText`(text) · `maxSuggestions`(number)
- **success/readOnly/required 없음**.
- ⚠️ 후보 패널도 열림 상태가 prop이 아니라 `onChange` 시점에만 `open=true`가 되므로, "값 있음" 스토리조차 **패널이 닫혀 있다**. 매칭 하이라이트(`Highlight` 컴포넌트, `.match` 클래스)와 빈 결과 문구(`emptyText`)를 보여주는 패널은 전부 **수동 목업** 대상.
- 렌더할 상태 (States 스토리 3개 + 수동 2개):
  1. Default (empty)
  2. Filled (값 "사과", 패널 닫힘)
  3. Disabled (empty)
  4. **수동 목업** — Open with suggestions (입력값과 매칭되는 부분 하이라이트된 후보 리스트, 예: "사과" 입력 시 "사과", "사과주스")
  5. **수동 목업** — Open, no results ("검색 결과가 없습니다." 빈 상태 문구)

### 3.4 Slider
- Props: `label`(text) · `min`/`max`/`step`(number) · `unit`(text) · `showValue`(boolean-show) · `disabled`(boolean-variant)
- **error/success/readOnly/required 전부 없음** — 순수 range 컨트롤이라 일반 필드 체크리스트(에러/성공)를 기계적으로 적용하지 말 것.
- 트랙 채움(`linear-gradient`)이 `value`에 따라 좌우 비율로 시각화됨 — Figma에서도 값별로 채움 폭이 달라야 함.
- 렌더할 상태 (States 스토리 6개 그대로):
  1. Min (0%)
  2. Mid (50%)
  3. Max (100%)
  4. Custom unit/range (가격 45,000원, min0/max100000/step1000)
  5. Disabled (30%)
  6. `showValue=false` (값 라벨 숨김, 트랙만)

### 3.5 Upload
- Props: `label`(text) · `accept`(text, MIME 필터 — 시각 아님) · `multiple`(boolean, 동작) · `maxFiles`(number, 기능 한도) · `disabled`(boolean-variant) · `helperText`(text) · `children`(ReactNode — 드롭존 안내 영역 커스텀 슬롯)
- Upload 자신은 **파일 목록을 렌더하지 않는다** (목록 UI는 FileUpload/ImageUpload가 담당) — `files` prop은 내부 add 로직에만 쓰이고 시각적으로 드러나지 않음.
- ⚠️ `dragOver` 상태(점선 보더 하이라이트, `.dragOver` 클래스)는 드래그 중에만 켜지는 임시 JS 상태라 **어떤 스토리에도 없음** — 수동 목업 필요.
- 렌더할 상태 (States 스토리 4개 + 수동 1개):
  1. Default (label 없음, 아이콘+안내문구만)
  2. Labeled + helper ("첨부 파일" / "PDF, DOCX 파일 · 최대 10MB")
  3. Disabled (helper "지금은 업로드할 수 없어요")
  4. Custom slot content (children으로 안내 문구 교체: "여기에 명세서를 끌어다 놓아 주세요")
  5. **수동 목업** — DragOver (점선 보더 강조 상태)

### 3.6 FileUpload
- Props: `label`(text) · `accept`(text) · `multiple`(boolean) · `maxFiles`(number) · `disabled`(boolean-variant) · `helperText`(text)
- Upload 드롭존 + 파일별 행(아이콘 + 파일명 + 용량(`formatBytes`) + 삭제 버튼) 리스트로 구성.
- `disabled`일 때도 파일 리스트는 그대로 보이고 **삭제 버튼만 `disabled` 속성으로 흐려짐** (숨겨지지 않음) — ImageUpload와 다른 동작이니 혼동 주의.
- 렌더할 상태 (States 스토리 3개):
  1. Empty (드롭존만)
  2. Filled (샘플 파일 2개: "용역_계약서_최종.pdf" 210.0 KB, "견적서.xlsx" 18.0 KB)
  3. Disabled (파일 2개 있는 채, 삭제 버튼 비활성 스타일)

### 3.7 ImageUpload
- Props: `label`(text) · `maxFiles`(number, 기본 6) · `disabled`(boolean-variant) · `helperText`(text) — `accept="image/*"`는 하드코딩(prop 아님)
- Upload 드롭존 + 정사각형 썸네일 그리드. 각 썸네일에 삭제(×) 버튼, 여유 슬롯이 있으면 마지막에 "+" 추가 타일.
- `disabled`일 때 **삭제 버튼과 추가 타일이 통째로 사라짐**(조건부 렌더 `!disabled &&`) — FileUpload처럼 흐려지기만 하는 게 아니라 아예 미노출. 반드시 구분해서 재현할 것.
- 렌더할 상태 (States 스토리 4개):
  1. Empty (드롭존만)
  2. Filled + add-tile 노출 (이미지 2장, maxFiles 6 — 여유 있어 + 타일 보임)
  3. Max reached, add-tile 숨김 (이미지 3장, maxFiles=3 — 꽉 차서 + 타일 없음)
  4. Disabled (이미지 2장, 삭제 버튼·+ 타일 모두 없음)

---

## 4. Figma 매핑 시 공통 주의사항

- `docs/spec/PROMPT_BUNDLE_V2.md` §3 매핑 규약 기준: `error/success/disabled/readOnly/required` 등 스타일이 바뀌는 boolean → **Variant property**, `showXxx` 형태(카운터·클리어버튼·토글 등 레이어 표시/숨김) → **Boolean property**, `label/placeholder/helperText` 등 텍스트 → **Text property**.
- 컴포넌트마다 지원하는 상태 집합이 다르다 — 특히 **success는 TextField/EmailField/PasswordField만 지원**하고 나머지(NumberField, CurrencyField, OtpField, Textarea, Select, MultiSelect, Autocomplete, Slider, Upload 계열)는 success prop 자체가 없다. "모든 필드에 8종 상태(default/filled/focus/error/success/disabled/readonly/required)를 기계적으로 찍어내지 말 것" — 실제 props에 없는 상태는 만들지 않는다.
- Select/MultiSelect/Autocomplete/Upload(dragOver)의 "열림/드래그" 상태는 **정적 스토리 스냅샷에 존재하지 않는다.** 각 컴포넌트의 `*.module.css`에서 해당 클래스(`.open`, `.panel`, `.dragOver` 등)를 직접 참고해 수동으로 프레임을 구성해야 하며, 실제 렌더 결과가 아니므로 검수 시 우선순위를 낮게 잡거나 별도 플래그로 표시할 것을 권장.
