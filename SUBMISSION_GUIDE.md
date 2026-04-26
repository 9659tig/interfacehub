# 동작 가능한 웹앱 프로토타입 제출 가이드

## 1. 제출 목표
심사자가 "5분 내 실행 + 핵심 기능 확인"을 할 수 있어야 한다.

핵심 원칙:
- 한 번에 실행 가능해야 함 (`docker compose up --build`)
- 데모 시나리오가 명확해야 함
- 실행 실패 시 대체 경로(로컬 실행)가 문서화되어 있어야 함

## 1.1 빠른 배포 권장안 (무료)
- 프론트: Vercel Hobby
- 백엔드: Render Free Web Service
- 제출: 배포된 프론트 URL + 백엔드 `/health` URL

## 2. 제출 패키지 구성
필수 포함:
- 소스코드 전체 (`InterfaceHub/`)
- `README.md`
- `DEVELOPMENT.md`
- `SUBMISSION_GUIDE.md`
- `docker-compose.yml`
- `server/.env.example`

권장 포함:
- 1~2분 데모 영상(`demo.mp4`)
- 핵심 화면 스크린샷 3장(대시보드, 검색결과, RCA)

## 3. 심사자 실행 시나리오 (복붙용)
```bash
# 1) 프로젝트 루트 이동
cd InterfaceHub

# 2) API 키 설정
echo "ANTHROPIC_API_KEY=sk-ant-your-key" > .env

# 3) 실행
docker compose up --build
```

확인 URL:
- `http://localhost:3000` (웹앱)
- `http://localhost:4000/health` (헬스체크)

## 3.1 배포형 실행 시나리오 (복붙용)
1. Render에 `server` 배포
- Root Directory: `server`
- Build: `npm install && npm run build`
- Start: `npm start`
- Env:
  - `AI_PROVIDER=gemini`
  - `GEMINI_API_KEY=<your-key>`
  - `GEMINI_MODEL=gemini-2.5-flash`
  - `SIMULATOR_ENABLED=true`
  - `SIMULATOR_INTERVAL_MS=1000`

2. Vercel에 `client` 배포
- Root Directory: `client`
- Env:
  - `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api`

3. 최종 확인
- 프론트 URL 열기
- `https://<your-render-service>.onrender.com/health` 확인

## 4. 데모 시나리오 (발표/심사용)
시나리오 1: 통합 모니터링
- 대시보드 카드의 처리량/에러율 변화 확인

시나리오 2: 자연어 검색
- 입력: `어제 실패한 MQ 건 보여줘`
- 기대 결과: 필터된 로그 목록 표시

시나리오 3: RCA
- FAILURE 로그 클릭
- "AI 근본원인 분석 실행" 클릭
- 원인 후보/권장조치/영향범위/신뢰도 표시 확인

## 5. 제출 형태 권장안
옵션 A (권장): Git 저장소 링크 제출
- 공개 또는 접근 가능한 비공개 저장소
- 릴리즈 태그 예: `v1.0-phase1`
- README 첫 화면에 실행 명령 배치

옵션 B: 압축본 제출
- 파일명: `InterfaceHub_Phase1_YYYYMMDD.zip`
- 압축 내부 루트에 바로 `docker-compose.yml`이 보이게 구성
- `node_modules`, `dist`는 제거 후 제출

## 6. 심사 리스크 최소화 체크리스트
제출 전 체크:
- Render 슬립으로 첫 요청이 지연될 수 있음을 제출 문서에 명시
- `docker compose up --build` 신규 환경에서 성공
- `GET /health` 응답 확인
- 검색/RCA 최소 1회 성공 확인
- `.env`/API 키가 저장소에 포함되지 않았는지 확인
- README에 "실행 실패 시 로컬 실행" 대안 포함

## 7. 발표 시 메시지 구조 (추천)
- 문제: 금융 인터페이스 운영의 분산/장애 추적 난이도
- 해결: 단일 화면 + AI 검색/RCA + 시뮬레이터
- 증명: 3개 데모 시나리오 라이브 시연
- 한계/로드맵: 실행·재처리·FTP·OpenSearch 고도화는 Phase2
