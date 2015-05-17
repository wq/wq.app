from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs
import json
import random


class RequestHandler(SimpleHTTPRequestHandler):
    def echo(self, **update):
        length = int(self.headers.get('content-length'))
        qs = self.rfile.read(length).decode('utf-8')
        data = {
            key: val[0]
            for key, val in parse_qs(qs).items()
        }
        data.update(**update)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_POST(self):
        pk = ''.join([chr(ord('a') + random.randint(0, 25)) for o in range(3)])
        self.echo(id=pk)

    def do_PUT(self):
        pk = self.path.split('/')[-1].split('.')[0]
        self.echo(id=pk)


def run():
    address = ("", 8080)
    httpd = HTTPServer(address, RequestHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == "__main__":
    run()
