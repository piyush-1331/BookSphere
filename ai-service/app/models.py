from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, AliasChoices, computed_field


class BookItem(BaseModel):
    """
    Representation of a book in the BookSphere catalog or user history.
    Compatible with MongoDB Book schema representation.
    Supports both 'id' and '_id'.
    """
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    id: str = Field(
        ...,
        validation_alias=AliasChoices("_id", "id"),
        description="MongoDB ObjectId or unique string identifier"
    )

    @computed_field
    @property
    def _id(self) -> str:
        """MongoDB compatible alias."""
        return self.id
    title: str = Field(..., description="Title of the book")
    author: str = Field(..., description="Primary author")
    genre: str = Field(..., description="Literary genre (e.g. Astrophysics, Architecture)")
    category: str = Field(..., description="Broad category (e.g. Science & Technology, History)")
    description: Optional[str] = Field("", description="Synopsis or thematic overview")
    ISBN: Optional[str] = Field(None, description="ISBN identifier")
    publicationYear: Optional[int] = Field(None, description="Year of publication")
    publisher: Optional[str] = Field(None, description="Publishing house")
    coverImage: Optional[str] = Field(None, description="Cover asset URL")
    availableCopies: int = Field(1, description="Copies currently available for lending")
    totalCopies: int = Field(1, description="Total inventory count")
    rating: float = Field(4.5, description="Catalog average rating (0.0 to 5.0)")
    status: Optional[str] = Field("available", description="Catalog availability status")
    formats: Optional[List[str]] = Field(default_factory=list, description="Lending formats")


class UserPreferences(BaseModel):
    """User-declared reading preferences."""
    favorite_genres: List[str] = Field(default_factory=list)
    favorite_categories: List[str] = Field(default_factory=list)
    favorite_authors: List[str] = Field(default_factory=list)


class RecommendationRequest(BaseModel):
    """
    Input payload for the recommendation engine.
    Supplies user reading history, preferences, and available catalog candidates.
    """
    user_id: Optional[str] = Field(None, description="Optional user identifier")
    preferences: UserPreferences = Field(default_factory=UserPreferences)
    borrowed_books: List[BookItem] = Field(
        default_factory=list,
        description="Historical or active borrowings by the user"
    )
    favorite_books: List[BookItem] = Field(
        default_factory=list,
        description="Books currently saved in user's favorites shelf"
    )
    recently_viewed_books: List[BookItem] = Field(
        default_factory=list,
        description="Books inspected in recent browsing sessions"
    )
    candidate_books: List[BookItem] = Field(
        default_factory=list,
        description="Available catalog books eligible for recommendation"
    )
    excluded_book_ids: Optional[List[str]] = Field(
        None,
        description="Explicit list of book IDs to exclude from output"
    )
    exclude_previously_borrowed: bool = Field(
        True,
        description="Avoid recommending books the user has already borrowed"
    )
    prefer_available: bool = Field(
        True,
        description="Give preference to books with availableCopies > 0"
    )
    limit: int = Field(
        5,
        ge=1,
        le=50,
        description="Maximum number of recommendations to return"
    )


class RecommendationItem(BaseModel):
    """A scored recommendation item with an explainable reason."""
    book: BookItem
    score: float = Field(..., description="Calculated similarity/relevance score between 0.0 and 1.0")
    reason: str = Field(..., description="Transparent, human-readable rationale for this recommendation")
    matched_genre: Optional[str] = Field(None, description="Specific matched genre if applicable")
    matched_category: Optional[str] = Field(None, description="Specific matched category if applicable")
    matched_author: Optional[str] = Field(None, description="Specific matched author if applicable")
    matched_keywords: Optional[List[str]] = Field(None, description="Overlapping topical keywords")


class RecommendationResponse(BaseModel):
    """Top-level recommendation response schema."""
    success: bool = True
    total: int = Field(..., description="Count of recommendations returned")
    strategy: str = Field(..., description="Algorithm strategy used (personalized vs cold-start)")
    is_personalized: bool = Field(..., description="True if based on user-specific history/preferences")
    disclaimer: str = (
        "Educational PBL demonstration recommendation engine. "
        "Built using content-based filtering algorithms; not a scientifically validated or clinical system."
    )
    data: List[RecommendationItem]


class HealthResponse(BaseModel):
    """Health diagnostic response model."""
    status: str = "healthy"
    service: str
    version: str
    timestamp: str
    environment: str
