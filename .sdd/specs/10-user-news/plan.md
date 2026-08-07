# Technical Implementation Plan: News & Announcements Viewer

## Technical Context
- **Pages**: `NewsPage.tsx`.

## Phase 1: News Feed
- Implement `NewsPage.tsx` using `useQuery` to fetch from `news` table.
- Display in a list or grid of cards.

## Phase 2: Announcement Banner
- Create an `AnnouncementBanner` component included in the main layout.
- Fetch active announcements from `announcements` table.
