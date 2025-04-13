import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import debounce from "lodash.debounce";
import {
  fetchProgressThunk,
  saveProgressThunk,
  setVideoMetadata,
  setCurrentTime,
  setIsPlaying,
} from "../store/progressSlice";
import ProgressBar from "./ProgressBar";

const SAVE_INTERVAL_MS = 5000;
const DEBOUNCE_SAVE_MS = 1500;

const VideoPlayer = ({ videoSrc }) => {
  const videoRef = useRef(null);
  const dispatch = useDispatch();

  // --- Selectors ---
  const {
    currentVideoId,
    isLoading,
    error,
    duration,
    videoDurationFromDB,
    currentTime,
    isPlaying,
    progressPercentage,
    lastKnownPosition,
    watchedIntervals, // Select watchedIntervals for ProgressBar
  } = useSelector((state) => state.progress);

  // --- Refs ---
  const saveIntervalRef = useRef(null);
  const isSeekingRef = useRef(false);
  const initialSeekDoneRef = useRef(false);
  const isReadyRef = useRef(false);

  // --- Core Save Logic ---
  const dispatchSaveBasedOnPlayed = useCallback(() => {
    if (!videoRef.current || !currentVideoId || !isReadyRef.current) return;
    const timeRanges = videoRef.current.played;
    const playedRanges = [];
    for (let i = 0; i < timeRanges.length; i++) {
      playedRanges.push({ start: timeRanges.start(i), end: timeRanges.end(i) });
    }
    const currentVideoTime = videoRef.current.currentTime;
    const payload = {
      intervals: playedRanges,
      lastWatchedPosition: currentVideoTime,
      videoDuration:
        duration > 0 && duration !== videoDurationFromDB ? duration : undefined,
    };
    dispatch(saveProgressThunk({ videoId: currentVideoId, payload }));
  }, [currentVideoId, dispatch, duration, videoDurationFromDB]);

  // --- Debounced Save Function ---
  const debouncedEventSave = useMemo(() => {
    return debounce(dispatchSaveBasedOnPlayed, DEBOUNCE_SAVE_MS);
  }, [dispatchSaveBasedOnPlayed]);

  // --- Cleanup Debounce ---
  useEffect(() => {
    return () => debouncedEventSave.cancel();
  }, [debouncedEventSave]);

  // --- Interval Timer Management ---
  const clearSaveInterval = useCallback(() => {
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    saveIntervalRef.current = null;
  }, []);

  const startSaveInterval = useCallback(() => {
    clearSaveInterval();
    saveIntervalRef.current = setInterval(() => {
      if (
        videoRef.current &&
        !videoRef.current.paused &&
        !isSeekingRef.current &&
        isReadyRef.current
      ) {
        dispatchSaveBasedOnPlayed();
      }
    }, SAVE_INTERVAL_MS);
  }, [clearSaveInterval, dispatchSaveBasedOnPlayed]);

  // --- Effects ---
  useEffect(() => {
    // Fetch Progress
    if (currentVideoId) {
      initialSeekDoneRef.current = false;
      isReadyRef.current = false;
      dispatch(fetchProgressThunk({ videoId: currentVideoId }));
    }
    return () => clearSaveInterval();
  }, [currentVideoId, dispatch, clearSaveInterval]);

  useEffect(() => {
    // Initial Seek
    if (
      currentVideoId &&
      !isLoading &&
      duration > 0 &&
      !initialSeekDoneRef.current &&
      videoRef.current &&
      isReadyRef.current
    ) {
      const seekPosition = lastKnownPosition || 0;
      if (seekPosition > 0.1 && seekPosition < duration) {
        videoRef.current.currentTime = seekPosition;
      }
      const actualStartTime = videoRef.current.currentTime;
      dispatch(setCurrentTime(actualStartTime));
      initialSeekDoneRef.current = true;
      if (duration !== videoDurationFromDB) {
        dispatch(
          saveProgressThunk({
            videoId: currentVideoId,
            payload: {
              lastWatchedPosition: actualStartTime,
              videoDuration: duration,
            },
          })
        );
      }
    }
  }, [
    currentVideoId,
    isLoading,
    duration,
    lastKnownPosition,
    videoDurationFromDB,
    dispatch,
  ]);

  // --- Event Handlers ---
  const handleLoadedMetadata = () => {
    const videoDuration = videoRef.current.duration;
    dispatch(setVideoMetadata({ duration: videoDuration }));
    isReadyRef.current = true;
  };
  const handlePlay = () => {
    if (!isReadyRef.current) return;
    dispatch(setIsPlaying(true));
    startSaveInterval();
  };
  const handlePause = () => {
    if (!isReadyRef.current || isSeekingRef.current) return;
    dispatch(setIsPlaying(false));
    clearSaveInterval();
    debouncedEventSave();
  };
  const handleTimeUpdate = () => {
    if (!isReadyRef.current || isSeekingRef.current) return;
    dispatch(setCurrentTime(videoRef.current.currentTime));
  };
  const handleSeeking = () => {
    if (!isReadyRef.current || isSeekingRef.current) return;
    isSeekingRef.current = true;
    clearSaveInterval();
    debouncedEventSave();
  };
  const handleSeeked = () => {
    if (!isReadyRef.current) return;
    const seekedTime = videoRef.current.currentTime;
    dispatch(setCurrentTime(seekedTime));
    isSeekingRef.current = false;
    if (!videoRef.current.paused) {
      dispatch(setIsPlaying(true));
      startSaveInterval();
    } else {
      dispatch(setIsPlaying(false));
    }
  };
  const handleEnded = () => {
    if (!isReadyRef.current) return;
    dispatch(setIsPlaying(false));
    clearSaveInterval();
    debouncedEventSave();
    dispatch(setCurrentTime(videoRef.current?.duration ?? duration));
  };

  // --- Render ---
  // Loading/Error states remain the same
  if (!currentVideoId)
    return (
      <div className="text-center p-4 text-gray-500 dark:text-gray-400">
        Select a lecture to begin.
      </div>
    );
  if (isLoading && !initialSeekDoneRef.current)
    return (
      <div className="text-center p-4">
        Loading video progress for {currentVideoId}...
      </div>
    );

  return (
    // Adjusted container: slightly more padding, subtle border
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
      {error && (
        <div className="text-center p-3 my-2 bg-red-100 text-red-700 rounded-md dark:bg-red-900/30 dark:text-red-300">
          Error: {error}
        </div>
      )}
      {/* Video element container - ensure it's rounded if video itself isn't */}
      <div className="aspect-video mb-4 overflow-hidden rounded-lg">
        <video
          ref={videoRef}
          controls
          // Use width/height 100% to fill container
          width="100%"
          height="100%"
          src={videoSrc}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onEnded={handleEnded}
          onError={(e) => console.error("Video Error:", e.target.error)}
          // Removed fixed class rounding, handled by container now
        >
          Your browser does not support the video tag.
        </video>
      </div>
      {/* Progress Bar and Time Display */}
      <div className="mt-2">
        {" "}
        {/* Reduced margin slightly */}
        <ProgressBar
          intervals={watchedIntervals} // Pass intervals from Redux state
          duration={duration} // Pass duration from component state
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mt-1">
          <span>
            {new Date(currentTime * 1000).toISOString().substr(14, 5)}
          </span>
          <span>
            {duration
              ? new Date(duration * 1000).toISOString().substr(14, 5)
              : "00:00"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
