import re
from typing import Dict, Any, List

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

    @staticmethod
    def validate_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes a list of chunks and adds 'warnings' to their metadata if 
        context breakage is detected (Failure Mode Detection).
        """
        for chunk in chunks:
            content = chunk["content"].strip()
            warnings = []
            
            # 1. Sentence Fragment Check
            if content and content[-1] not in ('.', '!', '?', '"', "'", '”', '’'):
                # Avoid flagging if it's a code block end or header
                if not content.endswith('```') and not content.startswith('#'):
                    warnings.append({
                        "type": "fragment",
                        "severity": "medium",
                        "message": "Chunk ends mid-sentence. Potential context loss."
                    })
            
            # 2. Code Block Check
            backtick_count = content.count('```')
            if backtick_count % 2 != 0:
                warnings.append({
                    "type": "code_break",
                    "severity": "high",
                    "message": "Unclosed code block. Syntax highlighting and context will be broken."
                })
                
            # 3. List Item Break Check
            # Check if it ends with a list pattern (bullet or number)
            if re.search(r'^\s*[-*+]\s+.*$|^\s*\d+\.\s+.*$', content.split('\n')[-1]):
                warnings.append({
                    "type": "list_break",
                    "severity": "medium",
                    "message": "Chunk ends on a list item. Next item may be separated."
                })

            chunk["metadata"]["warnings"] = warnings
            
        return chunks
    @staticmethod
    def explain_chunk(chunk_content: str, chunk_index: int) -> Dict[str, Any]:
        """
        Uses an LLM to explain the quality of a specific chunk.
        """
        import os
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage, SystemMessage
        
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"explanation": "OpenAI API key missing. Cannot generate AI explanation."}
            
        llm = ChatOpenAI(model="gpt-4o-mini", api_key=api_key, temperature=0)
        
        system_prompt = (
            "You are a RAG optimization expert. Analyze the provided text chunk and explain its quality for retrieval. "
            "Identify if it preserves context, where it breaks (if at all), and what information might be missing. "
            "Keep the explanation concise (2-3 sentences)."
        )
        
        user_prompt = f"Chunk Index: {chunk_index}\nContent: {chunk_content}"
        
        try:
            response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
            return {"explanation": response.content}
        except Exception as e:
            return {"explanation": f"Failed to generate explanation: {str(e)}"}
