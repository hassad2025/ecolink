from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
from uuid import uuid4
from pathlib import Path

router = APIRouter(prefix="/uploads", tags=["Uploads"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "static" / "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # validate content type
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only images are allowed")

        ext = os.path.splitext(file.filename)[1]
        fname = f"{uuid4().hex}{ext}"
        dest = UPLOAD_DIR / fname

        with open(dest, "wb") as f:
            content = await file.read()
            f.write(content)

        # Return public URL
        url = f"/static/uploads/{fname}"
        return JSONResponse({"url": url})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
