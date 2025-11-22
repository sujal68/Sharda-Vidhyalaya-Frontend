'use client';
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';

export default function Messages() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'search'>('chats');
  const [connections, setConnections] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [waveHeights] = useState(() => Array.from({ length: 20 }, () => Math.random() * 80 + 20));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchConnections();
    fetchRequests();
    
    if (user?.id) {
      connectSocket(user.id);
      
      socket.on('receiveMessage', (data) => {
        if (selectedUser && data.sender === selectedUser._id) {
          setMessages(prev => [...prev, data]);
        }
        fetchConnections();
      });
    }
    
    return () => {
      disconnectSocket();
    };
  }, [user, selectedUser]);

  const fetchConnections = async () => {
    try {
      const { data } = await api.get('/connections/list');
      // Fetch unread count for each connection
      const connectionsWithUnread = await Promise.all(
        data.connections.map(async (conn: any) => {
          try {
            const { data: msgs } = await api.get(`/messages/${conn._id}`);
            const unreadCount = msgs.messages.filter((m: any) => 
              m.sender === conn._id && !m.isRead
            ).length;
            return { ...conn, unreadCount };
          } catch {
            return { ...conn, unreadCount: 0 };
          }
        })
      );
      setConnections(connectionsWithUnread);
    } catch (error) {
      console.error('Failed to fetch connections');
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/connections/requests');
      setRequests(data.requests);
    } catch (error) {
      console.error('Failed to fetch requests');
    }
  };

  const searchUsers = async (role: string) => {
    try {
      const { data } = await api.get('/connections/search', { params: { role } });
      setSearchResults(data.users);
    } catch (error) {
      toast.error('Failed to search users');
    }
  };

  const sendRequest = async (userId: string) => {
    try {
      await api.post('/connections/send', { recipientId: userId });
      toast.success('Request sent!');
      setSearchResults(searchResults.filter(u => u._id !== userId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send request');
    }
  };

  const respondRequest = async (requestId: string, accept: boolean) => {
    try {
      await api.post('/connections/respond', { requestId, accept });
      toast.success(accept ? 'Request accepted!' : 'Request rejected');
      fetchRequests();
      fetchConnections();
    } catch (error) {
      toast.error('Failed to respond');
    }
  };

  const fetchMessages = async (userId: string) => {
    try {
      const { data } = await api.get(`/messages/${userId}`);
      setMessages(data.messages);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const { data } = await api.post('/messages', { receiver: selectedUser._id, message: newMessage });
      socket.emit('sendMessage', {
        ...data.message,
        sender: user?.id,
        receiver: selectedUser._id
      });
      setNewMessage('');
      fetchMessages(selectedUser._id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!mounted) return <div className="h-screen flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>;

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-950">
      {/* Tabs */}
      <div className="flex justify-center gap-6 px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-800/50 shadow-sm">
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-5 py-2 font-semibold transition-all relative ${
            activeTab === 'chats' ? 'text-sky-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <i className="ri-message-3-line mr-2"></i>Chats
          {activeTab === 'chats' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 dark:bg-blue-400"></div>}
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-2 font-semibold transition-all relative ${
            activeTab === 'requests' ? 'text-sky-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <i className="ri-mail-line mr-2"></i>Requests
          {requests.length > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-sky-500 text-white rounded-full">{requests.length}</span>}
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 dark:bg-blue-400"></div>}
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-5 py-2 font-semibold transition-all relative ${
            activeTab === 'search' ? 'text-sky-500 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          <i className="ri-search-line mr-2"></i>Connect
          {activeTab === 'search' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 dark:bg-blue-400"></div>}
        </button>
      </div>

      {activeTab === 'chats' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Connections List */}
          <div className={`${
            showMobileChat ? 'hidden' : 'flex'
          } lg:flex flex-col w-full lg:w-80 border-r border-gray-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm`}>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {connections.map((conn) => (
                <div
                  key={conn._id}
                  onClick={() => {
                    setSelectedUser(conn);
                    fetchMessages(conn._id);
                    setShowMobileChat(true);
                  }}
                  className={`flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4 ${
                    selectedUser?._id === conn._id
                      ? 'bg-gradient-to-r from-sky-100/80 to-transparent dark:from-blue-900/40 border-sky-500 dark:border-blue-500'
                      : 'hover:bg-gray-100/60 dark:hover:bg-slate-800/40 border-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {getInitials(conn.name)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{conn.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{conn.role}</p>
                  </div>
                  {conn.unreadCount > 0 && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shrink-0">
                      {conn.unreadCount}
                    </div>
                  )}
                </div>
              ))}
              {connections.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No connections yet</p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${
            showMobileChat ? 'flex' : 'hidden lg:flex'
          } flex-1 flex-col bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm`}>
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm shrink-0">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all"
                    >
                      <i className="ri-arrow-left-line text-xl"></i>
                    </button>
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {getInitials(selectedUser.name)}
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{selectedUser.name}</p>
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              const callWindow = window.open(
                                `/call?user=${selectedUser._id}&type=audio`,
                                'Voice Call',
                                'width=400,height=600'
                              );
                              toast.success('Starting voice call...');
                            }}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-sky-100 dark:hover:bg-blue-900 transition-all"
                            title="Voice Call"
                          >
                            <i className="ri-phone-line text-xl"></i>
                          </button>
                          <button
                            onClick={() => {
                              const callWindow = window.open(
                                `/call?user=${selectedUser._id}&type=video`,
                                'Video Call',
                                'width=800,height=600'
                              );
                              toast.success('Starting video call...');
                            }}
                            className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-sky-100 dark:hover:bg-blue-900 transition-all"
                            title="Video Call"
                          >
                            <i className="ri-vidicon-line text-xl"></i>
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/50 to-gray-100/50 dark:from-slate-950/50 dark:to-slate-900/50 scrollbar-thin">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl shadow-md break-words ${
                          msg.sender === user?.id
                            ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-slate-800 rounded-bl-md'
                        }`}
                      >
                              {msg.type === 'voice' ? (
                                <div className="flex items-center gap-2 min-w-[200px]">
                                  <button
                                    onClick={() => {
                                      if (playingAudio === msg._id) {
                                        setPlayingAudio(null);
                                      } else {
                                        const audio = new Audio(msg.audioUrl);
                                        audio.play();
                                        setPlayingAudio(msg._id);
                                        audio.onended = () => setPlayingAudio(null);
                                      }
                                    }}
                                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all"
                                  >
                                    <i className={playingAudio === msg._id ? 'ri-pause-fill' : 'ri-play-fill'}></i>
                                  </button>
                          <div className="flex-1 flex items-center gap-0.5 h-8">
                            {waveHeights.map((height, i) => (
                              <div
                                key={i}
                                className="w-1 bg-white/40 rounded-full transition-all"
                                style={{
                                  height: `${height}%`,
                                  animation: playingAudio === msg._id ? `pulse 0.5s ease-in-out ${i * 0.05}s infinite` : 'none'
                                }}
                              />
                            ))}
                          </div>
                                  <span className="text-xs font-mono">{msg.duration || 0}s</span>
                                </div>
                              ) : (
                                <p>{msg.message}</p>
                              )}
                        <div className={`text-xs mt-1.5 flex items-center gap-1.5 ${
                          msg.sender === user?.id ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={msg.sender === user?.id ? 'opacity-80' : 'opacity-60'}>
                            {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.sender === user?.id && (
                            <i className={`text-sm ${
                              msg.isRead ? 'ri-check-double-line text-blue-100' : 'ri-check-line opacity-80'
                            }`}></i>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
                        {recordedAudio ? (
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg p-2">
                            <button
                              onClick={() => {
                                const audio = new Audio(recordedAudio);
                                audio.play();
                              }}
                              className="w-8 h-8 rounded-full bg-sky-500 dark:bg-blue-700 text-white flex items-center justify-center"
                            >
                              <i className="ri-play-fill"></i>
                            </button>
                            <div className="flex-1 h-8 bg-sky-200 dark:bg-blue-900 rounded-full flex items-center px-2">
                              <div className="text-xs text-muted"><i className="ri-mic-line"></i> Voice message - {recordDuration}s</div>
                            </div>
                            <button
                              onClick={async () => {
                                const reader = new FileReader();
                                reader.readAsDataURL(recordedBlob!);
                                reader.onloadend = async () => {
                                  await api.post('/messages', { 
                                    receiver: selectedUser._id, 
                                    message: '🎤 Voice message',
                                    type: 'voice',
                                    audioUrl: reader.result,
                                    duration: recordDuration
                                  });
                                  
                                  socket.emit('sendMessage', {
                                    sender: user?.id,
                                    receiver: selectedUser._id,
                                    message: '🎤 Voice message',
                                    type: 'voice',
                                    audioUrl: reader.result,
                                    duration: recordDuration
                                  });
                                  
                                  setRecordedAudio(null);
                                  setRecordedBlob(null);
                                  fetchMessages(selectedUser._id);
                                  toast.success('Voice message sent!');
                                };
                              }}
                              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center"
                            >
                              <i className="ri-check-line"></i>
                            </button>
                            <button
                              onClick={() => {
                                setRecordedAudio(null);
                                setRecordedBlob(null);
                                toast.success('Deleted');
                              }}
                              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-full px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-500/50 transition-all">
                            <button
                              className="w-9 h-9 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shrink-0"
                              title="Emoji"
                            >
                              <i className="ri-emotion-line text-xl text-gray-600 dark:text-gray-400"></i>
                            </button>
                            <button
                              onClick={async () => {
                                if (!isRecording) {
                                  try {
                                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                                    const recorder = new MediaRecorder(stream);
                                    const chunks: Blob[] = [];
                                    
                                    let startTime = Date.now();
                                    recorder.ondataavailable = (e) => chunks.push(e.data);
                                    recorder.onstop = () => {
                                      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                                      const audioUrl = URL.createObjectURL(audioBlob);
                                      const duration = Math.floor((Date.now() - startTime) / 1000);
                                      setRecordedAudio(audioUrl);
                                      setRecordedBlob(audioBlob);
                                      setRecordDuration(duration);
                                      stream.getTracks().forEach(track => track.stop());
                                    };
                                    
                                    recorder.start();
                                    setMediaRecorder(recorder);
                                    setIsRecording(true);
                                    toast.success('Recording...');
                                  } catch (error) {
                                    toast.error('Microphone access denied');
                                  }
                                } else {
                                  mediaRecorder?.stop();
                                  setIsRecording(false);
                                }
                              }}
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${
                                isRecording 
                                  ? 'bg-red-500 text-white animate-pulse' 
                                  : 'hover:bg-gray-200 dark:hover:bg-slate-700'
                              }`}
                              title="Voice Message"
                            >
                              <i className={`ri-mic-line text-xl ${isRecording ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}></i>
                            </button>
                            <button
                              className="w-9 h-9 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all shrink-0"
                              title="Attach"
                            >
                              <i className="ri-attachment-2 text-xl text-gray-600 dark:text-gray-400"></i>
                            </button>
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              className="flex-1 bg-transparent outline-none px-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 min-w-0"
                              placeholder="Type a message..."
                            />
                            <button
                              onClick={sendMessage}
                              disabled={!newMessage.trim()}
                              className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shrink-0"
                            >
                              <i className="ri-send-plane-fill text-lg"></i>
                            </button>
                          </div>
                        )}
                      </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 dark:from-blue-900/20 dark:to-slate-800/20 flex items-center justify-center mb-6 shadow-lg">
                  <i className="ri-message-3-line text-6xl text-sky-400 dark:text-blue-500"></i>
                </div>
                <p className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">No chat selected</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Choose a connection to start messaging</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {getInitials(req.requester.name)}
                      </div>
                      <div>
                        <p className="font-semibold">{req.requester.name}</p>
                        <p className="text-sm text-muted capitalize">{req.requester.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondRequest(req._id, true)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondRequest(req._id, false)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <p className="text-muted text-center py-8">No pending requests</p>
                )}
              </div>
            )}

      {activeTab === 'search' && (
              <div>
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => searchUsers('teacher')}
                    className="btn-primary"
                  >
                    Find Teachers
                  </button>
                  <button
                    onClick={() => searchUsers('student')}
                    className="btn-primary"
                  >
                    Find Students
                  </button>
                </div>

                <div className="space-y-4">
                  {searchResults.map((usr) => (
                    <div key={usr._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {getInitials(usr.name)}
                        </div>
                        <div>
                          <p className="font-semibold">{usr.name}</p>
                          <p className="text-sm text-muted capitalize">{usr.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => sendRequest(usr._id)}
                        className="btn-primary"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <p className="text-muted text-center py-8">Search for users to connect</p>
                  )}
                </div>
              </div>
            )}
    </div>
  );
}
