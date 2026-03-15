DocLens 🔍

AI-Powered Document Question Answering using Retrieval-Augmented Generation (RAG)

DocLens is a Retrieval-Augmented Generation (RAG) based system that allows users to upload documents and ask natural language questions about them.
Instead of relying only on a language model’s knowledge, DocLens retrieves relevant chunks from the document and generates accurate answers grounded in the document content.

The goal of this project is to make large documents easier to search, understand, and interact with using AI.

✨ Features

    📄 Upload and process documents
    🔎 Semantic search over document content
    🤖 AI-generated answers grounded in document data
    🧠 Embedding-based retrieval for relevant context
    ⚡ Fast vector similarity search
    💬 Natural language question answering
    🧠 How It Works (RAG Pipeline)

The system follows a standard Retrieval-Augmented Generation pipeline:

Document Ingestion
    Documents are uploaded and parsed.

Text Chunking
    Documents are split into smaller chunks for efficient retrieval.

Embedding Generation
    Each chunk is converted into vector embeddings.

Vector Storage
    Embeddings are stored in a vector database.

Query Processing
    User asks a question.

Similarity Search
    Most relevant chunks are retrieved using vector similarity.

Answer Generation
    Retrieved context is passed to the LLM to generate the final answer.

🛠 Tech Stack
AI / Machine Learning

   - Python
   - LangChain
   - HuggingFace Embeddings
   - LLM for answer generation

Data Processing

   - Document loaders
   - Text chunking
   - Embedding models

Vector Database
   - ChromaDB

Backend
   - FastAPI / Python API

Deployment / Environment
   - Python virtual environment
   - Jupyter / local development

📂 Project Structure
DocLens
│
├── data/                # Uploaded documents
├── embeddings/          # Generated embeddings
├── src/                 # Core logic
│   ├── ingestion.py
│   ├── embeddings.py
│   ├── retriever.py
│   └── rag_pipeline.py
│
├── app.py               # Main application
├── requirements.txt
└── README.md
⚙️ Installation

Clone the repository:

    git clone https://github.com/Mayank-GH/DocLens.git
    cd DocLens

Create a virtual environment:
    python -m venv venv

Activate it:

Windows

    venv\Scripts\activate

Mac/Linux

    source venv/bin/activate

Install dependencies:

    pip install -r requirements.txt
    ▶️ Running the Project

Run the application:

    python app.py

Then interact with the system by asking questions about the uploaded documents.

📊 Example Use Cases
    📚 Query large PDFs and reports
    🏢 Internal knowledge base search
    📑 Research paper analysis
    🧾 Document summarization and Q&A

🚀 Future Improvements

    Multi-document querying
    Web interface for document upload
    Better ranking and reranking models
    Support for images and tables
    Cloud deployment

👨‍💻 Authors
Mayank