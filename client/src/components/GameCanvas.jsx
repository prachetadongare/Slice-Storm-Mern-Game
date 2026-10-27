import { useEffect, useRef } from "react";
import { GAME_WIDTH, GAME_HEIGHT } from "../game/gameConfig";
import { createFruit, updateFruit, isFruitOutOfBounds } from "../game/fruit";
import { swipeHitsFruit } from "../game/collision";

const TRAIL_LIFETIME = 180;
const MAX_TRAIL_POINTS = 24;
const GRAVITY = 0.16;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

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
    let halves = [];
    let particles = [];
    let trail = [];
    let score = 0;
    let animationId = 0;
    let lastSpawnTime = 0;
    let lastFrameTime = 0;
    let pointerDown = false;
    let pointerId = null;
    let previousPoint = null;
    let disposed = false;

    const spawnDelay = 850;

    function getPoint(event) {
      const rect = canvas.getBoundingClientRect();

      return {
        x: ((event.clientX - rect.left) / rect.width) * canvas.width,
        y: ((event.clientY - rect.top) / rect.height) * canvas.height,
      };
    }

    function createParticles(x, y) {
      const colors = [
        "#ff5964",
        "#ffb52e",
        "#ffe66d",
        "#8df35d",
        "#68e8ff",
        "#ff8de1",
      ];

      const count = Math.floor(randomBetween(14, 22));

      for (let i = 0; i < count; i++) {
        const angle = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(1.2, 5);

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          radius: randomBetween(1.5, 4),
          color: colors[Math.floor(Math.random() * colors.length)],
          life: randomBetween(250, 500),
          maxLife: 500,
          gravity: randomBetween(0.04, 0.14),
          droplet: Math.random() > 0.4,
        });
      }

      // Bright sparks around the cut.
      for (let i = 0; i < 5; i++) {
        const angle = randomBetween(0, Math.PI * 2);
        const speed = randomBetween(2, 5);

        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: randomBetween(1, 2),
          color: "#fff7c2",
          life: 160,
          maxLife: 160,
          gravity: 0.02,
          droplet: false,
        });
      }
    }

    function splitFruit(fruit, start, end, hitPoint) {
      if (fruit.sliced) return;

      fruit.sliced = true;

      const swipeAngle = Math.atan2(end.y - start.y, end.x - start.x);

      // The two halves move away from the cut.
      const splitAngle = swipeAngle + Math.PI / 2;
      const radius = fruit.radius;
      const fruitScore = fruit.score || 1;

      for (const side of [-1, 1]) {
        halves.push({
          emoji: fruit.emoji,
          radius,
          x: fruit.x,
          y: fruit.y,
          rotation: fruit.rotation || 0,
          vx:
            Math.cos(splitAngle) * side * randomBetween(1.5, 2.8) +
            (end.x - start.x) * 0.01,
          vy:
            Math.sin(splitAngle) * side * randomBetween(1.5, 2.8) -
            randomBetween(1, 2.5),
          angularVelocity: randomBetween(-0.12, 0.12),
          splitAngle,
          side,
          age: 0,
        });
      }

      createParticles(hitPoint.x, hitPoint.y);

      // The future sound system can listen for this event.
      canvas.dispatchEvent(
        new CustomEvent("fruit-sliced", {
          bubbles: true,
          detail: {
            x: hitPoint.x,
            y: hitPoint.y,
            fruit: fruit.emoji,
            score: fruitScore,
          },
        }),
      );

      score += fruitScore;
      scoreCallbackRef.current?.(score);
    }

    function handlePointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();

      pointerDown = true;
      pointerId = event.pointerId;
      previousPoint = getPoint(event);

      trail = [
        {
          ...previousPoint,
          time: performance.now(),
        },
      ];

      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional.
      }
    }

    function handlePointerMove(event) {
      if (!pointerDown || pointerId !== event.pointerId || !previousPoint) {
        return;
      }

      event.preventDefault();

      const currentPoint = getPoint(event);

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

      if (trail.length > MAX_TRAIL_POINTS) {
        trail.splice(0, trail.length - MAX_TRAIL_POINTS);
      }

      // Slice only fruits that the swipe actually intersects.
      for (const fruit of fruits) {
        if (
          fruit.sliced ||
          !swipeHitsFruit(previousPoint, currentPoint, fruit)
        ) {
          continue;
        }

        const hitPoint = {
          x: fruit.x,
          y: fruit.y,
        };

        splitFruit(fruit, previousPoint, currentPoint, hitPoint);
      }

      previousPoint = currentPoint;
    }

    function handlePointerUp(event) {
      if (
        pointerId !== null &&
        event.pointerId !== undefined &&
        event.pointerId !== pointerId
      ) {
        return;
      }

      pointerDown = false;
      pointerId = null;
      previousPoint = null;
    }

    function drawBackground() {
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);

      gradient.addColorStop(0, "#201c3c");
      gradient.addColorStop(0.55, "#100f25");
      gradient.addColorStop(1, "#070710");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      const glow = ctx.createRadialGradient(
        GAME_WIDTH * 0.5,
        GAME_HEIGHT * 0.32,
        5,
        GAME_WIDTH * 0.5,
        GAME_HEIGHT * 0.32,
        GAME_WIDTH * 0.7,
      );

      glow.addColorStop(0, "rgba(69, 93, 180, 0.18)");
      glow.addColorStop(1, "rgba(8, 8, 18, 0)");

      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      ctx.fillStyle = "rgba(255,255,255,0.055)";

      for (let x = 30; x < GAME_WIDTH; x += 50) {
        for (let y = 30; y < GAME_HEIGHT; y += 50) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function drawFruit(fruit) {
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation || 0);

      ctx.shadowColor = "rgba(255, 181, 46, 0.3)";
      ctx.shadowBlur = fruit.radius * 0.25;

      ctx.font = `${fruit.radius * 2}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(fruit.emoji, 0, 0);

      ctx.restore();
    }

    function drawFruitHalf(half) {
      const r = half.radius * 1.6;
      const a = half.splitAngle;
      const nx = Math.cos(a);
      const ny = Math.sin(a);
      const tx = -ny;
      const ty = nx;
      const side = half.side;

      ctx.save();
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);

      // Clip the fruit artwork to one side of the cut.
      ctx.beginPath();
      ctx.moveTo(nx * r * side + tx * r, ny * r * side + ty * r);
      ctx.lineTo(nx * r * side - tx * r, ny * r * side - ty * r);
      ctx.lineTo(-nx * r * side - tx * r, -ny * r * side - ty * r);
      ctx.lineTo(-nx * r * side + tx * r, -ny * r * side + ty * r);
      ctx.closePath();
      ctx.clip();

      ctx.font = `${half.radius * 2}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(half.emoji, 0, 0);

      ctx.restore();

      // Draw a bright edge along the cut.
      ctx.save();
      ctx.translate(half.x, half.y);
      ctx.rotate(half.rotation);

      ctx.beginPath();
      ctx.moveTo(-nx * half.radius * side, -ny * half.radius * side);
      ctx.lineTo(nx * half.radius * side, ny * half.radius * side);

      ctx.strokeStyle = "rgba(255, 246, 204, 0.9)";
      ctx.lineWidth = Math.max(1, half.radius * 0.04);
      ctx.shadowColor = "#fff2b0";
      ctx.shadowBlur = 7;
      ctx.stroke();

      ctx.restore();
    }

    function updateAndDrawHalves(delta) {
      halves = halves.filter((half) => half.age < 1500);

      for (const half of halves) {
        half.x += half.vx * delta;
        half.y += half.vy * delta;
        half.vy += GRAVITY * delta;
        half.rotation += half.angularVelocity * delta;
        half.age += 16.67 * delta;

        drawFruitHalf(half);
      }
    }

    function updateAndDrawParticles(delta) {
      particles = particles.filter((particle) => particle.life > 0);

      for (const particle of particles) {
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.vy += particle.gravity * delta;
        particle.vx *= Math.pow(0.99, delta);
        particle.life -= 16.67 * delta;

        ctx.save();
        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.droplet ? 7 : 5;

        ctx.beginPath();

        if (particle.droplet) {
          ctx.ellipse(
            particle.x,
            particle.y,
            particle.radius * 0.7,
            particle.radius * 1.4,
            Math.atan2(particle.vy, particle.vx),
            0,
            Math.PI * 2,
          );
        } else {
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.restore();
      }
    }

    function drawTrail(now) {
      trail = trail.filter((point) => now - point.time < TRAIL_LIFETIME);

      if (trail.length < 2) return;

      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Soft cyan glow around the blade.
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);

      for (let i = 1; i < trail.length; i++) {
        const previous = trail[i - 1];
        const current = trail[i];
        const midX = (previous.x + current.x) / 2;
        const midY = (previous.y + current.y) / 2;

        ctx.quadraticCurveTo(previous.x, previous.y, midX, midY);
      }

      const last = trail[trail.length - 1];
      ctx.lineTo(last.x, last.y);

      ctx.strokeStyle = "rgba(45, 220, 255, 0.55)";
      ctx.lineWidth = 12;
      ctx.shadowColor = "#3deaff";
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Bright white core, fading behind the pointer.
      for (let i = 1; i < trail.length; i++) {
        const previous = trail[i - 1];
        const current = trail[i];
        const opacity = Math.max(0, 1 - (now - current.time) / TRAIL_LIFETIME);

        ctx.globalAlpha = opacity;
        ctx.strokeStyle = "#f2ffff";
        ctx.lineWidth = 1.5 + opacity * 2.5;
        ctx.shadowColor = "#b9ffff";
        ctx.shadowBlur = 9;

        ctx.beginPath();
        ctx.moveTo(previous.x, previous.y);
        ctx.lineTo(current.x, current.y);
        ctx.stroke();
      }

      ctx.restore();
    }

    function drawScore() {
      ctx.save();
      ctx.font = "900 25px Arial, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#fff4cf";
      ctx.shadowColor = "#ffb32c";
      ctx.shadowBlur = 10;
      ctx.fillText(`SCORE ${score}`, 20, 18);
      ctx.restore();
    }

    function animate(timestamp) {
      if (disposed) return;

      const delta = lastFrameTime
        ? Math.min(2.5, Math.max(0.5, (timestamp - lastFrameTime) / 16.67))
        : 1;

      lastFrameTime = timestamp;

      drawBackground();

      if (timestamp - lastSpawnTime > spawnDelay) {
        fruits.push(createFruit(GAME_WIDTH));
        lastSpawnTime = timestamp;

        if (Math.random() < 0.3) {
          fruits.push(createFruit(GAME_WIDTH));
        }
      }

      for (const fruit of fruits) {
        if (!fruit.sliced) updateFruit(fruit);
      }

      fruits = fruits.filter(
        (fruit) => !fruit.sliced && !isFruitOutOfBounds(fruit),
      );

      for (const fruit of fruits) {
        drawFruit(fruit);
      }

      updateAndDrawHalves(delta);
      updateAndDrawParticles(delta);
      drawTrail(timestamp);
      drawScore();

      animationId = requestAnimationFrame(animate);
    }

    canvas.addEventListener("pointerdown", handlePointerDown, {
      passive: false,
    });
    canvas.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("lostpointercapture", handlePointerUp);

    animationId = requestAnimationFrame(animate);

    return () => {
      disposed = true;
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
      aria-label="Slice Storm game arena. Swipe across fruit to slice it."
      style={{
        display: "block",
        touchAction: "none",
      }}
    />
  );
}

export default GameCanvas;
