import { useEffect, useRef, useState } from "react";
import "../styles/modeLobby.css";

const modeDetails = {
  classic: {
    title: "CLASSIC MODE",
    fruit: "🍉",
    description: "Slice fruit. Avoid bombs. Chase your high score.",
  },
  zen: {
    title: "ZEN MODE",
    fruit: "🍋",
    description: "Relax, find your rhythm, and enjoy the flow.",
  },
  arcade: {
    title: "ARCADE MODE",
    fruit: "🍌",
    description: "Move fast and score as many points as possible.",
  },
  theme: {
    title: "GAME THEME",
    fruit: "🍍",
    description: "Enter a colorful fruit-slicing adventure.",
  },
};

function ModeLobby({ mode = "classic", soundOn = true, onBack, onStartGame }) {
  const playFruitRef = useRef(null);
  const pointerRef = useRef(null);
  const lastPointRef = useRef(null);
  const swishAudioRef = useRef(null);
  const sliceAudioRef = useRef(null);
  const soundOnRef = useRef(soundOn);
  const startTimerRef = useRef(null);

  const [slicing, setSlicing] = useState(false);
  const [sliceLine, setSliceLine] = useState(null);
  const [activePanel, setActivePanel] = useState("");
  const [notice, setNotice] = useState("");

  const details = modeDetails[mode] || modeDetails.classic;

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    const swish = new Audio("/sounds/sword-swish.mp3");
    swish.preload = "auto";
    swish.volume = 0.35;

    const slice = new Audio("/sounds/fruit-slice.wav");
    slice.preload = "auto";
    slice.volume = 0.75;

    swishAudioRef.current = swish;
    sliceAudioRef.current = slice;

    return () => {
      swish.pause();
      slice.pause();

      swishAudioRef.current = null;
      sliceAudioRef.current = null;

      if (startTimerRef.current) {
        clearTimeout(startTimerRef.current);
      }
    };
  }, []);

  function playSound(audioRef, volume) {
    if (!soundOnRef.current || !audioRef.current) return;

    const sound = audioRef.current.cloneNode();
    sound.volume = volume;
    sound.currentTime = 0;

    sound.play().catch(() => {
      // The browser may block audio until the first user interaction.
    });
  }

  function pointInsideFruit(x, y) {
    const fruit = playFruitRef.current;
    if (!fruit) return false;

    const rect = fruit.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.48;

    return Math.hypot(x - centerX, y - centerY) <= radius;
  }

  function handlePointerDown(event) {
    if (slicing || activePanel) return;

    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      hasMoved: false,
      hitFruit: pointInsideFruit(event.clientX, event.clientY),
    };

    lastPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    };
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current;

    if (!pointer || pointer.id !== event.pointerId || slicing) return;

    const previous = lastPointRef.current;
    if (!previous) return;

    const current = {
      x: event.clientX,
      y: event.clientY,
    };

    const distanceFromStart = Math.hypot(
      current.x - pointer.startX,
      current.y - pointer.startY,
    );

    if (distanceFromStart < 8) return;

    pointer.hasMoved = true;

    const crossedFruit =
      pointer.hitFruit ||
      pointInsideFruit(previous.x, previous.y) ||
      pointInsideFruit(current.x, current.y);

    if (crossedFruit) {
      playSound(swishAudioRef, 0.35);
      setSliceLine({
        x1: previous.x,
        y1: previous.y,
        x2: current.x,
        y2: current.y,
      });
    }

    pointer.hitFruit = crossedFruit;
    pointer.lastX = current.x;
    pointer.lastY = current.y;
    lastPointRef.current = current;
  }

  function handlePointerUp(event) {
    const pointer = pointerRef.current;

    if (!pointer || pointer.id !== event.pointerId) return;

    const crossedFruit =
      pointer.hitFruit || pointInsideFruit(event.clientX, event.clientY);

    const travelled = Math.hypot(
      event.clientX - pointer.startX,
      event.clientY - pointer.startY,
    );

    pointerRef.current = null;
    lastPointRef.current = null;

    if (!pointer.hasMoved || !crossedFruit || travelled < 12) {
      setSliceLine(null);
      return;
    }

    setSlicing(true);
    playSound(sliceAudioRef, 0.75);

    startTimerRef.current = setTimeout(() => {
      onStartGame?.();
    }, 550);
  }

  function handlePointerCancel() {
    pointerRef.current = null;
    lastPointRef.current = null;
    setSliceLine(null);
  }

  function handlePanel(panel) {
    setActivePanel((current) => (current === panel ? "" : panel));
    setNotice("");
  }

  return (
    <section
      className="mode-lobby"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={(event) => {
        if (pointerRef.current && event.pointerType === "mouse") {
          handlePointerCancel();
        }
      }}
    >
      <div className="lobby-particles" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ "--particle-index": index }} />
        ))}
      </div>

      <header className="lobby-header">
        <button type="button" className="lobby-back" onClick={onBack}>
          ← GAME HOME
        </button>

        <div className="lobby-brand">
          <span>✦</span> SLICE STORM
        </div>

        <div className="lobby-player">
          <span>⭐</span> LEVEL 1
        </div>
      </header>

      <nav className="lobby-navigation" aria-label="Game lobby">
        <button
          type="button"
          className={activePanel === "missions" ? "active" : ""}
          onClick={() => handlePanel("missions")}
        >
          <span>🎯</span>
          MISSIONS
        </button>

        <button
          type="button"
          className={activePanel === "leaderboard" ? "active" : ""}
          onClick={() => handlePanel("leaderboard")}
        >
          <span>🏆</span>
          LEADERBOARD
        </button>
      </nav>

      <main className="lobby-content">
        <p className="lobby-eyebrow">YOUR ARENA AWAITS</p>

        <h1 className="lobby-title">{details.title}</h1>

        <p className="lobby-description">{details.description}</p>

        {activePanel && (
          <section className="lobby-info-panel">
            <button
              type="button"
              className="lobby-panel-close"
              onClick={() => setActivePanel("")}
              aria-label="Close panel"
            >
              ×
            </button>

            {activePanel === "missions" ? (
              <>
                <h2>DAILY MISSIONS</h2>
                <p>Slice 10 fruits — Progress: 0/10</p>
                <p>Reach a score of 50 — Progress: 0/50</p>
                <p className="lobby-panel-note">
                  Mission progress tracking will be added with gameplay data.
                </p>
              </>
            ) : (
              <>
                <h2>LEADERBOARD</h2>
                <p>Leaderboard is ready for player scores.</p>
                <p className="lobby-panel-note">
                  Online rankings require score storage and a backend.
                </p>
              </>
            )}
          </section>
        )}

        <div className={`lobby-play-area ${slicing ? "is-slicing" : ""}`}>
          <div className="lobby-fruit-glow" />

          <button
            ref={playFruitRef}
            type="button"
            className="lobby-play-fruit"
            aria-label="Swipe across the Play fruit to start the game"
            onClick={() => {
              setNotice("Swipe across the fruit to start!");
            }}
          >
            {slicing ? (
              <>
                <span className="play-fruit-half left">{details.fruit}</span>
                <span className="play-fruit-half right">{details.fruit}</span>
              </>
            ) : (
              <span>{details.fruit}</span>
            )}
          </button>

          {sliceLine && (
            <svg className="lobby-slice-overlay" aria-hidden="true">
              <line
                x1={sliceLine.x1}
                y1={sliceLine.y1}
                x2={sliceLine.x2}
                y2={sliceLine.y2}
              />
            </svg>
          )}
        </div>

        <p className="lobby-swipe-prompt">
          {slicing
            ? "ENTERING THE ARENA..."
            : "SWIPE THROUGH THE FRUIT TO PLAY"}
        </p>

        {notice && (
          <p className="lobby-notice" role="status">
            {notice}
          </p>
        )}

        <p className="lobby-footer-text">
          ✦ TRUST YOUR REFLEXES · OWN THE ARENA ✦
        </p>
      </main>
    </section>
  );
}

export default ModeLobby;
