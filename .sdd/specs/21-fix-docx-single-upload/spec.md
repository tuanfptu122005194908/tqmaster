# Spec: Fix DOCX Single Upload Parsing Error

## Status: Approved

## Overview
When uploading a single DOCX file (e.g. \ull-quiz-chuong-16-den-28-390-cau.docx\), the web UI fails to parse and recognize any questions due to a ReferenceError (\parsedQ is not defined\) in \extractExamFromFile\.

## User Scenarios
- Given a user uploads a single DOCX file, When the file is processed, Then the system should successfully extract all questions and display them in the modal.

## Functional Requirements
- FR-1: Fix the reference error by properly calling \parseHtmlToQuestions\ in \extractExamFromFile\ when handling \.docx\ files.

## Key Files
- \src/lib/markdownExamParser.ts\`n
## Success Criteria
- SC-1: Single DOCX file upload works without throwing errors.
