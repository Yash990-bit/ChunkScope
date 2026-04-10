from typing import List, Dict, Any

class EvaluationService:
    @staticmethod
    def calculate_metrics(retrieved_chunk_indices: List[int], relevant_chunk_indices: List[int], k: int = 5) -> Dict[str, float]:
        """
        Calculates retrieval metrics.
        - retrieved_chunk_indices: Ordered list of indices returned by the search engine.
        - relevant_chunk_indices: List of indices that are actually relevant (ground truth).
        """
        if not retrieved_chunk_indices or not relevant_chunk_indices:
            return {
                "hit_rate": 0.0,
                "mrr": 0.0,
                "precision": 0.0,
                "recall": 0.0
            }

        top_k = retrieved_chunk_indices[:k]
        
        # 1. Hit Rate (Is any relevant chunk in top K?)
        hit = any(idx in relevant_chunk_indices for idx in top_k)
        hit_rate = 1.0 if hit else 0.0
        
        # 2. MRR (Mean Reciprocal Rank)
        mrr = 0.0
        for rank, idx in enumerate(retrieved_chunk_indices, 1):
            if idx in relevant_chunk_indices:
                mrr = 1.0 / rank
                break
        
        # 3. Precision@K
        relevant_in_top_k = [idx for idx in top_k if idx in relevant_chunk_indices]
        precision = len(relevant_in_top_k) / k
        
        # 4. Recall@K
        recall = len(relevant_in_top_k) / len(relevant_chunk_indices) if relevant_chunk_indices else 0.0
        
        return {
            "hit_rate": hit_rate,
            "mrr": round(mrr, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4)
        }

    @staticmethod
    def evaluate_groundedness(query: str, answer: str, contexts: List[str]) -> Dict[str, Any]:
        """
        Uses an LLM to evaluate if the answer is grounded in the contexts.
        (Simplified RAGAS-style faithfulness check).
        """
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage, SystemMessage
        import os

        if not os.getenv("OPENAI_API_KEY"):
            return {"score": 0.0, "reason": "No API key for evaluation"}

        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
        
        system_prompt = (
            "You are an evaluator. Grade the 'Groundedness' of an answer relative to provided contexts. "
            "Groundedness means the answer contains ONLY information found in the context and does not hallucinate. "
            "Return a JSON object with 'score' (0.0 to 1.0) and 'reason'."
        )
        
        context_text = "\n\n".join(contexts)
        user_prompt = f"Query: {query}\n\nAnswer: {answer}\n\nContexts:\n{context_text}"
        
        try:
            response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
            # Simple extraction from JSON-like string if LLM returns it
            content = response.content
            import json
            import re
            match = re.search(r'\{.*\}', content, re.DOTALL)
            if match:
                data = json.loads(match.group())
                return data
            return {"score": 0.5, "reason": "Could not parse evaluator response"}
        except:
            return {"score": 0.0, "reason": "Evaluation failed"}
