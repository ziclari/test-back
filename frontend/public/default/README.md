# Default Test Simulator

## Overview

This is a simple test simulator built in a **single YAML file** (`test-simulator.yaml`) to demonstrate the core capabilities of the simulator engine. It features a **space/tech themed CSS** with futuristic styling and glowing effects.

## Visual Theme

The simulator uses a custom **Space/Tech aesthetic** (`src/default.css`):
- **Color Palette**: Deep space blues (#0a0e27 background) with bright cyan accents (#60a5fa)
- **Typography**: 'Orbitron' for headings (futuristic), 'Space Mono' for body text
- **Effects**: Glowing text shadows, animated buttons, glassmorphism, pulsing animations
- **Inspiration**: Combines the clean corporate style of `corp-espionage` with the dramatic atmosphere of `english-mission`

## Features Demonstrated

### 1. **State Management**
- Uses `custom_set` to track variables:
  - `score` - Player's current score
  - `visited_room1` - Whether Room 1 puzzle was solved
  - `visited_room2` - Whether Room 2 was explored
  - `has_key` - Whether the player found the key

### 2. **Conditional Visibility**
- Elements appear/disappear based on state using `visible_if`
- Example: The final door is locked until `has_key == true`

### 3. **Navigation**
- Uses `goto_id` to navigate between slides within the same file
- Hub-and-spoke pattern: Central hub connects to multiple rooms

### 4. **Interactive Elements**
- Buttons with actions
- Puzzles with multiple choice answers
- Score tracking with `inc:score`

### 5. **Animations**
- Various animations: `fadeUp`, `slideDown`, `bounce`, `pulse`, `zoomIn`, `rotateIn`
- Delayed animations for cinematic effect

## Structure

```
welcome → hub → room1 (puzzle)
              → room2 (find key)
              → finale (requires key)
```

## How to Play

1. Start at the welcome screen
2. Navigate to the central hub
3. Explore Room 1 to solve a puzzle (+10 points)
4. Explore Room 2 to find the hidden key (+20 points)
5. Return to hub and unlock the final door
6. Complete the simulator!

## Technical Notes

- **Single File Architecture**: All slides are in `test-simulator.yaml`
- **Custom CSS Theme**: Space/tech aesthetic in `src/default.css`
- **Local State**: All variables use `local` scope for session persistence
- **Background**: Uses a space-themed Unsplash image

## Comparison with Other Simulators

| Feature | corp-espionage | english-mission | default (this) |
|---------|----------------|-----------------|----------------|
| Architecture | Single YAML | Multi-file | Single YAML |
| Complexity | Medium | High | Low |
| Custom CSS | Yes (corporate) | Yes (mystery/noir) | Yes (space/tech) |
| State Variables | 1 | Multiple | 4 |
| Slides | 6 | 10+ | 5 |

This simulator serves as a **minimal viable example** for testing engine features and as a template for new projects.
