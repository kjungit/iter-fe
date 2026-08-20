# lib/ — 도메인 타입, 목데이터, 상태 스토어

전역 아키텍처는 루트 `CLAUDE.md` 참고.

## 구조
```
lib/
  types.ts        도메인 타입 (Equipment, Rental, RentalStatus, Report, Dispute, AdminUser,
                   AdminHistoryEntry, User ...)
  mock-data.ts     시드 데이터 (장비 8, 대여 8, 내 신고 3, 관리자 회원 5·장비 5·신고 4·
                   분쟁 3·처리 이력 5) — 아직 실 API로 안 옮긴 도메인(장비/대여/신고/분쟁/
                   관리자)에서만 사용. 인증은 더 이상 이 목데이터를 쓰지 않음.
  status.ts        상태 → 배지 팔레트/라벨 매핑, 타임라인 단계 인덱스, 연체 판정 함수
  format.ts        통화("일 {가격}원"), 날짜 포맷 헬퍼
  api/
    client.ts       fetch 래퍼 — 액세스 토큰(메모리 보관)/401 자동 refresh 재시도/CSRF 헤더
    auth.ts          /api/v1/auth, /api/v1/users/me(+address) 연동, UserResponse→User 매핑
  auth/
    use-require-auth.ts  로그인 필요 화면에서 호출하는 가드 훅 (미인증 시 /login 리다이렉트)
  store/
    app-data-context.tsx   AppDataProvider (Context) + 액션 훅(useAppData). 인증
                            (`currentUser`/`login`/`signup`/`logout`)은 react-query로 실
                            백엔드에 붙어있고, 나머지 도메인(장비/대여/신고/분쟁/관리자)은
                            아직 `useReducer` 기반 목데이터 — 각 도메인이 연동되는 대로 이
                            파일 내부만 교체한다(화면 쪽 액션 이름은 그대로 유지가 목표).
    confirm-modal-context.tsx  ConfirmModalProvider, useConfirm() — Promise 기반 확인 모달
```

## 상태 스토어
- 인증(`currentUser`, `login`, `signup`, `logout`)은 `lib/api/auth.ts`를 통해 실 백엔드
  JWT로 동작한다. 액세스 토큰은 새로고침 시 사라지는 메모리 변수에만 두고(리프레시 토큰은
  BE가 HttpOnly 쿠키로 관리), 부트스트랩 시 `/api/v1/auth/refresh` → `/api/v1/users/me`
  순서로 세션을 복구한다 (`fetchCurrentUser`).
- 그 외 도메인(장비/대여/신고/분쟁/관리자 처리이력)은 아직 인메모리 목데이터 —
  `useReducer`의 액션은 실제 API 엔드포인트처럼 명명: `approveRental`, `rejectRental`,
  `registerShipping`, `confirmReceipt`, `requestReturn`, `submitReturnEvidence`,
  `finalizeReturn`, `fileDispute`, `submitReport`, `updateAdminStatus`, `submitReview`,
  `registerEquipment`.
- 관리자는 별도 계정 체계가 아니라 일반 `User` + `role === "ADMIN"` 통합 구조(BE
  `SecurityConfig`의 `hasRole("ADMIN")`과 일치). `isAdminAuthenticated`/`currentAdmin`은
  `currentUser.role`에서 파생되는 편의 필드일 뿐 별도 상태가 아니다.
- 컴포넌트는 `useAppData()`로 액션만 호출, reducer 밖에서 상태를 직접 mutate하지 않는다.
  로그인이 필요한 화면은 `useAppData()`가 아니라 `lib/auth/use-require-auth.ts`의
  `useRequireAuth()`로 `currentUser`를 받아야 미인증/로딩 상태를 놓치지 않는다.

## 대여 상태 머신 (RentalStatus)
```
PENDING --승인(등록자)--> PAID --배송등록(등록자)--> SHIPPING
PENDING --거절(등록자)--> REJECTED
SHIPPING --수령확인(대여자)--> RENTING
RENTING --반납신청(대여자)--> RETURN_UPLOAD --증빙제출(대여자)--> RETURN_REQUESTED
RETURN_REQUESTED --최종확인(등록자)--> COMPLETED
RETURN_REQUESTED --이상있음(등록자)--> 신고 접수 플로우
```
- 타임라인 인덱스: `PENDING=0, PAID=1, SHIPPING=2, RENTING=3, RETURN_REQUESTED=4,
  COMPLETED=5, REJECTED=-1(전부 미도달)`.
- 연체 판정: 상태가 `COMPLETED`/`REJECTED`/`PENDING`이 아니고 반납예정일 < 오늘이면 연체
  (`status.ts`의 `isOverdue`/`overdueDays`에 구현, 화면에서 재계산 금지).
- 대여 상세 화면의 "역할 + 상태" → 액션 패널 매핑은 핸드오프 README 6번 화면 표를 그대로
  구현 (등록자/대여자 각각 다른 패널, 한 번에 하나만 노출).

## 목데이터 규칙
- 이미지 필드는 실제 URL 대신 placeholder 식별자만 두고, 렌더링은 `components/ui/ImagePlaceholder`
  (스트라이프 패턴)로 처리 — 목데이터에 base64/외부 URL을 넣지 않는다.
- 가격은 원 단위 정수, 날짜는 ISO 문자열(`YYYY-MM-DD`)로 저장하고 `format.ts`에서 표시용
  포맷 변환.
