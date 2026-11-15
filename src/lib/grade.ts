import type { GradedExercise } from './exercises';
import { check, similarity } from './answer';

export type AnswerValue = number | string | { transcript?: string; self?: boolean };
export interface Grade { correct: boolean; near?: 'typo' | 'accent'; expected: string; given?: string }

/** Pure grading for every answerable exercise type. */
export function grade(ex: GradedExercise, value: AnswerValue): Grade {
  switch (ex.type) {
    case 'choice': return { correct: value === ex.correct, expected: ex.options[ex.correct], given: ex.options[value as number] };
    case 'picture': return { correct: value === ex.correct, expected: ex.options[ex.correct].text, given: ex.options[value as number]?.text };
    case 'fill': return { correct: value === ex.correct, expected: ex.full, given: ex.options[value as number] };
    case 'chat': return { correct: value === ex.correct, expected: ex.options[ex.correct], given: ex.options[value as number] };
    case 'build': {
      // Tiles must match exactly (no typo allowance — the words are given).
      const v = check(String(value), ex.answers, ex.answerTarget ? 'target' : 'base');
      return { correct: v.correct && !v.near, expected: ex.answers[0], given: String(value) };
    }
    case 'type': {
      const v = check(String(value), ex.answers, ex.answerTarget ? 'target' : 'base');
      return { correct: v.correct, near: v.near, expected: v.correct ? v.matched : ex.answers[0], given: String(value) };
    }
    case 'speak': {
      const val = value as { transcript?: string; self?: boolean };
      if (val.transcript !== undefined) return { correct: similarity(val.transcript, ex.text) >= 0.7, expected: ex.text, given: val.transcript };
      return { correct: !!val.self, expected: ex.text };
    }
  }
}
