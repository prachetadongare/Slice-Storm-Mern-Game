import { useEffect, useRef, useState } from "react";
import "../styles/modeLobby.css";

const modeDetails = {
  classic: {
    title: "CLASSIC",
    fruit: "🍉",
    description: "Slice fruit. Avoid bombs. Beat your high score!",
  },
  zen: {
    title: "ZEN",
    fruit: "🍎",
    description: "Relax, find your rhythm, and enjoy the flow.",
  },
  arcade: {
    title: "ARCADE",
    fruit: "🍌",
    description: "Race against time and score as much as possible.",
  },
  theme: {
    title: "GAME THEME",
    fruit: "🍍",
    description: "Enter a colorful fruit-slicing adventure.",
  },
};

const missions = [
  {
    icon: "🥭",
    title: "Slice 40 Mangoes",
    progress: "40 to go!",
    reward: "75",
  },
  {
    icon: "🍉",
    title: "Slice 25 Watermelons",
    progress: "25 to go!",
    reward: "50",
  },
  {
    icon: "⭐",
    title: "Score 100 Points",
    progress: "100 to go!",
    reward: "100",
  },
];

const leaderboard = [
  { name: "Katsuro", score: "3008", avatar: "🥷" },
  { name: "Sensei", score: "2756", avatar: "👨🏻‍🍳" },
  { name: "Mari", score: "2430", avatar: "👩🏻‍🎤" },
  { name: "Rinjin", score: "1890", avatar: "🥷🏻" },
];

function ModeLobby({ mode = "classic", soundOn = true, onBack, onStartGame }) {
  const playFruitRef = useRef(null);
  const pointerRef = useRef(null);
  const lastPointRef = useRef(null);
  const swishAudioRef = useRef(null);
  const sliceAudioRef = useRef(null);
  const soundOnRef = useRef(soundOn);
  const startTimerRef = useRef(null);
  const lastSwishTimeRef = useRef(0);

  const [slicing, setSlicing] = useState(false);
  const [sliceLine, setSliceLine] = useState(null);
  const [activeMission, setActiveMission] = useState(0);
  const [activePanel, setActivePanel] = useState("");
  const [notice, setNotice] = useState("");

  const details = modeDetails[mode] || modeDetails.classic;
  const currentMission = missions[activeMission];

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

    const audio = audioRef.current.cloneNode();
    audio.volume = volume;

    audio.play().catch(() => {
      // Audio may be unavailable until browser interaction.
    });
  }

  function pointInsideFruit(x, y) {
    const fruit = playFruitRef.current;
    if (!fruit) return false;

    const rect = fruit.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // The center fruit, not the whole circular ring, is sliceable.
    const radius = Math.min(rect.width, rect.height) * 0.29;

    return Math.hypot(x - centerX, y - centerY) <= radius;
  }

  function handlePointerDown(event) {
    if (slicing || activePanel) return;

    const hitFruit = pointInsideFruit(event.clientX, event.clientY);

    pointerRef.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
      hitFruit,
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

    const movement = Math.hypot(
      current.x - pointer.startX,
      current.y - pointer.startY,
    );

    if (movement < 8) return;

    pointer.hasMoved = true;

    const crossedFruit =
      pointer.hitFruit ||
      pointInsideFruit(previous.x, previous.y) ||
      pointInsideFruit(current.x, current.y);

    // Only draw a blade trail and play the swish near the Play fruit.
    if (crossedFruit) {
      setSliceLine({
        x1: previous.x,
        y1: previous.y,
        x2: current.x,
        y2: current.y,
      });

      const now = performance.now();

      if (now - lastSwishTimeRef.current > 100) {
        lastSwishTimeRef.current = now;
        playSound(swishAudioRef, 0.35);
      }
    }

    pointer.hitFruit = crossedFruit;
    lastPointRef.current = current;
  }

  function handlePointerUp(event) {
    const pointer = pointerRef.current;

    if (!pointer || pointer.id !== event.pointerId) return;

    const crossedFruit =
      pointer.hitFruit || pointInsideFruit(event.clientX, event.clientY);

    const distance = Math.hypot(
      event.clientX - pointer.startX,
      event.clientY - pointer.startY,
    );

    pointerRef.current = null;
    lastPointRef.current = null;

    if (!pointer.hasMoved || !crossedFruit || distance < 12) {
      setSliceLine(null);
      return;
    }

    setSlicing(true);
    setNotice("");
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

  function changeMission(direction) {
    setActiveMission(
      (current) => (current + direction + missions.length) % missions.length,
    );
  }

  function togglePanel(panel) {
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
    >
      <div className="dojo-grain" aria-hidden="true" />
      <div className="dojo-light" aria-hidden="true" />

      <button
        type="button"
        className="dojo-back"
        onClick={onBack}
        aria-label="Return to game home"
      >
        ←
      </button>

      <div className="dojo-layout">
        <main className="dojo-left">
          <div className="mode-wood-title">
            <span>{details.title}</span>
          </div>

          <section className="parchment-board">
            <div className="mission-section">
              <h2 className="dojo-heading">MISSIONS</h2>

              <div className="mission-card">
                <div className="mission-icon">{currentMission.icon}</div>

                <div className="mission-copy">
                  <strong>{currentMission.title}</strong>
                  <span>{currentMission.progress}</span>
                </div>

                <div className="mission-reward">
                  <strong>{currentMission.reward}</strong>
                  <span>✦</span>
                </div>

                <button
                  type="button"
                  className="mission-next"
                  onClick={() => changeMission(1)}
                  aria-label="Next mission"
                >
                  ›
                </button>
              </div>

              <div className="mission-dots">
                {missions.map((mission, index) => (
                  <button
                    key={mission.title}
                    type="button"
                    className={index === activeMission ? "active" : ""}
                    onClick={() => setActiveMission(index)}
                    aria-label={`Show mission ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="powerup-section">
              <h2 className="dojo-heading">
                POWER UPS <span className="powerup-info">i</span>
              </h2>

              <div className="powerup-grid">
                <button
                  type="button"
                  className="powerup-card strawberry-power"
                  onClick={() =>
                    setNotice("Fruit Frenzy power-up: coming soon!")
                  }
                  aria-label="Fruit Frenzy power-up"
                >
                  <span className="powerup-art">🍓</span>
                  <span className="powerup-plus">+</span>
                </button>

                <button
                  type="button"
                  className="powerup-card peach-power"
                  onClick={() =>
                    setNotice("Double Points power-up: coming soon!")
                  }
                  aria-label="Double Points power-up"
                >
                  <span className="powerup-art">🍑</span>
                  <span className="powerup-check">✓</span>
                </button>
              </div>

              {notice && (
                <p className="dojo-notice" role="status">
                  {notice}
                </p>
              )}
            </div>
          </section>
        </main>

        <aside className="dojo-right">
          <section className="leaderboard-board">
            <h2 className="dojo-heading">LEADERBOARDS</h2>
            <p className="leaderboard-subtitle">WEEKLY</p>

            <div className="leaderboard-list">
              {leaderboard.map((player, index) => (
                <div className="leaderboard-row" key={player.name}>
                  <span className="leaderboard-rank">{index + 1}</span>
                  <span className="leaderboard-avatar">{player.avatar}</span>
                  <span className="leaderboard-name">{player.name}</span>
                  <strong className="leaderboard-score">{player.score}</strong>
                </div>
              ))}
            </div>

            <div className="coming-soon-ribbon">
              COMING
              <br />
              SOON
            </div>
          </section>

          <div className="play-fruit-area">
            <div className="play-orbit" aria-hidden="true">
              <svg viewBox="0 0 220 220">
                <defs>
                  <path
                    id="play-ring-path"
                    d="M 110,110 m -79,0 a 79,79 0 1,1 158,0 a 79,79 0 1,1 -158,0"
                  />
                </defs>
                <text>
                  <textPath href="#play-ring-path">
                    PLAY GAME ✦ PLAY GAME ✦
                  </textPath>
                </text>
              </svg>
            </div>

            <button
              ref={playFruitRef}
              type="button"
              className={`lobby-play-fruit ${slicing ? "sliced" : ""}`}
              aria-label="Swipe through the fruit to start playing"
              onClick={() => setNotice("Swipe through the fruit to play!")}
            >
              {slicing ? (
                <>
                  <span className="fruit-half fruit-half-left">
                    {details.fruit}
                  </span>
                  <span className="fruit-half fruit-half-right">
                    {details.fruit}
                  </span>
                </>
              ) : (
                <span className="lobby-fruit-emoji">{details.fruit}</span>
              )}
            </button>
          </div>

          <p className="play-instruction">
            {slicing ? "ENTERING GAME..." : "SWIPE FRUIT TO PLAY"}
          </p>
        </aside>
      </div>

      {sliceLine && (
        <svg className="dojo-slice-trail" aria-hidden="true">
          <line
            x1={sliceLine.x1}
            y1={sliceLine.y1}
            x2={sliceLine.x2}
            y2={sliceLine.y2}
          />
        </svg>
      )}

      {activePanel && (
        <div className="dojo-modal-backdrop" onClick={() => setActivePanel("")}>
          <section
            className="dojo-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="dojo-modal-close"
              onClick={() => setActivePanel("")}
              aria-label="Close"
            >
              ×
            </button>

            {activePanel === "missions" ? (
              <>
                <h2>DAILY MISSIONS</h2>
                {missions.map((mission) => (
                  <p key={mission.title}>
                    {mission.icon} {mission.title} — {mission.progress}
                  </p>
                ))}
              </>
            ) : (
              <>
                <h2>WEEKLY LEADERBOARD</h2>
                {leaderboard.map((player, index) => (
                  <p key={player.name}>
                    {index + 1}. {player.name} — {player.score}
                  </p>
                ))}
              </>
            )}
          </section>
        </div>
      )}

      <footer className="dojo-footer">
        SLICE STORM <span>✦</span> TRUST YOUR REFLEXES
      </footer>
    </section>
  );
}

export default ModeLobby;
