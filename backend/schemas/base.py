"""
AeroShield Base Schemas
Common Pydantic models used across the application
"""

from datetime import datetime
from typing import Any, Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

DataT = TypeVar("DataT")


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True,
        json_encoders={
            datetime: lambda v: v.isoformat(),
            UUID: lambda v: str(v),
        },
    )


class TimestampMixin(BaseModel):
    """Mixin for timestamp fields."""
    
    created_at: datetime
    updated_at: datetime


class PaginationParams(BaseModel):
    """Pagination parameters."""
    
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


class PaginatedResponse(BaseSchema, Generic[DataT]):
    """Generic paginated response."""
    
    data: list[DataT]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class APIResponse(BaseSchema, Generic[DataT]):
    """Standard API response wrapper."""
    
    success: bool = True
    message: Optional[str] = None
    data: Optional[DataT] = None
    errors: Optional[list[dict[str, Any]]] = None


class HealthResponse(BaseSchema):
    """Health check response."""
    
    status: str = "healthy"
    version: str
    timestamp: datetime
    services: dict[str, str]


class ErrorDetail(BaseSchema):
    """Error detail schema."""
    
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseSchema):
    """Error response schema."""
    
    success: bool = False
    error: str
    details: Optional[list[ErrorDetail]] = None
    request_id: Optional[str] = None
