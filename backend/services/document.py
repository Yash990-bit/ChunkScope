import io
from pypdf import PdfReader
from fastapi import UploadFile

class DocumentService:
    @staticmethod
    async def parse_file(file: UploadFile) -> str:
        """
        Parses a file and extracts text content.
        Supported formats: .txt, .md, .pdf
        """
        filename = file.filename.lower()
        content = await file.read()
        
        if filename.endswith(".pdf"):
            return DocumentService._parse_pdf(content)
        elif filename.endswith((".txt", ".md")):
            return content.decode("utf-8", errors="ignore")
        else:
            raise ValueError(f"Unsupported file format: {filename}")

    @staticmethod
    def _parse_pdf(content: bytes) -> str:
        """
        Extracts text from a PDF byte stream.
        """
        try:
            pdf_file = io.BytesIO(content)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text
        except Exception as e:
            raise Exception(f"Failed to parse PDF: {str(e)}")
