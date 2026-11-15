import { describe, expect, it } from 'vitest';
import { check, normBase, similarity, tokenize } from '../../src/lib/answer';

describe('answer checking', () => {
  it('ignores case, punctuation and articles in English', () => {
    expect(check('the food is delicious', ['The food is delicious.'], 'base').correct).toBe(true);
    expect(check('Food is delicious', ['The food is delicious.'], 'base').correct).toBe(true);
  });
  it('expands contractions and accepts British spellings', () => {
    expect(normBase("I'm hungry")).toBe(normBase('I am hungry'));
    expect(check('I like the colour green', ['I like the color green.'], 'base').correct).toBe(true);
  });
  it('accepts alternatives', () => {
    expect(check('Natoka Kenya', ['Ninatoka Kenya.', 'Natoka Kenya.'], 'target').correct).toBe(true);
  });
  it('flags typos but accepts them', () => {
    const v = check('Habari yaku?', ['Habari yako?'], 'target');
    expect(v).toMatchObject({ correct: true, near: 'typo' });
  });
  it('flags missing diacritics but accepts them', () => {
    expect(check('Wi mwega?', ['Wĩ mwega?'], 'target')).toMatchObject({ correct: true, near: 'accent' });
  });
  it('rejects wrong answers', () => {
    expect(check('Kwaheri', ['Habari yako?'], 'target').correct).toBe(false);
    expect(check('', ['x'], 'target').correct).toBe(false);
  });
  it('tokenizes keeping apostrophes', () => {
    expect(tokenize("Babu ana ng'ombe kumi.")).toEqual(['Babu', 'ana', "ng'ombe", 'kumi']);
  });
  it('scores speech similarity', () => {
    expect(similarity('habari yako', 'Habari yako?')).toBe(1);
    expect(similarity('habari', 'Habari yako?')).toBe(0.5);
  });
});
