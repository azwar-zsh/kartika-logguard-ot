"""
KARTIKA LogGuard-OT — Backend Development Server
Jalankan: python run.py
"""
import os
from dotenv import load_dotenv

# Load .env jika ada
load_dotenv()

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
        log_level="info",
    )
