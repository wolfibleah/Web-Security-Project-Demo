from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

logging.basicConfig(filename='server.log', level=logging.DEBUG, format='%(asctime)s%(levelname)s %(name)s %(threadName)s : %(message)s') 
app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "https://localhost:3000", "http://localhost:4200", "https://localhost:4200"])

@app.route("/api/date", methods=['GET', 'POST'])


def apiData():
    method = request.method
    path = request.path
    remote = request.remote_addr
    user_agent = request.headers.get('User-Agent', '')
    query_params = request.args.to_dict(flat=False) 
    form = request.form.to_dict(flat=False)
    files = {k: v.filename for k, v in request.files.items()}
    values = request.values.to_dict(flat=False)
    json_body = request.get_json(silent=True)
    raw_body = request.get_data(as_text=True)
    headers = dict(request.headers)
    cookies = request.cookies.to_dict()

    print("request.method:", method)
    print("request.headers:", headers)
    print("request.args:", query_params)
    print("request.form:", form)
    print("request.files:", files)
    print("request.values:", values)
    print("request.json:", json_body)
    print("request.cookies:", request.cookies)

    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "method": method,
        "path": path,
        "remote": remote,
        "user_agent": user_agent,
        "query_params": query_params,
        "form": form,
        "files": files,
        "values": values,
        "json": json_body,
        "raw_body": raw_body,
        "headers": headers,
        "cookies": cookies
    }
    
    app.logger.info("Info:  args=%s form=%s files=%s values=%s json=%s cookies=%s",
                    query_params, form, files, values, bool(json_body), cookies)
    app.logger.debug("Debug: received request: %s %s from %s", method, path, remote)
    if 'nume' not in request.args and 'nume' not in request.form:
        app.logger.warning("WARNING: Missing expected parameter 'nume' in request from %s — args=%s form=%s",
                           remote, query_params, form)
    if request.content_type and 'application/json' in (request.content_type or '') and json_body is None and raw_body.strip():
        app.logger.error("ERROR: Failed to parse JSON body from %s — raw_body=%s", remote, raw_body)
    if len(raw_body) > 2000:
        app.logger.critical("CRITICAL: Large request body from %s (%d bytes) — headers=%s", remote, len(raw_body), {k: headers.get(k) for k in ('Referer','User-Agent')})
    
    resp = {
        "message": "Hello World",
        "received": {
            "method": method,
            "args": query_params,
            "form": form,
            "json": json_body
        }
    }
    return jsonify(resp), 200

if __name__ == "__main__":
    app.run(port=5000,debug=True)


