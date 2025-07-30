#!/usr/bin/env python3
"""
Generate simple poker-themed icons for the Chrome extension
"""

from PIL import Image, ImageDraw, ImageFont

def create_icon(size):
    """Create a simple poker chip icon."""
    # Create image with green background (poker table color)
    img = Image.new('RGBA', (size, size), (46, 125, 50, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw poker chip circle
    margin = size * 0.1
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=(255, 255, 255, 255),
        outline=(200, 200, 200, 255),
        width=max(1, size // 32)
    )
    
    # Draw inner circle
    inner_margin = size * 0.3
    draw.ellipse(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        fill=(220, 20, 60, 255)
    )
    
    # Add spade symbol in center
    center = size // 2
    spade_size = size // 4
    
    # Simple spade shape using polygon
    spade_points = [
        (center, center - spade_size),  # Top
        (center - spade_size//2, center - spade_size//3),  # Left curve
        (center - spade_size//3, center),  # Left bottom
        (center, center - spade_size//6),  # Center dip
        (center + spade_size//3, center),  # Right bottom
        (center + spade_size//2, center - spade_size//3),  # Right curve
        (center, center - spade_size),  # Back to top
    ]
    
    draw.polygon(spade_points, fill=(0, 0, 0, 255))
    
    # Draw stem
    stem_width = max(2, size // 16)
    stem_height = spade_size // 2
    draw.rectangle(
        [center - stem_width//2, center - spade_size//6,
         center + stem_width//2, center + stem_height//3],
        fill=(0, 0, 0, 255)
    )
    
    return img

# Generate icons in different sizes
sizes = [16, 32, 48, 128]

for size in sizes:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png')
    print(f'Created icon{size}.png')

print("Icons created successfully!")
