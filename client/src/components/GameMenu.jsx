import { useState } from "react";

function GameMenu({ mode, setMode, onStart }) {
  const [notice, setNotice] = useState("");

  const modes = [
    { id: "classic", name: "CLASSIC", icon: "🍉", color: "blue" },
    { id: "zen", name: "ZEN", icon: "🍋", color: "green" },
    { id: "arcade", name: "ARCADE", icon: "🍊", color: "orange" },
    { id: "theme", name: "GAME THEME", icon: "🍍", color: "purple" },
  ];

  const navigationItems = [
    {
      label: "MISSIONS",
      icon: "🎯",
      message: "Your missions will appear here soon!",
    },
    {
      label: "REWARDS",
      icon: "🏆",
      message: "Your rewards will appear here soon!",
    },
    {
      label: "SHOP",
      icon: "🛒",
      message: "The item shop is coming soon!",
    },
    {
      label: "ARMORY",
      icon: "⚔️",
      message: "Your armory is coming soon!",
    },
  ];

  const modeDescriptions = {
    classic: "Classic slicing. Avoid the bombs.",
    zen: "Relax, focus, and slice at your own pace.",
    arcade: "Race against the clock for a high score.",
    theme: "Explore themed fruit-slicing adventures.",
  };

  function selectMode(id) {
    setMode(id);
    setNotice("");
  }

  return (
    <section className="ninja-screen">
      {/* Separate left-side wooden navigation */}

      {/* Game navigation */}
      <aside className="wooden-sidebar" aria-label="Game navigation">
        <h2 className="mobile-menu-heading">
          <span aria-hidden="true">✦</span>
          YOUR ARENA
          <span aria-hidden="true">✦</span>
        </h2>

        {navigationItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="wooden-plank"
            onClick={() => setNotice(item.message)}
          >
            <span className="wooden-plank-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="wooden-plank-label">{item.label}</span>
          </button>
        ))}
      </aside>

      {/* Centered game title and mode selection */}
      <main className="ninja-layout">
        <div className="ninja-center">
          <p className="ninja-eyebrow">
            <span className="ninja-status-dot" />
            THE ULTIMATE FRUIT SLICING GAME
          </p>

          <h1 className="ninja-heading">
            SLICE <span>STORM</span>
          </h1>

          <p className="ninja-subtitle">
            Slice the fruit. Test your reflexes. Become a legend.
          </p>

          <div className="ninja-mode-row">
            {modes.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ninja-mode-card ${item.color} ${
                  mode === item.id ? "active" : ""
                }`}
                onClick={() => selectMode(item.id)}
                aria-pressed={mode === item.id}
              >
                <span className="ninja-card-ring">
                  <span className="ninja-card-fruit">{item.icon}</span>
                </span>
                <span className="ninja-card-name">{item.name}</span>
              </button>
            ))}
          </div>

          <p className="ninja-mode-description">
            {modeDescriptions[mode] || modeDescriptions.classic}
          </p>

          {notice && (
            <p className="ninja-notice" role="status">
              {notice}
            </p>
          )}

          <button type="button" className="ninja-play-button" onClick={onStart}>
            <span aria-hidden="true">▶</span> PLAY NOW
          </button>

          <p className="ninja-tagline">
            ✦ READY YOUR BLADE · TRUST YOUR REFLEXES ✦
          </p>
        </div>
      </main>
    </section>
  );
}

export default GameMenu;
