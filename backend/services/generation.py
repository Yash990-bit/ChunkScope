import time
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
import os

class GenerationService:
    @staticmethod
    def generate_answer(query: str, contexts: List[str], model_name: str = "gpt-4o-mini") -> Dict[str, Any]:
        """
        Generates an answer based on provided contexts.
        Returns the answer, token usage, and latency.
        """
        if not os.getenv("OPENAI_API_KEY"):
            return {
                "answer": "Error: OPENAI_API_KEY NOT FOUND. Please set it in your environment.",
                "usage": {"input": 0, "output": 0, "total": 0},
                "latency_ms": 0,
                "model": model_name
            }

        llm = ChatOpenAI(model=model_name, temperature=0)
        
        context_text = "\n\n---\n\n".join(contexts)
        
        system_prompt = (
            "You are a helpful assistant. Answer the user's question ONLY using the provided context blocks. "
            "If the answer is not in the context, say 'I cannot find the answer in the provided documents.' "
            "Cite the context using [index] corresponding to the order of blocks if possible."
        )
        
        user_prompt = f"Context:\n{context_text}\n\nQuestion: {query}"
        
        start_time = time.perf_counter()
        
        try:
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt)
            ]
            response = llm.invoke(messages)
            
            latency = (time.perf_counter() - start_time) * 1000
            
            usage = response.response_metadata.get("token_usage", {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0})
            
            return {
                "answer": response.content,
                "usage": {
                    "input": usage.get("prompt_tokens"),
                    "output": usage.get("completion_tokens"),
                    "total": usage.get("total_tokens")
                },
                "latency_ms": round(latency, 2),
                "model": model_name
            }
        except Exception as e:
            return {
                "answer": f"Error during generation: {str(e)}",
                "usage": {"input": 0, "output": 0, "total": 0},
                "latency_ms": 0,
                "model": model_name
            }
