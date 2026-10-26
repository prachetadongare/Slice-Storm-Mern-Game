import { useState, useRef, useEffect } from "react";
import GameMenu from "./components/GameMenu";
import GameCanvas from "./components/GameCanvas";
import SplashScreen from "./components/SplashScreen";
import AuthPage from "./components/AuthPage";
import GameHome from "./components/GameHome";
import "./styles/global.css";

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("sliceStormUser")) || null;
  } catch {
    return null;
  }
}

function getInitialPage() {
  const token = localStorage.getItem("sliceStormToken");
  const savedUser = getSavedUser();
  const savedPage = localStorage.getItem("sliceStormPage");

  if (token && savedUser) {
    if (["home", "game", "auth"].includes(savedPage)) {
      return savedPage;
    }
    return "home";
  }

  // Never restore a protected page without a saved login.
  return savedPage === "auth" ? "auth" : "menu";
}

function App() {
  // Show the splash screen only on the first visit to this app.
  const [loading, setLoading] = useState(
    () => localStorage.getItem("sliceStormHasLoaded") !== "true",
  );
  const [progress, setProgress] = useState(0);

  const [page, setPage] = useState(getInitialPage);
  const [mode, setMode] = useState(
    () => localStorage.getItem("sliceStormMode") || "classic",
  );
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);
  const [user, setUser] = useState(getSavedUser);

  const audioContextRef = useRef(null);
  const pointerRef = useRef(null);
  const lastSoundTimeRef = useRef(0);

  // Save the current page whenever navigation changes.
  useEffect(() => {
    localStorage.setItem("sliceStormPage", page);
  }, [page]);

  // Save the selected game mode.
  useEffect(() => {
    localStorage.setItem("sliceStormMode", mode);
  }, [mode]);

  // Splash screen progress.
  useEffect(() => {
    if (!loading) return;

    const startTime = performance.now();
    const loadingDuration = 3000;
    let animationFrame;

    function updateProgress(now) {
      const next = Math.min(
        100,
        Math.floor(((now - startTime) / loadingDuration) * 100),
      );

      setProgress(next);

      if (next >= 100) {
        localStorage.setItem("sliceStormHasLoaded", "true");
        setLoading(false);
      } else {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    }

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, [loading]);

  // App-wide swipe sound.
  useEffect(() => {
    function handlePointerDown(event) {
      pointerRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        hasMoved: false,
      };

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (soundOn && AudioContextClass) {
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
          }

          if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().catch(() => {});
          }
        } catch (error) {
          console.error("Audio initialization failed:", error);
        }
      }
    }

    function handlePointerMove(event) {
      const pointer = pointerRef.current;

      if (!pointer || pointer.id !== event.pointerId || !soundOn) return;

      const dx = event.clientX - pointer.lastX;
      const dy = event.clientY - pointer.lastY;

      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;

      if (!pointer.hasMoved) {
        if (
          Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) < 6
        ) {
          return;
        }

        pointer.hasMoved = true;
      }

      if (dx === 0 && dy === 0) return;

      const audio = audioContextRef.current;
      if (!audio || audio.state !== "running") return;

      const now = audio.currentTime;

      if (now - lastSoundTimeRef.current < 0.065) return;
      lastSoundTimeRef.current = now;

      try {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();

        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(1000, now);
        oscillator.frequency.exponentialRampToValueAtTime(250, now + 0.065);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

        oscillator.connect(gain);
        gain.connect(audio.destination);

        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };

        oscillator.start(now);
        oscillator.stop(now + 0.075);
      } catch (error) {
        console.error("Swipe sound failed:", error);
      }
    }

    function handlePointerUp(event) {
      if (
        pointerRef.current &&
        (event.pointerId === undefined ||
          pointerRef.current.id === event.pointerId)
      ) {
        pointerRef.current = null;
      }
    }

    function handleBlur() {
      pointerRef.current = null;
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [soundOn]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, []);

  function handleAuthenticated(authenticatedUser) {
    // AuthPage saves the token and user before calling this function.
    setUser(authenticatedUser);
    setPage("home");
  }

  function handleLogout() {
    // Clear saved authentication and user-specific navigation.
    localStorage.removeItem("sliceStormToken");
    localStorage.removeItem("sliceStormUser");
    localStorage.removeItem("sliceStormPage");

    setUser(null);
    setScore(0);
    setPage("auth");
  }

  function handlePlayMode(selectedMode) {
    setMode(selectedMode);
    setScore(0);
    setPage("game");
  }

  if (loading) {
    return <SplashScreen progress={progress} />;
  }

  return (
    <main className="app">
      <header className="topbar">
        <a
          className="brand"
          href="/"
          aria-label="Slice Storm home"
          onClick={(event) => {
            event.preventDefault();
            setPage(user ? "home" : "menu");
          }}
        >
          <span className="brand-icon">✦</span>
          SLICE STORM
        </a>

        <span className="topbar-label">FRUIT SLICING ARCADE</span>
      </header>

      {page === "menu" && (
        <GameMenu
          onStart={() => setPage("auth")}
          mode={mode}
          setMode={setMode}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
        />
      )}

      {page === "auth" && (
        <AuthPage
          onAuthenticated={handleAuthenticated}
          onBack={() => setPage(user ? "home" : "menu")}
        />
      )}

      {page === "home" && (
        <GameHome user={user} onPlay={handlePlayMode} onLogout={handleLogout} />
      )}

      {page === "game" && (
        <section className="game-screen">
          <div className="game-toolbar">
            <button
              type="button"
              className="back-button"
              onClick={() => setPage("home")}
            >
              ← Game Home
            </button>

            <span className="mode-badge">{mode.toUpperCase()} MODE</span>

            <span className="score-placeholder">
              SCORE <strong>{score}</strong>
            </span>
          </div>

          <GameCanvas onScoreChange={setScore} soundOn={soundOn} />

          <p className="game-hint">
            {mode === "zen"
              ? "Relax and slice at your own pace."
              : mode === "arcade"
                ? "Race against the clock for a high score."
                : mode === "theme"
                  ? "Enjoy your themed fruit-slicing adventure."
                  : "Slice the fruit. Avoid the bombs."}
          </p>
        </section>
      )}

      <footer className="app-footer">
        SLICE STORM <span>•</span> BUILT FOR ARCADE LOVERS
      </footer>
    </main>
  );
}

export default App;
