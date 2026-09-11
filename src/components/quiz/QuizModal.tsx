import React, { useState } from 'react';
import { QuizQuestion } from '../../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

interface Props {
  questions: QuizQuestion[];
  chapterTitle: string;
  onClose: () => void;
  onMastered?: () => void;
}

export const QuizModal: React.FC<Props> = ({ questions, chapterTitle, onClose, onMastered }) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (questions.length === 0) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
        <div className="glass-panel" style={{ padding: '30px', maxWidth: '450px', textAlign: 'center' }}>
          <h3>No Quizzes Yet</h3>
          <p style={{ marginTop: '10px' }}>Quizzes for this specific chapter are coming soon!</p>
          <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    if (idx === currentQ.correctIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      if (onMastered) onMastered();
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedOpt(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '28px', position: 'relative', border: '1px solid var(--border-glow)', boxShadow: 'var(--glow-indigo)' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '18px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer' }}
        >
          ✕
        </button>

        {!isFinished ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-indigo">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Score: {score}/{questions.length}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', color: '#fff', lineHeight: 1.5 }}>
                {currentQ.question}
              </h3>
            </div>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let bg = 'rgba(255,255,255,0.03)';
                let border = '1px solid var(--border-glass)';
                let text = '#f8fafc';

                if (isAnswered) {
                  if (isCorrect) {
                    bg = 'rgba(16, 185, 129, 0.15)';
                    border = '1px solid #10b981';
                    text = '#34d399';
                  } else if (isSelected) {
                    bg = 'rgba(244, 63, 94, 0.15)';
                    border = '1px solid #f43f5e';
                    text = '#fb7185';
                  }
                }

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: bg,
                      border: border,
                      color: text,
                      fontSize: '13px',
                      cursor: isAnswered ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && <CheckCircle2 size={16} color="#10b981" />}
                    {isAnswered && isSelected && !isCorrect && <XCircle size={16} color="#f43f5e" />}
                  </div>
                );
              })}
            </div>

            {/* Explanation & Next */}
            {isAnswered && (
              <div style={{ background: 'rgba(99, 102, 241, 0.08)', borderLeft: '3px solid var(--accent-indigo)', padding: '12px 16px', borderRadius: '0 8px 8px 0', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.6 }}>
                <strong>Explanation:</strong> {currentQ.explanation}
              </div>
            )}

            {isAnswered && (
              <button className="btn btn-primary" onClick={handleNext} style={{ alignSelf: 'flex-end' }}>
                {currentIdx + 1 < questions.length ? 'Next Question' : 'View Results'} <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          /* Results Stage */
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
            <Award size={64} color="var(--accent-amber)" />
            <h2 style={{ fontSize: '24px', color: '#fff' }}>Knowledge Check Completed!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              You scored <strong style={{ color: 'var(--accent-emerald)', fontSize: '18px' }}>{score} / {questions.length}</strong> on <em>{chapterTitle}</em>!
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={handleRestart}>
                <RotateCcw size={16} /> Retake Quiz
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                <Sparkles size={16} /> Continue Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
