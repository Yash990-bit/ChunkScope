import re
from typing import Dict, Any

class DocumentAnalyzer:
    @staticmethod
    def analyze(text: str) -> Dict[str, Any]:
        """Extracts structural signals from the document text."""
        signals = {
            "total_length": len(text),
            "paragraph_count": len(re.split(r'\n\s*\n', text)),
            "avg_paragraph_length": 0,
            "has_markdown": False,
            "header_count": 0,
            "list_item_count": 0,
            "code_block_count": 0,
            "density_score": 0.0 # higher means more dense text
        }
        
        if signals["total_length"] == 0:
            return signals

        # 1. Structural Checks
        signals["header_count"] = len(re.findall(r'^#{1,6}\s+.+', text, re.MULTILINE))
        signals["list_item_count"] = len(re.findall(r'^\s*[-*+]\s+.+', text, re.MULTILINE)) + \
                                     len(re.findall(r'^\s*\d+\.\s+.+', text, re.MULTILINE))
        signals["code_block_count"] = len(re.findall(r'```', text)) // 2
        
        if signals["header_count"] > 0 or signals["code_block_count"] > 0:
            signals["has_markdown"] = True
            
        # 2. Density Checks
        paragraphs = [p for p in re.split(r'\n\s*\n', text) if p.strip()]
        if paragraphs:
            signals["avg_paragraph_length"] = sum(len(p) for p in paragraphs) / len(paragraphs)
            
        # 3. Complexity Score (Heuristic)
        # More headers/lists/code blocks usually mean "Recursive" is better.
        # Long paragraphs without structure mean "Fixed" might be okay but high overlap needed.
        sig_count = signals["header_count"] + signals["list_item_count"] + signals["code_block_count"]
        signals["density_score"] = round(sig_count / (len(text) / 1000 + 1), 4)

        return signals
