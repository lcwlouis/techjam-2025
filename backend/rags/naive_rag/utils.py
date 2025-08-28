from langchain_openai import OpenAIEmbeddings 
from langchain_chroma import Chroma 


"""
A Chroma vector store is the database that holds embeddings (vectors + metadata + original text).
The chroma.sqlite3 file under chroma_db is the metadata database. It stores the list of collections we have created and other data 
The actual embeddings are within the collections which is the 725bxxxxx thing ( the numbers are just the id for that collection )
So the mapping from id to collection name is in the chroma.sqlite3 file 
But stuff like vector embeddings and the metadata about that particular vector embedding is in the collection folders
Within a single vector store, you can have multiple collections.
Each collection is like a separate table and we map each of it to a separate region that we have
"""

# get embedding function
def get_embedding_function(model="text-embedding-3-small"):
    embeddings = OpenAIEmbeddings(model=model)
    return embeddings

# returns the vector store within that collection to query from / ingest to 
"""
The persist_directory parameter in Chroma specifies where on disk the vector store’s data is saved. 
Inside this directory, you’ll find chroma.sqlite3 (the catalog of collections) and a collections/ folder (containing the actual embeddings and metadata). 
The collection_name parameter selects which logical collection (like a table) to use. Chroma checks the catalog for the collection, loads its data if it exists, or creates a new collection if it doesn’t.
"""
def get_vector_store(collection_name: str, persist_directory="./chroma_db", model="text-embedding-3-small"):
    embeddings = get_embedding_function(model)
    return Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=persist_directory,
    )
