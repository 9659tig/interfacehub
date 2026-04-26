# InterfaceHub Phase1 개발 문서

## 1. 문서 목적
이 문서는 InterfaceHub Phase1(현재 구현 범위)의 기술 구조, 기능 범위, 실행/검증 방법, 운영 시 주의사항을 개발자 관점에서 정리한다.

## 2. 구현 범위 (Phase1)
Phase1은 "통합 모니터링 + AI 검색/RCA + 시뮬레이터" 검증용 MVP에 집중한다.

포함 기능:
- 통합 대시보드(인터페이스 카드, 24h 처리량/에러율/평균 응답시간)
- 자연어 로그 검색(질문 -> Claude 변환 -> DB 필터 + MiniSearch 보완)
- AI RCA(실패/타임아웃 로그에 대한 원인/권장조치/영향범위/신뢰도)
- 시뮬레이터(1초 주기 로그 생성, 에러 스파이크 패턴)
- Docker Compose 단일 실행
- 클라우드 배포 대응(Vercel + Render 환경변수 기반 API 연결)

미포함 기능(Phase2 예정):
- 인터페이스 등록 UI/API 고도화
- 실행 트리거(run) 및 재처리(retry) 오케스트레이션
- FTP 프로토콜(현재 SFTP까지)
- OpenSearch/Nori 기반 실제 대용량 로그 인프라

## 3. 아키텍처
3계층 FO/MO/BO 구조로 구현했다.

FO (React):
- 대시보드, 자연어 검색 UI, RCA 사이드 패널

MO (AI 처리):
- `AIService.convertNLToQuery()`
- `AIService.analyzeRCA()`

BO (Express + SQLite):
- 인터페이스/로그/대시보드/API 라우트
- SQLite 저장소 및 트랜잭션 시뮬레이터

## 4. 주요 컴포넌트
서버:
- `server/src/app.ts`: 앱 초기화, 라우트 연결, 시뮬레이터 시작
- `server/src/services/aiService.ts`: Claude 호출 + Zod 검증
- `server/src/services/logService.ts`: 로그 조회/필터/집계
- `server/src/search/LogSearchEngine.ts`: MiniSearch 기반 키워드 검색
- `server/src/simulator/TransactionSimulator.ts`: 가짜 트랜잭션 생성

클라이언트:
- `client/src/pages/Dashboard.tsx`: 메인 화면 조립
- `client/src/hooks/useDashboard.ts`: 통계 폴링
- `client/src/hooks/useLogSearch.ts`: 자연어 검색 요청 상태 관리
- `client/src/hooks/useRCA.ts`: RCA 요청 상태 관리

## 5. API 엔드포인트 (Phase1)
- `GET /health`
- `GET /api/dashboard/stats`
- `GET /api/logs?interfaceId=&limit=`
- `GET /api/logs/:id`
- `POST /api/ai/nl-search` body: `{ "question": "..." }`
- `POST /api/ai/rca` body: `{ "transactionId": "..." }`
- `GET /api/interfaces`
- `GET /api/interfaces/:id`
- `PATCH /api/interfaces/:id/status`

## 6. 로컬 실행
### 6.1 Docker (권장)
```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env
docker compose up --build
```

접속:
- UI: `http://localhost:3000`
- API: `http://localhost:4000`

클라이언트 API 주소:
- 로컬: 기본값 `/api` + Vite proxy
- 배포: `client` 환경변수 `VITE_API_BASE_URL` 사용 (예: `https://your-api.onrender.com/api`)

### 6.2 개발 모드
서버:
```bash
cd server
cp .env.example .env
# .env에 ANTHROPIC_API_KEY 입력
npm install
npm run dev
```

클라이언트:
```bash
cd client
npm install
npm run dev
```

## 7. 검증 절차
서버 테스트:
```bash
cd server
npx jest --forceExit --detectOpenHandles
```

빌드 검증:
```bash
cd server && npm run build
cd client && npx tsc -b --noEmit && npx vite build
```

수동 검증:
- 대시보드 카드 수치가 5초 단위로 갱신되는지 확인
- 자연어 검색 질의로 결과 테이블이 생성되는지 확인
- FAILURE/TIMEOUT 로그 선택 후 RCA 패널이 정상 표시되는지 확인

## 8. 운영/보안 주의사항
- `ANTHROPIC_API_KEY`는 커밋 금지(`.env`만 사용)
- `GEMINI_API_KEY`도 동일하게 커밋 금지(`.env`/배포 환경변수만 사용)
- `AI_PROVIDER`에 따라 필요한 키가 달라짐 (`gemini` 또는 `anthropic`)
- Phase1은 MVP라 인증/권한 분리가 없다
- AI 응답은 Zod 검증을 거치지만, 운영계 적용 전 추가 검증(권한, 레이트리밋, 감사로그) 필요

## 9. 알려진 제한사항
- `SUM(...)` 집계가 데이터 없을 때 `null`일 수 있음
- 프로토콜은 `SFTP`까지 포함, `FTP`는 Phase2에서 추가 필요
- 시뮬레이터 로그는 데모 목적이며 실제 업무 로그 표준과 다를 수 있음
