import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, SkipForward, SkipBack, RotateCcw, RotateCw,
  Monitor, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface VideoPlayerProps {
  url?: string;
  embedCode?: string;
  title?: string;
}

export default function VideoPlayer({ url, embedCode, title }: VideoPlayerProps) {
  const { user } = useAuth();
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showBypass, setShowBypass] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [watermarkPos, setWatermarkPos] = useState({ top: 25, left: 30 });
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic anti-piracy watermark shifting every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 60) + 15,
        left: Math.floor(Math.random() * 55) + 15,
      });
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsReady(false);
    setError(null);
    setShowBypass(false);
    setBuffering(false);
    setPlaying(false); // Reset playing state on URL change
    
    console.log("VideoPlayer loading URL:", url);

    // Fallback: if video doesn't signal ready in 8 seconds, force ready state
    const timer = setTimeout(() => {
      if (!isReady && !error) {
        console.log("Video Player: Ready timeout fallback triggered");
        setIsReady(true);
      }
    }, 8000);

    // Show bypass button after 4 seconds
    const bypassTimer = setTimeout(() => {
      if (!isReady && !error) {
        setShowBypass(true);
      }
    }, 4000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(bypassTimer);
    };
  }, [url]);

  const handlePlayPause = () => setPlaying(!playing);
  const handleToggleMute = () => setMuted(!muted);
  
  const handleProgress = (state: any) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (value: number | readonly number[]) => {
    const numValue = Array.isArray(value) ? value[0] : value;
    setPlayed(numValue);
    playerRef.current?.seekTo(numValue);
  };

  const handleFullscreen = () => {
    if (containerRef.current?.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const getCorrectUrl = (u: string) => {
    if (!u) return '';
    let trimmed = u.trim();
    
    // Handle YouTube IDs
    if (trimmed.length === 11 && !trimmed.includes('/') && !trimmed.includes('.') && !trimmed.includes(':')) {
      return `https://www.youtube.com/watch?v=${trimmed}`;
    }
    
    // Handle local paths - ensure they are absolute
    if (trimmed.startsWith('/') && typeof window !== 'undefined') {
      return window.location.origin + trimmed;
    }
    
    return trimmed;
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  if (embedCode && embedCode.trim() !== '') {
    return (
      <div 
        className="relative group bg-black rounded-[2rem] overflow-hidden shadow-2xl aspect-video"
      >
        <div 
          className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-none"
          dangerouslySetInnerHTML={{ __html: embedCode }}
        />
      </div>
    );
  }

  if (!url || url.trim() === '') {
    return (
      <div className="relative aspect-video bg-slate-900 rounded-[2rem] flex flex-col items-center justify-center text-white p-8 text-center border border-slate-800">
        <div className="h-20 w-20 bg-brand-500/20 rounded-full flex items-center justify-center mb-6">
          <Monitor className="h-10 w-10 text-brand-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2 font-heading">No Video Available</h3>
        <p className="text-slate-400 max-w-sm">
          This lesson doesn't have a video attached yet. Please check back later or contact your instructor.
        </p>
      </div>
    );
  }

  const finalUrl = getCorrectUrl(url);

  return (
    <div 
      ref={containerRef}
      className="relative group bg-black rounded-[2rem] overflow-hidden shadow-2xl aspect-video select-none"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* DRM Anti-Piracy Floating Watermark */}
      <div 
        className="absolute pointer-events-none select-none z-30 transition-all duration-1000 ease-out font-mono text-[11px] font-bold text-white/25 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-wider"
        style={{
          top: `${watermarkPos.top}%`,
          left: `${watermarkPos.left}%`,
        }}
      >
        EduVision • {user?.email || 'student@eduvision.com'} • ID:{user?.id || 1}
      </div>

      {/* Persistent DRM Security Badge */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-slate-300">
        <ShieldCheck className="h-3 w-3 text-emerald-400" />
        <span>DRM Shield Active</span>
      </div>
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <RotateCcw className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Video Playback Error</h3>
          <p className="text-slate-400 text-sm max-w-md mb-6">
            {error}
          </p>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-700 text-white hover:bg-white/10"
              onClick={() => {
                setError(null);
                setIsReady(false);
                setPlaying(true);
              }}
            >
              Try Again
            </Button>
            <Button 
              className="rounded-xl bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => window.open(finalUrl, '_blank')}
            >
              Open in New Tab
            </Button>
          </div>
        </div>
      ) : (
        <ReactPlayer
          key={finalUrl}
          ref={playerRef}
          {...({
            url: finalUrl,
            width: "100%",
            height: "100%",
            playing: playing,
            volume: volume,
            muted: muted,
            playbackRate: playbackRate,
            playsinline: true,
            onReady: () => {
              console.log("Video Player Ready");
              setIsReady(true);
              setError(null);
            },
            onStart: () => {
              console.log("Video Player Started");
              setIsReady(true);
            },
            onPlay: () => {
              setPlaying(true);
              setBuffering(false);
            },
            onPause: () => setPlaying(false),
            onBuffer: () => setBuffering(true),
            onBufferEnd: () => setBuffering(false),
            onProgress: handleProgress,
            onDuration: (d: number) => {
              setDuration(d);
              setIsReady(true);
            },
            onError: (e: any) => {
              console.error("Video Player Error:", e);
              setError("We couldn't load this video. It might be restricted, the URL might be invalid, or the format is not supported.");
              setIsReady(true);
            },
            config: {
              youtube: { 
                playerVars: {
                  rel: 0,
                  playsinline: 1,
                  modestbranding: 1,
                  autoplay: 0,
                  iv_load_policy: 3,
                  origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                  enablejsapi: 1
                }
              },
              file: {
                attributes: {
                  controlsList: 'nodownload',
                  playsInline: true,
                  crossOrigin: "anonymous",
                  style: { width: '100%', height: '100%', objectFit: 'contain' }
                }
              }
            }
          } as any)}
        />
      )}

      {/* Loading Spinner / Buffering */}
      {(!isReady || buffering) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
          {!isReady && showBypass && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white bg-black/20 hover:bg-black/40 rounded-xl"
              onClick={() => setIsReady(true)}
            >
              Taking too long? Click to play anyway
            </Button>
          )}
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 flex flex-col justify-between p-6 z-20",
        showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold font-heading truncate max-w-[70%]">
            {title || 'Course Lesson'}
          </h3>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 backdrop-blur-md border-none text-white">
              HD
            </Badge>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-xl">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {!playing && isReady && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-20 w-20 bg-brand-600 text-white rounded-full flex items-center justify-center shadow-2xl pointer-events-auto hover:bg-brand-700 transition-colors"
              onClick={handlePlayPause}
            >
              <Play className="h-10 w-10 fill-current ml-1" />
            </motion.button>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="space-y-4">
          {/* Progress Slider */}
          <div className="px-2">
            <Slider
              value={[played]}
              max={1}
              step={0.001}
              onValueChange={handleSeekChange}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePlayPause}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
              </Button>

              <div className="flex items-center gap-2 group/volume">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleToggleMute}
                  className="text-white hover:bg-white/10 rounded-xl"
                >
                  {muted || volume === 0 ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
                </Button>
                <div className="w-0 group-hover/volume:w-24 transition-all overflow-hidden">
                  <Slider
                    value={[muted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={(val) => setVolume(Array.isArray(val) ? val[0] : val)}
                    className="w-24"
                  />
                </div>
              </div>

              <div className="text-white text-sm font-medium tabular-nums">
                {formatTime(played * duration)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select 
                className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer hover:bg-white/10 p-1 rounded"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              >
                <option value="0.5" className="bg-slate-900">0.5x</option>
                <option value="1" className="bg-slate-900">1.0x</option>
                <option value="1.5" className="bg-slate-900">1.5x</option>
                <option value="2" className="bg-slate-900">2.0x</option>
              </select>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleFullscreen}
                className="text-white hover:bg-white/10 rounded-xl"
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", className)}>
      {children}
    </span>
  );
}
