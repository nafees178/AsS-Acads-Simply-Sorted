import logging
import numpy as np
from typing import List, Dict, Any, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)

# Configure Google AI
genai.configure(api_key="AIzaSyBpCGkmGiIOuqMTc3WAaMFrQ62up8J4i94")

# Google AI Models
EMBED_MODEL = "models/embedding-001"

class SearchEngine:
    def __init__(self, vector_db):
        self.vector_db = vector_db
    
    def get_query_embedding(self, query: str):
        """Get embedding for query using Google Gemini"""
        try:
            response = genai.embed_content(
                model="models/gemini-embedding-001",
                content=query
            )
            embedding = np.array(response["embedding"]).astype("float32")
            logger.info(f"Generated query embedding for: '{query}' - length: {len(embedding)}")
            return embedding
        except Exception as e:
            logger.error(f"Error getting query embedding: {str(e)}")
            return None
        
    
    async def search(self, user_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents given a query"""
        try:
            # Generate embedding for the query using Google Gemini
            query_embedding = self.get_query_embedding(query)
            
            if query_embedding is None:
                logger.error("Failed to generate query embedding")
                return []
            
            # Search in vector database
            results = await self.vector_db.search_similar(
                user_id=user_id,
                query_embedding=query_embedding.tolist(),
                top_k=top_k
            )
            
            # Enhance results with page numbers and document names
            enhanced_results = []
            for result in results:
                content = result["content"]
                filename = result["filename"]
                
                # Extract page number from content if it's a PDF
                page_num = None
                if "Page " in content and ":" in content:
                    try:
                        # Look for "Page X:" pattern in the content
                        lines = content.split('\n')
                        for line in lines:
                            if line.startswith("Page ") and ":" in line:
                                page_line = line.strip()
                                page_num = page_line.split("Page ")[1].split(":")[0]
                                break
                    except:
                        page_num = "Unknown"
                
                # Extract slide number from content if it's a PowerPoint
                slide_num = None
                if "Slide " in content and ":" in content:
                    try:
                        lines = content.split('\n')
                        for line in lines:
                            if line.startswith("Slide ") and ":" in line:
                                slide_line = line.strip()
                                slide_num = slide_line.split("Slide ")[1].split(":")[0]
                                break
                    except:
                        slide_num = "Unknown"
                
                # Create searched_index with page/slide number and document name
                searched_index = f"Document: {filename}"
                if page_num:
                    searched_index += f", Page: {page_num}"
                elif slide_num:
                    searched_index += f", Slide: {slide_num}"
                
                # Summarize the content (take first 200 characters)
                summarized_content = content[:200] + "..." if len(content) > 200 else content
                
                enhanced_result = {
                    "document_id": result["document_id"],
                    "filename": filename,
                    "content": summarized_content,  # Actual content (summarized)
                    "searched_index": searched_index,  # Document name and page/slide number
                    "score": result["score"],
                    "metadata": result["metadata"]
                }
                enhanced_results.append(enhanced_result)
            
            logger.info(f"Search completed for user {user_id}, query: '{query[:50]}...'")
            return enhanced_results
            
        except Exception as e:
            logger.error(f"Error during search: {str(e)}")
            return []
    
    async def semantic_search(self, user_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search (same as search but with different name for clarity)"""
        return await self.search(user_id, query, top_k)
    
    async def get_relevant_chunks(self, user_id: str, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Get relevant text chunks for a query"""
        try:
            # Generate embedding for the query using Google Gemini
            query_embedding = self.get_query_embedding(query)
            
            if query_embedding is None:
                logger.error("Failed to generate query embedding")
                return []
            
            # Search for relevant chunks
            results = await self.vector_db.search_similar(
                user_id=user_id,
                query_embedding=query_embedding.tolist(),
                top_k=top_k
            )
            
            # Sort by score and return content
            sorted_results = sorted(results, key=lambda x: x['score'], reverse=True)
            
            return sorted_results
            
        except Exception as e:
            logger.error(f"Error getting relevant chunks: {str(e)}")
            return []
    
    async def find_similar_documents(self, user_id: str, document_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Find documents similar to a given document"""
        try:
            # This would require storing document-level embeddings
            # For now, we'll search using the first chunk of the document
            # In a production system, you'd want to store document-level embeddings
            
            # Get the first chunk of the document to use as query
            # This is a simplified version - in practice you'd want:
            # 1. Store document-level embeddings
            # 2. Use the document embedding as query
            # 3. Return similar documents
            
            logger.warning("Document similarity search not fully implemented")
            return []
            
        except Exception as e:
            logger.error(f"Error finding similar documents: {str(e)}")
            return []
