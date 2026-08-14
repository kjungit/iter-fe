@AGENTS.md

# ITer — P2P 장비 대여 플랫폼

## Product
개인 소유 IT 장비(카메라·노트북·VR기기·프로젝터·게임기·렌즈)를 다른 사용자에게 대여해주는
P2P 플랫폼. 핵심 도메인은 **대여 상태 머신**과 **수령/반납 시점 증빙(사진·상태) 비교** —
분쟁 발생 시 두 시점을 나란히 비교해 근거로 사용한다.

디자인 명세 원본: `~/Downloads/design_handoff_iter_rental/README.md` (색상 hex, 타이포,
간격, 화면별 레이아웃, 상태 머신, 인터랙션이 전부 명세됨). `ITer.dc.html`은 룩앤필 확인용
HTML 프로토타입이고 `support.js`는 프로토타입 런타임 — **이식 금지**, React로 재구현한다.
프로토타입 데이터는 전부 하드코딩 목데이터이며 백엔드는 아직 없다.

## Stack
- Next.js App Router — 이 저장소는 canary 기반 breaking-change 버전. 코드 작성 전
  `node_modules/next/dist/docs/`에서 관련 가이드 확인 (`AGENTS.md` 참고). 특히 `params`/
  `searchParams`는 Promise, 라우트 props는 `PageProps<'/path'>` / `LayoutProps<'/path'>`
  전역 헬퍼 사용 (import 불필요, `next dev`/`next build` 시 자동 생성).
- React 19, TypeScript strict (`tsconfig.json` strict 모드 유지)
- Tailwind CSS v4 — `tailwind.config.js` 없음. 테마 토큰은 `app/globals.css`의 `@theme`
  블록에서 정의 (임의 값 대신 토큰 사용)
- pnpm
- 백엔드 없음 — 전 화면 목데이터 + 클라이언트 상태로 동작 (아래 State management 참고)

## Architecture
```
app/            라우팅 전용. 화면 → 경로 매핑은 app/CLAUDE.md
components/ui/  디자인 시스템 프리미티브 (Button, Badge, Chip, Modal, Tabs, Input ...)
components/*    기능별 컴포넌트 (equipment/, rentals/, reports/, admin/, layout/)
lib/            도메인 타입, 목데이터, 클라이언트 상태 스토어, 상태/포맷 유틸 — lib/CLAUDE.md
```
하위 CLAUDE.md: `app/CLAUDE.md`(라우팅), `lib/CLAUDE.md`(상태·데이터 모델),
`components/CLAUDE.md`(UI 프리미티브 컨벤션).

## State management
백엔드가 없으므로 `lib/store`의 단일 `MockDataProvider`(root layout에 마운트되는 client
Context + `useReducer`)가 장비/대여/신고/분쟁/관리자 처리이력 전체를 인메모리로 보유한다.
액션 이름은 실제 API 엔드포인트에 대응하도록 짓는다 (예: `approveRental`,
`submitReturnEvidence`, `updateAdminStatus`) — 추후 실 API 연동 시 스토어 내부 구현만
교체하면 화면 코드는 그대로 두는 것이 목표. 화면 컴포넌트는 스토어 액션만 호출하고 상태를
직접 조작하지 않는다.

## Design tokens
핸드오프 README의 hex/px 값을 Tailwind v4 `@theme` 토큰으로 그대로 매핑해서 사용한다
(색상·spacing·radius 임의 값 금지, 명세된 스케일만 사용). 상태 배지 팔레트(중립/진행/성공/
경고/위험/완료)는 `lib/status.ts`에서 상태값 → 팔레트 매핑 함수로 관리하고 컴포넌트에
하드코딩하지 않는다.

## Conventions
- 화면 간 이동은 실제 Next.js 라우팅으로 재구현한다 (핸드오프 프로토타입은 단일 상태 전환
  SPA였지만, 여기서는 URL 기반 라우팅이 정답).
- 탭/필터처럼 URL로 표현 가능한 상태는 `searchParams` 사용, 순수 UI 상태(모달 열림 등)만
  로컬 `useState`.
- 파괴적/비가역 액션(대여 승인·거절, 반납 신청/제출/최종확인, 신고 접수, 관리자 상태변경)은
  공통 `ConfirmModal`을 항상 거친다. 확인 시 모달을 먼저 닫고 액션 실행, 백드롭 클릭 닫기
  구현 시 카드 클릭 `stopPropagation` 필수 (핸드오프에서 실제 발생했던 버그).
- 이미지 자리는 실 이미지가 없으므로 핸드오프의 대각선 스트라이프 플레이스홀더 패턴을 구현
  (업로드 슬롯은 점선 보더 스타일).
- 로딩/에러/빈 상태/폼 검증은 핸드오프 프로토타입에는 없지만 구현 시 반드시 추가 (핸드오프
  README "미구현 상태" 섹션 참고).
