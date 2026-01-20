# Hegemony: Earth Conquest

A strategic conquest simulator where you command an alien invasion fleet attempting to subjugate Earth. Built as a browser game using Three.js.

## Core Concept

You are Fleet Commander Veth'ari of the Hegemony, tasked with conquering Earth. Your civilization has approximately one century of technological advantage over humanity—significant but not overwhelming. Victory requires strategic precision, not brute force.

**Key Design Pillars:**
- **Strategic depth over twitch gameplay** - Thoughtful planning, not clicking speed
- **Meaningful consequences** - Decisions cascade through phases; early mistakes compound
- **Realistic constraints** - Resources matter, collateral damage reduces value, time pressure exists
- **Asymmetric challenge** - You have tech superiority; humans have numbers, nukes, and home advantage

---

## Game Phases

The conquest unfolds across five distinct phases, each with different mechanics and win conditions.

### Phase 1: Silent Infiltration (Turns 1-30)

**Objective:** Map Earth's defenses without detection

**Core Mechanics:**
- Deploy reconnaissance drone swarms to regions
- Each swarm gradually reveals: military bases, nuclear silos, command centers, infrastructure
- Detection risk increases with swarm density
- Intel quality affects Phase 2 strike accuracy

**Resources:**
- Drone swarms (limited, can be repositioned)
- Processing power (affects intel analysis speed)
- Stealth budget (detection risk threshold)

**Victory Condition:** Achieve 80%+ intel coverage on priority targets
**Failure Condition:** Detection triggers early human response (harder Phase 2)

**Player Decisions:**
- Where to concentrate reconnaissance?
- Risk higher detection for faster intel, or play safe?
- Which target categories to prioritize?

---

### Phase 2: The Decapitation Cascade (Turns 31-35)

**Objective:** Eliminate command structure and nuclear capability in 72 hours

**Core Mechanics:**
- Simultaneous strike planning (queue all actions, then execute)
- EMP deployment (disables electronics in radius, affects infrastructure)
- Kinetic bombardment (destroys hardened targets, visible and terrifying)
- Submarine hunting (time-sensitive, subs can launch if not found)
- Leadership elimination (requires prior intel, special ops teams)

**Resources:**
- EMP satellites (limited charges, cooldowns)
- Kinetic rods (finite ammunition)
- Strike teams (limited, can be lost)
- Time (72 hours, actions take time)

**Victory Condition:** Neutralize 90%+ nuclear capability, eliminate key leadership
**Failure Condition:** Nuclear launches exceed acceptable threshold (Pyrrhic victory/loss)

**Player Decisions:**
- Strike sequencing (what order? simultaneous or waves?)
- Resource allocation (kinetic rods are finite)
- Acceptable collateral damage threshold
- Abort/continue decisions as situation develops

---

### Phase 3: Consolidation (Turns 36-100)

**Objective:** Establish control before organized resistance forms

**Core Mechanics:**
- Deploy ground forces to regions
- Atmospheric suppressant dispersal
- Communication infrastructure (build your network, jam theirs)
- Pacification vs. destruction tradeoffs
- Regional stability management

**Resources:**
- Ground forces (troops, vehicles, drones)
- Suppressant supplies (chemicals for compliance)
- Broadcast capacity (propaganda, communication control)
- Goodwill (affects long-term stability)

**Victory Condition:** All major population centers under control, resistance below threshold
**Failure Condition:** Organized resistance movement achieves critical mass

**Player Decisions:**
- Harsh crackdown vs. gentle occupation
- Where to deploy limited ground forces
- Communication strategy (total blackout vs. controlled access)
- How to handle emerging resistance leaders

---

### Phase 4: Controlled Integration (Turns 101-200)

**Objective:** Transition from military occupation to administrative control

**Core Mechanics:**
- Collaborator recruitment and management
- Technology release decisions (what to share, when)
- Economic restructuring
- Counter-insurgency operations
- Regional autonomy calibration

**Resources:**
- Administrative capacity
- Technology "gifts" (medical, agricultural, energy)
- Collaborator loyalty
- Military reserves

**Victory Condition:** Self-sustaining administrative apparatus, military can draw down
**Failure Condition:** Major uprising, collaborator government collapse

**Player Decisions:**
- Which humans to elevate
- Technology release pacing
- Carrot vs. stick balance
- Regional policy variation

---

### Phase 5: Normalization (Turns 201+)

**Objective:** Transition from conquest to governance

**Core Mechanics:**
- Long-term stability simulation
- Generational shift modeling
- Cultural integration policies
- Insurgency final suppression

**Victory Condition:** Earth fully integrated into Hegemony (score based on efficiency, casualties, time)
**Failure Condition:** Persistent instability requiring ongoing military presence (partial victory)

---

## Core Systems

### Intelligence System (Fog of War)

Earth starts mostly unknown. Information is revealed through:
- Passive observation (slow, safe)
- Active reconnaissance (faster, riskier)
- Captured intel (from strikes, interrogation)
- Collaborator reports (Phase 3+)

Intel has **quality levels**: Rumored → Suspected → Confirmed → Detailed

Intel **decays** over time—military positions change, leaders move.

### Combat Resolution

Not a tactical game—combat resolves strategically:
- **Strike missions:** Success probability based on intel quality, target hardness, resources committed
- **Interception:** Humans may detect and intercept strikes (probability based on their remaining C&C)
- **Ground combat:** Regional control shifts based on force ratios, terrain, population attitude
- **Attrition:** Both sides lose resources over time in contested areas

### Resistance Simulation

Humans aren't passive. The game simulates:
- **National responses:** Governments coordinate (if C&C intact), go rogue, or collapse
- **Military remnants:** Surviving units become insurgents or surrender
- **Civilian resistance:** Emerges based on occupation harshness, cultural factors
- **Collaboration:** Some humans will help you (for various reasons)

Resistance has **momentum**—small successes breed larger movements.

### Resource Management

**Fleet Resources:**
- Energy (regenerates slowly, powers most actions)
- Kinetic ammunition (finite, no resupply)
- Drones (lost in combat, slow to replace)
- Personnel (troops, specialists—limited and valuable)

**Strategic Resources:**
- Time (phases have soft/hard deadlines)
- Stealth (detection has cascading consequences)
- Goodwill (affects long-term stability)
- Earth's value (excessive destruction reduces "score")

---

## Victory Conditions & Scoring

**Primary Victory:** Earth integrated into Hegemony (complete Phase 5)

**Scoring Factors:**
- Time to completion (faster = better)
- Earth's remaining productive capacity (cities intact, infrastructure functional)
- Hegemony casualties (personnel lost)
- Human casualties (genocide is inefficient)
- Resistance at completion (lower = more stable)
- Resources expended

**Victory Tiers:**
- **Flawless:** Minimal casualties, rapid conquest, high stability
- **Efficient:** Standard conquest, acceptable losses
- **Pyrrhic:** Victory but at high cost
- **Marginal:** Ongoing instability, permanent military presence required

---

## UI/UX Concept

### Main View: Orbital Command

- 3D Earth globe as centerpiece
- Zoom levels: Solar → Orbital → Continental → Regional → Tactical
- Overlays toggle: Military, Infrastructure, Population, Intel Coverage, Control Status
- Time controls: Pause, Play, Fast Forward (1x, 5x, 20x)

### Sidebar: Strategic Briefing

- Current phase and objectives
- Resource status
- Active missions
- Alerts and reports

### Bottom Bar: Action Queue

- Planned actions for current turn/phase
- Drag-and-drop mission planning
- Commit/execute button

### Modal Panels

- Regional detail view
- Mission planning interface
- Intel reports
- Collaborator management (Phase 4+)

---

## Art Direction

**Style:** Military holographic aesthetic
- Dark backgrounds with glowing elements
- Color coding: Blue (Hegemony), Red (hostile), Yellow (contested), Green (controlled)
- Grid overlays suggesting advanced scanning technology
- Clean, readable iconography
- Minimal but impactful visual effects (EMP pulses, kinetic impacts)

**Audio Concept:**
- Ambient: Low hum of ship systems
- UI: Subtle sci-fi bleeps and confirmations
- Events: Dramatic stings for major moments (nuclear launch detected, resistance uprising)
- Music: Tense electronic, escalating with phase

---

## Future Expansion Ideas

- **Asymmetric multiplayer:** One player as aliens, one coordinating human resistance
- **Campaign variations:** Different starting conditions, Earth tech levels, fleet resources
- **Scenario editor:** Create custom invasion challenges
- **Historical mode:** Replay famous Earth conflicts from alien perspective
- **Counter-invasion:** Humans develop FTL, take the fight to Hegemony space
