'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';

export default function Messages() {
  const { user } = useAuthStore();
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
  const [audioDurations, setAudioDurations] = useState<{[key: string]: number}>({});

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

  return (
    <div className="container-12">
      <div className="grid-12">
        <div className="col-12">
          <div className="card">
            <h1 className="h3 mb-6">Messages</h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-slate-700">
              <button
                onClick={() => setActiveTab('chats')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'chats'
                    ? 'text-sky-500 dark:text-blue-400 border-b-2 border-sky-500 dark:border-blue-400'
                    : 'text-muted'
                }`}
              >
                💬 Chats
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'requests'
                    ? 'text-sky-500 dark:text-blue-400 border-b-2 border-sky-500 dark:border-blue-400'
                    : 'text-muted'
                }`}
              >
                📩 Requests {requests.length > 0 && `(${requests.length})`}
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 font-semibold transition-colors ${
                  activeTab === 'search'
                    ? 'text-sky-500 dark:text-blue-400 border-b-2 border-sky-500 dark:border-blue-400'
                    : 'text-muted'
                }`}
              >
                🔍 Connect
              </button>
            </div>

            {/* Chats Tab */}
            {activeTab === 'chats' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
                {/* Connections List */}
                <div className="border-r border-gray-200 dark:border-slate-700 pr-4 overflow-y-auto">
                  <h3 className="font-semibold mb-4">Your Connections</h3>
                  {connections.map((conn) => (
                    <div
                      key={conn._id}
                      onClick={() => {
                        setSelectedUser(conn);
                        fetchMessages(conn._id);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                        selectedUser?._id === conn._id
                          ? 'bg-sky-100 dark:bg-blue-900'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {getInitials(conn.name)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{conn.name}</p>
                        <p className="text-xs text-muted capitalize">{conn.role}</p>
                      </div>
                      {conn.unreadCount > 0 && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                          {conn.unreadCount}
                        </div>
                      )}
                    </div>
                  ))}
                  {connections.length === 0 && (
                    <p className="text-muted text-center py-8">No connections yet</p>
                  )}
                </div>

                {/* Chat Area */}
                <div className="col-span-2 flex flex-col">
                  {selectedUser ? (
                    <>
                      {/* Chat Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold">
                            {getInitials(selectedUser.name)}
                          </div>
                          <div>
                            <p className="font-semibold">{selectedUser.name}</p>
                            <p className="text-xs text-muted capitalize">{selectedUser.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                            📞
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
                            📹
                          </button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto py-4 space-y-3 max-h-[450px] scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
                        {messages.map((msg) => (
                          <div
                            key={msg._id}
                            className={`flex ${msg.sender === user?.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                msg.sender === user?.id
                                  ? 'bg-sky-500 dark:bg-blue-700 text-white'
                                  : 'bg-gray-200 dark:bg-slate-700'
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
                                    {playingAudio === msg._id ? '⏸️' : '▶️'}
                                  </button>
                                  <div className="flex-1 flex items-center gap-0.5 h-8">
                                    {[...Array(20)].map((_, i) => (
                                      <div
                                        key={i}
                                        className="w-1 bg-white/40 rounded-full transition-all"
                                        style={{
                                          height: `${Math.random() * 100 + 20}%`,
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
                              {msg.sender === user?.id && (
                                <div className="text-xs mt-1 flex items-center justify-end gap-1">
                                  <span className="opacity-70">
                                    {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span>{msg.isRead ? '✓✓' : '✓'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input */}
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        {recordedAudio ? (
                          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-800 rounded-lg p-2">
                            <button
                              onClick={() => {
                                const audio = new Audio(recordedAudio);
                                audio.play();
                              }}
                              className="w-8 h-8 rounded-full bg-sky-500 dark:bg-blue-700 text-white flex items-center justify-center"
                            >
                              ▶️
                            </button>
                            <div className="flex-1 h-8 bg-sky-200 dark:bg-blue-900 rounded-full flex items-center px-2">
                              <div className="text-xs text-muted">🎤 Voice message - {recordDuration}s</div>
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
                              ✔️
                            </button>
                            <button
                              onClick={() => {
                                setRecordedAudio(null);
                                setRecordedBlob(null);
                                toast.success('Deleted');
                              }}
                              className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
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
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                                isRecording 
                                  ? 'bg-red-500 text-white animate-pulse' 
                                  : 'glass hover:bg-sky-100 dark:hover:bg-blue-900'
                              }`}
                              title="Voice Message"
                            >
                              🎤
                            </button>
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                              className="input flex-1"
                              placeholder="Type a message..."
                            />
                            <button
                              onClick={sendMessage}
                              className="w-10 h-10 rounded-full bg-sky-500 dark:bg-blue-700 text-white flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              ✈️
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted">
                      Select a connection to start chatting
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Requests Tab */}
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

            {/* Search Tab */}
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
        </div>
      </div>
    </div>
  );
}
