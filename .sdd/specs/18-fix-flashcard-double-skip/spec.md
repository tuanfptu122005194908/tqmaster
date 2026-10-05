# Spec: Fix Flashcard Double Skip Bug

## Status
- Status: Proposed
- Assigned to: AI Agent

## Overview
Trong tính năng flashcard, khi người dùng nhấn nút mũi tên trên bàn phím (ArrowLeft hoặc ArrowRight), hệ thống bị lỗi nhảy 2 câu hỏi thay vì 1 câu. (ví dụ từ câu 1 nhảy sang câu 3, câu 3 sang câu 5).

## User Scenarios
- **Given** Người dùng đang ở chế độ Flashcard.
- **When** Người dùng nhấn phím mũi tên trái hoặc phải.
- **Then** Câu hỏi chỉ được chuyển qua câu trước đó (hoặc tiếp theo) 1 câu duy nhất.

## Functional Requirements
- FR-01: Chuyển câu bằng phím mũi tên trên bàn phím hoạt động chính xác (1 lần ấn = nhảy 1 câu).

## Key Files
- `src/pages/user/ExamPage.tsx`: Chứa logic xử lý sự kiện `keydown`. Hiện tại đang có 2 block `useEffect` gắn sự kiện `keydown` để bắt phím mũi tên, dẫn đến việc sự kiện bị bắt 2 lần và nhảy 2 câu.

## Success Criteria
- SC-01: Nhấn ArrowLeft lùi đúng 1 câu.
- SC-02: Nhấn ArrowRight tiến đúng 1 câu.
