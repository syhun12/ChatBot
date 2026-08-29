"use client";

import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  CircleAlert,
  Database,
  FileQuestion,
  FileText,
  HelpCircle,
  Languages,
  Layers3,
  ListChecks,
  Loader2,
  MessageSquareText,
  Paperclip,
  Radar,
  RotateCcw,
  Route,
  Search,
  Send,
  Settings,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import styles from "./answer-variants.module.css";

const exampleQuestions = [
  "DMA 시스템은 어떤 기술로 구성되나요?",
  "OMV-LiDAR는 DMA에서 어떤 역할을 하나요?",
  "기존 선박에 DMA를 적용할 때 무엇을 검토하나요?",
  "DMA Retrofit이란 무엇인가요?",
  "Winch/Windlass에서는 어떤 데이터를 활용하나요?",
  "DMA Degree 1.5는 어떤 수준인가요?",
];

type Source = {
  title: string;
  section: string;
  page: string;
};

type AnswerItem = {
  title: string;
  body: string;
};

type AnswerKind = "overview" | "role" | "checklist" | "process" | "data" | "insufficient";

type AssistantAnswer = {
  kind: AnswerKind;
  title: string;
  summary: string;
  items: AnswerItem[];
  note?: string;
  sources: Source[];
};

type ChatMessage =
  | { id: string; role: "user"; text: string; time: string }
  | { id: string; role: "assistant"; answer: AssistantAnswer; time: string };

const presentationSource = (page: string, section: string): Source => ({
  title: "지역혁신클러스터 진도점검 발표자료",
  section,
  page,
});

function nowLabel() {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function createMockAnswer(question: string): AssistantAnswer {
  const q = question.toLowerCase().replaceAll(" ", "");

  if (q.includes("degree") || q.includes("1.5")) {
    return {
      kind: "insufficient",
      title: "DMA Degree 1.5의 상세 기능 기준은 현재 자료만으로 확정할 수 없습니다",
      summary:
        "진도점검 발표자료에서는 DMA Degree 1.5를 ‘과제 정의’ 수준으로 표기하고 있으며, 기존 선박의 자율기능 수준을 Degree 0/1에서 DMA Degree 1.5~2.0으로 향상시키는 것을 Retrofit 목표로 설명합니다.",
      items: [
        {
          title: "자료에서 확인되는 내용",
          body: "DMA Degree 1.5는 본 과제에서 정의한 자율기능 수준이며, 기존 선박의 계류·묘박 관련 장비와 제어시스템을 개조하여 자율화 수준을 높이는 목표와 연결됩니다.",
        },
        {
          title: "자료에서 확인되지 않는 내용",
          body: "Degree 1.5의 세부 기능 목록, 자동화 범위, 운전 권한, 단계별 판정 조건은 이 발표자료에 구체적으로 제시되어 있지 않습니다.",
        },
        {
          title: "추가 지식자료 필요",
          body: "향후 자율기능 정의서, 제어 요구사항, 시스템 사양서가 등록되면 해당 근거를 기반으로 상세 기준을 답변하도록 구성하는 것이 적절합니다.",
        },
      ],
      note: "근거가 없는 세부사항은 추정해서 생성하지 않고, 현재 지식자료의 범위를 명확히 안내하도록 설계합니다.",
      sources: [presentationSource("p.19", "DMA Retrofit 정의 및 자율기능 수준")],
    };
  }

  if (q.includes("retrofit") || q.includes("리트로핏") || q.includes("개조")) {
    return {
      kind: "process",
      title: "DMA Retrofit은 기존 선박의 자율 계류·묘박 기능을 높이기 위한 공학적 개조입니다",
      summary:
        "발표자료에서는 신조 도면(Ship Construction File) 대비 계류·묘박 관련 장비, 제어, 전력, 통신, 센서, 갑판구조를 변경 또는 추가하는 행위를 DMA Retrofit으로 정의합니다.",
      items: [
        {
          title: "Pre-Assessment",
          body: "대상선의 기존 시스템과 자율기능 요건을 사전 검토하여 Retrofit 필요 여부와 검토 범위를 판단합니다.",
        },
        {
          title: "Retrofit 범위 결정",
          body: "기존 탑재 장치, 구조·공간, 전력 시스템, 계류 배열 등 변경 영향을 검토해 개조 범위를 정합니다.",
        },
        {
          title: "Retrofit Engineering",
          body: "DMA Deck Machinery 및 제어시스템 설치를 위한 개조 설계, 도면, 승인 절차와 기술 요구사항을 구체화합니다.",
        },
        {
          title: "Repair와 구분",
          body: "노후·손상에 따른 동일 사양 교체나 단순 보강은 Retrofit이 아니라 Repair로 구분해 제외합니다.",
        },
      ],
      sources: [
        presentationSource("p.6", "참여기관별 개발목표 및 내용"),
        presentationSource("p.19", "DMA Retrofit 표준 프로세스 및 정의"),
      ],
    };
  }

  if (q.includes("기존선박") || q.includes("적용") || q.includes("검토")) {
    return {
      kind: "checklist",
      title: "기존 선박에 DMA를 적용할 때는 장비뿐 아니라 선박 전체 연계 구조를 함께 검토합니다",
      summary:
        "총괄과제는 실증선의 기존 탑재 시스템을 분석하고 Deck Machinery의 사양·운용 특성, 제어계통과 인터페이스, 전력·제어·통신 시스템 연계 구조를 검토하도록 계획하고 있습니다.",
      items: [
        {
          title: "Deck Machinery 현황",
          body: "기존 Winch/Windlass 등 Deck Machinery 장비의 사양과 운용 특성을 분석합니다.",
        },
        {
          title: "제어 및 인터페이스",
          body: "기존 제어계통과 인터페이스 구조를 분석하고 DMA 제어 알고리즘과의 연계 가능성을 검토합니다.",
        },
        {
          title: "전력·통신 연계",
          body: "선박 전력, 제어, 통신 시스템의 연계 구조와 DMA 적용 시 필요한 변경 사항을 검토합니다.",
        },
        {
          title: "구조·공간·계류 배열",
          body: "설치 구조와 공간, 전력 시스템, Mooring Arrangement 등 개조에 영향을 주는 설계 요소를 함께 확인합니다.",
        },
      ],
      sources: [
        presentationSource("p.5", "실증선 기존 탑재 시스템 분석 및 통합 엔지니어링"),
        presentationSource("p.6", "DMA Retrofit 대상선박 기존 시스템 분석"),
      ],
    };
  }

  if (q.includes("lidar") || q.includes("omv") || q.includes("라이다")) {
    return {
      kind: "role",
      title: "OMV-LiDAR는 계류·묘박 과정의 외부환경과 선박 상태를 인지하는 핵심 센서 시스템입니다",
      summary:
        "발표자료는 LiDAR-영상 센서 융합을 통해 실시간 환경을 인지하고, 이를 기반으로 자율 판단 및 제어 알고리즘을 개발하는 구조를 제시합니다.",
      items: [
        {
          title: "전방위 환경 감시",
          body: "OMV-LiDAR 기반 전방위 감시 H/W와 센서 시스템을 통해 계류·묘박 주변 환경 정보를 확보합니다.",
        },
        {
          title: "LiDAR + 영상 융합",
          body: "LiDAR와 영상 데이터를 융합해 실시간 환경 및 선박 상태를 인식·분석하는 방향으로 개발합니다.",
        },
        {
          title: "AI 상황 인식",
          body: "AI 기반 상황 인식 모델과 선박 동역학·환경 조건 기반 시뮬레이션을 자율 판단에 활용합니다.",
        },
        {
          title: "자율 제어 연계",
          body: "인지 결과는 자율 묘박·계류 알고리즘과 연계되어 Winch/Windlass 제어 시스템의 판단 정보로 활용됩니다.",
        },
      ],
      sources: [
        presentationSource("p.3", "과제 개요 및 통합 시스템 구성"),
        presentationSource("p.4", "2세부 OMV-LiDAR 개발전략"),
      ],
    };
  }

  if (q.includes("데이터") || q.includes("winch") || q.includes("windlass")) {
    return {
      kind: "data",
      title: "Winch/Windlass는 센서 인터페이스 기반 운용 데이터를 통합 수집·처리하도록 개발됩니다",
      summary:
        "1세부 개발전략에는 IoT 제어 모듈과 DAQ 장치 설계, 센서 인터페이스 기반 Winch/Windlass 운용 데이터의 통합 수집·처리, 복합 센서 기반 제어 H/W 및 알고리즘 개발이 포함되어 있습니다.",
      items: [
        {
          title: "IoT 제어 모듈 및 DAQ",
          body: "Deck Machinery 운용 데이터를 취득하고 제어 시스템과 연계하기 위한 IoT 제어 모듈과 DAQ 장치를 설계합니다.",
        },
        {
          title: "센서 데이터 통합",
          body: "Winch/Windlass의 센서 인터페이스를 기반으로 운용 데이터를 통합 수집·처리하는 기술을 확보합니다.",
        },
        {
          title: "복합 센서 기반 제어",
          body: "수집된 센서 데이터를 활용할 수 있는 제어 H/W와 제어 알고리즘을 개발하는 것이 목표입니다.",
        },
        {
          title: "세부 데이터 항목은 아직 미정",
          body: "현재 발표자료에는 장력, 속도, 압력 등 개별 센서 항목이나 데이터 필드 목록이 구체적으로 정의되어 있지 않습니다.",
        },
      ],
      note: "세부 센서 목록과 정상범위 값은 향후 장비 사양서·운용 매뉴얼이 확보된 뒤 지식베이스에 추가해야 합니다.",
      sources: [presentationSource("p.4", "1세부 Deck Machinery 개발전략")],
    };
  }

  if (q.includes("구성") || q.includes("시스템") || q.includes("dma") || q.includes("기술")) {
    return {
      kind: "overview",
      title: "DMA 과제는 ‘자동 제어 + 환경 인지 + 데이터 연계’의 3개 기술축으로 구성됩니다",
      summary:
        "진도점검 발표자료에서 DMA 통합 시스템은 지능형 Winch/Windlass, OMV-LiDAR 기반 자율 제어, AI 기반 정박상태 정보 및 선박-항만 데이터 연계 플랫폼을 통합하는 구조로 제시됩니다.",
      items: [
        {
          title: "1세부 · 지능형 Deck Machinery",
          body: "AI 기반 장력 제어가 가능한 Winch/Windlass와 계류·묘박 자동 제어 시스템을 개발합니다.",
        },
        {
          title: "2세부 · OMV-LiDAR 자율 제어",
          body: "LiDAR-영상 센서 융합을 통한 실시간 환경 인지와 AI 기반 자율 판단·제어 알고리즘을 개발합니다.",
        },
        {
          title: "3세부 · 데이터 연계 플랫폼",
          body: "AI 기반 정박상태 정보를 생성하고 선박-항만 데이터를 자율 연계하는 통합 관제 플랫폼을 개발합니다.",
        },
        {
          title: "총괄 · 통합 및 실증",
          body: "실증선 개조, 선박-항만-육상 클라우드 실증환경, 선급 인증과 글로벌 사업화를 통해 전체 시스템을 통합 검증합니다.",
        },
      ],
      sources: [
        presentationSource("p.3", "과제 개요 및 세부과제 구성"),
        presentationSource("p.4", "개발전략 Master Plan"),
      ],
    };
  }

  return {
    kind: "insufficient",
    title: "현재 등록된 발표자료에서 직접적인 근거를 찾기 어렵습니다",
    summary:
      "이 프로토타입은 진도점검 발표자료 내용만 데모 지식으로 사용하고 있습니다. 장비 매뉴얼, 제어 사양서, 알람 목록, 유지보수 절차서 등이 추가되면 현장 운용 질문까지 답변 범위를 확장할 수 있습니다.",
    items: [
      {
        title: "현재 답변 가능한 범위",
        body: "DMA 시스템 구성, 개발 기술, OMV-LiDAR 역할, Retrofit 개념과 검토 범위 등 발표자료에 명시된 내용입니다.",
      },
      {
        title: "현재 자료에 없는 범위",
        body: "구체적인 장비 운전값, 알람 코드, 부품별 점검 절차, 정비 주기처럼 실제 장비 매뉴얼이 필요한 정보입니다.",
      },
      {
        title: "향후 필요한 자료",
        body: "Winch/Windlass 매뉴얼, 제어 로직, 센서 목록 및 정상범위, 알람 코드, 점검·정비 절차, 장비 도면 등의 기술자료가 필요합니다.",
      },
    ],
    note: "근거가 부족한 경우 추정 답변보다 ‘자료 부족’을 명확히 표시하는 방향으로 설계합니다.",
    sources: [presentationSource("p.21", "AI 챗봇 어시스턴트 개발 기반 구축")],
  };
}

function kindLabel(kind: AnswerKind) {
  const labels: Record<AnswerKind, string> = {
    overview: "시스템 구성",
    role: "역할·연계",
    checklist: "적용 검토",
    process: "절차·프로세스",
    data: "데이터 흐름",
    insufficient: "근거 범위",
  };
  return labels[kind];
}

function KindIcon({ kind }: { kind: AnswerKind }) {
  if (kind === "overview") return <Layers3 size={20} />;
  if (kind === "role") return <Radar size={20} />;
  if (kind === "checklist") return <ListChecks size={20} />;
  if (kind === "process") return <Route size={20} />;
  if (kind === "data") return <Database size={20} />;
  return <FileQuestion size={20} />;
}

function AnswerBody({ answer }: { answer: AssistantAnswer }) {
  if (answer.kind === "overview") {
    return (
      <div className={styles.body}>
        <div className={styles.overviewGrid}>
          {answer.items.map((item, index) => (
            <div className={styles.overviewCard} key={item.title}>
              <span className={styles.overviewNumber}>TECH 0{index + 1}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (answer.kind === "role") {
    return (
      <div className={styles.body}>
        <div className={styles.roleFlow}>
          {answer.items.map((item, index) => (
            <div className={styles.flowNode} key={item.title}>
              <span className={styles.flowStep}>STEP {index + 1}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (answer.kind === "checklist") {
    return (
      <div className={styles.body}>
        <div className={styles.checklist}>
          {answer.items.map((item) => (
            <div className={styles.checkItem} key={item.title}>
              <span className={styles.checkIcon}><CheckCircle2 size={16} /></span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (answer.kind === "process") {
    return (
      <div className={styles.body}>
        <div className={styles.processTimeline}>
          {answer.items.map((item, index) => (
            <div className={styles.processItem} key={item.title}>
              <span className={styles.processIndex}>{index + 1}</span>
              <div className={styles.processContent}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (answer.kind === "data") {
    return (
      <div className={styles.body}>
        <div className={styles.dataPipeline}>
          {answer.items.map((item, index) => (
            <div className={styles.dataNode} key={item.title}>
              <span className={styles.dataIndex}>{index + 1}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <div className={styles.limitGrid}>
        {answer.items.map((item, index) => (
          <div className={styles.limitCard} key={item.title}>
            <span className={styles.limitState}>
              {index === 0 ? "확인 가능" : index === 1 ? "현재 확인 불가" : "추가 자료 필요"}
            </span>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnswerCard({ answer }: { answer: AssistantAnswer }) {
  const kindClass: Record<AnswerKind, string> = {
    overview: styles.kind_overview,
    role: styles.kind_role,
    checklist: styles.kind_checklist,
    process: styles.kind_process,
    data: styles.kind_data,
    insufficient: styles.kind_insufficient,
  };

  return (
    <article className={`${styles.answerCard} ${kindClass[answer.kind]}`}>
      <div className={styles.answerHeader}>
        <div className={styles.kindIcon}><KindIcon kind={answer.kind} /></div>
        <div>
          <h2 className={styles.answerTitle}>{answer.title}</h2>
          <p className={styles.answerSummary}>{answer.summary}</p>
        </div>
        <span className={styles.kindLabel}>{kindLabel(answer.kind)}</span>
      </div>

      <AnswerBody answer={answer} />

      {answer.note && (
        <div className={styles.noteBox}>
          <span className={styles.noteIcon}>!</span>
          <strong>{answer.kind === "insufficient" ? "근거 범위 안내" : "참고"}</strong>
          <span>{answer.note}</span>
        </div>
      )}

      <div className="source-block">
        <div className="source-title"><FileText size={15} /> 근거 자료</div>
        <div className="source-grid">
          {answer.sources.map((source) => (
            <div className="source-chip" key={`${source.page}-${source.section}`}>
              <div>
                <strong>{source.title}</strong>
                <span>{source.section}</span>
              </div>
              <b>{source.page}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-answer-footer">
        <div className="answer-badges">
          <span className="status-pill blue"><ShieldCheck size={14} />발표자료 근거 답변</span>
          <span className="status-pill mint"><FileText size={14} />{answer.sources.length}건 참조</span>
        </div>
        <div className="feedback">
          <span>도움이 되었나요?</span>
          <button aria-label="도움됨"><ThumbsUp size={15} /></button>
          <button aria-label="도움되지 않음"><ThumbsDown size={15} /></button>
        </div>
      </div>
    </article>
  );
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
    }, 650);
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
          <button className="collapse-btn" onClick={() => setCollapsed((value) => !value)} aria-label="메뉴 접기">
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
                <RotateCcw size={17} /> 새 질문
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
                현재 프로토타입은 진도점검 발표자료를 데모 지식으로 사용합니다.
                향후 기술문서와 매뉴얼이 추가되면 RAG 검색 범위를 확장합니다.
              </p>
              <div className="status-row">
                <span className="status-pill green"><span className="dot" />데모 지식자료 적용</span>
                <span className="status-pill blue"><ShieldCheck size={16} />질문 유형별 응답 UI</span>
              </div>
            </div>

            <form className="hero-search" onSubmit={onSubmit}>
              <Search size={24} />
              <textarea
                ref={inputRef}
                rows={1}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={onComposerKeyDown}
                placeholder="DMA 관련 질문을 입력하세요..."
                aria-label="DMA 질문 입력"
              />
              <button type="submit" aria-label="질문 보내기"><Send size={22} /></button>
              <span className="input-hint">Enter 전송 · Shift + Enter 줄바꿈</span>
            </form>

            <div className="examples-wrap">
              <div className="section-label">발표자료 기반 예시 질문</div>
              <div className="examples-grid">
                {exampleQuestions.map((item) => (
                  <button className="example-card" key={item} onClick={() => submitQuestion(item)}>
                    <div className="example-icon"><Bot size={20} /></div>
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
                <span>현재 세션의 대화는 서버에 저장되지 않습니다.</span>
              </div>
              <div className="chat-status"><span className="dot" /> 발표자료 Demo</div>
            </div>

            <div className="chat-scroll">
              <div className="session-start"><span>현재 세션</span></div>

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
                    <div className="assistant-avatar"><Bot size={19} /></div>
                    <div className="message-stack assistant-stack">
                      <div className="assistant-label">DMA Assistant <span>{message.time}</span></div>
                      <AnswerCard answer={message.answer} />
                    </div>
                  </div>
                );
              })}

              {isThinking && (
                <div className="message-row assistant-row">
                  <div className="assistant-avatar"><Bot size={19} /></div>
                  <div className="thinking-card">
                    <Loader2 size={19} className="spin" />
                    <div>
                      <strong>질문 유형과 근거 자료를 확인하고 있습니다</strong>
                      <span>현재는 진도점검 발표자료 기반 데모 응답입니다.</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <form className="composer-wrap" onSubmit={onSubmit}>
              <div className="chat-composer">
                <button type="button" className="attach-button" aria-label="파일 첨부 준비 중">
                  <Paperclip size={20} />
                </button>
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={onComposerKeyDown}
                  placeholder="추가 질문을 입력하세요..."
                  aria-label="추가 질문 입력"
                />
                <button className="send-button" type="submit" aria-label="질문 보내기" disabled={isThinking}>
                  {isThinking ? <Loader2 size={19} className="spin" /> : <Send size={20} />}
                </button>
              </div>
              <div className="composer-note">Enter 전송 · Shift + Enter 줄바꿈 · 새로고침 시 현재 대화 초기화</div>
            </form>
          </section>
        )}
      </section>
    </main>
  );
}
