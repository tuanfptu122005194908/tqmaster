import { describe, it, expect } from 'vitest';
import { parseMarkdownExam, matchOptionLine } from '../lib/markdownExamParser';

describe('markdownExamParser', () => {
  it('should recognize standard delimited options', () => {
    const md = `**Câu 1.** What is 1 + 1?
A. 1
B. 2
C. 3
D. 4
> **Đáp án:**
> - Câu 1: **B**`;

    const res = parseMarkdownExam(md);
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].options).toHaveLength(4);
    expect(res.questions[0].options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(res.questions[0].correctAnswers).toEqual(['B']);
    expect(res.questions[0].options.find(o => o.label === 'B')?.isCorrect).toBe(true);
  });

  it('should recognize bare letter math options like MAE101', () => {
    const md = `**Câu 2.** If it is known that
$$\\int_0^5 f(x)dx = 3, \\quad \\int_3^5 f(x)dx = 4,$$
find the value of $\\int_0^3 f(x)dx$.

A 2
B 1
C -1
D 5
E 6
F 7

> **Đáp án:**
> - Câu 2: **C**`;

    const res = parseMarkdownExam(md);
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].options).toHaveLength(6);
    expect(res.questions[0].options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(res.questions[0].options[0].content).toBe('2');
    expect(res.questions[0].options[2].content).toBe('-1');
    expect(res.questions[0].correctAnswers).toEqual(['C']);
    expect(res.questions[0].options[2].isCorrect).toBe(true);
  });

  it('should not treat English sentences starting with "A ..." as Option A', () => {
    const md = `**Câu 3.** MAE101_SU26_FE | Multiple Choice Question 3

(Choose 1 answer)

(See picture)

A ball is thrown into the air such that its height (in feet) after t seconds takes the form $h(t) = at - 16t^2$. Assume that the velocity of the ball at time $t = 2$ is 8 ft/s. Find $a$.

A 72
B 80
C 70
D 68
E None of the other choices is correct

> **Đáp án:**
> - Câu 3: **A**`;

    const res = parseMarkdownExam(md);
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].content).toContain('A ball is thrown into the air');
    expect(res.questions[0].options).toHaveLength(5);
    expect(res.questions[0].options[0].content).toBe('72');
    expect(res.questions[0].correctAnswers).toEqual(['A']);
    expect(res.questions[0].options[0].isCorrect).toBe(true);
  });

  it('should recognize Roman numerals in question body and bare letters in options', () => {
    const md = `**Câu 1.** Multiple Choice Question 1

If $v \\in \\text{span}(S)$, then:

(i) $v \\in S$.

(ii) $v$ is a linear combination of vectors in $S$.

(iii) $S = \\{v\\}$.

(iv) $v \\neq 0$.

A (iii)

B (i)

C (ii)

D (iv)

E None of them

> **Đáp án:**
> - Câu 1: **C**`;

    const res = parseMarkdownExam(md);
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].content).toContain('(i) $v \\in S$.');
    expect(res.questions[0].options).toHaveLength(5);
    expect(res.questions[0].options[0].content).toBe('(iii)');
    expect(res.questions[0].options[2].content).toBe('(ii)');
    expect(res.questions[0].options[2].isCorrect).toBe(true);
  });

  it('should recognize various option label formats', () => {
    expect(matchOptionLine('**A.** Option 1')?.label).toBe('A');
    expect(matchOptionLine('**B** Option 2')?.label).toBe('B');
    expect(matchOptionLine('(C) Option 3')?.label).toBe('C');
    expect(matchOptionLine('[D] Option 4')?.label).toBe('D');
    expect(matchOptionLine('E - Option 5')?.label).toBe('E');
    expect(matchOptionLine('F. Option 6')?.label).toBe('F');
    expect(matchOptionLine('G Option 7')?.label).toBe('G');
  });

  it('should correctly parse multi-letter answers like NWC204 exam format', () => {
    const md = `**Câu 8.** Which two characteristics describe the IP protocol at Layer 3? (Choose two answers)

A. Connectionless and best-effort

B. Independent of the underlying media

C. Guarantees delivery of packets

D. Relies on TCP for segmentation

> **Đáp án:**
> - Câu 8: **AB**

---

**Câu 10.** Match the command with the device mode.

| | |
| :--- | :--- |
| A. login | 1. R1(config)# |
| B. service password-encryption | 2. R1> |

A. A5-B1
B. A5-B2
C. A1-B2

> **Đáp án:**
> - Câu 10: **B**

---

**Câu 16.** What are two services provided by the OSI network layer? (Choose two answers)

A. Performing error detection
B. Routing packets toward the destination
C. Encapsulating PDUs from the transport layer
D. Placement of frames on the media
E. Collision detection

> **Đáp án:**
> - Câu 16: **BC**`;

    const res = parseMarkdownExam(md);
    expect(res.questions).toHaveLength(3);

    // Câu 8
    expect(res.questions[0].correctAnswers).toEqual(['A', 'B']);
    expect(res.questions[0].options[0].isCorrect).toBe(true);
    expect(res.questions[0].options[1].isCorrect).toBe(true);
    expect(res.questions[0].options[2].isCorrect).toBe(false);
    expect(res.questions[0].options[3].isCorrect).toBe(false);

    // Câu 10 (table preservation)
    expect(res.questions[1].content).toContain('| A. login | 1. R1(config)# |');
    expect(res.questions[1].options).toHaveLength(3);
    expect(res.questions[1].correctAnswers).toEqual(['B']);
    expect(res.questions[1].options[1].isCorrect).toBe(true);

    // Câu 16
    expect(res.questions[2].correctAnswers).toEqual(['B', 'C']);
    expect(res.questions[2].options[1].isCorrect).toBe(true);
    expect(res.questions[2].options[2].isCorrect).toBe(true);
    expect(res.questions[2].options[0].isCorrect).toBe(false);
    expect(res.unansweredQuestions).toHaveLength(0);
  });
});

