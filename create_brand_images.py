#!/usr/bin/env python3
"""
Create placeholder brand images for TVUS website
"""
from PIL import Image, ImageDraw, ImageFont
import os

# Define colors
BLUE_BG = "#5573A3"
DARK_BLUE = "#000066"
WHITE = "#FFFFFF"

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def create_big_logo():
    """Create big-logo.png - Full logo for landing page"""
    width, height = 600, 300
    img = Image.new('RGB', (width, height), hex_to_rgb(BLUE_BG))
    draw = ImageDraw.Draw(img)
    
    # Draw a ukulele shape (simple representation)
    # Body (ellipse)
    ukulele_center_x = width // 2
    ukulele_center_y = height // 2 + 20
    body_width = 120
    body_height = 140
    draw.ellipse([
        ukulele_center_x - body_width//2, ukulele_center_y - body_height//2,
        ukulele_center_x + body_width//2, ukulele_center_y + body_height//2
    ], fill=hex_to_rgb(DARK_BLUE), outline=hex_to_rgb(WHITE), width=3)
    
    # Sound hole
    hole_radius = 25
    draw.ellipse([
        ukulele_center_x - hole_radius, ukulele_center_y - hole_radius,
        ukulele_center_x + hole_radius, ukulele_center_y + hole_radius
    ], fill=hex_to_rgb(BLUE_BG), outline=hex_to_rgb(WHITE), width=2)
    
    # Neck
    neck_width = 30
    neck_height = 80
    draw.rectangle([
        ukulele_center_x - neck_width//2, ukulele_center_y - body_height//2 - neck_height,
        ukulele_center_x + neck_width//2, ukulele_center_y - body_height//2
    ], fill=hex_to_rgb(DARK_BLUE), outline=hex_to_rgb(WHITE), width=2)
    
    # Strings (4 lines)
    string_spacing = neck_width // 5
    for i in range(4):
        x = ukulele_center_x - neck_width//2 + string_spacing * (i + 1)
        draw.line([
            (x, ukulele_center_y - body_height//2 - neck_height),
            (x, ukulele_center_y + body_height//2 - 10)
        ], fill=hex_to_rgb(WHITE), width=1)
    
    # Add text
    try:
        # Try to use a default font
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 60)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Title text
    title = "Temecula Valley"
    title2 = "Ukulele Strummers"
    draw.text((width//2, 40), title, fill=hex_to_rgb(WHITE), anchor="mm", font=font_large)
    draw.text((width//2, 90), title2, fill=hex_to_rgb(WHITE), anchor="mm", font=font_large)
    
    # TVUS text
    draw.text((width//2, height - 30), "TVUS", fill=hex_to_rgb(WHITE), anchor="mm", font=font_medium)
    
    img.save('images/big-logo.png')
    print("✓ Created images/big-logo.png")

def create_ukulele_icon():
    """Create ukulele-icon.png - Just the ukulele for songs page"""
    width, height = 120, 150
    img = Image.new('RGBA', (width, height), (255, 255, 255, 0))  # Transparent background
    draw = ImageDraw.Draw(img)
    
    # Draw a ukulele shape (simple representation)
    # Body (ellipse)
    ukulele_center_x = width // 2
    ukulele_center_y = height // 2 + 15
    body_width = 70
    body_height = 80
    draw.ellipse([
        ukulele_center_x - body_width//2, ukulele_center_y - body_height//2,
        ukulele_center_x + body_width//2, ukulele_center_y + body_height//2
    ], fill=hex_to_rgb(DARK_BLUE), outline=hex_to_rgb(DARK_BLUE), width=2)
    
    # Sound hole
    hole_radius = 15
    draw.ellipse([
        ukulele_center_x - hole_radius, ukulele_center_y - hole_radius,
        ukulele_center_x + hole_radius, ukulele_center_y + hole_radius
    ], fill=hex_to_rgb(BLUE_BG), outline=hex_to_rgb(DARK_BLUE), width=2)
    
    # Neck
    neck_width = 20
    neck_height = 50
    draw.rectangle([
        ukulele_center_x - neck_width//2, ukulele_center_y - body_height//2 - neck_height,
        ukulele_center_x + neck_width//2, ukulele_center_y - body_height//2
    ], fill=hex_to_rgb(DARK_BLUE), outline=hex_to_rgb(DARK_BLUE), width=2)
    
    # Strings (4 lines)
    string_spacing = neck_width // 5
    for i in range(4):
        x = ukulele_center_x - neck_width//2 + string_spacing * (i + 1)
        draw.line([
            (x, ukulele_center_y - body_height//2 - neck_height),
            (x, ukulele_center_y + body_height//2 - 5)
        ], fill=hex_to_rgb(DARK_BLUE), width=1)
    
    img.save('images/ukulele-icon.png')
    print("✓ Created images/ukulele-icon.png")

def create_title_text():
    """Create title-text.png - Curved title text with musical notes"""
    width, height = 400, 120
    img = Image.new('RGBA', (width, height), (255, 255, 255, 0))  # Transparent background
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except:
        font = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Title text (two lines)
    title1 = "Temecula Valley"
    title2 = "Ukulele Strummers"
    
    draw.text((width//2, 30), title1, fill=hex_to_rgb(WHITE), anchor="mm", font=font)
    draw.text((width//2, 70), title2, fill=hex_to_rgb(WHITE), anchor="mm", font=font)
    
    # Add musical notes
    # Simple note shapes (circles and stems)
    note_y = 100
    for x in [30, 80, width-80, width-30]:
        # Note head (filled circle)
        draw.ellipse([x-6, note_y-6, x+6, note_y+6], fill=hex_to_rgb(WHITE))
        # Note stem (line going up)
        draw.line([(x+6, note_y), (x+6, note_y-20)], fill=hex_to_rgb(WHITE), width=2)
    
    img.save('images/title-text.png')
    print("✓ Created images/title-text.png")

if __name__ == '__main__':
    # Create images directory if it doesn't exist
    os.makedirs('images', exist_ok=True)
    
    # Create all three images
    create_big_logo()
    create_ukulele_icon()
    create_title_text()
    
    print("\nAll brand images created successfully!")
