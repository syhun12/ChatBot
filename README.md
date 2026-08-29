# DMA Assistant

1차년도용 Dynamic Mooring & Anchoring AI Q&A 사용자 UI 프로토타입입니다.

## 현재 구현 범위

- Next.js App Router + TypeScript
- PC 중심 반응형 UI
- 좌측 App Shell / 접기 기능
- AI Q&A 단일 사용자 메뉴
- 관리자 버튼 하단 고정
- 질문 전 랜딩 화면
- 간소화된 예시 질문
- 질문 제출 후 답변 화면 전환
- 근거 문서 / 관련 도면 UI
- RAG, DB, OpenAI API는 아직 연결하지 않은 Mock UI
- 대화 히스토리 저장 없음

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## 다음 단계

1. UI 검토 및 수정
2. 관리자 UI 구성
3. Supabase 지식베이스 구조 설계
4. RAG 문서 등록 구조 구현
5. OpenAI API 연결

> 실제 API 키나 Supabase 키는 GitHub에 커밋하지 않습니다.
