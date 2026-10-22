import logging
from abc import ABC, abstractmethod
from typing import List, Optional
import httpx
from app.core.config import settings
from app.schemas.search import SearchResultItem

logger = logging.getLogger(__name__)

class BaseLLMAdapter(ABC):
    @abstractmethod
    async def generate_answer(
        self,
        query: str,
        evidence: List[SearchResultItem],
        system_instruction: str,
        temperature: float = 0.1
    ) -> str:
        """Generates a grounded natural language answer citing the retrieved records."""
        pass

class MockLLMAdapter(BaseLLMAdapter):
    """
    Deterministic offline LLM adapter that synthesizes evidence-grounded answers
    directly from retrieved records with verified citations, enabling full local testing
    without external API keys or network calls.
    """
    async def generate_answer(
        self,
        query: str,
        evidence: List[SearchResultItem],
        system_instruction: str,
        temperature: float = 0.1
    ) -> str:
        if not evidence:
            return (
                "Insufficient evidence in historical maintenance records to substantiate this query. "
                "No records found matching the specified technical fault or components. "
                "Please verify the component name or rephrase using broader technical terms."
            )

        q_lower = query.lower()
        is_comparison = "compare" in q_lower or "difference" in q_lower or "versus" in q_lower or "vs" in q_lower

        # Extract cited records and build synthesis
        lines = []
        if is_comparison:
            lines.append(f"A comparison across {len(evidence)} historical maintenance logbook entries reveals distinct remedies:")
        elif "action" in q_lower or "remedy" in q_lower or "fix" in q_lower:
            lines.append(f"Based on historical maintenance logbook records, the following corrective actions were recorded:")
        elif "similar" in q_lower or "fault" in q_lower or "defect" in q_lower:
            lines.append(f"Review of historical maintenance logbook entries identifies {len(evidence)} closely matching fault occurrences:")
        else:
            lines.append(f"According to historical maintenance logbook records:")

        lines.append("")
        for idx, item in enumerate(evidence, start=1):
            prob = item.problem.strip().rstrip(".")
            act = item.action.strip().rstrip(".")
            comp = item.component_tag or "SYSTEM"
            lines.append(f"{idx}. In [{comp}], reported fault: \"{prob}\" resulted in corrective action: \"{act}\" [Rec #{item.ident}].")

        # Add technician guidance summary
        actions_mentioned = set(item.action_type for item in evidence if item.action_type)
        if actions_mentioned:
            action_summary = ", ".join(list(actions_mentioned)[:3])
            lines.append("")
            lines.append(f"Primary corrective procedures recorded for this discrepancy involve: {action_summary}.")

        return "\n".join(lines)

class GeminiLLMAdapter(BaseLLMAdapter):
    """Adapter for Google Gemini API."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    async def generate_answer(
        self,
        query: str,
        evidence: List[SearchResultItem],
        system_instruction: str,
        temperature: float = 0.1
    ) -> str:
        if not self.api_key:
            logger.warning("Gemini API key is empty, falling back to MockLLMAdapter")
            return await MockLLMAdapter().generate_answer(query, evidence, system_instruction, temperature)

        evidence_text = "\n".join([
            f"<record id=\"{e.ident}\" component=\"{e.component_tag}\">\n"
            f"  <problem>{e.problem}</problem>\n"
            f"  <action>{e.action}</action>\n"
            f"</record>"
            for e in evidence
        ])

        user_content = (
            f"{system_instruction}\n\n"
            f"EVIDENCE RECORDS:\n{evidence_text}\n\n"
            f"USER INQUIRY: {query}\n\n"
            f"Generate a clear, grounded answer. Every factual claim must include an inline citation formatted as [Rec #IDENT]."
        )

        payload = {
            "contents": [{"parts": [{"text": user_content}]}],
            "generationConfig": {"temperature": temperature, "maxOutputTokens": 800}
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(f"{self.endpoint}?key={self.api_key}", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return text
                logger.error(f"Gemini API returned error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {e}")

        return await MockLLMAdapter().generate_answer(query, evidence, system_instruction, temperature)

class OpenAILLMAdapter(BaseLLMAdapter):
    """Adapter for OpenAI and OpenAI-compatible endpoints."""
    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1", model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate_answer(
        self,
        query: str,
        evidence: List[SearchResultItem],
        system_instruction: str,
        temperature: float = 0.1
    ) -> str:
        if not self.api_key:
            logger.warning("OpenAI API key is empty, falling back to MockLLMAdapter")
            return await MockLLMAdapter().generate_answer(query, evidence, system_instruction, temperature)

        evidence_text = "\n".join([
            f"<record id=\"{e.ident}\" component=\"{e.component_tag}\">\n"
            f"  <problem>{e.problem}</problem>\n"
            f"  <action>{e.action}</action>\n"
            f"</record>"
            for e in evidence
        ])

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"EVIDENCE RECORDS:\n{evidence_text}\n\nUSER QUESTION: {query}"}
            ],
            "temperature": temperature
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                logger.error(f"OpenAI API error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {e}")

        return await MockLLMAdapter().generate_answer(query, evidence, system_instruction, temperature)

def get_llm_adapter() -> BaseLLMAdapter:
    provider = settings.LLM_PROVIDER.lower().strip()
    if provider == "gemini" and settings.GEMINI_API_KEY:
        return GeminiLLMAdapter(settings.GEMINI_API_KEY)
    elif provider == "openai" and settings.OPENAI_API_KEY:
        return OpenAILLMAdapter(settings.OPENAI_API_KEY, settings.OPENAI_BASE_URL, settings.LLM_MODEL_NAME)
    else:
        return MockLLMAdapter()
