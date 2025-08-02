import { Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSoundStore } from "../store/soundStore";

interface Props {
  file: string;
  label: string;
  icon?: React.ReactNode;
}

export default function SoundPlayer({ file, label, icon }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { activeSounds, togglePlay, setVolume } = useSoundStore();

  const state = activeSounds[file] || { isPlaying: false, volume: 0.5 };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(file);
      audioRef.current.loop = true;
    }
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
      state.isPlaying ? audioRef.current.play() : audioRef.current.pause();
    }
  }, [state.isPlaying, state.volume, file]);

  return (
    <div className="flex items-center gap-4 bg-gray-100 p-3 rounded-xl shadow">
      <button onClick={() => togglePlay(file)} className="p-2 bg-white rounded-full shadow">
        {state.isPlaying ? <Pause /> : <Play />}
      </button>
      <span className="flex items-center gap-2">{icon}{label}</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={state.volume}
        onChange={(e) => setVolume(file, parseFloat(e.target.value))}
      />
    </div>
  );
}
