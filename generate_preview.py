import fitz  # PyMuPDF
import os
import sys
try:
  from PIL import Image # Pillow is still useful for robust image handling
except ImportError:
  print("Pillow library not found. Please install it: pip install Pillow")
  print("While PyMuPDF can save PNGs, Pillow is often used for broader image operations.")
  # PyMuPDF can save to PNG directly, so Pillow isn't strictly essential
  # for this PNG-only version, but good to keep for consistency if PyMuPDF's direct save fails.
  pass # Continue, as PyMuPDF might handle PNG saving alone.

def create_png_preview(pdf_path, output_base_dir="previews", dpi=150):
  """
  Generates a PNG preview image from the first page of a PDF.

  Args:
    pdf_path (str): Path to the input PDF file.
    output_base_dir (str): The directory where preview images will be saved.
    dpi (int): Dots per inch for rendering the PDF page.
  """
  if not os.path.isfile(pdf_path):
    print(f"Error: PDF file not found at '{pdf_path}'")
    return

  doc = None
  try:
    if not os.path.exists(output_base_dir):
      os.makedirs(output_base_dir)
      print(f"Created directory: '{output_base_dir}'")

    pdf_filename = os.path.basename(pdf_path)
    name_without_extension = os.path.splitext(pdf_filename)[0]
    output_png_path = os.path.join(output_base_dir, f"{name_without_extension}.png") # Changed to .png

    doc = fitz.open(pdf_path)
    if len(doc) == 0:
      print(f"Error: PDF '{pdf_path}' has no pages.")
      return

    page = doc.load_page(0)
    
    # Render page to a pixmap. Request alpha for PNG transparency.
    pix = page.get_pixmap(dpi=dpi, alpha=True) 

    if pix.width == 0 or pix.height == 0:
      print(f"Warning: Page 0 of '{pdf_path}' (would be {name_without_extension}.png) resulted in an empty image. Skipping.")
      return

    # PyMuPDF's pix.save() can directly save to PNG.
    # It uses the filename extension to determine format.
    try:
      pix.save(output_png_path)
      print(f"Successfully created preview: '{output_png_path}'")
    except Exception as save_error:
      print(f"Error saving image '{output_png_path}' directly with PyMuPDF: {save_error}")
      print("Attempting to save with Pillow as a fallback (if Pillow is available)...")
      # Fallback to Pillow if direct save fails and Pillow is available
      if 'Image' in globals():
        try:
          if pix.alpha:
            img_mode = "RGBA"
          else:
            img_mode = "RGB"
          pil_image = Image.frombytes(img_mode, [pix.width, pix.height], pix.samples)
          pil_image.save(output_png_path, "PNG")
          print(f"Successfully created preview using Pillow: '{output_png_path}'")
        except Exception as pillow_save_error:
          print(f"Error saving image '{output_png_path}' using Pillow fallback: {pillow_save_error}")
      else:
        print("Pillow is not available for fallback save.")


  except fitz.fitz.FileNotFoundError:
    print(f"Error: PyMuPDF could not open '{pdf_path}'. The file might be corrupted or not a valid PDF.")
  except Exception as e:
    print(f"An unexpected error occurred while processing '{pdf_path}': {e}")
  finally:
    if doc:
      doc.close()


if __name__ == "__main__":
  if len(sys.argv) < 2:
    print("Usage: python generate_preview.py <path_to_pdf_file_or_directory> [output_directory_name]")
    print("\nExamples:")
    print("  python generate_preview.py my_slides/presentation.pdf")
    print("  python generate_preview.py my_slides/presentation.pdf custom_previews")
    print("  python generate_preview.py my_pdf_folder/")
    print("  python generate_preview.py my_pdf_folder/ custom_previews")
    sys.exit(1)

  input_path = sys.argv[1]
  output_dir_name = "previews" # Default output directory name

  if len(sys.argv) > 2:
    output_dir_name = sys.argv[2]

  if os.path.isfile(input_path):
    if input_path.lower().endswith(".pdf"):
      create_png_preview(input_path, output_base_dir=output_dir_name)
    else:
      print(f"Error: Input file '{input_path}' is not a PDF.")
  elif os.path.isdir(input_path):
    print(f"Processing all PDF files in directory: '{input_path}'")
    found_pdfs = False
    for item in os.listdir(input_path):
      if item.lower().endswith(".pdf"):
        full_pdf_path = os.path.join(input_path, item)
        create_png_preview(full_pdf_path, output_base_dir=output_dir_name)
        found_pdfs = True
    if not found_pdfs:
      print(f"No PDF files found in '{input_path}'.")
  else:
    print(f"Error: Input path '{input_path}' is not a valid file or directory.")
