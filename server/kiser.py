#!/usr/bin/env python

import select
import socket
import sys
import threading
import time
import datetime
import Queue
import json
import rwlock
import toolbox
import xml.etree.ElementTree as ET
import Maps


serverQueue = Queue.Queue()	    # A general queue for all threads
globQueue = []			    # An array to store every queue in
globUser = {}			    # An object to store all the on-line users in

loadMaps = ['grassland.tmx.xml', 'default.tmx.xml']
rootFolder = '/home/skerit/www/subdomain/kiflea/';
globMaps = {}


rwQ = rwlock.ReadWriteLock()       # The r/w-lock for the globQueue
rwU = rwlock.ReadWriteLock()       # The r/w-lock for the globUser

# The main server class, which sets up the server itself and
# creates a thread for every connecting client
class Server:
    def __init__(self):
        self.host = ''
        self.port = 1234
        self.backlog = 5
        self.size = 1024
        self.server = None
        self.threads = []
        
    def loadMaps(self, maps):
        for fileName in maps:
            globMaps[fileName] = Maps.Map(fileName, rootFolder)
        
        print "Finished loading maps"
        print globMaps['grassland.tmx.xml'].printName()
        print "finished printing name"

    def run(self):
        self.loadMaps(loadMaps)
        self.open_socket()
        input = [self.server,sys.stdin]	#input listens to the server and standard input
        running = 1
        
        # Create an event handler
        e = EventHandler(serverQueue)
        
        # Start it
        e.start()
        
        # And thread it
        self.threads.append(e)

        while running:
            inputready,outputready,exceptready = select.select(input,[],[])

            for s in inputready:
                if s == self.server:
                    
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
                    c = Client(self.server.accept(), globQueue[globQueueIndex], globQueueIndex, serverQueue )
                    
                    # Start it
                    c.start()
                    
                    # And thread it
                    self.threads.append(c)
                    
                elif s == sys.stdin:
                    # handle standard input
                    junk = sys.stdin.readline()
                    
                    for case in switch(junk[0:-1]):
                        if case('close'):
                            print "Shutting down",
                            running = 0
                            break
                        if case('queues'):
                            print globQueue,
                            break
                        if case('ten'):
                            print 10,
                            break
                        if case('eleven'):
                            print 11,
                            break
                        if case(): # default, could also just omit condition or 'if True'
                            print "Command not recognized: " + junk[0:-1]
                            # No need to break here, it'll stop anyway

        # When this is reached, the running while has stopped
        # Close the server
        self.server.close()
        
        # Loop through all the threads and close (join) them
        for c in self.threads:
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
            print "Could not open socket: " + message
            sys.exit(1)

# The Client class
# This main thread will receive information from the client,
# another thread (updateclient) will be created to send information to the client
# and listen to the queue
class Client(threading.Thread):

    # Initializing the Client
    # @param    (client,address)        The info of the connecting client
    # @param    queue                   This thread's queue
    # @param    queueIndex              The index of the queue in the globQueue var
    # @param    serverQueue             A queue straight to the event handler
    def __init__(self,(client,address), queue, queueIndex, serverQueue):
        threading.Thread.__init__(self)
        self.client = client
        self.address = address
        self.size = 1024
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
        
        # Finally; start the handshake procedure
        self.handshake()

    # Handshake the client
    def handshake(self):
        
        # Wait for the handshake information
        shake = self.client.recv(self.size)
        
        # Start splicing the shake information
        shakelist = shake.split("\r\n")
        
        # The body follows a \r\n after the 'headers'
        body = shake.split("\r\n\r\n")[1]

        # Extract key1 and key2
        for elem in shakelist:
            if elem.startswith("Sec-WebSocket-Key1:"):
                key1 = elem[20:]  # Sec-WebSocket-Key1: is 20 chars
            elif elem.startswith("Sec-WebSocket-Key2:"):
                key2 = elem[20:]
            elif elem.startswith("Origin:"):
                origin = elem[8:]
                print "Client coming from " + origin
            else:
                continue
            
        # Count spaces
        nums1 = key1.count(" ")
        nums2 = key2.count(" ")
        
        # Join digits in the key
        num1 = ''.join([x for x in key1 if x.isdigit()])
        num2 = ''.join([x for x in key2 if x.isdigit()])
       
        # Divide the digits by the num of spaces
        key1 = int(int(num1)/int(nums1))
        key2 = int(int(num2)/int(nums2))
     
        # Pack into Network byte ordered 32 bit ints
        import struct
        key1 = struct.pack("!I", key1)
        key2 = struct.pack("!I", key2)
     
        # Concat key1, key2, and the the body of the client handshake and take the md5 sum of it
        key = key1 + key2 + body
        import hashlib
        m = hashlib.md5()
        m.update(key)
        d = m.digest()
        
        # Send 'headers'
        self.client.send("HTTP/1.1 101 WebSocket Protocol Handshake\r\n")
        self.client.send("Upgrade: WebSocket\r\n")
        self.client.send("Connection: Upgrade\r\n")
        self.client.send("Sec-WebSocket-Origin: "+ origin +"\r\n")
        self.client.send("Sec-WebSocket-Origin: http://kipdola.be\r\n")
        self.client.send("Sec-WebSocket-Location: ws://kipdola.be:1234/\r\n")
        self.client.send("Sec-WebSocket-Protocol: chat\r\n")
        self.client.send("\r\n")
        
        # Send the calculated handshake
        self.client.send(d)
    
    # Pipe received data through this function to make sure we've got everything
    # @param    data    {string}        The data to check
    # @return           {bool/string}   The data, or false if it's incomplete
    def wget(self, data):
        
        # Check if there's a header in the data
        if data.find("--KOP:") > 0:
            if self.wComplete == -1:
                print "Previous data was incomplete, new data already arrived"
            
            # Start splicing the header from the body
            self.wLength = data.partition("--KOP:")[2]
            data =  self.wLength.partition(":POK--")[2]
            self.wLength = int(self.wLength.partition(":POK--")[0])
            
            # If the length of the data matches the specified length, return the data
            if len(data) == self.wLength:
                self.wComplete = None
                self.wLength = None

                # Return the completed data
                return data
            else:
                self.wComplete = -1
                self.wData = data
        else:
            
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
                    print "Received stray data: " + data
                else:
                    print "The connection is going to be closed!"
                    self.closeClient()
                    print "Done! Connection closed"

        # Return false if this point has been reached
        return False
    
    def closeClient(self):
        
        self.updateWorld({'action': 'logoff'})
        
        self.running = 0
        # Loop through all the threads and close (join) them
        for c in self.threads:
            c.join()
        
        # Delete our queue from the dictionary
        rwQ.acquireRead()
        try:
            rwQ.acquireWrite()
            try:
                # Add a new queue to the array for the new thread
                print 'Globqueue length before deleting: ' + str(len(globQueue))
                del globQueue[self.queueIndex]
                print 'Globqueue length after deleting: ' + str(len(globQueue))
            finally:
                rwQ.release()
        finally:
            rwQ.release()
            
        # Delete our user from the dictionary
        rwU.acquireRead()
        try:
            rwU.acquireWrite()
            try:
                del globUser[self.uid]
            finally:
                rwU.release()
        finally:
            rwU.release()
            
    def join(self):
        self.closeClient()
        
    def run(self):
        queue = self.queue
        error = 0           # Error counter for this thread
        
        while self.running:
            # Wait for data ...
            data = self.wget(self.client.recv(self.size))
            
            # If data equals false after running through wget, continue to the next iteration
            if data == False:
                print "No data, upping error for user " + self.uid
                error += 1
                
                if error > 5:
                    self.closeClient()
                    
                continue
            
            #Try to parse the JSON data
            try:
                data = data[0:-1]           # Cut off the ending byte
                data = json.loads(data)     # Parse the JSON
            except ValueError:
                print 'This is not a JSON object: "' + data + '" -- end data;'
                error += 1
                data = None
                if error > 50:
                    print "This thread is being shut down: 50 errors"
                    running = 0
            
            # Only continue if there actually is data
            if data:
                # Initiate the user if it hasn't happened yet
                if self.initiated == False:
                    print 'Initializing user: ' + data['uid']
                    self.initiateUser(data)
                else:
                    # Here we decide what to do with the information received
                    try:
                        for case in switch(data['action']):
                            if case('timesync'):
                                t = datetime.datetime.now()
                                self.queue.put({'action': 'timesync', 'time': int(time.time()*1000)})
                                del t
                                break
                            if case('quit'):
                                print "User is quitting"
                                break
                            if case('move'):
                                data['uid'] = self.uid
                                
                                isWalkable = globMaps[globUser[self.uid]['map']].isTileWalkable(int(data['x']), int(data['y']))
                                
                                if isWalkable == True:
                                    del globUser[self.uid]['path'][0]
                                    globUser[self.uid]['path'].append(data)
                                    globUser[self.uid]['position']['x'] = int(data['x'])
                                    globUser[self.uid]['position']['y'] = int(data['y'])
                                
                                data['walkable'] = isWalkable
                                data['terrainSpeed'] = globMaps[globUser[self.uid]['map']].getTerrainSpeed(int(data['x']), int(data['y']))
                                self.updateWorld(data)
                                
                                # Update the globuser var if it's walkable
                                if isWalkable:
                                    globUser[self.uid]['x'] = int(data['x'])
                                    globUser[self.uid]['y'] = int(data['y'])
                                
                                break
                            if case('iniuser'):
                                data = globUser[data['who']]
                                data['action'] = 'initiation'
                                self.queue.put(data)
                                break
                            if case(): # default, could also just omit condition or 'if True'
                                print "something else!"
                                # No need to break here, it'll stop anyway
        
                    except KeyError:
                        # Key is not present
                        print "No action key found, ignoring"
                        pass
                        
        # Send the curent time to the client, to sync clocks
        #self.wsend(json.dumps(dict({'time': time.mktime(t.timetuple()))));
        
    def updateWorld(self, data):
        
        data['from'] = self.uid
        
        # Get a read lock
        rwQ.acquireRead()
        try:
            for index in range(len(globQueue)):
                globQueue[index].put(data)
        finally:
            rwQ.release()

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
        m=UpdateClient(data['uid'], self.queue, self.client)
        
        # Start the thread and actually thread it
        m.start()
        self.threads.append(m)
        
        
        
# This class listens to its own queue
# and sends the information as-is to the client
class UpdateClient(threading.Thread):
    x = 0
    y = 0

    def __init__(self, uid, queue, client):
        threading.Thread.__init__(self)
        self.uid = uid
        self.queue = queue
        self.client = client
        self.running = True
        global globUser
        
        # Tell the client its initiated, and tell him what maps to load
        self.wsend({'action': 'initiated', 'loadMaps': loadMaps})
        print 'UpdateClient thread started!'

    def run(self):
        
        # Send all online users
        self.wsend({'action': 'userlist', 'userlist': self.getClosebyUsers(100,100,1000,1000)})
        
        while self.running == True:
                
            qd = self.queue.get(True)
            
            self.wsend(qd)
            
            #self.x = int(globUser[self.uid]['x'])
            #self.y = int(globUser[self.uid]['y'])

            #self.wsend(self.getClosebyUsers(self.x, self.y, 8, 8));
            
            #time.sleep(0.20) # 0.20 = 5 fps

        print 'Updateclient has stopped'
    
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
            self.client.send('\x00' + header + message + '\xff');
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
        print 'EventHandler has started'

    def run(self):
        while self.running:
            
            qget = self.serverQueue.get(True)
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




# Initialize the server class, booting everything
if __name__ == "__main__":
    s = Server()
    s.run() 