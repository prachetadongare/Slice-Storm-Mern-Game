import { FRUIT_TYPES, GRAVITY, GAME_HEIGHT } from "./gameConfig";

export function createFruit(canvasWidth) {
  const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];

  const radius = type.radius;

  return {
    ...type,

    x: radius + Math.random() * (canvasWidth - radius * 2),
    y: GAME_HEIGHT + radius,

    vx: (Math.random() - 0.5) * 4,
    vy: -(7 + Math.random() * 3),

    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.08,

    radius,
    sliced: false,
  };
}

export function updateFruit(fruit) {
  fruit.x += fruit.vx;
  fruit.y += fruit.vy;

  // Gravity gradually pulls the fruit down.
  fruit.vy += GRAVITY;

  // Rotate the fruit as it moves.
  fruit.rotation += fruit.rotationSpeed;
}

export function isFruitOutOfBounds(fruit) {
  return fruit.y - fruit.radius > GAME_HEIGHT;
}
