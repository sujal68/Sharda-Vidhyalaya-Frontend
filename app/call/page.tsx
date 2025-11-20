'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CallContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user');
  const callType = searchParams.get('type');
  const [callStatus, setCallStatus] = useState('Connecting...');
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let interval: any;
    
    const startCall = async () => {
      try {
        const constraints = callType === 'video' 
          ? { video: true, audio: true }
          : { audio: true };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current && callType === 'video') {
          videoRef.current.srcObject = stream;
        }
        
        setCallStatus('Connected');
        
        interval = setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
        
      } catch (error) {
        setCallStatus('Failed to connect');
      }
    };

    startCall();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-blue-600 dark:from-blue-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        {callType === 'video' && (
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-64 bg-black rounded-lg mb-4"
          />
        )}
        
        <div className="text-6xl mb-4">
          {callType === 'video' ? '📹' : '📞'}
        </div>
        
        <h2 className="h3 mb-2">{callStatus}</h2>
        <p className="text-2xl font-mono text-sky-600 dark:text-blue-400 mb-6">
          {formatTime(duration)}
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-2xl shadow-lg"
          >
            📵
          </button>
          
          <button
            onClick={() => {
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
              }
            }}
            className="w-16 h-16 rounded-full glass hover:bg-white/80 dark:hover:bg-slate-800/80 flex items-center justify-center text-2xl"
          >
            🎤
          </button>
          
          {callType === 'video' && (
            <button
              onClick={() => {
                if (videoRef.current?.srcObject) {
                  const stream = videoRef.current.srcObject as MediaStream;
                  stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
                }
              }}
              className="w-16 h-16 rounded-full glass hover:bg-white/80 dark:hover:bg-slate-800/80 flex items-center justify-center text-2xl"
            >
              📹
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-500 to-blue-600 dark:from-blue-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <CallContent />
    </Suspense>
  );
}
