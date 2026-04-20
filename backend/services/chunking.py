import tiktoken
import re
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
    _tokenizer = None

    @classmethod
    def get_tokenizer(cls):
        if cls._tokenizer is None:
            cls._tokenizer = tiktoken.get_encoding("cl100k_base")
        return cls._tokenizer

    @classmethod
    def get_embeddings(cls):
        if cls._embedding_model is None:
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
        breakpoint_threshold_amount: Optional[float] = None,
        sentences_per_chunk: int = 3,
        regex_pattern: str = "\\n\\n"
    ) -> List[Dict[str, Any]]:
        """
        Splits text into chunks based on the specified strategy.
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
        elif strategy == "regex":
            # For regex, we split by the pattern and then group if necessary, 
            # but simplest is a CharacterSplitter with a custom regex separator
            splitter = CharacterTextSplitter(
                separator=regex_pattern,
                is_separator_regex=True,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                add_start_index=True,
            )
        elif strategy == "sentence":
            # Simple sentence-based splitting using regex or spacy
            # Here we'll use a recursive splitter with sentence-end markers
            splitter = RecursiveCharacterTextSplitter(
                separators=[". ", "! ", "? "],
                chunk_size=chunk_size, 
                chunk_overlap=chunk_overlap,
                add_start_index=True,
            )
        elif strategy == "semantic":
            embeddings = ChunkingService.get_embeddings()
            splitter = SemanticChunker(
                embeddings, 
                breakpoint_threshold_type=breakpoint_threshold_type,
                breakpoint_threshold_amount=breakpoint_threshold_amount
            )
        else:
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                length_function=len,
                add_start_index=True,
            )

        docs = splitter.create_documents([text])
        tokenizer = ChunkingService.get_tokenizer()
        
        chunks = []
        for i, doc in enumerate(docs):
            token_count = len(tokenizer.encode(doc.page_content))
            chunks.append({
                "index": i,
                "content": doc.page_content,
                "metadata": {
                    "start_index": doc.metadata.get("start_index", 0),
                    "char_count": len(doc.page_content),
                    "token_count": token_count,
                    "strategy_used": strategy
                }
            })
            
        return chunks
