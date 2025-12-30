from PIL import Image, ImageDraw, ImageFont
import os

sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for size in sizes:
    # Create image with emerald gradient background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background
    radius = size // 5
    # Emerald green background
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=(13, 115, 88, 255))
    
    # Draw circle accent
    circle_r = int(size * 0.31)
    center = size // 2
    draw.ellipse([center-circle_r, center-circle_r, center+circle_r, center+circle_r], 
                 outline=(167, 243, 208, 80), width=max(1, size//64))
    
    # Draw rupee symbol
    try:
        font_size = int(size * 0.45)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    text = "₹"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - size//10
    draw.text((x, y), text, fill=(236, 253, 245, 255), font=font)
    
    # Save
    img.save(f'icon-{size}x{size}.png', 'PNG')
    print(f'Created icon-{size}x{size}.png')

print('All icons generated!')
