"use client";
import { ArrowLeftRight, Check, Copy, Mic, MicOff, PhoneOff, Pin, PinOff, Video, VideoOff } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Peer from 'peerjs';
import { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const PeerPage = () => {
  const router = useRouter();
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const callingVideoRef = useRef<HTMLVideoElement>(null);
  const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
  const [myUniqueId, setMyUniqueId] = useState<string>("");
  const [callId, setCallId] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Local mic mute
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRemoteMuted, setIsRemoteMuted] = useState(false); // Remote audio mute
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [isJoining, setIsJoining] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 3;

  const params = useParams();
  const routeId = params?.id as string;

  useEffect(() => {
    console.log("First useEffect running. callId:", callId, "routeId:", routeId, "isJoining:", isJoining);
    if (!callId && !routeId) {
      const newCallId = uuidv4().substring(0, 8);
      setCallId(newCallId);
      const newPersonalId = `${newCallId}-${uuidv4().substring(0, 8)}`;
      setMyUniqueId(newPersonalId);
      router.replace(`/call/${newCallId}`, { scroll: false });
      console.log("Creating new call:", newCallId, "with ID:", newPersonalId);
    } else if (routeId && !callId) {
      setCallId(routeId);
      const newPersonalId = `${routeId}-${uuidv4().substring(0, 8)}`;
      setMyUniqueId(newPersonalId);
      setIsJoining(true);
      console.log("Joining existing call:", routeId, "with ID:", newPersonalId);
    }
  }, [callId, routeId, router]);

  useEffect(() => {
    if (callId) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const link = `${baseUrl}/call/${callId}`;
      setShareableLink(link);
    }
  }, [callId]);

  const initializePeerConnection = () => {
    if (!myUniqueId || typeof window === 'undefined') return null;

    try {
      console.log("Initializing peer connection with ID:", myUniqueId);
      const peer = new Peer(myUniqueId, {
        host: 'localhost',
        port: 9000,
        path: '/myapp/myapp', // Corrected to match your server setup
        debug: 2,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject'
            }
          ],
          iceTransportPolicy: 'all',
          iceCandidatePoolSize: 10,
        }
      });
      return peer;
    } catch (err) {
      console.error("Error creating peer:", err);
      setConnectionError("Failed to initialize connection");
      return null;
    }
  };

  useEffect(() => {
    if (!myUniqueId) return;

    setConnectionError(null);
    const peer = initializePeerConnection();
    if (!peer) return;

    setPeerInstance(peer);

    peer.on('open', (id) => {
      console.log("Peer connection established with ID:", id);
      setConnectionError(null);
      setReconnectAttempts(0);
    });

    peer.on('error', (err) => {
      console.error("Peer error:", err.type, err.message);
      if (err.type === 'peer-unavailable') {
        setConnectionError("The person you're trying to call is not available.");
      } else if (err.type === 'network') {
        setConnectionError("Network error. Check if server is running at localhost:9000.");
        if (reconnectAttempts < maxReconnectAttempts) {
          const attemptCount = reconnectAttempts + 1;
          setReconnectAttempts(attemptCount);
          setConnectionError(`Network error. Reconnecting (${attemptCount}/${maxReconnectAttempts})...`);
          peer.destroy();
          setTimeout(() => {
            const newPeer = initializePeerConnection();
            if (newPeer) setPeerInstance(newPeer);
          }, 2000);
        }
      } else if (err.type === 'server-error') {
        setConnectionError("Server error. The PeerJS server may be down.");
      } else if (err.type === 'browser-incompatible') {
        setConnectionError("Your browser doesn't support WebRTC.");
      } else {
        setConnectionError(`Connection error: ${err.type}. Please try again.`);
      }
    });

    peer.on('connection', (conn) => {
      console.log("Data connection established with:", conn.peer);
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (myVideoRef.current) myVideoRef.current.srcObject = stream;

        peer.on('call', call => {
          console.log("Incoming call from:", call.peer);
          const callerCallId = call.peer.split('-')[0];
          if (callerCallId !== callId) {
            console.error("Call rejected: caller from different call ID");
            return;
          }

          navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
              console.log("Answering call with stream:", stream);
              call.answer(stream);
              setIsConnected(true);

              call.on('stream', userVideoStream => {
                console.log("Received remote stream from incoming call:", userVideoStream);
                if (callingVideoRef.current) {
                  callingVideoRef.current.srcObject = userVideoStream;
                  setTimeout(() => {
                    callingVideoRef.current.play()
                      .then(() => console.log("Remote video playing successfully"))
                      .catch(err => console.error("Error playing remote video:", err));
                  }, 100);
                } else {
                  console.error("callingVideoRef is not available");
                }
              });

              call.on('close', () => {
                console.log("Incoming call closed");
                setIsConnected(false);
              });

              call.on('error', (err) => {
                console.error("Incoming call error:", err);
                setIsConnected(false);
              });
            })
            .catch(err => {
              console.error("Error answering call:", err);
              setConnectionError("Failed to access media devices to answer call");
            });
        });
      })
      .catch(err => {
        console.error("Media device error:", err);
        setConnectionError("Failed to access camera/microphone. Check permissions.");
      });

    return () => {
      console.log("Cleaning up peer connection");
      peer.destroy();
      handleEndCall();
    };
  }, [myUniqueId, callId, reconnectAttempts]);

  useEffect(() => {
    if (!peerInstance || !callId || !isJoining) return;

    console.log("Starting findPeersInCall for call:", callId);
    findPeersInCall();

    return () => {
      console.log("Cleaning up findPeersInCall polling");
    };
  }, [peerInstance, callId, isJoining]);

  const findPeersInCall = async () => {
    if (!peerInstance || !callId) return;

    console.log("Attempting to find peers in call:", callId);

    const maxAttempts = 10;
    let attempts = 0;

    const pollPeers = async () => {
      try {
        console.log(`Polling attempt ${attempts + 1}/${maxAttempts} for call: ${callId}`);
        const response = await fetch(`http://localhost:9000/myapp/peers/${callId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        const peers = data.peers;

        console.log("Fetched peers:", peers);

        if (peers.length > 1) {
          const otherPeer = peers.find(peer => peer.id !== myUniqueId);
          if (otherPeer) {
            console.log("Found other peer to call:", otherPeer.id);
            callPeer(otherPeer.id);
            return true;
          }
        } else {
          console.log("Waiting for another peer to join...");
        }
        return false;
      } catch (err) {
        console.error("Error fetching peers:", err);
        setConnectionError("Failed to find other participants. Check server connection.");
        return false;
      }
    };

    const interval = setInterval(async () => {
      attempts++;
      const success = await pollPeers();
      if (success || attempts >= maxAttempts) {
        clearInterval(interval);
        if (!success) {
          console.log("Polling stopped: No peers found after max attempts");
          setConnectionError("No other peers joined in time.");
        } else {
          console.log("Polling stopped: Successfully connected to peer");
        }
      }
    }, 2000);
  };

  const callPeer = (peerId) => {
    if (!peerInstance) {
      setConnectionError("Connection not initialized. Please refresh and try again.");
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log("Calling peer:", peerId);
        const call = peerInstance.call(peerId, stream);

        if (call) {
          setIsConnected(true);
          setConnectionError(null);

          call.on('stream', userVideoStream => {
            console.log("Received remote stream from peer:", peerId, userVideoStream);
            if (callingVideoRef.current) {
              callingVideoRef.current.srcObject = userVideoStream;
              setTimeout(() => {
                callingVideoRef.current.play()
                  .then(() => console.log("Remote video playing successfully"))
                  .catch(err => console.error("Error playing remote video:", err));
              }, 100);
            } else {
              console.error("callingVideoRef is not available");
            }
          });

          call.on('close', () => {
            console.log("Call with peer closed:", peerId);
            setIsConnected(false);
          });

          call.on('error', (err) => {
            console.error("Call error with peer:", peerId, err);
            setIsConnected(false);
            setConnectionError("Call disconnected unexpectedly");
          });
        } else {
          console.error("Failed to initiate call to peer:", peerId);
          setConnectionError("Failed to start call.");
        }
      })
      .catch(err => {
        console.error("Media device error:", err);
        setConnectionError("Failed to access media devices");
      });
  };

  const attemptConnection = () => {
    setConnectionError("Attempting to connect...");

    if (!peerInstance) {
      const newPeer = initializePeerConnection();
      if (newPeer) {
        setPeerInstance(newPeer);
        setConnectionError("Reconnecting to server...");
      } else {
        setConnectionError("Failed to initialize connection. Check server status.");
      }
      return;
    }

    if (isJoining && callId) {
      findPeersInCall();
    }
  };

  const handleEndCall = () => {
    setIsConnected(false);
    if (callingVideoRef.current?.srcObject) {
      const mediaStream = callingVideoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach(track => track.stop());
      callingVideoRef.current.srcObject = null;
    }
    if (myVideoRef.current?.srcObject) {
      const mediaStream = myVideoRef.current.srcObject as MediaStream;
      mediaStream.getTracks().forEach(track => track.stop());
      myVideoRef.current.srcObject = null;
    }
  };

  const toggleMute = () => {
    if (myVideoRef.current?.srcObject) {
      const stream = myVideoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleRemoteMute = () => {
    if (callingVideoRef.current) {
      callingVideoRef.current.muted = !callingVideoRef.current.muted;
      setIsRemoteMuted(!isRemoteMuted);
    }
  };

  const toggleVideo = () => {
    if (myVideoRef.current?.srcObject) {
      const stream = myVideoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  const togglePin = () => setIsPinned(!isPinned);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 animate-pulse">
            Virtual Interview
          </h1>
          <div className="flex items-center space-x-3 bg-gray-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-700/50 shadow-lg">
            <span className="text-sm font-medium text-gray-300">Room ID:</span>
            <span className="font-mono text-sm bg-gray-900/70 px-3 py-1 rounded-md text-indigo-300">{callId}</span>
          </div>
        </header>

        {shareableLink && !isConnected && (
          <div className="bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-700/50 transition-all duration-300 hover:shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Share this Link to Join the Call</h2>
            <div className="flex items-center space-x-4">
              <input
                className="flex-grow bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                value={shareableLink}
                readOnly
              />
              <button
                onClick={copyToClipboard}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 shadow-md transition-all duration-300 transform hover:scale-105"
              >
                {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                <span>{copySuccess ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
            {isJoining ? (
              <p className="mt-3 text-gray-400 text-sm">Waiting to connect to the call...</p>
            ) : (
              <p className="mt-3 text-gray-400 text-sm">Waiting for someone to join your call...</p>
            )}

            {connectionError && (
              <div className="mt-3 p-3 bg-red-900/50 border border-red-700/50 rounded-lg">
                <p className="text-red-200 text-sm">{connectionError}</p>
                <button
                  onClick={attemptConnection}
                  className="mt-2 bg-red-800 hover:bg-red-700 px-3 py-1 rounded text-xs font-medium text-white"
                >
                  Retry Connection
                </button>
              </div>
            )}
          </div>
        )}

        <div className={`grid ${isPinned ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-6 relative`}>
          <div className={`relative ${isPinned && isConnected ? "absolute top-4 right-4 w-56 z-10" : "w-full"} transition-all duration-500 ease-in-out`}>
            <div className="relative rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-700/50 shadow-xl">
              <video
                className="w-full h-full object-cover aspect-video"
                playsInline
                ref={myVideoRef}
                autoPlay
                muted // Keep muted to avoid feedback
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                  <div className="h-24 w-24 rounded-full bg-indigo-800/80 flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">You</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-gray-900/70 px-3 py-1 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm shadow-md">
                You
              </div>
            </div>
          </div>

          {isConnected && (
            <div className="relative w-full">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-700/50 shadow-xl">
                <video
                  className="w-full h-full object-cover aspect-video"
                  playsInline
                  ref={callingVideoRef}
                  autoPlay
                  // Removed muted to allow remote audio
                />
                <div className="absolute bottom-3 left-3 bg-gray-900/70 px-3 py-1 rounded-full text-sm font-medium text-gray-200 backdrop-blur-sm shadow-md">
                  Interviewer
                </div>
                {isPinned && (
                  <button
                    onClick={togglePin}
                    className="absolute top-3 right-3 bg-gray-900/70 p-2 rounded-full backdrop-blur-sm hover:bg-gray-800/80 transition-all duration-200 shadow-md"
                  >
                    <PinOff size={16} className="text-gray-300" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center items-center space-x-4 bg-gray-800/90 backdrop-blur-lg p-4 rounded-2xl border border-gray-700/50 shadow-xl">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
            title={isMuted ? "Unmute Mic" : "Mute Mic"}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          {isConnected && (
            <>
              <button
                onClick={toggleRemoteMute}
                className={`p-3 rounded-full ${isRemoteMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
                title={isRemoteMuted ? "Unmute Remote" : "Mute Remote"}
              >
                {isRemoteMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={togglePin}
                className={`p-3 rounded-full ${isPinned ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'} transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105`}
                title={isPinned ? "Unpin video" : "Pin video"}
              >
                {isPinned ? <PinOff size={20} /> : <Pin size={20} />}
              </button>

              <button
                onClick={handleEndCall}
                className="bg-red-600 hover:bg-red-700 p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                title="End call"
              >
                <PhoneOff size={20} />
              </button>

              <button
                onClick={() => setIsPinned(!isPinned)}
                className="bg-indigo-700 hover:bg-indigo-800 p-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Swap video layout"
              >
                <ArrowLeftRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeerPage;
