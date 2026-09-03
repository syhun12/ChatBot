"use client";

import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  CircleAlert,
  Database,
  FileText,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  MessageSquareText,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tag,
  ThumbsDown,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import DocumentIngestionPanel from "./components/DocumentIngestionPanel";
import styles from "./admin.module.css";

type Section = "dashboard" | "knowledge" | "images" | "operations" | "settings";
type KnowledgeTab = "documents" | "answers" | "keywords";
type OperationTab = "feedback" | "test";
type RagState = "READY" | "EXTRACTING" | "CHUNKING" | "EMBEDDING" | "FAILED";

type DocumentRow = {
  name: string;
  type: string;
  status: "활성" | "비활성";
  rag: RagState;
  ragLabel: string;
  date: string;
  pages?: number;
  chunks?: number;
};

const documents: DocumentRow[] = [
  { name: "DMA_진도점검_발표자료.pdf", type: "기술자료", status: "활성", rag: "READY", ragLabel: "RAG 준비", date: "2026.08.31", pages: 29, chunks: 42 },
  { name: "DMA_Retrofit_기획자료.pdf", type: "기술자료", status: "활성", rag: "READY", ragLabel: "RAG 준비", date: "2026.08.29", pages: 18, chunks: 31 },
  { name: "Winch_운용자료_샘플.pdf", type: "매뉴얼", status: "활성", rag: "CHUNKING", ragLabel: "Chunk 생성", date: "2026.08.28", pages: 128 },
  { name: "Sensor_Scan_Reference.pdf", type: "참고자료", status: "비활성", rag: "FAILED", ragLabel: "텍스트 추출 실패", date: "2026.08.26" },
];

const answers = [
  { title: "DMA 시스템 구성", question: "DMA 시스템은 어떤 기술로 구성되나요?", priority: 80, status: "활성" },
  { title: "DMA Retrofit 정의", question: "DMA Retrofit이란 무엇인가요?", priority: 90, status: "활성" },
  { title: "Degree 1.5 안내", question: "DMA Degree 1.5는 어떤 수준인가요?", priority: 70, status: "작성중" },
];

const keywords = [
  { name: "DMA", synonyms: "Dynamic Mooring & Anchoring", links: 12 },
  { name: "Winch", synonyms: "윈치, Mooring Winch", links: 8 },
  { name: "Retrofit", synonyms: "개조, 리트로핏", links: 6 },
  { name: "OMV-LiDAR", synonyms: "LiDAR, 라이다", links: 5 },
];

const feedbacks = [
  { id: "#1024", question: "DMA Degree 1.5의 세부 기준은?", reason: "정보가 부족함", status: "미확인", date: "09.01 10:32" },
  { id: "#1023", question: "Winch 데이터는 어떤 항목을 쓰나요?", reason: "근거가 부족함", status: "검토중", date: "09.01 09:14" },
  { id: "#1022", question: "Retrofit 적용 범위를 알려줘", reason: "질문 의도 파악 미흡", status: "개선완료", date: "08.31 18:21" },
];

const imageCards = [
  ["DMA 시스템 구성도", "시스템 구성", "도식"],
  ["Winch 구조 참고", "Winch", "장비"],
  ["OMV-LiDAR 개념도", "OMV-LiDAR", "센서"],
  ["Retrofit 검토 흐름", "Retrofit", "프로세스"],
  ["선박 계류 참고", "Mooring", "현장"],
  ["데이터 연계 구조", "데이터", "아키텍처"],
];

const menuItems: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "knowledge", label: "지식 관리", icon: FileText },
  { id: "images", label: "이미지 관리", icon: ImageIcon },
  { id: "operations", label: "서비스 운영", icon: MessageSquareText },
  { id: "settings", label: "시스템 설정", icon: Settings },
];

function Status({ tone = "green", children }: { tone?: "green" | "blue" | "red" | "gray" | "orange"; children: React.ReactNode }) {
  return <span className={`${styles.status} ${styles[`status_${tone}`]}`}>{children}</span>;
}

function ragTone(state: RagState): "green" | "blue" | "red" {
  if (state === "READY") return "green";
  if (state === "FAILED") return "red";
  return "blue";
}

export default function AdminPage() {
  const [section, setSection] = useState<Section>("dashboard");
  const [knowledgeTab, setKnowledgeTab] = useState<KnowledgeTab>("documents");
  const [operationTab, setOperationTab] = useState<OperationTab>("feedback");
  const [drawer, setDrawer] = useState<null | "document" | "answer" | "keyword" | "image" | "feedback">(null);
  const [search, setSearch] = useState("");
  const [ragEnabled, setRagEnabled] = useState(true);
  const [imageEnabled, setImageEnabled] = useState(true);
  const [model, setModel] = useState("gpt-5-mini");
  const [apiKey, setApiKey] = useState("");
  const [testQuestion, setTestQuestion] = useState("DMA Retrofit은 기존 선박에 어떻게 적용하나요?");
  const [testRan, setTestRan] = useState(false);

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((item) => `${item.name} ${item.type} ${item.ragLabel}`.toLowerCase().includes(q));
  }, [search]);

  const titleMap: Record<Section, [string, string]> = {
    dashboard: ["대시보드", "DMA Assistant의 지식과 서비스 상태를 빠르게 확인합니다."],
    knowledge: ["지식 관리", "문서 등록부터 RAG 지식화, 지정답변, 키워드를 한 곳에서 관리합니다."],
    images: ["이미지 관리", "답변에 연결할 이미지와 도식을 등록하고 분류합니다."],
    operations: ["서비스 운영", "사용자 피드백을 확인하고 응답 품질을 테스트합니다."],
    settings: ["시스템 설정", "OpenAI 연결과 최소 RAG 응답 정책을 설정합니다."],
  };

  function openDrawer(type: NonNullable<typeof drawer>) {
    setDrawer(type);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden="true" />
          <div><strong>DMA Assistant</strong><span>Admin</span></div>
        </div>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={`${styles.navItem} ${section === item.id ? styles.active : ""}`} onClick={() => setSection(item.id)}>
                <Icon size={19} /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.mockBadge}>UI MOCK</div>
          <p>현재 DB/API 미연결 상태입니다.</p>
          <Link href="/" className={styles.backLink}><ArrowLeft size={16} /> 사용자 화면</Link>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div><span className={styles.productName}>DMA Assistant Admin</span><span className={styles.environment}>1차년도 MVP · UI Preview</span></div>
          <div className={styles.topbarRight}><span className={styles.connection}><span /> Mock Data</span><div className={styles.avatar}>A</div></div>
        </header>

        <div className={styles.page}>
          <div className={styles.pageHeading}>
            <div><h1>{titleMap[section][0]}</h1><p>{titleMap[section][1]}</p></div>
            {section === "knowledge" && (
              <button className={styles.primaryButton} onClick={() => openDrawer(knowledgeTab === "documents" ? "document" : knowledgeTab === "answers" ? "answer" : "keyword")}>
                <Plus size={17} /> 신규 등록
              </button>
            )}
            {section === "images" && <button className={styles.primaryButton} onClick={() => openDrawer("image")}><Upload size={17} /> 이미지 등록</button>}
          </div>

          {section === "dashboard" && <Dashboard onMove={setSection} />}
          {section === "knowledge" && <Knowledge tab={knowledgeTab} setTab={setKnowledgeTab} search={search} setSearch={setSearch} filteredDocuments={filteredDocuments} onOpen={openDrawer} />}
          {section === "images" && <Images onOpen={() => openDrawer("image")} />}
          {section === "operations" && <Operations tab={operationTab} setTab={setOperationTab} onOpenFeedback={() => openDrawer("feedback")} testQuestion={testQuestion} setTestQuestion={setTestQuestion} testRan={testRan} onRun={() => setTestRan(true)} />}
          {section === "settings" && <SystemSettings apiKey={apiKey} setApiKey={setApiKey} model={model} setModel={setModel} ragEnabled={ragEnabled} setRagEnabled={setRagEnabled} imageEnabled={imageEnabled} setImageEnabled={setImageEnabled} />}
        </div>
      </section>

      {drawer && <AdminDrawer type={drawer} onClose={() => setDrawer(null)} />}
    </main>
  );
}

function Dashboard({ onMove }: { onMove: (section: Section) => void }) {
  return (
    <div className={styles.dashboardGrid}>
      <div className={styles.metricGrid}>
        <Metric icon={FileText} label="등록 문서" value="4" note="RAG 준비 2건" />
        <Metric icon={MessageSquareText} label="지정답변" value="3" note="활성 2건" />
        <Metric icon={ThumbsDown} label="미처리 피드백" value="2" note="확인 필요" tone="orange" />
        <Metric icon={CircleAlert} label="처리 실패" value="1" note="텍스트 추출 실패" tone="red" />
      </div>

      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>최근 활동</h2><p>Mock 데이터 기준 최근 관리자 작업</p></div></div>
        <div className={styles.activityList}>
          <Activity icon={Upload} title="DMA 진도점검 발표자료 RAG 준비 완료" meta="지식 관리 · 방금 전" />
          <Activity icon={RefreshCw} title="Winch 운용자료 Chunk 생성 중" meta="지식 관리 · 12분 전" />
          <Activity icon={ThumbsDown} title="사용자 피드백 #1024 접수" meta="서비스 운영 · 32분 전" />
          <Activity icon={Tag} title="Retrofit 키워드 연결 수정" meta="지식 관리 · 1시간 전" />
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>서비스 상태</h2><p>현재는 UI 표시용 상태값입니다.</p></div></div>
        <div className={styles.serviceList}>
          <ServiceLine icon={Sparkles} label="OpenAI API" value="미연결" />
          <ServiceLine icon={Database} label="Vector DB" value="미연결" />
          <ServiceLine icon={ImageIcon} label="Storage" value="미연결" />
        </div>
      </section>

      <section className={`${styles.card} ${styles.quickCard}`}>
        <div className={styles.cardHeader}><div><h2>빠른 작업</h2><p>1차년도에 자주 사용할 작업만 배치했습니다.</p></div></div>
        <button onClick={() => onMove("knowledge")}><FileText size={19} /><span><strong>문서 지식화</strong><small>텍스트 추출·Chunk·Embedding</small></span><ChevronRight size={18} /></button>
        <button onClick={() => onMove("operations")}><Play size={19} /><span><strong>응답 테스트</strong><small>Mock 답변 흐름 확인</small></span><ChevronRight size={18} /></button>
        <button onClick={() => onMove("operations")}><ThumbsDown size={19} /><span><strong>피드백 확인</strong><small>개선 필요 답변 검토</small></span><ChevronRight size={18} /></button>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, note, tone = "blue" }: { icon: typeof FileText; label: string; value: string; note: string; tone?: "blue" | "orange" | "red" }) {
  return <div className={styles.metricCard}><div className={`${styles.metricIcon} ${styles[`metric_${tone}`]}`}><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></div>;
}

function Activity({ icon: Icon, title, meta }: { icon: typeof Upload; title: string; meta: string }) {
  return <div className={styles.activity}><div><Icon size={16} /></div><span><strong>{title}</strong><small>{meta}</small></span></div>;
}

function ServiceLine({ icon: Icon, label, value }: { icon: typeof Sparkles; label: string; value: string }) {
  return <div className={styles.serviceLine}><div><Icon size={18} /><span>{label}</span></div><Status tone="gray">{value}</Status></div>;
}

function Knowledge({ tab, setTab, search, setSearch, filteredDocuments, onOpen }: {
  tab: KnowledgeTab;
  setTab: (tab: KnowledgeTab) => void;
  search: string;
  setSearch: (value: string) => void;
  filteredDocuments: DocumentRow[];
  onOpen: (type: "document" | "answer" | "keyword") => void;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.tabs}>
        <button className={tab === "documents" ? styles.tabActive : ""} onClick={() => setTab("documents")}>문서</button>
        <button className={tab === "answers" ? styles.tabActive : ""} onClick={() => setTab("answers")}>지정답변</button>
        <button className={tab === "keywords" ? styles.tabActive : ""} onClick={() => setTab("keywords")}>키워드</button>
      </div>

      <div className={styles.toolbar}>
        <label className={styles.searchBox}><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="검색어 입력" /></label>
        <button className={styles.secondaryButton}><SlidersHorizontal size={16} /> 필터</button>
      </div>

      {tab === "documents" && (
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>문서명</th><th>유형</th><th>상태</th><th>지식화 상태</th><th>페이지 / Chunk</th><th>등록일</th><th /></tr></thead>
            <tbody>{filteredDocuments.map((item) => (
              <tr key={item.name}>
                <td><FileText size={15} />{item.name}</td>
                <td>{item.type}</td>
                <td><Status tone={item.status === "활성" ? "green" : "gray"}>{item.status}</Status></td>
                <td><Status tone={ragTone(item.rag)}>{item.ragLabel}</Status></td>
                <td>{item.pages ? `${item.pages}p` : "-"} / {item.chunks ? `${item.chunks} chunks` : item.rag === "CHUNKING" ? "생성 중" : "-"}</td>
                <td>{item.date}</td>
                <td><button className={styles.textButton} onClick={() => onOpen("document")}>{item.rag === "FAILED" ? "확인" : "보기"}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab === "answers" && (
        <div className={styles.tableWrap}><table><thead><tr><th>제목</th><th>대표 질문</th><th>우선순위</th><th>상태</th><th /></tr></thead><tbody>
          {answers.map((item) => <tr key={item.title}><td>{item.title}</td><td>{item.question}</td><td>{item.priority}</td><td><Status tone={item.status === "활성" ? "green" : "orange"}>{item.status}</Status></td><td><button className={styles.textButton} onClick={() => onOpen("answer")}>수정</button></td></tr>)}
        </tbody></table></div>
      )}

      {tab === "keywords" && (
        <div className={styles.tableWrap}><table><thead><tr><th>대표 키워드</th><th>동의어 / 유사어</th><th>연결 항목</th><th>상태</th><th /></tr></thead><tbody>
          {keywords.map((item) => <tr key={item.name}><td><Tag size={15} />{item.name}</td><td>{item.synonyms}</td><td>{item.links}건</td><td><Status tone="green">활성</Status></td><td><button className={styles.textButton} onClick={() => onOpen("keyword")}>수정</button></td></tr>)}
        </tbody></table></div>
      )}
    </section>
  );
}

function Images({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <div className={styles.toolbarStandalone}><label className={styles.searchBox}><Search size={17} /><input placeholder="이미지 제목, 키워드 검색" /></label><button className={styles.secondaryButton}><SlidersHorizontal size={16} /> 전체 분류</button></div>
      <div className={styles.imageGrid}>
        {imageCards.map(([title, keyword, category], index) => (
          <button className={styles.imageCard} key={title} onClick={onOpen}>
            <div className={`${styles.imagePlaceholder} ${styles[`imageTone${(index % 4) + 1}`]}`}><ImageIcon size={32} /><span>{category}</span></div>
            <div><strong>{title}</strong><span>{keyword}</span></div>
          </button>
        ))}
      </div>
    </>
  );
}

function Operations({ tab, setTab, onOpenFeedback, testQuestion, setTestQuestion, testRan, onRun }: {
  tab: OperationTab;
  setTab: (tab: OperationTab) => void;
  onOpenFeedback: () => void;
  testQuestion: string;
  setTestQuestion: (value: string) => void;
  testRan: boolean;
  onRun: () => void;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.tabs}><button className={tab === "feedback" ? styles.tabActive : ""} onClick={() => setTab("feedback")}>사용자 피드백</button><button className={tab === "test" ? styles.tabActive : ""} onClick={() => setTab("test")}>응답 테스트</button></div>

      {tab === "feedback" ? (
        <div className={styles.tableWrap}><table><thead><tr><th>ID</th><th>원 질문</th><th>피드백 사유</th><th>처리상태</th><th>제출일</th><th /></tr></thead><tbody>
          {feedbacks.map((item) => <tr key={item.id}><td>{item.id}</td><td>{item.question}</td><td>{item.reason}</td><td><Status tone={item.status === "개선완료" ? "green" : item.status === "검토중" ? "blue" : "orange"}>{item.status}</Status></td><td>{item.date}</td><td><button className={styles.textButton} onClick={onOpenFeedback}>검토</button></td></tr>)}
        </tbody></table></div>
      ) : (
        <div className={styles.testLayout}>
          <div className={styles.testInput}><label>테스트 질문</label><textarea value={testQuestion} onChange={(e) => setTestQuestion(e.target.value)} /><button className={styles.primaryButton} onClick={onRun}><Play size={17} /> 답변 테스트</button></div>
          <div className={styles.testResult}>
            {!testRan ? <div className={styles.emptyState}><Bot size={30} /><strong>테스트 결과가 여기에 표시됩니다.</strong><span>현재는 Mock 결과만 확인할 수 있습니다.</span></div> : (
              <><div className={styles.resultSummary}><Status tone="blue">Intent: procedure</Status><span>지정답변 없음 → RAG 검색 → AI 답변 생성</span><Status tone="green">SUPPORTED Mock</Status></div><h3>DMA Retrofit 적용 검토</h3><p>현재 등록된 Mock 지식 기준으로 기존 선박의 계류·묘박 장비와 제어·전력·통신 연계 구조를 검토한 뒤 Retrofit 범위를 결정하는 흐름으로 답변합니다.</p><div className={styles.sourceMini}><FileText size={16} /><span><strong>참조 자료</strong> DMA 진도점검 발표자료 · p.19 · Mock Chunk</span></div></>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SystemSettings({ apiKey, setApiKey, model, setModel, ragEnabled, setRagEnabled, imageEnabled, setImageEnabled }: {
  apiKey: string;
  setApiKey: (value: string) => void;
  model: string;
  setModel: (value: string) => void;
  ragEnabled: boolean;
  setRagEnabled: (value: boolean) => void;
  imageEnabled: boolean;
  setImageEnabled: (value: boolean) => void;
}) {
  const [tested, setTested] = useState(false);
  return (
    <div className={styles.settingsGrid}>
      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>OpenAI 연결</h2><p>현재 입력값은 브라우저 상태에만 존재하며 저장되지 않습니다.</p></div><KeyRound size={20} /></div>
        <div className={styles.formGroup}><label>API Key</label><input type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); setTested(false); }} placeholder="sk-... (UI 확인용)" /></div>
        <div className={styles.inlineActions}><button className={styles.secondaryButton} onClick={() => setTested(true)}><RefreshCw size={16} /> 연결 테스트</button>{tested && <Status tone="gray">Mock: 실제 호출 없음</Status>}</div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}><div><h2>AI / RAG 응답 설정</h2><p>AI가 개입하는 지점과 RAG 정책을 1차년도 최소 범위로 표시합니다.</p></div><SlidersHorizontal size={20} /></div>
        <div className={styles.formGroup}><label>사용 모델</label><select value={model} onChange={(e) => setModel(e.target.value)}><option value="gpt-5-mini">gpt-5-mini</option><option value="gpt-5">gpt-5</option><option value="gpt-4.1-mini">gpt-4.1-mini</option></select></div>
        <Toggle label="RAG 사용" description="등록 문서 Chunk를 검색해 답변 근거로 활용" checked={ragEnabled} onChange={setRagEnabled} />
        <Toggle label="관련 이미지 제공" description="지정답변/검색문서/키워드 순서로 이미지 연결" checked={imageEnabled} onChange={setImageEnabled} />
        <div className={styles.formGroup}><label>검색 Chunk 수 (Top-K)</label><input defaultValue="5" /></div>
        <div className={styles.formGroup}><label>근거 부족 시 정책</label><select defaultValue="limit"><option value="limit">INSUFFICIENT 안내 후 답변 제한</option><option value="partial">PARTIAL 범위까지만 답변</option></select></div>
      </section>

      <section className={`${styles.card} ${styles.noticeCard}`}>
        <ShieldCheck size={21} /><div><strong>현재는 UI 단계입니다.</strong><p>실제 연결 시 흐름은 질문 문맥/Intent 분석 → 지정답변 → Vector 검색 → 근거 판정 → 필요한 경우에만 OpenAI 답변 생성 순서로 구성합니다. API Key는 관리자 인증 적용 전에는 저장하지 않습니다.</p></div>
      </section>
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <div className={styles.toggleRow}><div><strong>{label}</strong><span>{description}</span></div><button aria-pressed={checked} className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`} onClick={() => onChange(!checked)}><span /></button></div>;
}

function AdminDrawer({ type, onClose }: { type: "document" | "answer" | "keyword" | "image" | "feedback"; onClose: () => void }) {
  const title = { document: "문서 등록 / RAG 처리", answer: "지정답변 등록 / 수정", keyword: "키워드 등록 / 수정", image: "이미지 등록 / 수정", feedback: "피드백 상세" }[type];
  return (
    <div className={styles.drawerBackdrop} onMouseDown={onClose}>
      <aside className={styles.drawer} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.drawerHeader}><div><span>UI MOCK</span><h2>{title}</h2></div><button onClick={onClose}><X size={20} /></button></div>
        {type === "document" && <DocumentForm />}
        {type === "answer" && <AnswerForm />}
        {type === "keyword" && <KeywordForm />}
        {type === "image" && <ImageForm />}
        {type === "feedback" && <FeedbackDetail />}
        <div className={styles.drawerFooter}><button className={styles.secondaryButton} onClick={onClose}>닫기</button>{type !== "feedback" && <button className={styles.primaryButton} onClick={onClose}><Check size={16} /> Mock 저장</button>}</div>
      </aside>
    </div>
  );
}

function DocumentForm() {
  return (
    <div className={styles.drawerBody}>
      <div className={styles.uploadZone}><Upload size={24} /><strong>문서 파일 선택</strong><span>1차년도 MVP: PDF / TXT 우선 · DOCX 추가 가능 · 스캔 PDF OCR 제외</span></div>
      <Field label="문서명" placeholder="DMA Operating Manual" />
      <Field label="문서 유형" placeholder="운용 매뉴얼 / 기술자료 / 사양서" />
      <Field label="버전" placeholder="v1.0" />
      <Field label="키워드" placeholder="DMA, Winch, Retrofit" />
      <DocumentIngestionPanel />
    </div>
  );
}

function AnswerForm() {
  return <div className={styles.drawerBody}><Field label="관리 제목" placeholder="DMA Retrofit 정의" /><Field label="대표 질문" placeholder="DMA Retrofit이란 무엇인가요?" /><Field label="질문 예시" placeholder="리트로핏은 무엇인가요?" /><div className={styles.formGroup}><label>답변 내용</label><textarea placeholder="관리자가 제공할 표준 답변을 입력합니다." /></div><Field label="연결 키워드" placeholder="Retrofit, 개조" /><Field label="우선순위" placeholder="80" /></div>;
}

function KeywordForm() {
  return <div className={styles.drawerBody}><Field label="대표 키워드" placeholder="Winch" /><Field label="동의어 / 유사어" placeholder="윈치, Mooring Winch" /><Field label="연결 질문 유형" placeholder="definition, troubleshooting" /><Field label="우선 지정답변" placeholder="선택 안 함" /></div>;
}

function ImageForm() {
  return <div className={styles.drawerBody}><div className={styles.uploadZone}><ImageIcon size={24} /><strong>이미지 선택</strong><span>JPG / PNG · 현재 업로드 동작 없음</span></div><Field label="제목" placeholder="DMA 시스템 구성도" /><Field label="설명" placeholder="답변에 함께 표시할 이미지 설명" /><Field label="키워드" placeholder="DMA, 시스템 구성" /><Field label="관련 문서 / 페이지" placeholder="DMA 진도점검 발표자료 / p.19" /></div>;
}

function FeedbackDetail() {
  return <div className={styles.drawerBody}><div className={styles.feedbackQuestion}><span>사용자 질문</span><strong>DMA Degree 1.5의 세부 기준은?</strong></div><div className={styles.feedbackQuestion}><span>피드백 사유</span><div><Status tone="orange">정보가 부족함</Status> <Status tone="red">근거가 부족함</Status></div></div><div className={styles.formGroup}><label>답변 당시 Source Snapshot</label><p className={styles.readonlyBox}>진도점검 발표자료 p.19 · Chunk #083 · 자료 범위 부족</p></div><div className={styles.formGroup}><label>사용자 상세 의견</label><p className={styles.readonlyBox}>세부 기능 기준이 정확히 어디까지인지 더 구체적인 자료가 필요합니다.</p></div><div className={styles.formGroup}><label>처리 상태</label><select defaultValue="review"><option value="new">미확인</option><option value="review">검토중</option><option value="done">개선완료</option></select></div></div>;
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return <div className={styles.formGroup}><label>{label}</label><input placeholder={placeholder} /></div>;
}
