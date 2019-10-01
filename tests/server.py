from http.server import HTTPServer, SimpleHTTPRequestHandler
try:
    from html_json_forms import parse_json_form
except ImportError:
    def parse_json_form(data):
        return parse_values_array(data)


import json
import random
import string
import cgi


batch_number = 0


class RequestHandler(SimpleHTTPRequestHandler):
    def echo(self, status=200, id=None):
        ctype, pdict = cgi.parse_header(self.headers.get('content-type'))
        pdict = {key: val.encode('utf-8') for key, val in pdict.items()}
        form = cgi.parse_multipart(self.rfile, pdict)
        data = parse_json_form({
            key: val[0].decode('utf-8')
            for key, val in form.items()
        })
        for value in data.values():
            if isinstance(value, list):
                for i, val in enumerate(value):
                    val['@index'] = i
        if id and 'id' not in data:
            data['id'] = id
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_POST(self):
        if '/error' in self.path or 'status/400' in self.path:
            self.status_400()
        elif 'status/500' in self.path:
            self.status_500()
        elif 'reset-batch-number' in self.path:
            self.reset_batch_number()
        elif 'batch' in self.path:
            self.process_batch()
        else:
            self.status_200()

    def generate_id(self):
        return ''.join([
            random.choice(string.ascii_lowercase)
            for o in range(3)
        ])

    def status_200(self):
        self.echo(id=self.generate_id())

    def status_400(self):
        self.send_response(400)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "label": ["Not a valid label"]
        }).encode('utf-8'))

    def status_500(self):
        self.send_response(500)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"SERVER ERROR")

    def reset_batch_number(self):
        global batch_number
        batch_number = 0
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"{}")

    def process_batch(self):
        global batch_number
        batch_number += 1
        size = int(self.headers['Content-Length'])
        requests = json.loads(self.rfile.read(size).decode('utf-8'))

        def process_request(request):
            data = json.loads(request['body'])
            data['id'] = self.generate_id()
            data['batch'] = batch_number
            return {
                'status_code': 200,
                'headers': {},
                'body': json.dumps(data)
            }

        responses = [
            process_request(request) for request in requests
        ]

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(responses).encode('utf-8'))

    def do_PUT(self):
        pk = self.path.split('/')[-1].split('.')[0]
        self.echo(id=pk)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()


def run():
    address = ("", 8080)
    httpd = HTTPServer(address, RequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()


def parse_values_array(data):
    for key, val in list(data.items()):
        if key.startswith('values['):
            i = int(key[7])
            if 'values' not in data:
                data['values'] = []
            while len(data['values']) < i + 1:
                data['values'].append({})
            data['values'][i][key[9:].strip('[]')] = data[key]
            data.pop(key)
    return data


if __name__ == "__main__":
    run()
