# app/ — 라우팅

전역 아키텍처는 루트 `CLAUDE.md` 참고. 이 파일은 화면(핸드오프 README 기준) → 실제 경로
매핑과 라우팅 관련 결정만 다룬다.

## 공통 셸
- `layout.tsx`: html/body, Pretendard 폰트 로드, `AppQueryProvider`(react-query) →
  `AppDataProvider` → `ConfirmModalProvider` 마운트, `<Header />` 렌더. Header는 sticky,
  모든 화면에 항상 노출.
- 인증은 실 백엔드(`iter-be`) JWT 기반으로 연동됨 (`lib/api/auth.ts`, `lib/store/
  app-data-context.tsx`). 로그인이 필요한 화면(마이페이지/장비등록/대여 관련/신고 관련)은
  각 클라이언트 컴포넌트 최상단에서 `lib/auth/use-require-auth.ts`의 `useRequireAuth()`를
  호출해 미인증 시 `/login`으로 리다이렉트한다(로딩/미인증 동안 `null` 반환 — 호출부는
  `if (!currentUser) return null;` 패턴 유지). 홈/장비 조회처럼 BE가 `permitAll`인 화면은
  가드하지 않는다.
- 관리자는 별도 계정 체계가 아니라 **일반 `User` + `role === "ADMIN"`** 통합 구조(BE
  `SecurityConfig`가 `/api/v1/admin/**`를 `hasRole("ADMIN")`으로 보호). 로그인 자체는
  `/api/v1/auth/login` 하나만 쓰고, `app/admin/(dashboard)/layout.tsx`가
  `isAdminAuthenticated`(= `currentUser?.role === "ADMIN"`)를 체크해 미인증 시
  `/admin/login`으로 리다이렉트하는 라우트 가드 역할을 한다. `/admin/login`은 라우트
  그룹 밖에 둬서 가드 대상에서 제외(그렇지 않으면 리다이렉트 루프).

## 화면 → 경로

| # | 화면 | 경로 |
|---|---|---|
| 1 | 홈 (탐색) | `/` |
| 2 | 상품 상세 | `/equipment/[id]` |
| 3 | 대여 요청(결제) | `/equipment/[id]/request` |
| 4 | 대여 내역 | `/rentals` (`?tab=borrowed\|lent`, `?overdue=1`) |
| 5 | 반납 확인 대상 목록 | `/rentals/returns` |
| 6 | 대여 상세 | `/rentals/[id]` |
| 7 | 신고 접수 | `/rentals/[id]/report` |
| 8 | 내 신고 목록 | `/reports` |
| 9 | 내 신고 상세 | `/reports/[id]` |
| 10 | 마이페이지 | `/mypage` |
| 11 | 장비 등록 | `/equipment/new` |
| 12 | 장비 수정 | `/equipment/[id]/edit` |
| 13 | 로그인 | `/login` |
| 14 | 회원가입 | `/signup` |
| 15 | 카카오 로그인 콜백 | `/oauth2/callback` |
| 16 | 관리자 목록 | `/admin` (`?tab=users\|equipment\|reports\|payments\|history`, `(dashboard)` 그룹 — 가드 적용) |
| 17 | 관리자 상세 | `/admin/[entity]/[id]` (`entity: users\|equipment\|reports\|payments`, `(dashboard)` 그룹 — 가드 적용) |
| 18 | 관리자 로그인 | `/admin/login` (아이디/비밀번호, `(dashboard)` 그룹 밖 — 가드 미적용) |
| 19 | 리뷰 작성 | `/rentals/[id]/review` |
| 20 | 내가 쓴 리뷰 | `/mypage/reviews` |

분쟁(Dispute) 화면은 BE에 API 자체가 없어(엔티티만 존재, 컨트롤러 없음) 제거된 상태다 —
백엔드에 해당 엔드포인트가 생기기 전까지는 다시 추가하지 않는다. 리뷰(Review)는
`RentalReview`(`lib/api/reviews.ts`) 실 API가 생겨 위 19/20번 화면으로 되살렸다 — 상세 규칙은
`lib/CLAUDE.md` 참고.

- 탭/필터는 모두 `searchParams` 기반 (뒤로가기·공유 가능해야 함). 페이지는 `params`/
  `searchParams`를 Promise로 받는 canary 컨벤션 준수 (`PageProps<'/path'>` 헬퍼 사용).
- 목록→상세 이동은 `next/link`의 `<Link>` 사용, 상태 변경 후 리다이렉트는 클라이언트
  컴포넌트에서 `useRouter().push`.
- 각 라우트 폴더는 `page.tsx`만 두고, 화면 전용 조합 로직은 `components/<feature>/`의
  클라이언트 컴포넌트로 위임한다 (page.tsx는 얇게 유지).
