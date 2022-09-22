import time
from http.server import HTTPServer
from py.server import Server

import sys
import _thread
import webbrowser
import time

HOST_NAME = 'localhost'
PORT = 80

def start_server():
    httpd = HTTPServer((HOST_NAME,PORT),Server)
    print(time.asctime(), "Start Server - %s:%s"%(HOST_NAME,PORT))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print(time.asctime(),'Stop Server - %s:%s'%(HOST_NAME,PORT))

if __name__ == "__main__":
    _thread.start_new_thread(start_server, ()) 

    if len( sys.argv ) > 1:
        webbrowser.open('http://' + HOST_NAME + ':' + str(PORT) + '/')
    
    while True:
        try:
            time.sleep(1)
        except KeyboardInterrupt:
            sys.exit(0)