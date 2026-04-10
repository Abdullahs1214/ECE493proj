import EntryContainer from "./containers/EntryContainer";
import { useAmbientMusic } from "./hooks/useAmbientMusic";

export default function App() {
  const { playing, toggle } = useAmbientMusic();

  return (
    <main className="app-shell">
      <EntryContainer />

      <button
        type="button"
        onClick={toggle}
        title={playing ? "Mute music" : "Play music"}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          border: "none",
          background: playing ? "rgba(18,33,44,0.85)" : "rgba(18,33,44,0.4)",
          color: "#f8fbfc",
          fontSize: "1.2rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(6px)",
          transition: "background 0.3s",
          zIndex: 9999,
        }}
        aria-label={playing ? "Mute music" : "Play music"}
      >
        {playing ? "🔊" : "🔇"}
      </button>
    </main>
  );
}
