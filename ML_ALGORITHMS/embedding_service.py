from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import numpy as np

app = Flask(__name__)
model = SentenceTransformer('all-MiniLM-L6-v2')  # small, fast, accurate

def normalize(vec):
    vec = np.array(vec)
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec.tolist()
    return (vec / norm).tolist()

@app.route('/embedding', methods=['POST'])
def get_embedding():
    data = request.json
    texts = data.get('texts', [])
    if not texts:
        return jsonify({"error": "No texts provided"}), 400

    embeddings = model.encode(texts)  # shape: (n_texts, dim)
    normalized_embeddings = [normalize(emb) for emb in embeddings]

    return jsonify({"embeddings": normalized_embeddings})

if __name__ == '__main__':
    app.run(port=8000)
