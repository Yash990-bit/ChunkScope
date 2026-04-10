import os
import json
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from services.analyzer import DocumentAnalyzer

class StrategyRecommender:
    @staticmethod
    def get_recommendation(text: str) -> Dict[str, Any]:
        """Analyzes text and returns a chunking strategy recommendation."""
        
        # 1. Local structural analysis
        signals = DocumentAnalyzer.analyze(text)
        
        # 2. Try OpenAI recommendation if key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key:
            try:
                return StrategyRecommender._get_openai_recommendation(text[:2000], signals, api_key)
            except Exception as e:
                print(f"OpenAI Recommendation failed: {e}")
                # Fallback to rules
        
        # 3. Rule-based fallback
        return StrategyRecommender._get_rule_based_recommendation(signals)

    @staticmethod
    def _get_openai_recommendation(sample_text: str, signals: Dict[str, Any], api_key: str) -> Dict[str, Any]:
        llm = ChatOpenAI(model="gpt-4o", api_key=api_key, temperature=0)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert RAG (Retrieval-Augmented Generation) engineer. 
            Analyze the document metrics and text sample provided to recommend the optimal chunking strategy.
            
            Return your response ONLY as a JSON object with these keys:
            - strategy: "recursive", "fixed", or "token"
            - chunk_size: suggested integer
            - chunk_overlap: suggested integer
            - rationale: clear 1-2 sentence explanation
            """),
            ("user", "Document Metrics: {metrics}\n\nText Sample: {sample}")
        ])
        
        chain = prompt | llm
        response = chain.invoke({"metrics": json.dumps(signals), "sample": sample_text})
        
        try:
            # Attempt to parse json from response content
            content = response.content.strip()
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except:
            return StrategyRecommender._get_rule_based_recommendation(signals)

    @staticmethod
    def _get_rule_based_recommendation(signals: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback rule-based recommendation logic."""
        
        # Default
        rec = {
            "strategy": "recursive",
            "chunk_size": 500,
            "chunk_overlap": 50,
            "rationale": "Default recommendation based on general document structure."
        }
        
        if signals["code_block_count"] > 0:
            rec["strategy"] = "recursive"
            rec["chunk_size"] = 800
            rec["chunk_overlap"] = 100
            rec["rationale"] = "Detected code blocks. Using larger chunks with recursive splitting to preserve code context."
        elif signals["header_count"] > 5:
            rec["strategy"] = "recursive"
            rec["chunk_size"] = 600
            rec["chunk_overlap"] = 60
            rec["rationale"] = "Highly structured document found. Recursive splitting will respect header boundaries."
        elif signals["avg_paragraph_length"] > 1000:
            rec["strategy"] = "fixed"
            rec["chunk_size"] = 1000
            rec["chunk_overlap"] = 200
            rec["rationale"] = "Dense, long paragraphs detected. Using fixed size with high overlap to ensure context transition."
            
        return rec
