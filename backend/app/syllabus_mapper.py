import logging
import json
import asyncio
import google.generativeai as genai
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# We reuse the model from document_processor for consistency
VISION_MODEL = "gemini-2.5-flash"

class SyllabusMapper:
    def __init__(self, vector_db):
        self.vector_db = vector_db

    async def map_syllabus(self, user_id: str, document_id: str = None, syllabus_text: str = "", course_id: str = None) -> Dict[str, Any]:
        """
        Enhanced RAG-based mapper:
        1. Extract topics from syllabus text.
        2. Perform vector search for EACH topic.
        3. Synthesize mapping with Gemini using retrieved context.
        """
        try:
            from document_processor import DocumentProcessor
            doc_processor = DocumentProcessor()
            
            # 1. Extract Topics
            logger.info("Extracting topics from syllabus text...")
            topic_prompt = f"""
            Extract a list of specific, distinct educational topics from the following syllabus text.
            Return ONLY a valid JSON array of strings. No markdown, no backticks.
            
            SYLLABUS:
            {syllabus_text}
            """
            
            model = genai.GenerativeModel(VISION_MODEL)
            topic_response = await asyncio.to_thread(model.generate_content, topic_prompt)
            
            topic_text = topic_response.text.strip()
            if "```json" in topic_text:
                topic_text = topic_text.split("```json")[1].split("```")[0].strip()
            elif "```" in topic_text:
                topic_text = topic_text.split("```")[1].split("```")[0].strip()
            
            try:
                topics = json.loads(topic_text)
            except:
                # Fallback: simple line split if JSON fails
                topics = [t.strip() for t in syllabus_text.split('\n') if t.strip() and len(t) > 10][:15]

            logger.info(f"Extracted {len(topics)} topics.")

            mapped_topics = []
            
            # 2. Process each topic in parallel (or sequential with a cap for speed/quality balance)
            # We'll do sequential for now to ensure quality and avoid hitting rate limits too hard, 
            # but we can use gather for true parallel speed later.
            
            for topic in topics[:10]: # Cap at 10 for performance
                logger.debug(f"Searching context for topic: {topic}")
                
                # Get embedding for the topic
                query_embedding = await doc_processor.get_embedding_async(topic)
                if query_embedding is None: continue
                
                # Search similar chunks
                results = await self.vector_db.search_similar(user_id, query_embedding.tolist(), top_k=3)
                
                if not results:
                    continue
                
                # 3. Synthesize for this topic
                context = "\n\n".join([f"[{r['filename']}]: {r['content']}" for r in results])
                
                synth_prompt = f"""
                You are an educational assistant.
                TOPIC: {topic}
                CONTEXT FROM MATERIALS:
                {context}
                
                Based ONLY on the context provided, provide:
                1. A detailed 2-4 sentence description of what the materials say about this topic.
                2. Which chunks/files it was found in.
                3. Key verbatim excerpts (1-3 sentences each) from the materials that are most relevant as "context_snippets".
                
                Return JSON:
                {{
                    "topic": "{topic}",
                    "description": "...",
                    "chunks": ["filename - Chunk X", ...],
                    "context_snippets": ["verbatim excerpt 1...", "verbatim excerpt 2..."]
                }}
                """
                
                res = await asyncio.to_thread(model.generate_content, synth_prompt)
                res_text = res.text.strip()
                if "```json" in res_text:
                    res_text = res_text.split("```json")[1].split("```")[0].strip()
                elif "```" in res_text:
                    res_text = res_text.split("```")[1].split("```")[0].strip()
                
                try:
                    mapped_topics.append(json.loads(res_text))
                except:
                    # Minimal fallback
                    mapped_topics.append({
                        "topic": topic,
                        "description": "Information found in your materials.",
                        "chunks": [results[0]["filename"]],
                        "context_snippets": [results[0]["content"][:200]] if results else []
                    })

            return {
                "document_id": document_id,
                "filename": "Selected Materials" if document_id or course_id else "Global Library",
                "mapped_topics": mapped_topics
            }
            
        except Exception as e:
            logger.error(f"Error in enhanced mapping: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "mapped_topics": []
            }

