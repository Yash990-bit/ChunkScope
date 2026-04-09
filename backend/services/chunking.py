from typing import List, Dict, Any, Optional
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    TokenTextSplitter
)

class ChunkingService:
    @staticmethod
    def split_text(
        text: str, 
        strategy: str, 
        chunk_size: int = 500, 
        chunk_overlap: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Splits text into chunks based on the specified strategy.
        Returns a list of dictionaries containing chunk text and metadata.
        """
        if strategy == "recursive":
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                add_start_index=True,
            )
        elif strategy == "fixed":
            splitter = CharacterTextSplitter(
                separator="",
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                add_start_index=True,
            )
        elif strategy == "token":
            splitter = TokenTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                add_start_index=True,
            )
        else:
            # Default to recursive if strategy unknown
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                add_start_index=True,
            )

        docs = splitter.create_documents([text])
        
        chunks = []
        for i, doc in enumerate(docs):
            chunks.append({
                "index": i,
                "content": doc.page_content,
                "metadata": {
                    "start_index": doc.metadata.get("start_index", 0),
                    "char_count": len(doc.page_content),
                    "token_count_estimated": len(doc.page_content) // 4 # Simple estimation
                }
            })
            
        return chunks
