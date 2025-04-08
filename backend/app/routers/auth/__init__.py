
from fastapi import APIRouter
from .routes import router

# Export the router to maintain the same API
__all__ = ["router"]
