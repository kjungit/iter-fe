# app/ — 라우팅

전역 아키텍처는 루트 `CLAUDE.md` 참고. 이 파일은 화면(핸드오프 README 기준) → 실제 경로
매핑과 라우팅 관련 결정만 다룬다.

## 공통 셸
- `layout.tsx`: html/body, Pretendard 폰트 로드, `MockDataProvider` + `ConfirmModalProvider`
  마운트, `<Header />` 렌더. Header는 sticky, 모든 화면에 항상 노출.
- 인증/관리자 권한 체크는 프로토타입과 동일하게 미구현(헤더 링크로 무조건 진입) — 핸드오프
  명세를 그대로 따름.

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
| 12 | 리뷰 작성 | `/rentals/[id]/review` |
| 13 | 로그인 | `/login` |
| 14 | 회원가입 | `/signup` |
| 15 | 관리자 목록 | `/admin` (`?tab=users\|equipment\|reports\|disputes\|history`) |
| 16 | 관리자 상세 | `/admin/[entity]/[id]` (`entity: users\|equipment\|reports\|disputes`) |

- 탭/필터는 모두 `searchParams` 기반 (뒤로가기·공유 가능해야 함). 페이지는 `params`/
  `searchParams`를 Promise로 받는 canary 컨벤션 준수 (`PageProps<'/path'>` 헬퍼 사용).
- 목록→상세 이동은 `next/link`의 `<Link>` 사용, 상태 변경 후 리다이렉트는 클라이언트
  컴포넌트에서 `useRouter().push`.
- 각 라우트 폴더는 `page.tsx`만 두고, 화면 전용 조합 로직은 `components/<feature>/`의
  클라이언트 컴포넌트로 위임한다 (page.tsx는 얇게 유지).
