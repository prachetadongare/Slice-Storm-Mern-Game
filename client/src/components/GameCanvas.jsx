import { useEffect, useRef } from "react";
import { GAME_WIDTH, GAME_HEIGHT } from "../game/gameConfig";
import { createFruit, updateFruit, isFruitOutOfBounds } from "../game/fruit";
import { swipeHitsFruit } from "../game/collision";

function GameCanvas({ onScoreChange }) {
  const canvasRef = useRef(null);
  const scoreCallbackRef = useRef(onScoreChange);

  useEffect(() => {
    scoreCallbackRef.current = onScoreChange;
  }, [onScoreChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    let fruits = [];
    let trail = [];
    let score = 0;
    let animationId;
    let lastSpawnTime = 0;
    let isPointerDown = false;
    let activePointerId = null;
    let previousPoint = null;

    const spawnDelay = 850;
    const TRAIL_LIFETIME = 160;

    function getCanvasPoint(event) {
      const rect = canvas.getBoundingClientRect();

      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function handlePointerDown(event) {
      // Ignore secondary mouse buttons.
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();

      isPointerDown = true;
      activePointerId = event.pointerId;
      previousPoint = getCanvasPoint(event);

      trail.push({
        ...previousPoint,
        time: performance.now(),
      });

      if (canvas.setPointerCapture) {
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          // Continue if pointer capture is unavailable.
        }
      }
    }

    function handlePointerMove(event) {
      if (
        !isPointerDown ||
        !previousPoint ||
        event.pointerId !== activePointerId
      ) {
        return;
      }

      event.preventDefault();

      const currentPoint = getCanvasPoint(event);

      // Ignore zero-distance movements.
      if (
        currentPoint.x === previousPoint.x &&
        currentPoint.y === previousPoint.y
      ) {
        return;
      }

      trail.push({
        ...currentPoint,
        time: performance.now(),
      });

      // Fruit collision detection only; audio is managed by App.jsx.
      for (const fruit of fruits) {
        if (
          fruit.sliced ||
          !swipeHitsFruit(previousPoint, currentPoint, fruit)
        ) {
          continue;
        }

        fruit.sliced = true;
        score += fruit.score;
        scoreCallbackRef.current?.(score);
      }

      previousPoint = currentPoint;
    }

    function handlePointerUp(event) {
      if (activePointerId !== null && event.pointerId !== activePointerId) {
        return;
      }

      isPointerDown = false;
      activePointerId = null;
      previousPoint = null;
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);

      gradient.addColorStop(0, "#15132c");
      gradient.addColorStop(1, "#080812");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = "#ffffff12";

      for (let x = 30; x < GAME_WIDTH; x += 50) {
        for (let y = 30; y < GAME_HEIGHT; y += 50) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawFruit(fruit) {
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);

      ctx.font = `${fruit.radius * 2}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fruit.emoji, 0, 0);

      ctx.restore();
    }

    function drawTrail(now) {
      trail = trail.filter((point) => now - point.time < TRAIL_LIFETIME);

      if (trail.length < 2) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "#67e8f9";
      ctx.shadowBlur = 16;

      for (let i = 1; i < trail.length; i++) {
        const previous = trail[i - 1];
        const current = trail[i];

        const age = now - current.time;
        const opacity = Math.max(0, 1 - age / TRAIL_LIFETIME);

        ctx.globalAlpha = opacity;
        ctx.strokeStyle = "#67e8f9";
        ctx.lineWidth = 3 + opacity * 3;

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawScore() {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE: ${score}`, 20, 36);
      ctx.restore();
    }

    function animate(timestamp) {
      drawBackground();

      if (timestamp - lastSpawnTime > spawnDelay) {
        fruits.push(createFruit(GAME_WIDTH));
        lastSpawnTime = timestamp;

        if (Math.random() < 0.3) {
          fruits.push(createFruit(GAME_WIDTH));
        }
      }

      for (const fruit of fruits) {
        updateFruit(fruit);
      }

      fruits = fruits.filter(
        (fruit) => !fruit.sliced && !isFruitOutOfBounds(fruit),
      );

      for (const fruit of fruits) {
        drawFruit(fruit);
      }

      drawTrail(timestamp);
      drawScore();

      animationId = requestAnimationFrame(animate);
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("lostpointercapture", handlePointerUp);

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);

      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("lostpointercapture", handlePointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas"
      aria-label="Slice Storm game arena. Drag across fruit to slice it."
    />
  );
}

export default GameCanvas;
