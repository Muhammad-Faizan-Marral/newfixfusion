from flask import Flask, request, jsonify
from model import suggest_technicians
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/suggest', methods=['POST'])
def suggest():
    data = request.get_json()
    issue = data.get("issue")
    technicians = data.get("technicians")

    result = suggest_technicians(issue, technicians)
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=7000)
