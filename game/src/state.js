// Orbital Drift — game state: screens, launches, score, stars.
// Screens: title, aiming, flying, levelComplete, gameOver, victory.
// Shards persist across the level's launches; stars are earned per level:
// 1 for finishing, +1 for every shard, +1 for finishing on the first launch.
import { LEVELS } from './levels.js';

export function freshState() {
  return {
    screen: 'title',
    levelIndex: 0,
    launchesLeft: 3,
    launchesUsed: 0,
    score: 0,
    levelScore: 0,
    collected: new Set(),
    stars: Array(LEVELS.length).fill(0),
    best: 0,
    muted: false,
    flightTime: 0,
    probe: null,
    trail: [],
    aim: null,
    message: '',
    messageUntil: 0,
  };
}

export function loadLevel(state, index) {
  const level = LEVELS[index];
  state.levelIndex = index;
  state.launchesLeft = level.launches;
  state.launchesUsed = 0;
  state.levelScore = 0;
  state.collected = new Set();
  state.probe = null;
  state.trail = [];
  state.aim = null;
  state.flightTime = 0;
  state.screen = 'aiming';
  return level;
}

export function levelStars(state) {
  let s = 1;
  const level = LEVELS[state.levelIndex];
  if (state.collected.size === level.shards.length) s += 1;
  if (state.launchesUsed <= 1) s += 1;
  return Math.min(s, 3);
}

export function awardLevelComplete(state) {
  const stars = levelStars(state);
  state.stars[state.levelIndex] = Math.max(state.stars[state.levelIndex], stars);
  const bonus = state.launchesLeft * 250;
  state.levelScore += bonus;
  state.score += bonus;
  state.screen = 'levelComplete';
  return { stars, bonus };
}
