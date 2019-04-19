from http.server import HTTPServer, SimpleHTTPRequestHandler
from html_json_forms import parse_json_form
from urllib.parse import parse_qs
import json
import time
import random
import cgi


class RequestHandler(SimpleHTTPRequestHandler):
    def echo(self, status=200, **update):
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
        data.update(**update)
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        # FIXME: This is to avoid a race condition in wq/outbox
        time.sleep(random.random())
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_POST(self):
        if 'status/400' in self.path:
            self.status_400()
        elif 'status/500' in self.path:
            self.status_500()
        else:
            self.status_200()

    def status_200(self):
        pk = ''.join([chr(ord('a') + random.randint(0, 25)) for o in range(3)])
        self.echo(id=pk)

    def status_400(self):
        self.echo(status=400)

    def status_500(self):
        self.send_response(500)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(b"SERVER ERROR")

    def do_PUT(self):
        pk = self.path.split('/')[-1].split('.')[0]
        self.echo(id=pk)

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

if __name__ == "__main__":
    run()
