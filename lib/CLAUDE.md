# lib/ — 도메인 타입, 상태 스토어, API 클라이언트

전역 아키텍처는 루트 `CLAUDE.md` 참고.

## 구조
```
lib/
  types.ts        인증/공통 타입만 (User, UserRole, ShippingAddress). 도메인별 타입(장비/대여/
                   신고/관리자/알림)은 각 lib/api/*.ts 파일이 직접 소유한다 — 화면은 그 파일에서
                   import.
  status.ts        상태 → 배지 팔레트/라벨 매핑(rentalStatusBadge, reportStatusBadge,
                   adminUserStatusBadge, equipmentStatusBadge, paymentStatusBadge), 대여
                   타임라인 단계 인덱스, 연체 판정 함수. 상태 배지 색은 항상 이 파일을 거쳐서만
                   가져온다(컴포넌트에 하드코딩 금지).
  format.ts        통화("일 {가격}원"), 날짜 포맷 헬퍼
  daum-postcode.ts 다음 우편번호 검색 팝업 로더(스크립트 동적 삽입 + Promise 래핑)
  api/
    client.ts         fetch 래퍼 — 액세스 토큰(메모리 보관)/401 자동 refresh 재시도/CSRF 헤더.
                       API_BASE_URL도 여기서 export.
    auth.ts           /api/v1/auth, /api/v1/users/me(+address) 연동
    oauth.ts          카카오 OAuth2 로그인(exchange/signup/link), 세션 기반 교환 코드 플로우
    equipment.ts      /api/v1/devices 전체(조회/등록/수정/삭제/상태변경/견적/가용성/내 장비)
    rentals.ts        /api/v1/rentals 전체(요청~반납 상태머신, 배송/수령/반납증빙)
    payments.ts       토스페이먼츠 ready/confirm
    reports.ts        /api/v1/reports (일반 사용자 신고 제출/목록/상세)
    reviews.ts        /api/v1/rentals/{id}/reviews, /api/v1/users/{id}/reviews/written(+stats) —
                      거래 완료 후 당사자끼리 남기는 리뷰(작성/거래별 조회/내가 쓴 리뷰/평균 평점)
    admin.ts          /api/v1/admin/** 전체(회원/장비/신고/결제/처리이력)
    notifications.ts  /api/v1/notifications 전체 + SSE 티켓 발급
    s3-upload.ts      presigned URL로 S3 직접 PUT
    chat.ts           apps:chat(모노레포 전환 후 신규 서비스, 포트 8081) 연동 — 문의 그랜트/
                      티켓 발급(monolith)부터 방 목록·메시지·읽음 처리(chat 서비스)까지. 상세
                      규칙은 아래 "채팅(Chat) 연동 규칙" 참고.
  hooks/
    useNotificationStream.ts  SSE 구독 훅(티켓 재발급 기반 수동 재연결)
    useChatSocket.ts          채팅방 WebSocket 구독 훅(티켓 기반 수동 재연결, useNotificationStream과
                              동일한 패턴)
  auth/
    use-require-auth.ts  로그인 필요 화면에서 호출하는 가드 훅 (미인증 시 /login 리다이렉트)
  store/
    app-data-context.tsx      AppDataProvider — 인증 상태(`currentUser`/`login`/`signup`/
                               `logout`/`isAdminAuthenticated`)만 담당. react-query로 실
                               백엔드에 붙어있다. 그 외 도메인은 각 화면 컴포넌트가 해당
                               `lib/api/*.ts` 함수를 `useQuery`/`useMutation`으로 직접 호출—
                               이 컨텍스트를 거치지 않는다.
    confirm-modal-context.tsx  ConfirmModalProvider, useConfirm() — Promise 기반 확인 모달
```

## 상태 스토어
- 전 도메인이 실 백엔드(`iter-be`) API로 연동되어 있다. 인메모리 목데이터(`lib/mock-data.ts`)는
  삭제됨 — 되살리지 않는다.
- `useAppData()`(`app-data-context.tsx`)는 **인증 상태 전용**이다: `currentUser`, `login`,
  `signup`, `logout`, `isAuthLoading`, `currentAdmin`/`isAdminAuthenticated`(= `currentUser.role
  === "ADMIN"`에서 파생되는 편의 필드). 장비/대여/신고/관리자/알림 등 다른 도메인 상태를 여기
  추가하지 않는다 — 해당 화면 컴포넌트에서 `lib/api/*.ts`를 직접 `useQuery`/`useMutation`으로
  호출한다(장비 상세·대여 상세·신고 목록·관리자 탭 컴포넌트들이 이 패턴의 실례).
- 로그인이 필요한 화면은 `useAppData()`가 아니라 `lib/auth/use-require-auth.ts`의
  `useRequireAuth()`로 `currentUser`를 받아야 미인증/로딩 상태를 놓치지 않는다.
- 관리자는 별도 계정 체계가 아니라 일반 `User` + `role === "ADMIN"` 통합 구조(BE
  `SecurityConfig`의 `hasRole("ADMIN")`과 일치).

## 대여 상태 머신 (RentalStatus — `lib/api/rentals.ts`)
BE `RentalStatus` enum 그대로: `PENDING, REQUESTED, APPROVED, REJECTED, CANCELED, SHIPPING,
RECEIVED, RENTING, RETURN_REQUESTED, RETURNING, RETURNED, DISPUTED, COMPLETED`. 타임라인
인덱스·배지 매핑은 `lib/status.ts`의 `rentalTimelineStage`/`rentalStatusBadge`에 구현되어
있으므로 화면에서 재계산하지 않는다. `overdueDays`도 BE가 계산해서 내려주는 값을 그대로 쓴다.

## 백엔드에 API가 없는 도메인 (되살리지 말 것)
- **분쟁(Dispute)**: BE에 엔티티/리포지토리만 있고 컨트롤러·서비스가 없다. 이전에 목데이터로
  흉내낸 관리자 분쟁 탭이 있었으나 실제로 아무것도 저장/전송하지 않는 가짜 기능이라 제거했다.
  BE에 엔드포인트가 실제로 추가되기 전까지는 다시 만들지 않는다. (참고: 반납 확인 시 "이상
  있음"으로 처리하면 `RentalStatus.DISPUTED`로 전이되는 기능은 `ReturnApiController`/
  `ReturnService`에 실제로 구현되어 있는 별개 기능 — 이건 그대로 유지.)
- **리뷰(Review)는 더 이상 여기 해당하지 않는다** — `RentalReview` 실 API가 추가되어
  `lib/api/reviews.ts`로 연동했다. 아래 "리뷰 작성 규칙" 참고.

## 리뷰(Review) 작성 규칙 (임의로 바꾸지 말 것)
`RentalReview`는 장비가 아니라 **거래 상대방(사용자)** 을 대상으로 하는 양방향 리뷰다 —
`RentalReviewService.resolveRevieweeId` 기준:
- 대여자가 쓰면 대상은 등록자, 등록자가 쓰면 대상은 대여자 — `POST /rentals/{id}/reviews`
  하나로 양쪽 다 처리되고 BE가 principal로 방향을 판별한다(프론트에서 "누구에게" 지정 안 함).
- `RentalStatus.COMPLETED`가 아니면 거절(409 `REVIEW_NOT_ALLOWED_STATUS`) — `RETURNED`도 아직
  불가, `COMPLETED`에서만 가능.
- 거래당 `(rentalId, reviewerId)` 유일 — 한 사람은 같은 거래에 1건만(409
  `REVIEW_ALREADY_EXISTS`), 두 당사자는 각자 1건씩이라 거래당 최대 2건.
- `rating`은 1~5 정수, `content`는 공백 아님·최대 1000자.
- 수정/삭제 엔드포인트가 없다 — 작성한 리뷰는 되돌릴 수 없으므로 프론트는 제출 전 반드시
  `useConfirm()`으로 확인시킨다(`components/rentals/ReviewForm.tsx` 참고).
- 사용자 평균 평점(`GET /users/{id}/reviews/stats`)은 principal 검증 없이 어떤 userId든 조회
  가능한 범용 엔드포인트 — 다른 사용자 표시 지점과 "내 프로필" 모두 `UserRatingBadge` 하나로
  재사용한다. 장비(Equipment) 자체의 `averageRating`/`reviewCount`는 별개 필드이며 BE에서
  항상 `0.0, 0`으로 하드코딩되어 있으니 섞어 쓰지 않는다.

## 채팅(Chat) 연동 규칙 (임의로 바꾸지 말 것)
채팅은 monolith(`iter-be`, 포트 8080)와 완전히 분리된 별도 서비스(`apps:chat`, 포트 8081,
`NEXT_PUBLIC_CHAT_API_BASE_URL`)다 — 인증도 JWT가 아니라 monolith가 발급하는 **티켓**을 쓴다.
- 티켓 발급(`POST /api/v1/chat/tickets`)과 문의 그랜트 발급(`POST /api/v1/chat/inquiry-grants`)은
  monolith 엔드포인트라 `apiFetch`(JWT)로 호출한다. 그 이후 방 목록/메시지/읽음 처리는 전부
  `lib/api/chat.ts`의 `chatFetch`(티켓 Bearer, refresh/CSRF 없음)로 chat 서비스에 직접 호출한다.
- 티켓은 10분 TTL이지만 **재사용 가능**(SSE 티켓과 달리 1회용 아님) — `getChatTicket()`이 모듈
  스코프에 캐시해 두고 만료 임박/401 때만 재발급한다. 화면에서 직접 티켓을 다루지 않는다.
- 채팅방은 대여(rental)가 아니라 **장비+문의자** 단위로 생성된다(`stage: INQUIRY`, `rentalId`
  없음). 결제가 확정되면 BE가 같은 방을 찾아 `TRADE`로 전환하고 `rentalId`를 채운다 — 결제 전에
  문의 채팅이 없었다면 결제 후에도 방이 새로 생기지 않는다(BE의 알려진 제약, 프론트에서 보완
  하지 않는다).
- 메시지는 텍스트 전용이다(첨부/이미지 없음). `masked: true`인 메시지는 BE가 전화번호/계좌/외부
  링크 등을 이미 가려서 저장한 것 — 원문은 애초에 저장되지 않으므로 프론트가 마스킹을 풀거나
  재현하려고 하지 않는다.
- 실시간 송수신은 REST가 아니라 `lib/hooks/useChatSocket.ts`의 순수 WebSocket(`/ws/chat`)이다.
  서버가 보내는 `type: "ERROR", code: "MUTED"` 프레임은 24시간 뮤트(30일 내 마스킹 위반 3회)
  상태라는 뜻 — 재시도 로직을 넣지 않고 컴포저를 비활성화한 채 안내만 한다.
- 방 목록의 `unreadCount`는 폴링으로만 갱신된다(채팅 전용 SSE/전역 푸시 없음) — 알림
  (`NotificationBell`)과 동일하게 `refetchInterval`로 처리한다.

## 관리자 상태 전이 규칙 (임의로 바꾸지 말 것)
관리자 상태 변경 API들은 겉보기와 달리 허용되는 전이가 좁게 제한되어 있다 — UI는 항상 "현재
상태에서 실제로 허용되는 다음 상태"만 옵션으로 제시해야 하며(`components/admin/AdminDetailView.tsx`
의 `allowedOptions`/`allowedReportTransitions` 참고), 백엔드 서비스의 검증 로직과 반드시 일치시킨다:
- 회원(`AdminUserService`): ACTIVE↔SUSPENDED만, 같은 상태로는 재변경 불가, ADMIN 역할은 정지 불가,
  DELETED 회원은 조치 불가.
- 장비(`AdminEquipmentService`): ACTIVE/INACTIVE → SUSPENDED(차단)만, SUSPENDED → INACTIVE(차단
  해제, 재공개는 등록자 본인만 가능)만.
- 신고(`AdminReportService`): RECEIVED → UNDER_REVIEW/RESOLVED/REJECTED, UNDER_REVIEW →
  RESOLVED/REJECTED, RESOLVED/REJECTED는 종결 상태로 더 이상 변경 불가.
