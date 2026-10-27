import { useState, useEffect } from "react";
import GameMenu from "./components/GameMenu";
import GameCanvas from "./components/GameCanvas";
import SplashScreen from "./components/SplashScreen";
import AuthPage from "./components/AuthPage";
import GameHome from "./components/GameHome";
import ModeLobby from "./components/ModeLobby";
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
    if (["home", "lobby", "game"].includes(savedPage)) {
      return savedPage;
    }

    return "home";
  }

  return savedPage === "auth" ? "auth" : "menu";
}

function App() {
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

  // Persist the current page.
  useEffect(() => {
    localStorage.setItem("sliceStormPage", page);
  }, [page]);

  // Persist the selected game mode.
  useEffect(() => {
    localStorage.setItem("sliceStormMode", mode);
  }, [mode]);

  // Show the splash screen only on the first visit.
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

  function handleAuthenticated(authenticatedUser) {
    setUser(authenticatedUser);
    setPage("home");
  }

  function handleLogout() {
    localStorage.removeItem("sliceStormToken");
    localStorage.removeItem("sliceStormUser");
    localStorage.removeItem("sliceStormPage");

    setUser(null);
    setScore(0);
    setPage("auth");
  }

  // Called after the user successfully slices a mode fruit.
  function handlePlayMode(selectedMode) {
    setMode(selectedMode);
    setScore(0);
    setPage("lobby");
  }

  // Called after the user slices the Play fruit in the lobby.
  function handleStartGame() {
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
        <GameHome
          user={user}
          onPlay={handlePlayMode}
          onLogout={handleLogout}
          soundOn={soundOn}
        />
      )}

      {page === "lobby" && (
        <ModeLobby
          mode={mode}
          soundOn={soundOn}
          onBack={() => setPage("home")}
          onStartGame={handleStartGame}
        />
      )}

      {page === "game" && (
        <section className="game-screen">
          <div className="game-toolbar">
            <button
              type="button"
              className="back-button"
              onClick={() => setPage("lobby")}
            >
              ← Mode Lobby
            </button>

            <span className="mode-badge">{mode.toUpperCase()} MODE</span>

            <span className="score-placeholder">
              SCORE <strong>{score}</strong>
            </span>
          </div>

          <GameCanvas onScoreChange={setScore} soundOn={soundOn} mode={mode} />

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
