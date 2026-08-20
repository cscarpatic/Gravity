# Progressive anomaly gameplay

- 12 levels with increasing rocket count, speed, smaller docks and faster release intervals.
- Fixed non-draggable celestial hazards are introduced progressively: moon, black hole, antimatter star and neutron star.
- Antimatter uses negative gravity and repels rockets.
- A level is passed when at least 50% of its rockets are docked (rounded up for odd fleet sizes).
- The final gameplay layer is loaded after the visual polish layer so fixed anomaly bodies cannot be made draggable by earlier rendering wrappers.
