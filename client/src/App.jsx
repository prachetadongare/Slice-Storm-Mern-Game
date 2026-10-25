import { useState, useRef, useEffect } from "react";
import GameMenu from "./components/GameMenu";
import AuthPage from "./components/AuthPage";
import GameCanvas from "./components/GameCanvas";
import SplashScreen from "./components/SplashScreen";
import "./styles/global.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [gameStarted, setGameStarted] = useState(false);
  const [mode, setMode] = useState("classic");
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);
  const [showAuth, setShowAuth] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const audioContextRef = useRef(null);
  const pointerRef = useRef(null);
  const lastSoundTimeRef = useRef(0);

  // Temporary loading animation.
  useEffect(() => {
    const startTime = performance.now();
    const loadingDuration = 3000;
    let animationFrame;

    function updateProgress(now) {
      const elapsed = now - startTime;
      const nextProgress = Math.min(
        100,
        Math.floor((elapsed / loadingDuration) * 100),
      );

      setProgress(nextProgress);

      if (nextProgress >= 100) {
        setLoading(false);
      } else {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    }

    animationFrame = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  // Play slicing sound only while a pointer is being dragged.
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

      // Unlock audio during the user's direct gesture, but play no sound.
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
          console.error("Could not initialize audio:", error);
        }
      }
    }

    function handlePointerMove(event) {
      const pointer = pointerRef.current;

      if (!pointer || pointer.id !== event.pointerId || !soundOn) {
        return;
      }

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
        console.error("Slicing sound failed:", error);
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

    function handleWindowBlur() {
      pointerRef.current = null;
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", handleWindowBlur);
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

  function handleStartGame() {
    setShowAuth(true);
  }

  function handleAuthenticated(user) {
    setAuthenticatedUser(user);
    setShowAuth(false);
    setScore(0);
    setGameStarted(true);
  }

  function handleBackToMenu() {
    setGameStarted(false);
  }

  // The splash screen appears before the menu or gameplay.
  if (loading) {
    return <SplashScreen progress={progress} />;
  }

  return (
    <main className="app">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Slice Storm home">
          <span className="brand-icon">✦</span>
          SLICE STORM
        </a>

        <span className="topbar-label">FRUIT SLICING ARCADE</span>
      </header>

      {gameStarted ? (
        <section className="game-screen">
          <div className="game-toolbar">
            <button
              type="button"
              className="back-button"
              onClick={handleBackToMenu}
            >
              ← Main Menu
            </button>

            <span className="mode-badge">{mode.toUpperCase()} MODE</span>

            <span className="score-placeholder">
              SCORE <strong>{score}</strong>
            </span>
          </div>

          <GameCanvas onScoreChange={setScore} soundOn={soundOn} />

          <p className="game-hint">
            {authenticatedUser
              ? `Ready to play, ${authenticatedUser.username}!`
              : "Your game arena is ready."}
          </p>
        </section>
      ) : showAuth ? (
        <AuthPage
          onBack={() => setShowAuth(false)}
          onAuthenticated={handleAuthenticated}
        />
      ) : (
        <GameMenu
          onStart={handleStartGame}
          mode={mode}
          setMode={setMode}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
        />
      )}

      <footer className="app-footer">
        SLICE STORM <span>•</span> BUILT FOR ARCADE LOVERS
      </footer>
    </main>
  );
}

export default App;
