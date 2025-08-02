import { CloudRain, Flame, Zap } from "lucide-react";
import { useEffect } from "react";
import SoundPlayer from "../features/sound-control/components/SoundPlayer";
import { useSoundStore } from "../features/sound-control/store/soundStore";

export default function Home() {
  const sounds = [
    { file: "/sounds/rain.mp3", label: "Chuva", icon: <CloudRain /> },
    { file: "/sounds/thunder.wav", label: "Trovão", icon: <Zap /> },
    { file: "/sounds/bonfire.wav", label: "Fogueira", icon: <Flame /> },
    // { file: "/sounds/ruido-marrom.wav", label: "Ruído Marrom", icon: <Waves /> },
  ];

  const { loadState, playAll, pauseAll } = useSoundStore();

  useEffect(() => {
    loadState(sounds.map((s) => s.file));
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">🎧 Hibiki Noise</h1>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 bg-green-500 text-white rounded-xl"
          onClick={playAll}
        >
          Play All
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-xl"
          onClick={pauseAll}
        >
          Pause All
        </button>
      </div>

      {sounds.map((s, i) => (
        <SoundPlayer key={i} file={s.file} label={s.label} icon={s.icon} />
      ))}
    </div>
  );
}
