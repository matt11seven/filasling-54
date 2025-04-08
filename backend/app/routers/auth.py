
# This file is now a wrapper around the refactored auth module
# to maintain backward compatibility

from app.routers.auth import router

# Export the router to maintain the same API
__all__ = ["router"]
