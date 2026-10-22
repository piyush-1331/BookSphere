"""
BookSphere Content-Based Recommendation Engine
---------------------------------------------
Educational PBL recommendation engine demonstrating transparent,
explainable content-based filtering algorithms.

Features analyzed:
- Genre affinity
- Category affinity
- Author affinity
- Title & description topical keyword overlap
- Availability preference
- Community rating weighting

DISCLAIMER:
This recommendation system is implemented for educational/academic PBL purposes.
It is not claimed to be a scientifically validated or clinical algorithm.
"""

import re
from collections import Counter
from typing import List, Set, Tuple, Optional
from app.models import (
    BookItem,
    RecommendationRequest,
    RecommendationItem,
    RecommendationResponse,
)

# Common stopwords to ignore during keyword extraction
STOPWORDS: Set[str] = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by",
    "from", "of", "about", "into", "through", "after", "before", "is", "was",
    "are", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "shall", "should", "can", "could", "may", "might",
    "must", "this", "that", "these", "those", "it", "its", "as", "their", "our",
    "your", "his", "her", "book", "books", "story", "novel", "volume", "series",
    "guide", "edition", "first", "study", "new", "more", "most", "such", "than"
}


def extract_keywords(text: Optional[str]) -> Set[str]:
    """
    Extracts normalized, non-stopword tokens from textual descriptions or titles.
    """
    if not text:
        return set()
    tokens = re.findall(r"[a-zA-Z]{3,}", text.lower())
    return {t for t in tokens if t not in STOPWORDS}


class ContentBasedRecommender:
    """
    Transparent, explainable content-based filtering recommender.
    Scores books against a weighted composite profile built from
    user borrowing history, favorites, recent views, and declared preferences.
    """

    # Weights for scoring components (summing to ~0.90 + 0.10 for availability/rating boost)
    WEIGHT_GENRE: float = 0.32
    WEIGHT_CATEGORY: float = 0.20
    WEIGHT_AUTHOR: float = 0.26
    WEIGHT_KEYWORDS: float = 0.12
    WEIGHT_AVAILABILITY: float = 0.05
    WEIGHT_RATING: float = 0.05

    def generate_recommendations(self, request: RecommendationRequest) -> RecommendationResponse:
        """
        Main entry point for generating personalized recommendations.
        """
        # 1. Build exclusion set
        excluded_ids: Set[str] = set()

        if request.excluded_book_ids:
            excluded_ids.update(request.excluded_book_ids)

        if request.exclude_previously_borrowed:
            for b in request.borrowed_books:
                excluded_ids.add(b.id)

        # Also exclude books currently in user favorites to suggest fresh titles
        for b in request.favorite_books:
            excluded_ids.add(b.id)

        # Filter candidate pool
        eligible_candidates: List[BookItem] = [
            b for b in request.candidate_books if b.id not in excluded_ids
        ]

        # Handle empty candidates gracefully
        if not eligible_candidates:
            return RecommendationResponse(
                success=True,
                total=0,
                strategy="empty_candidates",
                is_personalized=False,
                data=[],
            )

        # 2. Determine if sufficient personalization data exists
        has_preferences = bool(
            request.preferences.favorite_genres
            or request.preferences.favorite_categories
            or request.preferences.favorite_authors
        )
        has_history = bool(
            request.borrowed_books
            or request.favorite_books
            or request.recently_viewed_books
        )

        # 3. Branch: Cold Start Fallback vs Personalized Content-Based
        if not has_preferences and not has_history:
            return self._cold_start_recommendations(
                candidates=eligible_candidates,
                limit=request.limit,
                prefer_available=request.prefer_available,
            )

        return self._personalized_recommendations(
            request=request,
            candidates=eligible_candidates,
        )

    def _cold_start_recommendations(
        self,
        candidates: List[BookItem],
        limit: int,
        prefer_available: bool,
    ) -> RecommendationResponse:
        """
        Fallback strategy for new users or sessions with no reading history or preferences.
        Ranks by community rating and stock availability.
        """
        def cold_start_key(book: BookItem) -> Tuple[int, float, int]:
            available_boost = 1 if (prefer_available and book.availableCopies > 0) else 0
            return (available_boost, book.rating, book.availableCopies)

        sorted_candidates = sorted(candidates, key=cold_start_key, reverse=True)
        top_picks = sorted_candidates[:limit]

        items: List[RecommendationItem] = []
        for rank, book in enumerate(top_picks, start=1):
            # Normalized score between 0.65 and 0.90 based on rating & stock
            base_score = (book.rating / 5.0) * 0.80
            avail_bonus = 0.10 if book.availableCopies > 0 else 0.0
            score = round(min(1.0, base_score + avail_bonus), 3)

            if book.availableCopies > 0:
                reason = (
                    f"Popular catalog highlight with a strong {book.rating}★ community rating "
                    f"and {book.availableCopies} copy(ies) ready for checkout."
                )
            else:
                reason = (
                    f"Critically acclaimed title ({book.rating}★) in our {book.category} collection."
                )

            items.append(
                RecommendationItem(
                    book=book,
                    score=score,
                    reason=reason,
                    matched_category=book.category,
                    matched_genre=book.genre,
                )
            )

        return RecommendationResponse(
            success=True,
            total=len(items),
            strategy="cold_start_popular",
            is_personalized=False,
            data=items,
        )

    def _personalized_recommendations(
        self,
        request: RecommendationRequest,
        candidates: List[BookItem],
    ) -> RecommendationResponse:
        """
        Executes personalized content-based matching against the user's composite profile.
        """
        has_history = bool(
            request.borrowed_books
            or request.favorite_books
            or request.recently_viewed_books
        )

        # Build composite interest profile with weights
        genre_weights = Counter()
        category_weights = Counter()
        author_weights = Counter()
        keywords_pool: Counter = Counter()

        # Weighting contributions:
        # Borrowed: 2.5
        # Favorites: 3.0
        # Recently Viewed: 1.5
        # Explicit Preferences: 3.5

        for b in request.borrowed_books:
            genre_weights[b.genre.lower()] += 2.5
            category_weights[b.category.lower()] += 2.5
            author_weights[b.author.lower()] += 2.5
            for kw in extract_keywords(f"{b.title} {b.description}"):
                keywords_pool[kw] += 2.5

        for b in request.favorite_books:
            genre_weights[b.genre.lower()] += 3.0
            category_weights[b.category.lower()] += 3.0
            author_weights[b.author.lower()] += 3.0
            for kw in extract_keywords(f"{b.title} {b.description}"):
                keywords_pool[kw] += 3.0

        for b in request.recently_viewed_books:
            genre_weights[b.genre.lower()] += 1.5
            category_weights[b.category.lower()] += 1.5
            author_weights[b.author.lower()] += 1.5
            for kw in extract_keywords(f"{b.title} {b.description}"):
                keywords_pool[kw] += 1.5

        for g in request.preferences.favorite_genres:
            genre_weights[g.strip().lower()] += 3.5

        for c in request.preferences.favorite_categories:
            category_weights[c.strip().lower()] += 3.5

        for a in request.preferences.favorite_authors:
            author_weights[a.strip().lower()] += 3.5

        # Top user keywords
        top_user_keywords = {kw for kw, _ in keywords_pool.most_common(25)}

        # Normalization denominators
        max_genre_w = max(genre_weights.values()) if genre_weights else 1.0
        max_cat_w = max(category_weights.values()) if category_weights else 1.0
        max_author_w = max(author_weights.values()) if author_weights else 1.0

        scored_items: List[Tuple[float, RecommendationItem]] = []

        for book in candidates:
            book_genre = book.genre.lower()
            book_category = book.category.lower()
            book_author = book.author.lower()
            book_keywords = extract_keywords(f"{book.title} {book.description}")

            # 1. Genre Score
            genre_affinity = genre_weights.get(book_genre, 0.0) / max_genre_w if max_genre_w > 0 else 0.0
            matched_genre = book.genre if genre_affinity > 0 else None

            # 2. Category Score
            category_affinity = category_weights.get(book_category, 0.0) / max_cat_w if max_cat_w > 0 else 0.0
            matched_category = book.category if category_affinity > 0 else None

            # 3. Author Score
            author_affinity = author_weights.get(book_author, 0.0) / max_author_w if max_author_w > 0 else 0.0
            matched_author = book.author if author_affinity > 0 else None

            # 4. Keyword overlap
            matching_kws = list(book_keywords.intersection(top_user_keywords))[:3]
            keyword_score = min(1.0, len(matching_kws) / 3.0) if top_user_keywords else 0.0

            # 5. Availability & Rating bonuses
            avail_bonus = 1.0 if (request.prefer_available and book.availableCopies > 0) else 0.0
            rating_score = min(1.0, max(0.0, book.rating / 5.0))

            # Composite Score Calculation
            composite_score = (
                (genre_affinity * self.WEIGHT_GENRE)
                + (category_affinity * self.WEIGHT_CATEGORY)
                + (author_affinity * self.WEIGHT_AUTHOR)
                + (keyword_score * self.WEIGHT_KEYWORDS)
                + (avail_bonus * self.WEIGHT_AVAILABILITY)
                + (rating_score * self.WEIGHT_RATING)
            )

            # Round score to 3 decimals, bounded [0.05, 0.99]
            final_score = round(min(0.99, max(0.05, composite_score)), 3)

            # Human-readable rationale generation
            reason = self._generate_reason(
                book=book,
                matched_genre=matched_genre,
                matched_category=matched_category,
                matched_author=matched_author,
                matched_keywords=matching_kws,
                has_history=has_history,
            )

            rec_item = RecommendationItem(
                book=book,
                score=final_score,
                reason=reason,
                matched_genre=matched_genre,
                matched_category=matched_category,
                matched_author=matched_author,
                matched_keywords=matching_kws if matching_kws else None,
            )

            scored_items.append((final_score, rec_item))

        # Sort descending by calculated score, with stock as tie-breaker
        scored_items.sort(
            key=lambda pair: (pair[0], pair[1].book.availableCopies > 0, pair[1].book.rating),
            reverse=True,
        )

        top_picks = [item for _, item in scored_items[: request.limit]]

        return RecommendationResponse(
            success=True,
            total=len(top_picks),
            strategy="personalized_content_based",
            is_personalized=True,
            data=top_picks,
        )

    def _generate_reason(
        self,
        book: BookItem,
        matched_genre: Optional[str],
        matched_category: Optional[str],
        matched_author: Optional[str],
        matched_keywords: List[str],
        has_history: bool,
    ) -> str:
        """
        Produces clear, human-readable explanations tailored to the specific matching criteria.
        """
        if matched_author and matched_genre:
            return (
                f"Recommended because you enjoy {matched_genre} and have explored previous works "
                f"by {matched_author}."
            )

        if matched_author:
            return (
                f"Features author {matched_author}, whose works align with your historical reading shelf."
            )

        if matched_genre and matched_category:
            return (
                f"High match for your preferred genre '{matched_genre}' in the '{matched_category}' category."
            )

        if matched_genre:
            return f"Aligns with your reading interest in {matched_genre}."

        if matched_category and matched_keywords:
            kw_str = ", ".join(f"'{k}'" for k in matched_keywords[:2])
            return (
                f"Belongs to your preferred '{matched_category}' collection and shares thematic keywords: {kw_str}."
            )

        if matched_category:
            return f"Recommended based on your affinity for books in '{matched_category}'."

        if matched_keywords:
            kw_str = ", ".join(f"'{k}'" for k in matched_keywords[:2])
            return f"Shares thematic concepts ({kw_str}) with titles you have recently explored."

        # Fallback rationale
        return (
            f"Curated title with a {book.rating}★ community rating in {book.category} "
            f"with active circulation copies."
        )


# Singleton engine instance
recommender_engine = ContentBasedRecommender()
