import { Review } from '@/components/ProductReviews';
import { MOCK_REVIEWS } from '@/components/ProductReviews';

const STORAGE_KEY = 'ibacuu_fake_reviews';

export function getFakeReviews(): Review[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to parse fake reviews', e);
  }
  // Initialize if empty
  saveFakeReviews(MOCK_REVIEWS);
  return MOCK_REVIEWS;
}

export function saveFakeReviews(reviews: Review[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}
