# components/ — UI 프리미티브 & 기능 컴포넌트

전역 아키텍처는 루트 `CLAUDE.md` 참고.

## 구조
```
components/
  layout/     Header
  ui/         디자인 시스템 프리미티브 (아래 목록)
  equipment/  EquipmentCard, EquipmentGrid, CategoryChips, DateRangeCalendar
  rentals/    RentalListItem, RentalTimeline, 상태별 ActionPanel(등록자/대여자용 각각)
  reports/    ReportTypeRadioList, ReportStatusTimeline
  admin/      AdminStatCards, AdminTable(탭별 컬럼 정의는 데이터로 주입), AdminDetailPanel
```

## ui/ 프리미티브 목록 (핸드오프 명세를 그대로 컴포넌트화)
`Button`(primary/secondary), `Badge`(팔레트는 `lib/status.ts` 매핑 함수로만 결정),
`Chip`(카테고리/필터 공용, selected 상태), `Tabs`, `Input`, `Textarea`, `Select`,
`ConfirmModal`(useConfirm 훅과 함께 루트에 1개만 마운트), `Table`(헤더/행 스펙 공용),
`Timeline`(가로형: 대여 상세용 / 세로형: 신고 상세·관리자 처리이력용, variant prop으로 분기),
`PhotoUploadSlot`(점선 보더, 4슬롯 그리드로 조합), `ImagePlaceholder`(스트라이프 패턴),
`StarRating`, `StatCard`.

## 컨벤션
- 모든 색상·spacing·radius·font-size는 Tailwind 유틸/`@theme` 토큰 사용, 인라인 style이나
  임의 값(`[#123456]` 등) 금지 — 핸드오프 값은 전부 토큰화되어 있어야 함.
- 상태 배지 색은 컴포넌트에서 하드코딩하지 않고 항상 `lib/status.ts`의 매핑 함수를 통해서만
  가져온다 (배지 팔레트가 여러 화면에서 재사용되므로 단일 소스 유지).
- `ui/`는 도메인 지식 없이 순수 프레젠테이셔널만 (mock store를 import하지 않는다).
  기능 컴포넌트(`equipment/`, `rentals/` 등)만 `useMockData()`를 호출.
- 파괴적 액션 버튼은 직접 액션을 호출하지 않고 항상 `useConfirm()`을 거쳐 확인 후 실행.
- 반응형은 1차 스코프 아님 (핸드오프가 데스크톱 기준 고정 max-width) — 임의로 브레이크포인트
  추가하지 않는다. 필요해지면 루트 CLAUDE.md에 먼저 결정 기록.
