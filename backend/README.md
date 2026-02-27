# Document Processing API

A FastAPI application for uploading, processing, and searching documents using vector embeddings.

## Features

- **Multi-format Document Support**: PDF, PowerPoint (PPTX), Word (DOCX), and plain text files
- **User Management**: Create and manage users with document isolation
- **Vector Database**: Store document chunks in Qdrant vector database
- **Semantic Search**: Search documents using natural language queries
- **FastAPI**: Modern, fast web framework with automatic API documentation

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FastAPI App   │    │  Vector Database │    │ Document Files  │
│                 │    │   (Qdrant)       │    │                 │
│ • User Routes   │◄──►│ • Store Embeddings│◄──►│ • PDF           │
│ • Upload Routes │    │ • Semantic Search │    │ • PPTX          │
│ • Search Routes │    │ • User Filtering  │    │ • DOCX          │
│ • Delete Routes │    │ • Document CRUD   │    │ • TXT           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Installation

1. **Install Dependencies**
   ```bash
   conda activate insom
   pip install -r requirements.txt
   ```

2. **Install System Dependencies**
   
   For PDF OCR support:
   ```bash
   # Install Tesseract OCR
   # Windows: Download from https://github.com/tesseract-ocr/tesseract
   # Add tesseract to PATH
   ```

3. **Start Qdrant Vector Database**
   ```bash
   # Option 1: Using Docker
   docker run -p 6333:6333 qdrant/qdrant
   
   # Option 2: Download and run locally
   # Download from https://qdrant.tech/
   ```

## Usage

### Start the Application
```bash
cd app
python main.py
```

The API will be available at `http://localhost:8000`

### API Endpoints

#### User Management
- `POST /users/` - Create a new user
- `GET /users/{user_id}` - Get user information

#### Document Upload
- `POST /upload/` - Upload and process a document
  - Parameters:
    - `file`: The document file (PDF, PPTX, DOCX, TXT)
    - `user_id`: User ID
    - `document_name`: Optional document name

#### Document Management
- `GET /documents/{user_id}` - List all documents for a user
- `DELETE /documents/{document_id}` - Delete a document

#### Search
- `POST /search/` - Search documents
  - Parameters:
    - `user_id`: User ID
    - `query`: Search query
    - `top_k`: Number of results (default: 5)

### Example Usage

#### 1. Create a User
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

#### 2. Upload a Document
```bash
curl -X POST "http://localhost:8000/upload/" \
  -F "file=@document.pdf" \
  -F "user_id=user123" \
  -F "document_name=My Document"
```

#### 3. Search Documents
```bash
curl -X POST "http://localhost:8000/search/" \
  -F "user_id=user123" \
  -F "query=machine learning algorithms" \
  -F "top_k=3"
```

## File Processing

The application supports the following file formats:

1. **PDF Files**
   - Text extraction using PyPDF2
   - OCR fallback using Tesseract for scanned documents

2. **PowerPoint (PPTX)**
   - Extracts text from all slides and shapes

3. **Word Documents (DOCX)**
   - Extracts text from all paragraphs

4. **Plain Text (TXT)**
   - Direct text reading with encoding handling

## Document Processing Pipeline

1. **File Upload**: Accept uploaded file
2. **Text Extraction**: Extract text based on file format
3. **Text Chunking**: Split text into manageable chunks
4. **Embedding Generation**: Create vector embeddings using Sentence Transformers
5. **Storage**: Store chunks and embeddings in Qdrant
6. **Search**: Perform semantic search using vector similarity

## Configuration

Environment variables:
- `QDRANT_HOST`: Qdrant host (default: localhost)
- `QDRANT_PORT`: Qdrant port (default: 6333)

## Development

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── database.py          # Vector database operations
│   ├── document_processor.py # Document processing logic
│   ├── user_manager.py      # User management
│   └── search_engine.py     # Search functionality
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

### Adding New File Formats

To add support for new file formats:

1. Add extraction method in `document_processor.py`
2. Update the `extract_text` method to handle the new format
3. Test with sample files

### Customization

- **Embedding Model**: Change in `document_processor.py` and `search_engine.py`
- **Text Chunking**: Modify parameters in `document_processor.py`
- **Vector Database**: Update configuration in `database.py`

## Troubleshooting

### Common Issues

1. **Qdrant Connection Error**
   - Ensure Qdrant is running
   - Check host and port configuration

2. **PDF OCR Not Working**
   - Install Tesseract OCR
   - Add Tesseract to system PATH
   - Verify Tesseract installation

3. **Large File Upload**
   - Increase FastAPI file size limits
   - Consider chunked uploads for very large files

### Logs

Application logs are available in the console output. Set logging level in `document_processor.py`:

```python
logging.basicConfig(level=logging.INFO)  # Change to DEBUG for more details
```

## Security Considerations

- File uploads are validated for supported formats
- User isolation prevents cross-user document access
- Consider adding authentication for production use
- Validate and sanitize all user inputs

## Performance Optimization

- Use smaller chunk sizes for better search precision
- Adjust embedding model based on performance needs
- Consider document preprocessing for large files
- Monitor Qdrant performance and scale as needed

## License

This project is licensed under the MIT License.