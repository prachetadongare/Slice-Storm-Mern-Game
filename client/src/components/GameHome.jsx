import { useEffect, useRef, useState } from "react";
import "../styles/gameHome.css";

const modes = [
  { id: "classic", name: "CLASSIC", fruit: "🍉", color: "blue" },
  { id: "zen", name: "ZEN", fruit: "🍋", color: "green" },
  { id: "arcade", name: "ARCADE", fruit: "🍌", color: "gold" },
  { id: "theme", name: "GAME THEME", fruit: "🍍", color: "purple" },
];

const navigation = [
  ["🎯", "MISSIONS"],
  ["🏆", "REWARDS"],
  ["🛒", "SHOP"],
  ["⚔️", "ARMORY"],
];

function GameHome({ user, onLogout, onPlay }) {
  const [mode, setMode] = useState("classic");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [slicingMode, setSlicingMode] = useState(null);
  const [sliceLine, setSliceLine] = useState(null);

  const fruitRefs = useRef({});
  const pointerRef = useRef(null);
  const audioRef = useRef(null);
  const openTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.close().catch(() => {});
      }
    };
  }, []);

  function playSliceSound() {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!audioRef.current || audioRef.current.state === "closed") {
        audioRef.current = new AudioContextClass();
      }

      const audio = audioRef.current;

      if (audio.state === "suspended") {
        audio.resume().catch(() => {});
      }

      const now = audio.currentTime;

      // Short, layered synthesized slice sound.
      const noiseBuffer = audio.createBuffer(
        1,
        Math.floor(audio.sampleRate * 0.12),
        audio.sampleRate,
      );

      const data = noiseBuffer.getChannelData(0);

      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }

      const noise = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const gain = audio.createGain();

      noise.buffer = noiseBuffer;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.11);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audio.destination);

      noise.start(now);
      noise.stop(now + 0.12);
    } catch (error) {
      console.error("Could not play slicing sound:", error);
    }
  }

  function getPoint(event) {
    return { x: event.clientX, y: event.clientY };
  }

  function pointInsideFruit(point, modeId) {
    const element = fruitRefs.current[modeId];
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.43;

    const dx = point.x - centerX;
    const dy = point.y - centerY;

    return dx * dx + dy * dy <= radius * radius;
  }

  function segmentHitsFruit(start, end, modeId) {
    const element = fruitRefs.current[modeId];
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.43;

    const vx = end.x - start.x;
    const vy = end.y - start.y;
    const lengthSquared = vx * vx + vy * vy;

    const t =
      lengthSquared === 0
        ? 0
        : Math.max(
            0,
            Math.min(
              1,
              ((centerX - start.x) * vx + (centerY - start.y) * vy) /
                lengthSquared,
            ),
          );

    const closestX = start.x + t * vx;
    const closestY = start.y + t * vy;
    const dx = centerX - closestX;
    const dy = centerY - closestY;

    return dx * dx + dy * dy <= radius * radius;
  }

  function handlePointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (slicingMode) return;

    const point = getPoint(event);

    pointerRef.current = {
      pointerId: event.pointerId,
      start: point,
      last: point,
      hasMoved: false,
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    const pointer = pointerRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId || slicingMode) {
      return;
    }

    const current = getPoint(event);
    const previous = pointer.last;

    pointer.last = current;

    if (
      !pointer.hasMoved &&
      Math.hypot(current.x - pointer.start.x, current.y - pointer.start.y) < 7
    ) {
      return;
    }

    pointer.hasMoved = true;
    setSliceLine({ start: previous, end: current, key: Date.now() });

    for (const item of modes) {
      if (
        segmentHitsFruit(previous, current, item.id) ||
        pointInsideFruit(current, item.id)
      ) {
        pointerRef.current = null;
        setMode(item.id);
        setSlicingMode(item.id);
        setNotice("");
        playSliceSound();

        openTimerRef.current = setTimeout(() => {
          onPlay?.(item.id);
        }, 420);

        return;
      }
    }
  }

  function handlePointerUp(event) {
    if (
      pointerRef.current &&
      pointerRef.current.pointerId === event.pointerId
    ) {
      pointerRef.current = null;
    }
  }

  return (
    <section
      className="game-home"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <header className="home-hud">
        <div className="home-level">
          <span className="level-number">1</span>
          <div>
            <strong>LEVEL</strong>
            <div className="level-track" aria-label="Level progress: 0%">
              <span />
            </div>
          </div>
        </div>

        <div className="home-resources">
          <div className="home-resource">
            💎 <strong>0</strong>
          </div>
          <div className="home-resource">
            ⭐ <strong>0</strong>
          </div>

          <div className="home-menu-wrapper">
            <button
              type="button"
              className="home-menu-button"
              aria-expanded={menuOpen}
              aria-controls="home-account-dropdown"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
            >
              ☰ MENU
            </button>

            {menuOpen && (
              <div
                id="home-account-dropdown"
                className="home-dropdown"
                onPointerDown={(event) => event.stopPropagation()}
                onPointerMove={(event) => event.stopPropagation()}
              >
                <span className="home-player">
                  {user?.username || user?.name || user?.email || "Player"}
                </span>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setMenuOpen(false);
                    onLogout?.();
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <aside className="home-sidebar" aria-label="Game navigation">
        <h2 className="mobile-menu-heading">✦ YOUR ARENA ✦</h2>
        {navigation.map(([icon, label]) => (
          <button
            type="button"
            key={label}
            onClick={() => setNotice(`${label}: coming soon!`)}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </aside>

      <main className="home-main">
        <h1 className="home-title">
          SLICE <span>STORM</span>
        </h1>
        <p className="home-eyebrow">✦ YOUR NEXT ADVENTURE ✦</p>
        <p className="home-subtitle">
          Swipe through a fruit to enter your chosen arena.
        </p>

        <div className="home-mode-grid">
          {modes.map((item) => {
            const pathId = `mode-circle-${item.id}`;

            return (
              <button
                type="button"
                key={item.id}
                className={`home-mode ${item.color} ${
                  mode === item.id ? "selected" : ""
                } ${slicingMode === item.id ? "is-slicing" : ""}`}
                onClick={() => {
                  if (slicingMode) return;
                  setMode(item.id);
                  setNotice(
                    `${item.name} selected — swipe through its fruit to play.`,
                  );
                }}
                aria-pressed={mode === item.id}
                aria-label={`Select ${item.name}. Swipe across its fruit to start.`}
              >
                <span className="home-mode-ring">
                  <svg
                    className="home-mode-text"
                    viewBox="0 0 200 200"
                    aria-hidden="true"
                  >
                    <defs>
                      <path
                        id={pathId}
                        d="M 100,100 m -79,0 a 79,79 0 1,1 158,0 a 79,79 0 1,1 -158,0"
                      />
                    </defs>
                    <text>
                      <textPath
                        href={`#${pathId}`}
                        textLength="496"
                        lengthAdjust="spacing"
                      >
                        {`${item.name} ✦ `.repeat(item.id === "zen" ? 9 : 5)}
                      </textPath>
                    </text>
                  </svg>

                  <span
                    className="home-mode-fruit"
                    ref={(element) => {
                      fruitRefs.current[item.id] = element;
                    }}
                  >
                    {slicingMode === item.id ? (
                      <span className="fruit-split" aria-hidden="true">
                        <span>{item.fruit}</span>
                        <span>{item.fruit}</span>
                      </span>
                    ) : (
                      item.fruit
                    )}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {sliceLine && (
          <svg className="home-slice-overlay" aria-hidden="true">
            <line
              key={sliceLine.key}
              x1={sliceLine.start.x}
              y1={sliceLine.start.y}
              x2={sliceLine.end.x}
              y2={sliceLine.end.y}
            />
          </svg>
        )}

        {notice && (
          <p className="home-notice" role="status">
            {notice}
          </p>
        )}

        <p className="home-tagline">
          ✦ READY YOUR BLADE · TRUST YOUR REFLEXES ✦
        </p>
      </main>
    </section>
  );
}

export default GameHome;
