export function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  );

  const closestX = start.x + t * dx;
  const closestY = start.y + t * dy;

  return Math.hypot(point.x - closestX, point.y - closestY);
}

export function swipeHitsFruit(start, end, fruit) {
  const tolerance = 8;
  const radius = (fruit.radius || 0) + tolerance;

  return distanceToSegment({ x: fruit.x, y: fruit.y }, start, end) <= radius;
}
