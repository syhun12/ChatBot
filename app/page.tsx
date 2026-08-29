"use client";

import {
  Bot,
  ChevronLeft,
  FileText,
  HelpCircle,
  Languages,
  MessageSquareText,
  Paperclip,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

const exampleQuestions = [
  "Winch 브레이크 교체 방법은?",
  "Windlass 모터가 작동하지 않아요",
  "유압 압력이 정상 범위가 아니에요",
  "체인 장력 편차가 발생해요",
];

const answerSteps = [
  ["전원 공급 확인", "전원 차단기 상태, 퓨즈, 전원 케이블 연결 상태 및 전압을 확인합니다."],
  ["비상 정지 및 인터록 확인", "비상 정지 스위치 해제 상태와 도어·커버·리미트 스위치 등 안전 인터록 상태를 확인합니다."],
  ["제어 신호 확인", "PLC/제어 패널에서 입력·출력 신호 및 알람을 확인하고 Local/Remote 상태를 점검합니다."],
  ["유압 시스템 확인", "유압 오일 레벨, 펌프 작동 상태, 압력, 필터 막힘 및 누유 여부를 확인합니다."],
  ["기계 상태 및 부하 확인", "드럼·브레이크·클러치 상태, 로프 감김 상태 및 과부하 여부를 확인합니다."],
];

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);

  const hasAnswer = Boolean(submittedQuestion);
  const currentQuestion = useMemo(
    () => submittedQuestion ?? "Winch가 작동하지 않을 때 확인해야 할 사항은?",
    [submittedQuestion]
  );

  function submitQuestion(value?: string) {
    const nextQuestion = (value ?? question).trim();
    if (!nextQuestion) return;
    setSubmittedQuestion(nextQuestion);
    setQuestion("");
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submitQuestion();
  }

  return (
    <main className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark">⚓</div>
          {!collapsed && (
            <div>
              <div className="brand-title">DMA</div>
              <div className="brand-sub">Assistant</div>
            </div>
          )}
          <button className="collapse-btn" onClick={() => setCollapsed((v) => !v)} aria-label="메뉴 접기">
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="side-nav">
          <button className="nav-item active">
            <MessageSquareText size={20} />
            {!collapsed && <span>AI Q&amp;A</span>}
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <button className="nav-item admin-item">
          <Settings size={20} />
          {!collapsed && <span>관리자</span>}
        </button>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div />
          <div className="topbar-actions">
            <button><HelpCircle size={18} /> 도움말</button>
            <span className="divider" />
            <button><Languages size={18} /> 한국어</button>
          </div>
        </header>

        {!hasAnswer ? (
          <section className="landing-panel">
            <div className="hero-copy">
              <div className="eyebrow">Dynamic Mooring &amp; Anchoring</div>
              <h1>DMA 관련 내용을 질문하세요</h1>
              <p>
                기술 문서와 매뉴얼을 기반으로 관련 정보를 검색하고,
                RAG 방식으로 근거 중심의 답변을 제공합니다.
              </p>
              <div className="status-row">
                <span className="status-pill green"><span className="dot" />지식베이스 연결됨</span>
                <span className="status-pill blue"><ShieldCheck size={16} />RAG 기반 응답</span>
              </div>
            </div>

            <form className="hero-search" onSubmit={onSubmit}>
              <Search size={24} />
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="DMA 관련 질문을 입력하세요..."
              />
              <button type="submit" aria-label="질문 보내기"><Send size={22} /></button>
            </form>

            <div className="examples-wrap">
              <div className="section-label">예시 질문</div>
              <div className="examples-grid">
                {exampleQuestions.map((item, index) => (
                  <button className="example-card" key={item} onClick={() => submitQuestion(item)}>
                    <div className="example-icon">{index === 0 ? <Wrench size={20} /> : <Bot size={20} />}</div>
                    <span>{item}</span>
                    <Send size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="landing-note">
              현재 화면은 1차년도 AI Q&amp;A 사용자 인터페이스 시안입니다. 장비별 운용·정비 메뉴는 향후 지식자료 확보에 따라 확장할 수 있습니다.
            </div>
          </section>
        ) : (
          <section className="answer-page">
            <div className="question-bubble">{currentQuestion}</div>

            <div className="answer-card">
              <div className="answer-heading">
                <div className="assistant-icon"><Bot size={22} /></div>
                <div>
                  <strong>DMA Assistant</strong>
                  <p>질문과 연관된 문서 내용을 기준으로 다음 순서로 확인해 보세요.</p>
                </div>
              </div>

              <div className="answer-steps">
                {answerSteps.map(([title, body], index) => (
                  <div className="answer-step" key={title}>
                    <span className="step-index">{index + 1}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="warning-box">
                <span className="warning-icon">!</span>
                <strong>안전 주의</strong>
                <span>점검 전 장비 정지 및 전원 차단 후, 현장 안전절차에 따라 작업하세요.</span>
              </div>

              <div className="answer-meta">
                <div>
                  <span className="status-pill blue"><ShieldCheck size={15} />RAG 기반 답변</span>
                  <span className="status-pill mint"><FileText size={15} />문서 2건 참조</span>
                </div>
                <div className="feedback">
                  <span>도움이 되었나요?</span>
                  <button><ThumbsUp size={16} /></button>
                  <button><ThumbsDown size={16} /></button>
                </div>
              </div>
            </div>

            <div className="evidence-grid">
              <section className="evidence-card">
                <h2><FileText size={19} /> 근거 문서</h2>
                <button className="source-item">
                  <div>
                    <strong>DMA Operation Manual 4.2</strong>
                    <span>4.2.3 Winch 고장 시 점검 절차</span>
                  </div>
                  <b>p.82</b>
                </button>
                <button className="source-item">
                  <div>
                    <strong>Winch Maintenance Guide 2.1</strong>
                    <span>2.1.5 Troubleshooting - No Operation</span>
                  </div>
                  <b>p.37</b>
                </button>
              </section>

              <section className="evidence-card">
                <h2><Search size={19} /> 관련 도면 / 이미지</h2>
                <div className="image-strip">
                  {["유압 회로도", "전기 회로도", "Winch 조립도"].map((label) => (
                    <div className="diagram-card" key={label}>
                      <div className="diagram-placeholder">
                        <div className="diagram-lines" />
                      </div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <form className="followup-box" onSubmit={onSubmit}>
              <Paperclip size={21} />
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="추가 질문을 입력하세요..."
              />
              <button type="submit"><Send size={20} /></button>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}
