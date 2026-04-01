import { useEffect, useState } from "react";

import EntryContainer from "./containers/EntryContainer";
import { getHealth } from "./services/apiClient";

type HealthState = "idle" | "loading" | "ok" | "error";

export default function App() {
  const [healthState, setHealthState] = useState<HealthState>("loading");

  useEffect(() => {
    let active = true;

    getHealth()
      .then(() => {
        if (active) {
          setHealthState("ok");
        }
      })
      .catch(() => {
        if (active) {
          setHealthState("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="status-card">
        <p className="eyebrow">Blend Colour Game</p>
        <h1>Foundation Scaffold</h1>
        <p>This frontend performs a minimal backend health check.</p>
        <p aria-live="polite">Backend status: {healthState}</p>
      </section>
      <EntryContainer />
    </main>
  );
}
