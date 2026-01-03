"""
Neural Canvas Backend - Image Processor Service
Server-side image processing using Pillow and Google Gemini SDK.
Implements the "Heavy Lifting" portion of the Hybrid Architecture.
Industry Best Practice: Server processes, Client previews.
"""

import os
import io
import base64
from typing import Optional
from PIL import Image
import httpx

# Google GenAI SDK (current SDK as of 2025, replaces deprecated google-generativeai)
# Per Context7 docs: pip install google-genai && from google import genai
from google import genai
from google.genai import types

# Configure Gemini client from environment (GEMINI_API_KEY is auto-detected)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_CLIENT = genai.Client() if GEMINI_API_KEY else None


class ImageProcessor:
    """
    Server-side image processor.
    Handles heavy operations like AI analysis, resizing, format conversion.
    """

    def __init__(self):
        self.client = GEMINI_CLIENT
        self.model_name = "gemini-2.0-flash"

    async def download_image(self, url: str) -> Image.Image:
        """Download image from URL and return PIL Image."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            return Image.open(io.BytesIO(response.content))

    def resize_image(
        self,
        image: Image.Image,
        max_width: int = 1920,
        max_height: int = 1080,
        quality: int = 85,
    ) -> bytes:
        """
        Resize image while preserving aspect ratio.
        Returns JPEG bytes.
        """
        # Calculate new dimensions
        ratio = min(max_width / image.width, max_height / image.height)
        if ratio < 1:
            new_size = (int(image.width * ratio), int(image.height * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)

        # Convert to RGB if necessary (for JPEG)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Save to bytes
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality, optimize=True)
        return buffer.getvalue()

    def create_thumbnail(
        self, image: Image.Image, size: tuple[int, int] = (300, 300)
    ) -> bytes:
        """Create a thumbnail preserving aspect ratio."""
        thumb = image.copy()
        thumb.thumbnail(size, Image.Resampling.LANCZOS)

        if thumb.mode in ("RGBA", "P"):
            thumb = thumb.convert("RGB")

        buffer = io.BytesIO()
        thumb.save(buffer, format="JPEG", quality=75)
        return buffer.getvalue()

    async def analyze_with_gemini(
        self, image: Image.Image, prompt: Optional[str] = None
    ) -> dict:
        """
        Analyze image using Google Gemini Vision API (server-side).
        Returns structured analysis with tags, caption, etc.
        """
        if not self.client:
            return {"error": "Gemini API key not configured", "tags": [], "caption": None}

        # Default prompt for comprehensive analysis
        analysis_prompt = prompt or """
        Analyze this image and return a JSON object with:
        {
            "tags": ["tag1", "tag2", ...],  // 5-10 descriptive tags
            "caption": "A descriptive caption",
            "mood": "The overall mood/feeling",
            "colors": ["#hex1", "#hex2", ...]  // Dominant colors
        }
        Return ONLY valid JSON, no markdown.
        """

        # Convert PIL image to base64
        buffer = io.BytesIO()
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        image.save(buffer, format="JPEG", quality=90)
        image_bytes = buffer.getvalue()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        try:
            # Using new google-genai SDK client pattern
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    analysis_prompt,
                ]
            )
            # Parse response
            text = response.text.strip()
            # Clean markdown fences if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            import json
            return json.loads(text)
        except Exception as e:
            return {"error": str(e), "tags": [], "caption": None}

    def apply_filter(
        self, image: Image.Image, filter_type: str
    ) -> Image.Image:
        """
        Apply basic filters to image.
        Supports: grayscale, sepia, brighten, darken
        """
        from PIL import ImageEnhance, ImageFilter

        if filter_type == "grayscale":
            return image.convert("L").convert("RGB")
        elif filter_type == "sepia":
            # Convert to grayscale then apply sepia tone
            gray = image.convert("L")
            sepia = Image.merge("RGB", (
                gray.point(lambda x: min(255, x * 1.07)),
                gray.point(lambda x: x * 0.74),
                gray.point(lambda x: x * 0.43),
            ))
            return sepia
        elif filter_type == "brighten":
            enhancer = ImageEnhance.Brightness(image)
            return enhancer.enhance(1.3)
        elif filter_type == "darken":
            enhancer = ImageEnhance.Brightness(image)
            return enhancer.enhance(0.7)
        elif filter_type == "sharpen":
            return image.filter(ImageFilter.SHARPEN)
        elif filter_type == "blur":
            return image.filter(ImageFilter.GaussianBlur(radius=2))
        else:
            return image  # Unknown filter, return unchanged


# Singleton instance
image_processor = ImageProcessor()
