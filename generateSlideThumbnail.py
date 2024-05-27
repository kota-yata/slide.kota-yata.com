import os
import fitz
from PIL import Image

def convert_pdf_to_image(pdf_path, output_path):
    document = fitz.open(pdf_path)
    page = document.load_page(0)
    pix = page.get_pixmap()
    output_image_path = f"{output_path}.png"
    pix.save(output_image_path)
    print(f"Saved image: {output_image_path}")

def process_pdfs_in_folder(folder_path):
    for filename in os.listdir(folder_path):
        if filename.endswith(".pdf"):
            pdf_path = os.path.join(folder_path, filename)
            output_path = os.path.join(folder_path, os.path.splitext(filename)[0])
            convert_pdf_to_image(pdf_path, output_path)

folder_path = './static/slides'
process_pdfs_in_folder(folder_path)
