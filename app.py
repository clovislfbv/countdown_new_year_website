from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/api/run_python_code', methods=['POST'])
def run_python_code():
    # Run your Python code here
    result = "Hello, World!"
    return jsonify(result=result)

if __name__ == '__main__':
    app.run(debug=True)