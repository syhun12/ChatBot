"use client";

import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  FileText,
  HelpCircle,
  Languages,
  Loader2,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Wrench,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

const exampleQuestions = [
  "Winch가 작동하지 않아요",
  "브레이크가 해제되지 않아요",
  "유압 압력이 정상 범위가 아니에요",
  "체인 장력 편차가 발생해요",
];

type Source = {
  title: string;
  section: string;
  page: string;
};

type AssistantAnswer = {
  title: string;
  summary: string;
  steps: Array<{ title: string; body: string }>;
  warning: string;
  sources: Source[];
};

type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
      time: string;
    }
  | {
      id: string;
      role: "assistant";
      answer: AssistantAnswer;
      time: string;
    };

function nowLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function createMockAnswer(question: string): AssistantAnswer {
  const normalized = question.toLowerCase();

  if (normalized.includes("유압") || normalized.includes("압력")) {
    return {
      title: "유압 계통 점검 순서",
      summary: "유압 압력이 정상 범위를 벗어날 경우 오일량, 펌프, 필터, 밸브와 누유 상태를 순서대로 확인해야 합니다.",
      steps: [
        { title: "오일 레벨 확인", body: "탱크 오일 레벨이 권장 범위에 있는지 확인하고 부족하면 지정 유압유를 보충합니다." },
        { title: "펌프 작동 상태 확인", body: "펌프 기동 여부와 이상 소음·진동을 확인하고 흡입측 공기 유입 여부를 점검합니다." },
        { title: "필터 차압 확인", body: "필터 막힘 표시 또는 차압 값을 확인하고 기준 초과 시 필터 상태를 점검합니다." },
        { title: "밸브 및 누유 확인", body: "릴리프 밸브 설정과 배관·피팅부 누유 여부를 확인합니다." },
      ],
      warning: "설정 압력을 임의로 변경하지 말고, 압력 계통 점검 전 잔압 제거 절차를 따르세요.",
      sources: [
        { title: "DMA Operation Manual 4.2", section: "Hydraulic System - Pressure Monitoring", page: "p.82" },
        { title: "Winch Maintenance Guide 2.1", section: "Hydraulic Unit Inspection", page: "p.37" },
      ],
    };
  }

  if (normalized.includes("브레이크")) {
    return {
      title: "브레이크 해제 불가 시 확인 항목",
      summary: "브레이크가 해제되지 않을 때는 인터록, 유압/공압 공급, 솔레노이드 신호와 기계적 걸림을 우선 확인합니다.",
      steps: [
        { title: "안전 인터록 확인", body: "Emergency Stop, 도어·커버 인터록, 운전 모드 조건이 정상인지 확인합니다." },
        { title: "브레이크 공급 압력 확인", body: "브레이크 해제에 필요한 유압 또는 공압이 기준 범위에 도달하는지 확인합니다." },
        { title: "솔레노이드 출력 확인", body: "PLC 출력과 솔레노이드 밸브 동작 여부를 확인합니다." },
        { title: "기계적 걸림 확인", body: "브레이크 라이닝, 링크, 스프링 및 구동부에 고착이나 손상이 없는지 점검합니다." },
      ],
      warning: "브레이크를 강제로 해제하지 말고 하중이 걸린 상태에서는 반드시 안전 조치를 선행하세요.",
      sources: [
        { title: "Winch Maintenance Guide 2.1", section: "Brake Release Troubleshooting", page: "p.41" },
        { title: "DMA Operation Manual 4.2", section: "Winch Brake Operation", page: "p.76" },
      ],
    };
  }

  if (normalized.includes("체인") || normalized.includes("장력")) {
    return {
      title: "체인 장력 편차 확인 순서",
      summary: "장력 편차가 발생하면 센서값, 체인 배열, 하중 분배 및 제어 기준값을 함께 확인해야 합니다.",
      steps: [
        { title: "장력 센서값 확인", body: "좌우 또는 각 라인의 장력값이 정상적으로 수신되고 있는지 확인합니다." },
        { title: "체인 배열 확인", body: "체인의 꼬임, 비정상 마찰, 체인 스토퍼 간섭 여부를 확인합니다." },
        { title: "하중 분배 확인", body: "선박 자세와 외력 조건을 고려하여 특정 라인에 하중이 집중되는지 확인합니다." },
        { title: "제어 기준값 확인", body: "DMA 제어 기준값과 센서 영점·보정 상태를 확인합니다." },
      ],
      warning: "장력이 급격히 증가하는 경우 작업구역 접근을 통제하고 현장 책임자에게 즉시 보고하세요.",
      sources: [
        { title: "DMA Operation Manual 5.1", section: "Tension Monitoring", page: "p.104" },
        { title: "Mooring System Guide 3.3", section: "Load Distribution", page: "p.58" },
      ],
    };
  }

  return {
    title: "Winch 작동 불가 시 점검 순서",
    summary: "Winch가 작동하지 않을 때는 전원, 안전 인터록, 제어 신호, 유압 계통과 기계적 상태를 순서대로 확인합니다.",
    steps: [
      { title: "전원 공급 확인", body: "전원 차단기, 퓨즈, 전원 케이블 연결 상태와 입력 전압을 확인합니다." },
      { title: "비상 정지 및 인터록 확인", body: "Emergency Stop 해제 상태와 도어·커버·리미트 스위치 등 안전 인터록을 확인합니다." },
      { title: "제어 신호 확인", body: "PLC/제어 패널의 입력·출력 신호, 알람, Local/Remote 상태를 확인합니다." },
      { title: "유압 시스템 확인", body: "유압 오일 레벨, 펌프 작동, 압력, 필터 막힘과 누유 여부를 확인합니다." },
      { title: "기계 상태 및 부하 확인", body: "드럼·브레이크·클러치, 로프 감김 상태와 과부하 여부를 확인합니다." },
    ],
    warning: "점검 전 장비를 정지하고 전원을 차단한 뒤 현장 안전절차에 따라 작업하세요.",
    sources: [
      { title: "DMA Operation Manual 4.2", section: "4.2.3 Winch 고장 시 점검 절차", page: "p.82" },
      { title: "Winch Maintenance Guide 2.1", section: "2.1.5 Troubleshooting - No Operation", page: "p.37" },
    ],
  };
}

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const hasConversation = messages.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  function resetConversation() {
    setMessages([]);
    setQuestion("");
    setIsThinking(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function submitQuestion(value?: string) {
    const nextQuestion = (value ?? question).trim();
    if (!nextQuestion || isThinking) return;

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: nextQuestion,
      time: nowLabel(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setIsThinking(true);

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        answer: createMockAnswer(nextQuestion),
        time: nowLabel(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }, 700);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    submitQuestion();
  }

  function onComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
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
          <button className="nav-item active" onClick={resetConversation}>
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
          <div className="topbar-left">
            {hasConversation && (
              <button className="reset-button" onClick={resetConversation}>
                <RotateCcw size={17} />
                새 질문
              </button>
            )}
          </div>
          <div className="topbar-actions">
            <button><HelpCircle size={18} /> 도움말</button>
            <span className="divider" />
            <button><Languages size={18} /> 한국어</button>
          </div>
        </header>

        {!hasConversation ? (
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
              <textarea
                ref={inputRef}
                rows={1}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder="DMA 관련 질문을 입력하세요..."
                aria-label="DMA 질문 입력"
              />
              <button type="submit" aria-label="질문 보내기"><Send size={22} /></button>
              <span className="input-hint">Enter 전송 · Shift + Enter 줄바꿈</span>
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
          </section>
        ) : (
          <section className="chat-page">
            <div className="chat-header">
              <div>
                <strong>DMA AI Q&amp;A</strong>
                <span>현재 대화는 서버에 저장되지 않습니다.</span>
              </div>
              <div className="chat-status"><span className="dot" /> RAG Ready</div>
            </div>

            <div className="chat-scroll">
              <div className="session-start">
                <span>현재 세션</span>
              </div>

              {messages.map((message) => {
                if (message.role === "user") {
                  return (
                    <div className="message-row user-row" key={message.id}>
                      <div className="message-stack user-stack">
                        <div className="user-message">{message.text}</div>
                        <span className="message-time">{message.time}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="message-row assistant-row" key={message.id}>
                    <div className="assistant-avatar"><Bot size={20} /></div>
                    <div className="message-stack assistant-stack">
                      <div className="assistant-label">DMA Assistant <span>{message.time}</span></div>
                      <article className="chat-answer-card">
                        <div className="chat-answer-top">
                          <CheckCircle2 size={20} />
                          <div>
                            <h2>{message.answer.title}</h2>
                            <p>{message.answer.summary}</p>
                          </div>
                        </div>

                        <div className="chat-steps">
                          {message.answer.steps.map((step, index) => (
                            <div className="chat-step" key={`${message.id}-${step.title}`}>
                              <span>{index + 1}</span>
                              <div>
                                <strong>{step.title}</strong>
                                <p>{step.body}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="warning-box compact-warning">
                          <span className="warning-icon">!</span>
                          <strong>안전 주의</strong>
                          <span>{message.answer.warning}</span>
                        </div>

                        <div className="source-block">
                          <div className="source-title"><FileText size={17} /> 근거 문서</div>
                          <div className="source-grid">
                            {message.answer.sources.map((source) => (
                              <button className="source-chip" key={`${message.id}-${source.title}`}>
                                <div>
                                  <strong>{source.title}</strong>
                                  <span>{source.section}</span>
                                </div>
                                <b>{source.page}</b>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="chat-answer-footer">
                          <div className="answer-badges">
                            <span className="status-pill blue"><ShieldCheck size={14} />RAG 기반</span>
                            <span className="status-pill mint"><FileText size={14} />문서 {message.answer.sources.length}건</span>
                          </div>
                          <div className="feedback">
                            <span>도움이 되었나요?</span>
                            <button aria-label="좋아요"><ThumbsUp size={16} /></button>
                            <button aria-label="싫어요"><ThumbsDown size={16} /></button>
                          </div>
                        </div>
                      </article>
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="message-row assistant-row">
                  <div className="assistant-avatar"><Bot size={20} /></div>
                  <div className="thinking-card">
                    <Loader2 className="spin" size={18} />
                    <div>
                      <strong>관련 문서를 확인하고 있습니다.</strong>
                      <span>질문과 연관된 근거를 검색하는 중...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            <div className="composer-wrap">
              <form className="chat-composer" onSubmit={onSubmit}>
                <button type="button" className="attach-button" aria-label="첨부"><Paperclip size={20} /></button>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder="추가 질문을 입력하세요..."
                  aria-label="추가 질문 입력"
                />
                <button className="send-button" type="submit" aria-label="질문 보내기" disabled={isThinking || !question.trim()}>
                  <Send size={20} />
                </button>
              </form>
              <div className="composer-note">대화 내용은 현재 브라우저 화면에서만 유지되며 새로고침 시 초기화됩니다.</div>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
