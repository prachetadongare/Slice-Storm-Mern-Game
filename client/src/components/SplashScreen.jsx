import "../styles/SplashScreen.css";

function SplashScreen({ progress }) {
  return (
    <div className="splash-screen">
      <img
        className="splash-background"
        src="/slice-storm-splash.png"
        alt="Slice Storm game artwork"
      />

      <div className="splash-overlay">
        <div className="splash-loading">
          <p className="splash-loading-title">PREPARING YOUR NEXT ADVENTURE</p>

          <div
            className="splash-progress-track"
            role="progressbar"
            aria-label="Loading game"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="splash-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="splash-progress-info">
            <span>Loading game resources...</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;
