// src/components/AutoScrollCommunityFeed.tsx
import React, { useRef, useEffect, useState } from 'react';
import IssueCard from './IssueCard';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';

interface Props {
  issues: any[];
  onSelectIssue: (issue: any) => void;
  isMobile?: boolean;
  isLoading?: boolean;
}

export const AutoScrollCommunityFeed: React.FC<Props> = ({ 
  issues, 
  onSelectIssue,
  isMobile = false,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);

  // Filter out any rejected issues strictly:
  // "visible only to the admin and not in any other spaces like community report"
  const publicIssues = issues.filter(issue => {
    const s = (issue.status || '').toLowerCase();
    return !s.includes('reject');
  });

  const restartToTop = () => {
    const container = containerRef.current;
    if (!container) return;
    setIsRestarting(true);
    container.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      if (container) container.scrollTop = 0;
      setIsRestarting(false);
    }, 1200);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || publicIssues.length === 0) return;

    let animationFrameId: number;
    let scrollSpeed = 0.65; // Smooth reading speed
    let resetting = false;
    let pauseTimer: ReturnType<typeof setTimeout> | null = null;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const step = () => {
      // Pause if manually paused, user is hovering/touching, or currently looping back to top
      if (!isPaused && !isHovered && !resetting && container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        
        if (maxScroll > 10) {
          // Reached the end (with 3px buffer)
          if (container.scrollTop >= maxScroll - 3) {
            resetting = true;
            setIsRestarting(true);

            // 1. Pause at the bottom so citizen can view the last card
            pauseTimer = setTimeout(() => {
              if (!container) return;

              // 2. Smoothly scroll back to the top
              container.scrollTo({ top: 0, behavior: 'smooth' });

              // 3. Pause briefly at the top (1.2s) before resuming downward auto-scroll automatically
              resumeTimer = setTimeout(() => {
                if (container) {
                  container.scrollTop = 0;
                }
                resetting = false;
                setIsRestarting(false);
              }, 1200);
            }, 1800);
          } else {
            container.scrollTop += scrollSpeed;
          }
        }
      }

      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (pauseTimer) clearTimeout(pauseTimer);
      if (resumeTimer) clearTimeout(resumeTimer);
    };
  }, [isPaused, isHovered, publicIssues.length]);

  if (publicIssues.length === 0) {
    if (isLoading) {
      return (
        <div className="p-4 space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-700/60 rounded w-1/3" />
                <div className="h-4 bg-slate-700/40 rounded w-16" />
              </div>
              <div className="h-3 bg-slate-700/40 rounded w-3/4" />
              <div className="h-3 bg-slate-700/30 rounded w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className="text-center py-12 px-4 text-slate-500 text-xs">
        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
        No active community reports right now.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      
      {/* Auto-scroll banner bar */}
      <div className="px-4 py-2 border-b border-slate-800/50 bg-slate-950/40 flex items-center justify-between text-[11px] select-none shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 font-medium">
          <span className="relative flex h-2 w-2">
            {!isPaused && !isHovered && !isRestarting && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isRestarting 
                ? 'bg-amber-400' 
                : !isPaused && !isHovered 
                  ? 'bg-blue-500' 
                  : 'bg-slate-600'
            }`}></span>
          </span>
          <span className="text-slate-400">
            {isRestarting 
              ? 'Restarting from top...' 
              : !isPaused && !isHovered 
                ? 'Auto-scrolling' 
                : isHovered 
                  ? 'Paused on hover' 
                  : 'Paused'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={restartToTop}
            className="p-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
            title="Restart scroll from top"
          >
            <RotateCcw className="w-2.5 h-2.5 text-blue-400" />
            <span>Top</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
            title={isPaused ? "Resume auto-scroll" : "Pause auto-scroll"}
          >
            {isPaused ? (
              <>
                <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auto-scrolling feed container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 scroll-smooth custom-scrollbar"
      >
        {publicIssues.map((issue) => (
          <IssueCard 
            key={issue.id} 
            issue={issue} 
            onClick={() => onSelectIssue(issue)} 
            compact={true} 
          />
        ))}
      </div>

    </div>
  );
};

export default AutoScrollCommunityFeed;
