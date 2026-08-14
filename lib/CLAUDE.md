# lib/ — 도메인 타입, 목데이터, 상태 스토어

전역 아키텍처는 루트 `CLAUDE.md` 참고.

## 구조
```
lib/
  types.ts        도메인 타입 (Equipment, Rental, RentalStatus, Report, Dispute, AdminUser,
                   AdminHistoryEntry, User ...)
  mock-data.ts     시드 데이터 (장비 8, 대여 8, 내 신고 3, 관리자 회원 5·장비 5·신고 4·
                   분쟁 3·처리 이력 5) — 핸드오프 README 수치와 동일하게 유지
  status.ts        상태 → 배지 팔레트/라벨 매핑, 타임라인 단계 인덱스, 연체 판정 함수
  format.ts        통화("일 {가격}원"), 날짜 포맷 헬퍼
  store/
    mock-data-context.tsx   MockDataProvider (Context + useReducer), 액션 훅(useMockData)
    confirm-modal-context.tsx  ConfirmModalProvider, useConfirm() — Promise 기반 확인 모달
```

## 상태 스토어
- 단일 Context가 인메모리 "DB" 전체를 보유 (뒤로가기/새로고침 시 초기화되는 건 허용 —
  실 백엔드 없는 프로토타입이므로).
- 액션은 실제 API 엔드포인트처럼 명명: `approveRental`, `rejectRental`, `registerShipping`,
  `confirmReceipt`, `requestReturn`, `submitReturnEvidence`, `finalizeReturn`,
  `fileDispute`, `submitReport`, `updateAdminStatus`, `submitReview`, `registerEquipment`,
  `login`, `signup`.
- 컴포넌트는 `useMockData()`로 액션만 호출, reducer 밖에서 상태를 직접 mutate하지 않는다.

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
