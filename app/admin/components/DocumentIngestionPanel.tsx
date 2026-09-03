"use client";

import {
  AlertTriangle,
  Check,
  Database,
  FileSearch,
  FileText,
  Layers3,
  Loader2,
  RefreshCw,
  ScanText,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import styles from "./document-ingestion.module.css";

type IngestionState = "idle" | "running" | "ready" | "failed";

type Step = {
  key: string;
  title: string;
  description: string;
  icon: typeof FileText;
};

const steps: Step[] = [
  { key: "extract", title: "텍스트 추출", description: "PDF 페이지별 텍스트와 페이지 정보를 읽습니다.", icon: ScanText },
  { key: "normalize", title: "텍스트 정제", description: "불필요한 공백과 반복 텍스트를 정리합니다.", icon: FileSearch },
  { key: "chunk", title: "Chunk 생성", description: "제목·문단을 우선하고 긴 구간은 토큰 기준으로 분할합니다.", icon: Layers3 },
  { key: "embedding", title: "Embedding 생성", description: "각 Chunk를 검색 가능한 벡터로 변환합니다.", icon: Sparkles },
  { key: "vector", title: "Vector 저장", description: "페이지·섹션·Chunk 메타데이터와 함께 Vector DB에 저장합니다.", icon: Database },
];

export default function DocumentIngestionPanel() {
  const [state, setState] = useState<IngestionState>("idle");
  const [activeStep, setActiveStep] = useState(-1);
  const [failureMode, setFailureMode] = useState(false);

  useEffect(() => {
    if (state !== "running") return;

    if (activeStep >= steps.length) {
      const timer = window.setTimeout(() => {
        setState(failureMode ? "failed" : "ready");
      }, 450);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      if (failureMode && activeStep === 0) {
        setState("failed");
        return;
      }
      setActiveStep((current) => current + 1);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [activeStep, failureMode, state]);

  const progress = useMemo(() => {
    if (state === "ready") return 100;
    if (state === "failed") return failureMode ? 12 : Math.min(90, Math.max(0, activeStep) * 20);
    if (state === "idle") return 0;
    return Math.min(96, Math.max(6, (activeStep + 1) * 18));
  }, [activeStep, failureMode, state]);

  function start(nextFailureMode = failureMode) {
    setFailureMode(nextFailureMode);
    setActiveStep(0);
    setState("running");
  }

  function reset() {
    setActiveStep(-1);
    setState("idle");
    setFailureMode(false);
  }

  return (
    <section className={styles.panel}>
      <div className={styles.heading}>
        <div>
          <span className={styles.eyebrow}>RAG KNOWLEDGE INGESTION · UI MOCK</span>
          <h3>문서 지식화 처리</h3>
          <p>실제 DB/API 연결 전 단계이므로 아래 진행상태는 화면 확인용으로만 동작합니다.</p>
        </div>
        <span className={`${styles.stateBadge} ${styles[`state_${state}`]}`}>
          {state === "idle" && "처리 전"}
          {state === "running" && "처리 중"}
          {state === "ready" && "RAG 준비 완료"}
          {state === "failed" && "처리 실패"}
        </span>
      </div>

      <div className={styles.progressTrack} aria-label={`문서 처리 진행률 ${progress}%`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className={styles.steps}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const completed = state === "ready" || (state === "running" && index < activeStep) || (state === "failed" && !failureMode && index < activeStep);
          const active = state === "running" && index === activeStep;
          const failed = state === "failed" && failureMode && index === 0;

          return (
            <div className={`${styles.step} ${completed ? styles.stepDone : ""} ${active ? styles.stepActive : ""} ${failed ? styles.stepFailed : ""}`} key={step.key}>
              <div className={styles.stepIcon}>
                {completed ? <Check size={16} /> : active ? <Loader2 size={16} className={styles.spin} /> : failed ? <AlertTriangle size={16} /> : <Icon size={16} />}
              </div>
              <div>
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {state === "ready" && (
        <div className={styles.summary}>
          <div><span>페이지</span><strong>128</strong></div>
          <div><span>추출 텍스트</span><strong>81,324자</strong></div>
          <div><span>생성 Chunk</span><strong>186개</strong></div>
          <div><span>Embedding</span><strong>186개</strong></div>
        </div>
      )}

      {state === "failed" && (
        <div className={styles.failureBox}>
          <AlertTriangle size={18} />
          <div>
            <strong>{failureMode ? "텍스트 레이어를 확인하지 못했습니다." : "문서 처리 중 오류가 발생했습니다."}</strong>
            <p>{failureMode ? "스캔 PDF, 암호화 문서 또는 이미지 기반 PDF일 수 있습니다. 1차년도 MVP에서는 텍스트 PDF·DOCX·TXT를 우선 지원합니다." : "실제 연결 단계에서는 실패한 단계와 재처리 가능한 Chunk 범위를 기록합니다."}</p>
          </div>
        </div>
      )}

      <div className={styles.actions}>
        {state === "idle" && <button className={styles.primary} type="button" onClick={() => start(false)}><Sparkles size={16} /> Mock RAG 처리 시작</button>}
        {state === "idle" && <button className={styles.secondary} type="button" onClick={() => start(true)}>스캔 PDF 실패 예시</button>}
        {state === "running" && <button className={styles.secondary} type="button" disabled><Loader2 size={16} className={styles.spin} /> 처리 중...</button>}
        {(state === "ready" || state === "failed") && <button className={styles.secondary} type="button" onClick={() => start(false)}><RefreshCw size={16} /> 다시 처리</button>}
        {(state === "ready" || state === "failed") && <button className={styles.ghost} type="button" onClick={reset}>초기화</button>}
      </div>

      <div className={styles.policyNote}>
        <strong>1차년도 처리 원칙</strong>
        <span>PDF/TXT 우선 지원 · DOCX 추가 가능 · 스캔 PDF OCR은 후속 고도화 · 페이지 번호와 섹션 정보는 Chunk 메타데이터로 유지</span>
      </div>
    </section>
  );
}
