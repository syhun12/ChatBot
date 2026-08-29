"use client";

import { Check, MessageSquareText, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "../feedback.module.css";

const feedbackCategories = [
  "정보가 부족함",
  "답변이 모호함",
  "근거가 부족함",
  "질문 의도를 잘못 이해함",
  "원하는 답과 다름",
  "기타",
];

type FeedbackPayload = {
  messageId: string;
  helpful: boolean;
  categories: string[];
  comment: string;
  createdAt: string;
};

type FeedbackState = "helpful" | "unhelpful" | null;

type FeedbackControlsProps = {
  messageId: string;
  onSubmit?: (payload: FeedbackPayload) => void;
};

export default function FeedbackControls({ messageId, onSubmit }: FeedbackControlsProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");

  const canSubmit = selectedCategories.length > 0 || comment.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function markHelpful() {
    setFeedbackState("helpful");
    setIsOpen(false);
    setSelectedCategories([]);
    setComment("");

    const payload: FeedbackPayload = {
      messageId,
      helpful: true,
      categories: [],
      comment: "",
      createdAt: new Date().toISOString(),
    };

    onSubmit?.(payload);
  }

  function openUnhelpfulModal() {
    setIsOpen(true);
  }

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function submitUnhelpfulFeedback() {
    if (!canSubmit) return;

    const payload: FeedbackPayload = {
      messageId,
      helpful: false,
      categories: selectedCategories,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    onSubmit?.(payload);
    setFeedbackState("unhelpful");
    setIsOpen(false);
  }

  return (
    <>
      <div className={styles.feedbackWrap}>
        {feedbackState ? (
          <div className={`${styles.feedbackThanks} ${feedbackState === "helpful" ? styles.positive : styles.negative}`}>
            <span className={styles.thanksIcon}><Check size={14} /></span>
            <span>
              {feedbackState === "helpful"
                ? "도움이 되었다는 의견을 반영했습니다."
                : "의견이 제출되었습니다. 답변 개선에 활용됩니다."}
            </span>
            {feedbackState === "unhelpful" && (
              <button type="button" className={styles.editButton} onClick={() => setIsOpen(true)}>
                의견 수정
              </button>
            )}
          </div>
        ) : (
          <>
            <span className={styles.feedbackQuestion}>이 답변이 도움이 되었나요?</span>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.helpfulButton}`}
                onClick={markHelpful}
                aria-label="도움이 되었어요"
                title="도움이 되었어요"
              >
                <ThumbsUp size={15} />
                <span>도움돼요</span>
              </button>
              <button
                type="button"
                className={`${styles.actionButton} ${styles.unhelpfulButton}`}
                onClick={openUnhelpfulModal}
                aria-label="답변이 아쉬워요"
                title="답변이 아쉬워요"
              >
                <ThumbsDown size={15} />
                <span>아쉬워요</span>
              </button>
            </div>
          </>
        )}
      </div>

      {isOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={`feedback-title-${messageId}`}>
            <header className={styles.modalHeader}>
              <div className={styles.modalHeading}>
                <span className={styles.modalIcon}><MessageSquareText size={20} /></span>
                <div>
                  <h3 id={`feedback-title-${messageId}`}>답변 개선을 위한 의견 보내기</h3>
                  <p>부족했던 부분을 알려주시면 이후 답변 품질 개선에 활용할 수 있습니다.</p>
                </div>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setIsOpen(false)} aria-label="닫기">
                <X size={19} />
              </button>
            </header>

            <div className={styles.modalBody}>
              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>어떤 부분이 부족했나요?</div>
                <div className={styles.categoryGrid}>
                  {feedbackCategories.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return (
                      <button
                        type="button"
                        key={category}
                        className={`${styles.categoryChip} ${selected ? styles.categorySelected : ""}`}
                        onClick={() => toggleCategory(category)}
                        aria-pressed={selected}
                      >
                        {selected && <Check size={14} />}
                        <span>{category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className={styles.fieldGroup}>
                <span className={styles.fieldLabel}>상세 의견 <b>선택</b></span>
                <textarea
                  className={styles.feedbackTextarea}
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="어떤 정보가 더 필요했는지, 무엇이 부족했는지 입력해 주세요."
                  maxLength={500}
                  rows={5}
                />
                <span className={styles.characterCount}>{comment.length} / 500</span>
              </label>
            </div>

            <footer className={styles.modalFooter}>
              <span className={styles.privacyNote}>현재 버전에서는 서버에 저장하지 않는 UI 데모입니다.</span>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setIsOpen(false)}>취소</button>
                <button
                  type="button"
                  className={styles.submitButton}
                  disabled={!canSubmit}
                  onClick={submitUnhelpfulFeedback}
                >
                  제출하기
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

export type { FeedbackPayload };
