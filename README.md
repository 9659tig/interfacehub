# InterfaceHub

AI 기반 보험사 금융 IT 인터페이스 통합관리 플랫폼

## 문서
- [개발 문서](./DEVELOPMENT.md)
- [제출 가이드](./SUBMISSION_GUIDE.md)

## 아키텍처

3계층 FO/MO/BO 구조:
- **FO (Front Office)**: React 대시보드 — 인터페이스 카드 그리드, 자연어 검색, AI RCA 패널
- **MO (Middle Office)**: Claude API — 자연어→구조화 쿼리 변환, 에러 근본원인 분석
- **BO (Back Office)**: Express API — 인터페이스 등록/관리, 로그 저장, 시뮬레이터

## 기술 스택

| 계층 | 기술 |
|------|------|
| Backend | Node.js + Express + TypeScript |
| Frontend | Vite + React + Tailwind + shadcn/ui |
| DB | SQLite (better-sqlite3) |
| 검색 | MiniSearch (키워드 기반 로그 검색) |
| AI | Gemini / Claude (Provider 선택) |
| 인프라 | Docker Compose |

## 실행 방법
### 클라우드 배포 (권장: Vercel + Render)
1. 백엔드(Render)
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- 환경변수:
  - `AI_PROVIDER=gemini`
  - `GEMINI_API_KEY=<your-key>`
  - `GEMINI_MODEL=gemini-2.5-flash`
  - `SIMULATOR_ENABLED=true`
  - `SIMULATOR_INTERVAL_MS=1000`

2. 프론트엔드(Vercel)
- Root Directory: `client`
- 환경변수:
  - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`

3. 확인
- 프론트 URL 접속
- 백엔드 헬스체크: `https://<your-render-service>.onrender.com/health`

참고:
- Render free 플랜은 유휴 상태에서 sleep될 수 있어 첫 요청이 느릴 수 있습니다.

### Docker Compose (권장)

```bash
# .env 파일 생성
cat > .env <<'EOF'
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.5-flash
EOF

# 실행
docker compose up --build
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000

### 로컬 개발

```bash
# 서버
cd server
cp .env.example .env
npm install && npm run dev

# 클라이언트 (별도 터미널)
cd client
npm install && npm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:4000

## 데모 시나리오

### 1. 통합 대시보드 확인
서버 시작 후 대시보드에서 4개 인터페이스 카드를 확인합니다. 시뮬레이터가 매초 트랜잭션을 생성하여 실시간으로 수치가 변합니다.

### 2. 자연어 로그 검색
검색바에 `"어제 오후 실패한 MQ 건 보여줘"` 입력 → AI가 구조화 쿼리로 변환 → 결과 테이블 표시

### 3. AI 에러 RCA 분석
검색 결과에서 FAILURE 상태의 로그 클릭 → 우측 패널에서 "AI 근본원인 분석 실행" 클릭 → 원인/조치/영향범위 표시

### 4. 에러 스파이크 관찰
시뮬레이터가 30~90초마다 특정 인터페이스에 에러 스파이크를 발생시킵니다. 대시보드에서 에러율 급증을 관찰할 수 있습니다.

### 5. 다양한 검색 질문
- `"금감원 API 에러 로그"`
- `"응답시간 느린 건 보여줘"`
- `"증권사 MQ 최근 실패 원인"`

## 디렉터리 구조

```text
InterfaceHub/
├── server/          # Express 백엔드
│   ├── src/
│   │   ├── config/      # 환경 설정, DB 연결
│   │   ├── db/          # 스키마, 시드 데이터
│   │   ├── models/      # TypeScript 타입
│   │   ├── services/    # 비즈니스 로직 (Interface, Log, AI)
│   │   ├── controllers/ # HTTP 핸들러
│   │   ├── routes/      # Express 라우터
│   │   ├── search/      # MiniSearch 기반 로그 검색 엔진
│   │   ├── simulator/   # 트랜잭션 시뮬레이터
│   │   └── middleware/  # 에러 핸들러
│   └── tests/
├── client/          # React 프론트엔드
│   └── src/
│       ├── api/         # API 클라이언트
│       ├── components/  # UI 컴포넌트 (dashboard, search, rca)
│       ├── hooks/       # React 커스텀 훅
│       ├── pages/       # 페이지 컴포넌트
│       └── types/       # 공유 타입
└── docker-compose.yml
```
