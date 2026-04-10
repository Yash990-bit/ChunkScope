from typing import List, Dict, Any, Optional
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter,
    CharacterTextSplitter,
    TokenTextSplitter
)
from langchain_experimental.text_splitter import SemanticChunker
from langchain_community.embeddings import HuggingFaceEmbeddings
import torch

class ChunkingService:
    _embedding_model = None

    @classmethod
    def get_embeddings(cls):
        if cls._embedding_model is None:
            # Using the same model as retrieval for consistency
            device = "cuda" if torch.cuda.is_available() else "cpu"
            cls._embedding_model = HuggingFaceEmbeddings(
                model_name="all-MiniLM-L6-v2",
                model_kwargs={'device': device}
            )
        return cls._embedding_model

    @staticmethod
    def split_text(
        text: str, 
        strategy: str, 
        chunk_size: int = 500, 
        chunk_overlap: int = 50,
        breakpoint_threshold_type: str = "percentile",
        breakpoint_threshold_amount: Optional[float] = None
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
        elif strategy == "sliding":
            # Sliding window is basically just recursive with high overlap relative to size
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                add_start_index=True,
            )
        elif strategy == "semantic":
            # Semantic chunking doesn't use fixed sizes as strictly
            embeddings = ChunkingService.get_embeddings()
            splitter = SemanticChunker(
                embeddings, 
                breakpoint_threshold_type=breakpoint_threshold_type,
                breakpoint_threshold_amount=breakpoint_threshold_amount
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
                    "token_count_estimated": len(doc.page_content) // 4,
                    "strategy_used": strategy
                }
            })
            
        return chunks
