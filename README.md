# TKU Sparring System • ![License](https://img.shields.io/badge/License-MIT-blue)

A modern, user-friendly web application for managing Taekwondo sparring matches of UIT Taekwondo Tournaments.

## 🚀 Installation Guide

### Option 1: Direct access (Recommended)

Simply visit [TKU Sparring App](https://tku-sparring.vercel.app/) in your web browser to start using the application immediately.

### Option 2: Setup the project locally

Refer to [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed instructions on how to set up the project locally.

## 🔋 Features

<table>
  <tr>
    <th>Feature</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Match Configuration</td>
    <td>Customizable player names, round duration (10-300s), break time, health points, up to 3 rounds</td>
  </tr>
  <tr>
    <td>Scoring System</td>
    <td>6-point scoring (6/4/3/2/1 points), automatic health updates, visual feedback on critical hits</td>
  </tr>
  <tr>
    <td>Penalty & Mana System</td>
    <td>Gam-jeom tracking, 5-point mana system, penalties reduce mana and can end match</td>
  </tr>
  <tr>
    <td>Timer & Scoring</td>
    <td>Round timer with countdown, break time between rounds, scoring enabled only during active rounds</td>
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

<br />

## 📊 Stats

![Stats](https://repobeats.axiom.co/api/embed/bab8fc528b5de608bc6d757a16fbef110695eead.svg 'Repobeats analytics image')

## 📃 License

Licensed under the [MIT License](./LICENSE).
