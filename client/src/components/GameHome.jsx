import { useState } from "react";
import "../styles/gameHome.css";

const modes = [
  { id: "classic", name: "CLASSIC", fruit: "🍉", color: "blue" },
  { id: "zen", name: "ZEN", fruit: "🍋", color: "green" },
  { id: "arcade", name: "ARCADE", fruit: "🍌", color: "gold" },
  { id: "theme", name: "GAME THEME", fruit: "🍍", color: "purple" },
];

function GameHome({ user, onLogout }) {
  const [mode, setMode] = useState("classic");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const navigation = [
    ["🎯", "MISSIONS"],
    ["🏆", "REWARDS"],
    ["🛒", "SHOP"],
    ["⚔️", "ARMORY"],
  ];

  return (
    <section className="game-home">
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

          <button
            type="button"
            className="home-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
          >
            ☰ MENU
          </button>

          {menuOpen && (
            <div className="home-dropdown">
              <span className="home-player">{user?.username || "Player"}</span>
              <button type="button" onClick={onLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </header>

      <aside className="home-sidebar">
        {navigation.map(([icon, label]) => (
          <button
            type="button"
            key={label}
            onClick={() => setNotice(`${label}: coming soon!`)}
          >
            <span>{icon}</span>
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
          Choose your arena. Sharpen your reflexes. Become a legend.
        </p>

        <div className="home-mode-grid">
          {modes.map((item) => {
            const pathId = `mode-circle-${item.id}`;
            const repeatedLabel = `${item.name} ✦ `
              .repeat(item.id === "zen" ? 9 : 5)
              .trim();
            return (
              <button
                type="button"
                key={item.id}
                className={`home-mode ${item.color} ${
                  mode === item.id ? "selected" : ""
                }`}
                onClick={() => {
                  setMode(item.id);
                  setNotice("");
                }}
                aria-pressed={mode === item.id}
                aria-label={`Select ${item.name} mode`}
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
                        {repeatedLabel}
                      </textPath>
                    </text>
                  </svg>

                  <span className="home-mode-fruit" aria-hidden="true">
                    {item.fruit}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

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
