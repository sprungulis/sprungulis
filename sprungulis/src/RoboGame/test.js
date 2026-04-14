// Test script for controller.js
import { input, InitialState, stateList } from './controller.js';

console.log('=== Controller Test: State Generation ===\n');

// Initialize state
console.log('Initializing game state...\n');
InitialState();

// Execute a series of moves
const actions = [
  'move right 1',
  'move down 1',
  'move left 1',
  'move down 1',
  'pickup',
  'move up 1',
  'drop',
  'move right 1',
];

console.log('Executing actions:');
for (const action of actions) {
  const result = input(action);
  if (result === false) {
    console.log(`  ✗ "${action}" - FAILED\n`);
  } else {
    console.log(`  ✓ "${action}"`);
  }
}

// Print all states generated
console.log('\n=== Complete State List ===\n');
console.log(`Total states generated: ${stateList.length}\n`);

stateList.forEach((state, index) => {
  console.log(`State ${index}:`);
  console.log(`  Robot Position: [${state.robotPos[0]}, ${state.robotPos[1]}]`);
  console.log(`  Ball Position:  [${state.ballPos[0]}, ${state.ballPos[1]}]`);
  console.log(`  Picked Up:      ${state.pickedUp}`);
  console.log(`  Walls:          ${state.walls.map(w => `[${w[0]},${w[1]}]`).join(', ')}`);
  console.log(`  Grid Size:      ${state.gridSize}`);
  console.log();
});

console.log('=== Test Complete ===');