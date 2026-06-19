# TKU Sparring System • ![License](https://img.shields.io/badge/License-MIT-blue)

A tournament operations platform for Taekwondo UIT: an admin CRM for taekwondo tournaments, plus an arena client for live match scoring.

## 🚀 Installation Guide

### Option 1: Direct access (Recommended)

Simply visit [TKU Sparring App](https://tku-sparring.vercel.app/) in your web browser to start using the application immediately.

### Option 2: Setup the project locally

Refer to [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed instructions on how to set up the project locally.

## 🔋 Features

### Admin CRM

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Operations hub</td>
    <td>Cross-tournament KPIs, status pipeline, and recent tournaments at <code>/dashboard</code></td>
  </tr>
  <tr>
    <td>Command center</td>
    <td>Per-tournament monitoring, setup checklist, and lifecycle actions; editing stays in the builder</td>
  </tr>
  <tr>
    <td>Global athlete registry</td>
    <td>CRUD for <strong>AthleteProfile</strong> records, de-dup validation, filters, and bulk add to tournaments</td>
  </tr>
  <tr>
    <td>Tournament builder — Groups</td>
    <td>Constraint-based auto-assign, manual drag-and-drop, out-of-range warnings, per-group third-place toggle, arena assignment</td>
  </tr>
  <tr>
    <td>Tournament builder — Brackets</td>
    <td>Single-elimination bracket canvas, shuffle, seed locks, custom matches, corner swap, match detail panel</td>
  </tr>
  <tr>
    <td>Bracket export & fullscreen</td>
    <td>Fit-to-content PNG screenshot and immersive fullscreen view of the bracket canvas</td>
  </tr>
  <tr>
    <td>Match results & lifecycle</td>
    <td>Best-of-three round wins, Draft → Active → Completed transitions, manual winner overrides with audit trail</td>
  </tr>
  <tr>
    <td>Audit log</td>
    <td>Per-tournament activity for score edits, reseeds, group changes, and manual overrides</td>
  </tr>
</table>

### Arena client

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Advance Settings</td>
    <td>Select tournament, group, and match before a bout; per-device restore of last selection</td>
  </tr>
  <tr>
    <td>Arena match claim</td>
    <td>One device per match at a time (30-minute claim TTL); other devices see matches as in use</td>
  </tr>
  <tr>
    <td>Tournament realtime</td>
    <td>Socket.io invalidation keeps Advance Settings and bracket views in sync across devices</td>
  </tr>
  <tr>
    <td>Live scoring</td>
    <td>Full-screen scoreboard with round timer, technique scoring, health and mana, and gam-jeom penalties</td>
  </tr>
  <tr>
    <td>Round & match flow</td>
    <td>Automatic round-end submission, Finish Match to finalize, then return to Advance Settings (no auto-advance)</td>
  </tr>
  <tr>
    <td>Offline tolerance</td>
    <td>Scoring continues locally when connectivity drops; syncs on reconnect</td>
  </tr>
</table>

## 📋 Restrictions

<table>
  <tr>
    <th>Restriction</th>
    <th>Details</th>
  </tr>
  <tr>
    <td>Scoring Disabled</td>
    <td>Match not started, timer paused, break time active, player health = 0, time expired, max rounds reached</td>
  </tr>
  <tr>
    <td>Penalty Rules</td>
    <td>Max 5 penalties per player, penalties reduce mana, match ends if mana = 0</td>
  </tr>
  <tr>
    <td>Winner Determined</td>
    <td>Health depletion (KO) → Mana depletion → Remaining health → Fewer penalties → Technique points</td>
  </tr>
</table>

<br />

> [!NOTE]
>
> - User can still operate a match without configuration
> - Timer must be started before using any feature
> - User cannot reset the previous round's stat during break time
> - The system is web-base and **only supports PC resolution**.

## 📊 Stats

![Stats](https://repobeats.axiom.co/api/embed/bab8fc528b5de608bc6d757a16fbef110695eead.svg 'Repobeats analytics image')

## 📃 License

Licensed under the [MIT License](./LICENSE).
