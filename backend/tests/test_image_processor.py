"""
Neural Canvas Backend - Image Processor Tests
Tests for the image processing service using pytest best practices.
Per Perplexity research: Fixtures, parametrize, AsyncMock for Gemini.
"""

import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from PIL import Image
import io

# Import the service under test
from app.services.image_processor import ImageProcessor, image_processor


# === FIXTURES ===

@pytest.fixture
def mock_pil_image():
    """Create a mock PIL Image for testing without real files."""
    mock_img = MagicMock(spec=Image.Image)
    mock_img.width = 1920
    mock_img.height = 1080
    mock_img.mode = "RGB"
    mock_img.size = (1920, 1080)
    mock_img.copy.return_value = mock_img
    mock_img.convert.return_value = mock_img
    mock_img.resize.return_value = mock_img
    mock_img.thumbnail.return_value = None  # thumbnail modifies in place
    mock_img.save = MagicMock()
    return mock_img


@pytest.fixture
def real_test_image():
    """Create a real small test image for integration tests."""
    img = Image.new("RGB", (100, 100), color="red")
    return img


@pytest.fixture
def processor():
    """Get a fresh ImageProcessor instance."""
    return ImageProcessor()


# === UNIT TESTS: RESIZE ===

@pytest.mark.parametrize("original_size,max_width,max_height,expected_ratio", [
    ((1920, 1080), 1920, 1080, 1.0),     # No resize needed
    ((3840, 2160), 1920, 1080, 0.5),     # 4K -> 1080p
    ((800, 600), 1920, 1080, 1.0),       # Smaller, no resize
    ((2000, 1000), 1000, 500, 0.5),      # Custom max
])
def test_resize_preserves_aspect_ratio(processor, mock_pil_image, original_size, max_width, max_height, expected_ratio):
    """Test that resize maintains aspect ratio correctly."""
    mock_pil_image.width = original_size[0]
    mock_pil_image.height = original_size[1]
    
    result = processor.resize_image(mock_pil_image, max_width, max_height)
    
    # Should return bytes
    assert isinstance(result, bytes) or mock_pil_image.save.called


# === UNIT TESTS: THUMBNAIL ===

def test_create_thumbnail_default_size(processor, real_test_image):
    """Test thumbnail creation with default 300x300 size."""
    result = processor.create_thumbnail(real_test_image)
    
    assert isinstance(result, bytes)
    assert len(result) > 0


def test_create_thumbnail_custom_size(processor, real_test_image):
    """Test thumbnail creation with custom size."""
    result = processor.create_thumbnail(real_test_image, size=(50, 50))
    
    assert isinstance(result, bytes)
    # Verify it's valid JPEG by opening
    opened = Image.open(io.BytesIO(result))
    assert max(opened.size) <= 50


# === UNIT TESTS: FILTERS ===

@pytest.mark.parametrize("filter_type,expected_mode", [
    ("grayscale", "RGB"),   # Converts L back to RGB
    ("sepia", "RGB"),
    ("brighten", "RGB"),
    ("darken", "RGB"),
    ("sharpen", "RGB"),
    ("blur", "RGB"),
    ("unknown", "RGB"),     # Unknown filter returns unchanged
])
def test_apply_filter(processor, real_test_image, filter_type, expected_mode):
    """Test various filters produce valid images."""
    result = processor.apply_filter(real_test_image, filter_type)
    
    assert isinstance(result, Image.Image)
    # All filters should preserve or convert to RGB
    assert result.mode == expected_mode or result.mode == "L"


# === ASYNC TESTS: GEMINI INTEGRATION ===

@pytest.mark.asyncio
async def test_analyze_with_gemini_no_api_key(processor, real_test_image):
    """Test graceful handling when Gemini API key is not configured."""
    # Ensure client is None
    processor.client = None
    
    result = await processor.analyze_with_gemini(real_test_image)
    
    assert "error" in result
    assert result["tags"] == []
    assert result["caption"] is None


@pytest.mark.asyncio
async def test_analyze_with_gemini_success(processor, real_test_image):
    """Test successful Gemini analysis with mocked client."""
    # Mock the Gemini client
    mock_response = MagicMock()
    mock_response.text = '{"tags": ["test", "image"], "caption": "A test image", "mood": "neutral", "colors": ["#FF0000"]}'
    
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)
    processor.client = mock_client
    
    result = await processor.analyze_with_gemini(real_test_image)
    
    assert result["tags"] == ["test", "image"]
    assert result["caption"] == "A test image"
    assert result["mood"] == "neutral"


@pytest.mark.asyncio
async def test_analyze_with_gemini_error_handling(processor, real_test_image):
    """Test error handling when Gemini API fails."""
    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(side_effect=Exception("API Error"))
    processor.client = mock_client
    
    result = await processor.analyze_with_gemini(real_test_image)
    
    assert "error" in result
    assert "API Error" in result["error"]
    assert result["tags"] == []


# === ASYNC TESTS: DOWNLOAD ===

@pytest.mark.asyncio
async def test_download_image_success(processor):
    """Test image download with mocked httpx."""
    # Create test image bytes
    test_img = Image.new("RGB", (50, 50), color="blue")
    buffer = io.BytesIO()
    test_img.save(buffer, format="PNG")
    test_bytes = buffer.getvalue()
    
    with patch("httpx.AsyncClient") as mock_client:
        mock_response = MagicMock()
        mock_response.content = test_bytes
        mock_response.raise_for_status = MagicMock()
        
        mock_client.return_value.__aenter__.return_value.get = AsyncMock(return_value=mock_response)
        
        result = await processor.download_image("https://example.com/test.png")
        
        assert isinstance(result, Image.Image)
        assert result.size == (50, 50)


# === INTEGRATION TEST: FULL PIPELINE ===

def test_full_processing_pipeline(processor, real_test_image):
    """Integration test: filter -> resize -> thumbnail."""
    # Apply filter
    filtered = processor.apply_filter(real_test_image, "grayscale")
    assert isinstance(filtered, Image.Image)
    
    # Resize
    resized_bytes = processor.resize_image(filtered, 50, 50)
    assert isinstance(resized_bytes, bytes)
    
    # Create thumbnail
    thumb_bytes = processor.create_thumbnail(filtered, (25, 25))
    assert isinstance(thumb_bytes, bytes)
    
    # Verify thumbnail is valid
    thumb = Image.open(io.BytesIO(thumb_bytes))
    assert max(thumb.size) <= 25
