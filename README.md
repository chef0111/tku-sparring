# TKU Sparring System

A modern, user-friendly web application for managing Taekwondo sparring matches of UIT Taekwondo Tournaments.

## Installation Guide

### Option 1: Direct access (Recommended)

Simply visit [TKU Sparring App](https://tku-sparring.vercel.app/) in your web browser to start using the application immediately.

### Option 2: Setup the project locally

Refer to [DEVELOPMENT.md](DEVELOPMENT.md) for detailed instructions on how to set up the project locally.

## Features

### Match Configuration

- Customizable player names and avatars
- Adjustable round duration (10-300 seconds)
- Configurable break time between rounds (10-120 seconds)
- Customizable maximum health points (50-200)
- Support for up to 3 rounds per match

### Scoring System

- 6-point scoring system:
  - 6 points: Critical head hit (30 health points)
  - 4 points: Critical trunk hit (20 health points)
  - 3 points: Head hit (15 health points)
  - 2 points: Trunk hit (10 health points)
  - 1 point: Punch (5 health points)
- Automatic health bar updates
- Visual feedback for critical hits
- Hit counter for each player

### Penalty System

- Gam-jeom (penalty) tracking
- Mana system (5 points)
- Penalty effects on health and mana
- Visual feedback for penalty points

### Timer Features

- Round timer with countdown
- Break time between rounds
- Visual indicators for time status
- Support for pausing/resuming matches

### Match Management

- Round-by-round score tracking
- Match winner determination
- Match result display
- Support for multiple matches

## Requirements and Restrictions

### Scoring Restrictions

- Scoring buttons are disabled when:
  - Match is not started
  - Timer is paused
  - Break time is active
  - A player's health reaches 0
  - Match time has expired
  - Maximum rounds are completed

### Penalty System Rules

- Maximum 5 penalty points per player
- Penalty points reduce mana
- Match ends if a player's mana reaches 0
- Penalties can be removed if not at maximum mana

### Timer Rules

- Round timer must be started to enable scoring
- Break time is not allowed to skip
- Timer can be paused during active rounds
- Match ends when time expires or health/mana depletes

### Winner Determination

Winner is determined in the following order:

1. Health depletion (KO)
2. Mana depletion (penalties)
3. Remaining health points
4. Fewer penalty points
5. Higher technique points
6. More 3-point hits

<br>

> [!NOTE]
>
> - User can still operate a match without configuration
> - Timer must be started before using any feature
> - User cannot reset the previous round's stat during break time
> - The system is web-base and **only supports PC resolution**.

## Stats

![Stats](https://repobeats.axiom.co/api/embed/66da04f4e2d5d29f7e1307ff183de30486fed782.svg 'Repobeats analytics image')

---

Hope you have a good experience while using the system!
