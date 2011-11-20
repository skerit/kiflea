#!/usr/bin/env python
'''
Python WebSocket library with support for "wss://" encryption.
Copyright 2011 Joel Martin
Licensed under LGPL version 3 (see docs/LICENSE.LGPL-3)

Supports following protocol versions:
    - http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol-75
    - http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol-76
    - http://tools.ietf.org/html/draft-ietf-hybi-thewebsocketprotocol-10

You can make a cert/key with openssl using:
openssl req -new -x509 -days 365 -nodes -out self.pem -keyout self.pem
as taken from http://docs.python.org/dev/library/ssl.html#certificates
'''

import threading
import datetime
import Queue
import json
import rwlock
import toolbox
import xml.etree.ElementTree as ET
import Maps
import base64

import os, sys, time, errno, signal, socket, struct, traceback, select
from cgi import parse_qsl
from base64 import b64encode, b64decode
from toolbox import debug, verbose

# Imports that vary by python version
if sys.hexversion > 0x3000000:
    # python >= 3.0
    from io import StringIO
    from http.server import SimpleHTTPRequestHandler
    from urllib.parse import urlsplit
    b2s = lambda buf: buf.decode('latin_1')
    s2b = lambda s: s.encode('latin_1')
else:
    # python 2.X
    from cStringIO import StringIO
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    from urlparse import urlsplit
    # No-ops
    b2s = lambda buf: buf
    s2b = lambda s: s

if sys.hexversion >= 0x2060000:
    # python >= 2.6
    from multiprocessing import Process
    from hashlib import md5, sha1
else:
    # python < 2.6
    Process = None
    from md5 import md5
    from sha import sha as sha1

# Degraded functionality if these imports are missing
for mod, sup in [('numpy', 'HyBi protocol'),
        ('ssl', 'TLS/SSL/wss'), ('resource', 'daemonizing')]:
    try:
        globals()[mod] = __import__(mod)
    except ImportError:
        globals()[mod] = None
        print("WARNING: no '%s' module, %s support disabled" % (
            mod, sup))

# Kiser stuff

serverQueue = Queue.Queue()	    # A general queue for all threads
globQueue = []			    # An array to store every queue in
globUser = {}			    # An object to store all the on-line users in

loadMaps = ['grassland.tmx.xml', 'default.tmx.xml']
rootFolder = '/home/skerit/www/subdomain/kiflea/';
globMaps = {}

rwQ = rwlock.ReadWriteLock()        # The r/w-lock for the globQueue
rwU = rwlock.ReadWriteLock()        # The r/w-lock for the globUser
rwG = rwlock.ReadWriteLock()        # The r/w-lock for the globGuest

serverQueue = Queue.Queue()	    # A general queue for all threads
globQueue = []			    # An array to store every queue in
globUser = {}			    # An object to store all the on-line users in
globGuest = 0;

loadMaps = ['grassland.tmx.xml', 'default.tmx.xml']
rootFolder = '/home/skerit/www/subdomain/kiflea/';
globMaps = {}

rwQ = rwlock.ReadWriteLock()       # The r/w-lock for the globQueue
rwU = rwlock.ReadWriteLock()       # The r/w-lock for the globUser

class Server:
    """
    The main server class, which sets up the server itself and
    creates a thread for every connecting client
    """
    
    # Server Settings
    host            = ''        # Only listen to this host
    port            = 1234      # Listen on this port
    backlog         = 5         # Logsize
    size            = 65536     # Buffer size
    ssl_only        = False     # Enable SSL?
    
    # Server State
    server          = None      # Place to hold the server connection
    threads         = []        # Place to hold all the connecting clients
    
    def __init__(self):
        pass
        
    def loadMaps(self, maps):
        """
        Load all the XML maps
        """
        
        verbose("Loading maps ...", 0, 3)
        
        for fileName in maps:
            verbose(fileName, 2, 4)
            globMaps[fileName] = Maps.Map(fileName, rootFolder)
        
        verbose("Finished loading maps", 0, 2)

    @staticmethod
    def socket(host, port=None, connect=False, prefer_ipv6=False):
        """ Resolve a host (and optional port) to an IPv4 or IPv6
        address. Create a socket. Bind to it if listen is set,
        otherwise connect to it. Return the socket.
        """
        flags = 0
        if host == '':
            host = None
        if connect and not port:
            raise Exception("Connect mode requires a port")
        if not connect:
            flags = flags | socket.AI_PASSIVE
        addrs = socket.getaddrinfo(host, port, 0, socket.SOCK_STREAM,
                socket.IPPROTO_TCP, flags)
        if not addrs:
            raise Exception("Could resolve host '%s'" % host)
        addrs.sort(key=lambda x: x[0])
        if prefer_ipv6:
            addrs.reverse()
        sock = socket.socket(addrs[0][0], addrs[0][1])
        if connect:
            sock.connect(addrs[0][4])
        else:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(addrs[0][4])
            sock.listen(100)
        return sock

    #
    # Events that can/should be overridden in sub-classes
    #
    def started(self):
        """ Called after WebSockets startup """
        self.vmsg("WebSockets server started")

    def poll(self):
        """ Run periodically while waiting for connections. """
        #self.vmsg("Running poll()")
        pass

    def fallback_SIGCHLD(self, sig, stack):
        # Reap zombies when using os.fork() (python 2.4)
        self.vmsg("Got SIGCHLD, reaping zombies")
        try:
            result = os.waitpid(-1, os.WNOHANG)
            while result[0]:
                self.vmsg("Reaped child process %s" % result[0])
                result = os.waitpid(-1, os.WNOHANG)
        except (OSError):
            pass

    def do_SIGINT(self, sig, stack):
        self.msg("Got SIGINT, exiting")
        sys.exit(0)
        
    #
    # WebSocketServer logging/output functions
    #
    def traffic(self, token="."):
        """ Show traffic flow in verbose mode. """
        if self.verbose and not self.daemon:
            sys.stdout.write(token)
            sys.stdout.flush()

    def msg(self, msg):
        """ Output message with handler_id prefix. """
        verbose(msg, 0, 1)

    def vmsg(self, msg):
        """ Same as msg() but only if verbose. """
        verbose(msg, 0, 1)

    def start_server(self):
        """
        Daemonize if requested. Listen for for connections. Run
        do_handshake() method for each connection. If the connection
        is a WebSockets client then call new_client() method (which must
        be overridden) for each new client connection.
        """
        
        # Start loading all the maps
        self.loadMaps(loadMaps)
        
        # Create an event handler
        e = EventHandler(serverQueue)
        
        # Start it
        e.start()
        
        # And thread it
        self.threads.append(e)
        
        lsock = self.socket(self.host, self.port)

        while True:
            try:
                try:
                    self.client = None
                    startsock = None
                    pid = err = 0

                    try:
                        # Wait for connection
                        ready = select.select([lsock], [], [], 1)[0]
                        
                        # Did we receive anything?
                        if lsock in ready:
                            # Yes, store the data here
                            startsock, address = lsock.accept()
                        else:
                            # No, continue to the next itteration
                            continue
                            
                    except Exception:
                        _, exc, _ = sys.exc_info()
                        if hasattr(exc, 'errno'):
                            err = exc.errno
                        elif hasattr(exc, 'args'):
                            err = exc.args[0]
                        else:
                            err = exc[0]
                        if err == errno.EINTR:
                            self.vmsg("Ignoring interrupted syscall")
                            continue
                        else:
                            raise
                    
                    verbose("Incoming connection: " + str(address), 0, 3)
                    
                    # Thread it!
                    rwQ.acquireRead()
                    try:
                        rwQ.acquireWrite()
                        try:
                            # Add a new queue to the array for the new thread
                            globQueue.append(Queue.Queue())
                        finally:
                            rwQ.release()
                    finally:
                        rwQ.release()
                    
                    # Get the index of this new queue in the array
                    globQueueIndex = len(globQueue) - 1
                    
                    # Create a new client
                    c = Client(startsock, address, globQueue[globQueueIndex], globQueueIndex, serverQueue)
                    
                    verbose("New thread started. Queueindex: " + str(globQueueIndex), 2, 3)
                    
                    # Start it
                    c.start()
                    
                    # And thread it
                    self.threads.append(c)

                except KeyboardInterrupt:
                    _, exc, _ = sys.exc_info()
                    print("In KeyboardInterrupt")
                    pass
                except SystemExit:
                    _, exc, _ = sys.exc_info()
                    print("In SystemExit")
                    break
                except Exception:
                    _, exc, _ = sys.exc_info()
                    self.msg("handler exception: %s" % str(exc))
                    verbose(traceback.format_exc(), 0, 1)
                        
            except Exception:
                _, exc, _ = sys.exc_info()
                self.msg("handler exception: %s" % str(exc))
                verbose(traceback.format_exc(), 0, 1)
        
        verbose("\r\nServer is shutting down", 0, 1)
        
        # Loop through all the threads and close (join) them
        for c in self.threads:
            verbose("Closing thread", 2, 2)
            c.join()

    # Create the actual server
    def open_socket(self):
        try:
            # create an InterNET, STREAMing socket (aka TCP/IP) 
            self.server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            
            # allow quick restart and reuse of server socket 
            self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

            self.server.bind((self.host,self.port))
            self.server.listen(5)
        except socket.error, (value,message):
            if self.server:
                self.server.close()
            verbose("\r\nCould not open socket: " + message, 0, 0)
            sys.exit(1)

# The Client class
# This main thread will receive information from the client,
# another thread (updateclient) will be created to send information to the client
# and listen to the queue
class Client(threading.Thread):
    
    buffer_size = 65536
    framed = False

    server_handshake_hixie = """HTTP/1.1 101 Web Socket Protocol Handshake\r
Upgrade: WebSocket\r
Connection: Upgrade\r
%sWebSocket-Origin: %s\r
%sWebSocket-Location: %s://%s%s\r
"""

    server_handshake_hybi = """HTTP/1.1 101 Switching Protocols\r
Upgrade: websocket\r
Connection: Upgrade\r
Sec-WebSocket-Accept: %s\r
"""

    GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

    policy_response = """<cross-domain-policy><allow-access-from domain="*" to-ports="*" /></cross-domain-policy>\n"""

    # Initializing the Client
    # @param    (client,address)        The info of the connecting client
    # @param    queue                   This thread's queue
    # @param    queueIndex              The index of the queue in the globQueue var
    # @param    serverQueue             A queue straight to the event handler
    def __init__(self, startsock, address, queue, queueIndex, serverQueue):
        threading.Thread.__init__(self)
        
        self.startsock = startsock
        self.address = address
        
        self.verbose        = False
        self.ssl_only       = False
        self.daemon         = False
        self.handler_id     = 1
        self.cert = os.path.abspath('')
        self.key = self.web = self.record = ''
        
        self.size = 65536
        self.queue = queue
        self.queueIndex = queueIndex
        self.serverQueue = serverQueue
        self.threads = []
        self.wData = None               # Store incomplete data here
        self.wComplete = None           # Data receive boolean
        self.wLength = None             # The expected length of the received data
        self.running = True             # While this is true, the thread runs
        self.initiated = False          # Has this user been initialized?
        self.uid = None
        global globUser
        global globtest
        
        """ Do something with a WebSockets client connection. """
        # Initialize per client settings
        self.send_parts = []
        self.recv_part  = None
        self.base64     = False
        self.rec        = None
        self.start_time = int(time.time()*1000)

        # handler process
        try:
            try:
                verbose("Begin handshake", 2, 4)
                self.client = self.do_handshake(self.startsock, self.address)
                verbose("Handshake finished", 2, 3)

            except self.EClose:
                _, exc, _ = sys.exc_info()
                # Connection was not a WebSockets connection
                if exc.args[0]:
                    self.msg("%s: %s" % (address[0], exc.args[0]))
            except Exception:
                _, exc, _ = sys.exc_info()
                self.msg("handler exception: %s" % str(exc))
                if self.verbose:
                    self.msg(traceback.format_exc())
        finally:
            if self.client and self.client != self.startsock:
                verbose("Closing client", 0, 3)
                self.client.close()
        
        verbose("Client init finished", 2, 4)
        
                
    def msg(self, message):
        print message
                
    class EClose(Exception):
        print Exception
        pass

    def do_handshake(self, sock, address):
        """
        do_handshake does the following:
        - Peek at the first few bytes from the socket.
        - If the connection is Flash policy request then answer it,
          close the socket and return.
        - If the connection is an HTTPS/SSL/TLS connection then SSL
          wrap the socket.
        - Read from the (possibly wrapped) socket.
        - If we have received a HTTP GET request and the webserver
          functionality is enabled, answer it, close the socket and
          return.
        - Assume we have a WebSockets connection, parse the client
          handshake data.
        - Send a WebSockets handshake server response.
        - Return the socket for this WebSocket client.
        """

        stype = ""

        ready = select.select([sock], [], [], 3)[0]
        if not ready:
            raise self.EClose("ignoring socket not ready")
        # Peek, but do not read the data so that we have a opportunity
        # to SSL wrap the socket first
        handshake = sock.recv(1024, socket.MSG_PEEK)

        if handshake == "":
            raise self.EClose("ignoring empty handshake")

        elif handshake.startswith(s2b("<policy-file-request/>")):
            # Answer Flash policy request
            handshake = sock.recv(1024)
            sock.send(s2b(self.policy_response))
            raise self.EClose("Sending flash policy response")

        elif handshake[0] in ("\x16", "\x80"):
            # SSL wrap the connection
            if not ssl:
                raise self.EClose("SSL connection but no 'ssl' module")
            if not os.path.exists(self.cert):
                raise self.EClose("SSL connection but '%s' not found"
                                  % self.cert)
            retsock = None
            try:
                retsock = ssl.wrap_socket(
                        sock,
                        server_side=True,
                        certfile=self.cert,
                        keyfile=self.key)
            except ssl.SSLError:
                _, x, _ = sys.exc_info()
                if x.args[0] == ssl.SSL_ERROR_EOF:
                    raise self.EClose("")
                else:
                    raise

            scheme = "wss"
            stype = "SSL/TLS (wss://)"

        elif self.ssl_only:
            raise self.EClose("non-SSL connection received but disallowed")

        else:
            retsock = sock
            scheme = "ws"
            stype = "Plain non-SSL (ws://)"

        wsh = WSRequestHandler(retsock, address, not self.web)
        if wsh.last_code == 101:
            # Continue on to handle WebSocket upgrade
            pass
        elif wsh.last_code == 405:
            raise self.EClose("Normal web request received but disallowed")
        elif wsh.last_code < 200 or wsh.last_code >= 300:
            raise self.EClose(wsh.last_message)
        elif self.verbose:
            raise self.EClose(wsh.last_message)
        else:
            raise self.EClose("")

        h = self.headers = wsh.headers
        path = self.path = wsh.path

        prot = 'WebSocket-Protocol'
        protocols = h.get('Sec-'+prot, h.get(prot, '')).split(',')

        ver = h.get('Sec-WebSocket-Version')
        
        if ver:
            # HyBi/IETF version of the protocol

            if sys.hexversion < 0x2060000 or not numpy:
                raise self.EClose("Python >= 2.6 and numpy module is required for HyBi-07 or greater")

            # HyBi-07 report version 7
            # HyBi-08 - HyBi-12 report version 8
            # HyBi-13 reports version 13
            if ver in ['7', '8', '13']:
                self.version = "hybi-%02d" % int(ver)
            else:
                raise self.EClose('Unsupported protocol version %s' % ver)

            key = h['Sec-WebSocket-Key']
            
            # Generate the hash value for the accept header
            accept = b64encode(sha1(s2b(key + self.GUID)).digest())
            
            response = self.server_handshake_hybi % b2s(accept)
            #if self.base64:
            #    response += "Sec-WebSocket-Protocol: base64\r\n"
            #else:
            #    response += "Sec-WebSocket-Protocol: binary\r\n"
            response += "Sec-WebSocket-Protocol: chat\r\n"
            response += "\r\n"
            
            self.framed = True

        else:
            # Hixie version of the protocol (75 or 76)

            if h.get('key3'):
                trailer = gen_md5(h)
                pre = "Sec-"
                self.version = "hixie-76"
            else:
                trailer = ""
                pre = ""
                self.version = "hixie-75"

            # We only support base64 in Hixie era
            self.base64 = True

            response = self.server_handshake_hixie % (pre,
                    h['Origin'], pre, scheme, h['Host'], path)

            #if 'base64' in protocols:
            #    response += "%sWebSocket-Protocol: base64\r\n" % pre
            #else:
            #    self.msg("Warning: client does not report 'base64' protocol support")
            response += "%sWebSocket-Protocol: chat\r\n" % pre
            response += "\r\n" + trailer
            
            self.framed = False

        retsock.send(s2b(response))

        # Return the WebSockets socket which may be SSL wrapped
        return retsock
        

    # Pipe received data through this function to make sure we've got everything
    # @param    data    {string}        The data to check
    # @return           {bool/string}   The data, or false if it's incomplete
    def wget(self, data):
        
        data = decode_hybi(data)['payload']
        
        if data == None:
            return False
        
        # Check if there's a header in the data
        if data.find("--KOP:") > -1:
            
            if self.wComplete == -1:
                verbose("Previous data was incomplete, new data already arrived", 0, 3)
            
            # Start splicing the header from the body
            self.wLength = data.partition("--KOP:")[2]
            data =  self.wLength.partition(":POK--")[2]
            self.wLength = int(self.wLength.partition(":POK--")[0])
            
            # If the length of the data matches the specified length, return the data
            if len(data) == self.wLength:
                
                self.wComplete = None
                self.wLength = None

                debug(data)
                
                # Return the completed data
                return data
            else:
                verbose("Length does not match. Data is " + str(len(data)) + " while we wanted " + str(self.wLength), 0, 3)
                self.wComplete = -1
                self.wData = data
        else:
            verbose("Does not contain a KOP", 0, 3)
            # See if wData isn't none
            if self.wData:
                self.wData = self.wData + data
                
                if len(self.wData) == self.wLength:
                    print "\r\nCompleted!!"
                    self.wComplete = None
                    self.wLength = None
    
                    # Return the completed data
                    return self.wData
                else:
                    self.wComplete = -2
            else: # If it is, this data got to us before any head, and we won't be able to piece it together with anything
                if data:
                    verbose("Received stray data: " + data, 0, 3)
                else:
                    verbose("Closing connection of user " + self.uid, 0, 2)
                    self.closeClient()

        # Return false if this point has been reached
        return False
    
    def closeClient(self):
        
        if(self.uid):
            self.updateWorld({'action': 'logoff'})
        
        self.running = 0
        
        # Loop through all the subthreads and close (join) them
        for c in self.threads:
            c.join()
        
        # Delete our queue from the dictionary
        rwQ.acquireRead()
        try:
            rwQ.acquireWrite()
            try:
                # Add a new queue to the array for the new thread
                debug('Globqueue length before deleting: ' + str(len(globQueue)))
                del globQueue[self.queueIndex]
                debug('Globqueue length after deleting: ' + str(len(globQueue)))
            finally:
                rwQ.release()
        finally:
            rwQ.release()
            
        # Delete our user from the dictionary
        if(self.uid):
            rwU.acquireRead()
            try:
                rwU.acquireWrite()
                try:
                    del globUser[self.uid]
                finally:
                    rwU.release()
            finally:
                rwU.release()
            
        self.client.close()
        
        verbose("Client disconnected", 0, 5)

    

    def join(self):
        """
        When the join method is called of this thread, run closeClient
        """
        self.closeClient()
        
    def run(self):
        queue = self.queue
        error = 0           # Error counter for this thread
        
        while self.running:
            
            # Receive data
            data = self.wget(self.client.recv(self.size))
            
            # If data equals false after running through wget,
            # close the client and skip the rest of the code (by continuing)
            if data == False:
                self.closeClient()
                continue
            
            try:
                # Try to parse the JSON data
                data = json.loads(data)
            except ValueError:
                verbose('This is not a JSON object: "' + data + '" -- end data;', 0, 2)
                error += 1
                data = None
                if error > 50:
                    verbose("This thread is being shut down: 50 errors", 0, 2)
                    running = 0
            
            # Only continue if there actually is data
            if data:
                # Initiate the user if it hasn't happened yet
                if self.initiated == False:
                    if data['action'] == 'logon':
                        verbose('Initializing user: ' + data['username'], 0, 3)
                        self.loginUser(data)
                else:
                    # Here we decide what to do with the information received
                    try:
                        
                        for case in switch(data['action']):
                            
                            # Timesync: sync the time between client and server
                            if case('timesync'):
                                t = datetime.datetime.now()
                                self.queue.put({'action': 'timesync', 'time': int(time.time()*1000)})
                                del t
                                break
                            
                            # Quit: start closing the connection
                            if case('quit'):
                                verbose("User " + self.uid + " is quitting", 0, 2)
                                self.closeClient()
                                break
                            
                            # Move: The player has moved
                            # {"action":"move","added":1316437492646,"x":34,"y":17,"moveRequested":1316437492646} <-- old
                            # {"action":"move","timeRequested":1316437492646,"x":34,"y":17, "targetid": "U1"} <-- new
                            if case('move'):
                                
                                # Target ID should not be used, could be spoofed.
                                data['uid'] = self.uid
                                
                                isWalkable = globMaps[globUser[self.uid]['map']].isTileWalkable(int(data['x']), int(data['y']))
                                
                                if isWalkable == True:
                                    del globUser[self.uid]['path'][0]
                                    globUser[self.uid]['path'].append(data)
                                    globUser[self.uid]['position']['x'] = int(data['x'])
                                    globUser[self.uid]['position']['y'] = int(data['y'])
                                
                                data['walkable'] = isWalkable
                                data['terrainSpeed'] = globMaps[globUser[self.uid]['map']].getTerrainSpeed(int(data['x']), int(data['y']))
                                
                                # Send the data to everyone
                                self.updateWorld(data)
                                
                                # Update the globuser var if it's walkable
                                if isWalkable:
                                    globUser[self.uid]['x'] = int(data['x'])
                                    globUser[self.uid]['y'] = int(data['y'])
                                
                                break
                            
                            # Iniuser: The client does not know a specific user, send him the required data
                            if case('iniuser'):
                                data = globUser[data['who']]
                                data['action'] = 'initiation'
                                self.queue.put(data)
                                break
                            
                            # Unknown command received
                            if case():
                                verbose("Unknown command received from " + self.uid, 0, 2)
                                # No need to break here, it'll stop anyway
        
                    except KeyError:
                        # Key is not present
                        verbose("No action key found, ignoring", 0, 3)
                        pass
        
    def updateWorld(self, data):
        """
        Sends the command to *every* user connected to the server.
        That's a bit overkill at this time, but we'll take it.
        """
        
        data['from'] = self.uid
        
        # Get a read lock
        rwQ.acquireRead()
        try:
            for index in range(len(globQueue)):
                globQueue[index].put(data)
        finally:
            rwQ.release()

    def loginUser(self, data):
        global globGuest
        
        # Get our login username
        username = data['username']
        
        if(username == 'guest'):
            
            rwG.acquireRead()
            try:
                rwG.acquireWrite()
                try:
                    globGuest += 1
                    guestid = globGuest
                    userinfo = {"uid":"U" + str(guestid),"x":30,"y":31,"moveToX":30,"moveToY":31,"fromX":30,"fromY":31,"msMoved":100,"lastMoved":1000,"map":"grassland.tmx.xml","sprites":[1,21],"spritesToDraw":[1,21],"currentSprite":1,"effects":[],"selection":0,"currenthealth":55,"fullhealth":100,"position":{"x": 30, "y": 31},"path":[{"x":30,"y":31},{"x":30,"y":31},{"x":30,"y":31}],"actionsreceived":[],"finishedEvents":{}}
                finally:
                    rwG.release()
            finally:
                rwG.release()
        
        self.initiateUser(userinfo)

    def initiateUser(self, data):
        
        # Set our userid
        self.uid = data['uid']
        
        ## Put the received data in the serverQueue, which goes to the event handler
        #self.serverQueue.put(data)
        
        # Get a read lock on the globUser, we're going to insert it
        rwU.acquireRead()
        try:
            # Get a write lock. All readers will finish first, new ones will block
            rwU.acquireWrite()
            try:
                globUser[data['uid']] = data
            finally:
                rwU.release()
        finally:
            rwU.release()
        
        # Set the initiated flag true
        self.initiated = True
        
        # Send this new user to every client
        data['action'] = 'initiation'
        
        self.updateWorld(data)
        
        # Create a new thread that sends data to the client through its own queue
        m=UpdateClient(data, self.queue, self.client, self.framed)
        
        # Start the thread and actually thread it
        m.start()
        self.threads.append(m)
        
# This class listens to its own queue
# and sends the information as-is to the client
class UpdateClient(threading.Thread):
    x = 0
    y = 0

    def __init__(self, userinfo, queue, client, framed):
        threading.Thread.__init__(self)
        self.uid = userinfo['uid']
        self.userinfo = userinfo
        self.queue = queue
        self.client = client
        self.running = True
        self.framed = framed
        global globUser

        # Tell the client its initiated, and tell him what maps to load
        self.wsend({'action': 'initiated', 'loadMaps': loadMaps, 'userinfo': userinfo})

    def run(self):
        
        # Send all online users
        self.wsend({'action': 'userlist', 'userlist': self.getClosebyUsers(100,100,1000,1000)})
        
        print globUser
        
        while self.running == True:
                
            qd = self.queue.get(True)
            
            self.wsend(qd)
            
            #self.x = int(globUser[self.uid]['x'])
            #self.y = int(globUser[self.uid]['y'])

            #self.wsend(self.getClosebyUsers(self.x, self.y, 8, 8));
            
            #time.sleep(0.20) # 0.20 = 5 fps
    
    def join(self):
        self.running = False
        
    def getClosebyUsers(self, x, y, width, height):
        
        # Get a read lock on the globUser, we're going to iterate it
        rwU.acquireRead()
        try:
            s = dict([ (k,r) for k,r in globUser.iteritems() if x-width < int(r['x']) < x+width and y-height < int(r['y']) < y+height])
            return s
        finally:
            rwU.release()

    def wsend(self, message):
        # JSONify the message, before checking the length
        message = json.dumps(message)
        
        # Construct the simple length header
        header = "--KOP:" + str(len(message)) + ":POK--";
        
        try:
            # Send the message
            #self.client.send('\x00' + header + message + '\xff');
            if(self.framed):
                self.client.send(encode_hybi(header + message, 0x1));
            else:
                self.client.send(header + message);
        except socket.error, e:
            print "Socket error!"
        except IOError, e:
            if e.errno == errno.EPIPE:
                print "Pipe error (32?) " + str(e.errno)
            else:
                print "Other error: " + str(e.errno)

# The EventHandler is the only thread that is allowed to write to
# the global variables like globUser
class EventHandler(threading.Thread):
    
    def __init__(self, serverQueue):
        threading.Thread.__init__(self)
        self.serverQueue = serverQueue
        self.running = True
        global globUser
        verbose('EventHandler has started', 0, 1)

    def run(self):
        while self.running:
            
            # Wait to receive something from the queue
            qget = self.serverQueue.get(True)
            
            # And put that message in the desired destination
            globUser[qget['uid']] = qget

## {{{ http://code.activestate.com/recipes/410692/ (r8)
# This class provides the functionality we want. You only need to look at
# this if you want to know how this works. It only needs to be defined
# once, no need to muck around with its internals.
class switch(object):
    def __init__(self, value):
        self.value = value
        self.fall = False

    def __iter__(self):
        """Return the match method once, then stop"""
        yield self.match
        raise StopIteration
    
    def match(self, *args):
        """Indicate whether or not to enter a case suite"""
        if self.fall or not args:
            return True
        elif self.value in args: # changed for v1.5, see below
            self.fall = True
            return True
        else:
            return False

def encode_hybi(buf, opcode, base64=False):
    """ Encode a HyBi style WebSocket frame.
    Optional opcode:
    0x0 - continuation
    0x1 - text frame (base64 encode buf)
    0x2 - binary frame (use raw buf)
    0x8 - connection close
    0x9 - ping
    0xA - pong
    """
    if base64:
        buf = b64encode(buf)

    b1 = 0x80 | (opcode & 0x0f) # FIN + opcode
    payload_len = len(buf)
    if payload_len <= 125:
        header = struct.pack('>BB', b1, payload_len)
    elif payload_len > 125 and payload_len < 65536:
        header = struct.pack('>BBH', b1, 126, payload_len)
    elif payload_len >= 65536:
        header = struct.pack('>BBQ', b1, 127, payload_len)

    #print("Encoded: %s" % repr(header + buf))

    #return header + buf, len(header), 0
    return header+buf

def decode_hybi(buf, base64=False):
    """ Decode HyBi style WebSocket packets.
        Returns:
        {'fin' : 0_or_1,
        'opcode' : number,
        'mask' : 32_bit_number,
        'hlen' : header_bytes_number,
        'length' : payload_bytes_number,
        'payload' : decoded_buffer,
        'left' : bytes_left_number,
        'close_code' : number,
        'close_reason' : string}
        """

    f = {'fin' : 0,
         'opcode' : 0,
         'mask' : 0,
         'hlen' : 2,
         'length' : 0,
         'payload' : None,
         'left' : 0,
         'close_code' : None,
         'close_reason' : None}

    blen = len(buf)
    f['left'] = blen

    if blen < f['hlen']:
        return f # Incomplete frame header

    b1, b2 = struct.unpack_from(">BB", buf)
    f['opcode'] = b1 & 0x0f
    f['fin'] = (b1 & 0x80) >> 7
    has_mask = (b2 & 0x80) >> 7

    f['length'] = b2 & 0x7f

    if f['length'] == 126:
        f['hlen'] = 4
        if blen < f['hlen']:
            return f # Incomplete frame header
        (f['length'],) = struct.unpack_from('>xxH', buf)
    elif f['length'] == 127:
        f['hlen'] = 10
        if blen < f['hlen']:
            return f # Incomplete frame header
        (f['length'],) = struct.unpack_from('>xxQ', buf)

    full_len = f['hlen'] + has_mask * 4 + f['length']

    if blen < full_len: # Incomplete frame
        return f # Incomplete frame header

    # Number of bytes that are part of the next frame(s)
    f['left'] = blen - full_len

    # Process 1 frame
    if has_mask:
        # unmask payload
        f['mask'] = buf[f['hlen']:f['hlen']+4]
        b = c = s2b('')
        if f['length'] >= 4:
            mask = numpy.frombuffer(buf, dtype=numpy.dtype('<u4'),
                    offset=f['hlen'], count=1)
            data = numpy.frombuffer(buf, dtype=numpy.dtype('<u4'),
                    offset=f['hlen'] + 4, count=int(f['length'] / 4))
            #b = numpy.bitwise_xor(data, mask).data
            b = numpy.bitwise_xor(data, mask).tostring()

        if f['length'] % 4:
            #print("Partial unmask")
            mask = numpy.frombuffer(buf, dtype=numpy.dtype('B'),
                    offset=f['hlen'], count=(f['length'] % 4))
            data = numpy.frombuffer(buf, dtype=numpy.dtype('B'),
                    offset=full_len - (f['length'] % 4),
                    count=(f['length'] % 4))
            c = numpy.bitwise_xor(data, mask).tostring()
        f['payload'] = b + c
    else:
        verbose("Unmasked frame: %s" % repr(buf), 0, 2)
        #f['payload'] = buf[(f['hlen'] + has_mask * 4):full_len]
        print buf[1:len(buf)-1]
        f['payload'] = buf[1:len(buf)-1]

    if base64 and f['opcode'] in [1, 2]:
        try:
            f['payload'] = b64decode(f['payload'])
        except:
            print("Exception while b64decoding buffer: %s" %
                    repr(buf))
            raise

    if f['opcode'] == 0x08:
        if f['length'] >= 2:
            f['close_code'] = struct.unpack_from(">H", f['payload'])
        if f['length'] > 3:
            f['close_reason'] = f['payload'][2:]

    return f

def gen_md5(keys):
    """ Generate hash value for WebSockets hixie-76. """
    key1 = keys['Sec-WebSocket-Key1']
    key2 = keys['Sec-WebSocket-Key2']
    key3 = keys['key3']
    spaces1 = key1.count(" ")
    spaces2 = key2.count(" ")
    num1 = int("".join([c for c in key1 if c.isdigit()])) / spaces1
    num2 = int("".join([c for c in key2 if c.isdigit()])) / spaces2

    return b2s(md5(struct.pack('>II8s',
        int(num1), int(num2), key3)).digest())

# HTTP handler with WebSocket upgrade support
class WSRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, req, addr, only_upgrade=False):
        self.only_upgrade = only_upgrade # only allow upgrades
        SimpleHTTPRequestHandler.__init__(self, req, addr, object())

    def do_GET(self):
        if (self.headers.get('upgrade') and
                self.headers.get('upgrade').lower() == 'websocket'):

            if (self.headers.get('sec-websocket-key1') or
                    self.headers.get('websocket-key1')):
                # For Hixie-76 read out the key hash
                self.headers.__setitem__('key3', self.rfile.read(8))

            # Just indicate that an WebSocket upgrade is needed
            self.last_code = 101
            self.last_message = "101 Switching Protocols"
        elif self.only_upgrade:
            # Normal web request responses are disabled
            self.last_code = 405
            self.last_message = "405 Method Not Allowed"
        else:
            SimpleHTTPRequestHandler.do_GET(self)

    def send_response(self, code, message=None):
        # Save the status code
        self.last_code = code
        SimpleHTTPRequestHandler.send_response(self, code, message)

    def log_message(self, f, *args):
        # Save instead of printing
        self.last_message = f % args

# Initialize the server class, booting everything
if __name__ == "__main__":
    s = Server()
    s.start_server() 