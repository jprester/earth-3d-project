/**
 * First Contact - A sample invasion scenario
 *
 * The alien fleet arrives in Earth orbit and begins systematic conquest.
 * This scenario spans the first 72 hours of the invasion.
 */

import type { Scenario } from '../game/types';

export const firstContactScenario: Scenario = {
  id: 'first-contact',
  name: 'First Contact',
  description: 'Day One of the invasion. The alien fleet emerges from behind the Moon and begins its assault on Earth.',

  events: [
    // === HOUR 0-1: ARRIVAL ===
    {
      id: 'arrival-1',
      time: 0,
      type: 'narrative',
      alienMessage: 'FLEET EMERGENCE COMPLETE. 47 VESSELS IN FORMATION.',
      newsHeadline: 'Massive objects detected emerging from lunar shadow',
      newsDetail: 'NASA and ESA confirm multiple large objects approaching Earth. Emergency briefings scheduled.',
      importance: 'critical',
    },
    {
      id: 'arrival-2',
      time: 0.25,
      type: 'narrative',
      alienMessage: 'INITIATING ORBITAL INSERTION. PRIMARY TARGETS IDENTIFIED.',
      newsHeadline: 'World leaders convene emergency summit',
      importance: 'major',
    },
    {
      id: 'arrival-3',
      time: 0.5,
      type: 'narrative',
      alienMessage: 'DEPLOYING RECONNAISSANCE SWARMS',
      newsHeadline: 'Strange lights reported across multiple continents',
      newsDetail: 'Social media flooded with reports of glowing objects in the sky.',
      importance: 'minor',
    },

    // === HOUR 1-2: FIRST STRIKES - COMMUNICATIONS ===
    {
      id: 'hack-comms-1',
      time: 1,
      type: 'hack',
      locationId: 'usa-washington',
      alienMessage: 'TARGETING ENEMY COMMUNICATIONS INFRASTRUCTURE',
      newsHeadline: 'Major internet outages reported across Eastern US',
      newsDetail: 'Pentagon confirms "cyber incident" affecting military networks.',
      importance: 'major',
      focusCamera: true,
    },
    {
      id: 'hack-comms-2',
      time: 1.25,
      type: 'hack',
      locationId: 'uk-london',
      alienMessage: 'DISRUPTING ATLANTIC COMMAND LINKS',
      newsHeadline: 'UK government communications compromised',
      importance: 'major',
    },

    // === HOUR 2-4: DISABLE AIR DEFENSES ===
    {
      id: 'attack-norad',
      time: 2,
      type: 'attack',
      locationId: 'usa-norad',
      alienMessage: 'PRIORITY TARGET: NORAD COMMAND CENTER',
      newsHeadline: 'BREAKING: Cheyenne Mountain under attack',
      newsDetail: 'Witnesses report massive explosions near Colorado Springs. All civilian aircraft grounded.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'usa-norad',
        newStatus: 'contested',
        stabilityChange: -30,
      },
    },
    {
      id: 'attack-response-1',
      time: 2.5,
      type: 'human_response',
      alienMessage: 'DETECTING ENEMY AIRCRAFT SCRAMBLE. INSIGNIFICANT.',
      newsHeadline: 'US Air Force scrambles fighters nationwide',
      newsDetail: 'F-22s and F-35s deployed from multiple bases.',
      importance: 'major',
    },
    {
      id: 'destroy-fighters',
      time: 3,
      type: 'destroy',
      alienMessage: 'ENEMY AIRCRAFT NEUTRALIZED. 47 UNITS ELIMINATED.',
      newsHeadline: 'Reports of aircraft losses mount',
      newsDetail: 'Military sources confirm "significant casualties" in air defense response.',
      importance: 'critical',
    },

    // === HOUR 4-6: POWER GRID ATTACKS ===
    {
      id: 'attack-grid-1',
      time: 4,
      type: 'attack',
      locationId: 'usa-hoover-dam',
      alienMessage: 'INITIATING INFRASTRUCTURE DISRUPTION PROTOCOL',
      newsHeadline: 'Explosion at Hoover Dam',
      newsDetail: 'Massive power outages spreading across Southwest. Dam integrity unknown.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'usa-hoover-dam',
        newStatus: 'neutralized',
        newControlledBy: 'destroyed',
      },
    },
    {
      id: 'civilian-panic-1',
      time: 4.5,
      type: 'civilian',
      alienMessage: 'CIVILIAN POPULATION EXHIBITING EXPECTED DISORGANIZATION',
      newsHeadline: 'Mass evacuations begin in major cities',
      newsDetail: 'Highways gridlocked as millions flee urban centers.',
      importance: 'major',
    },

    // === HOUR 6-10: EXPANSION ===
    {
      id: 'attack-europe-1',
      time: 6,
      type: 'attack',
      locationId: 'germany-ramstein',
      alienMessage: 'EUROPEAN THEATER: TARGETING NATO COMMAND ASSETS',
      newsHeadline: 'Ramstein Air Base under attack',
      newsDetail: 'German authorities confirm hostile action at major NATO installation.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'germany-ramstein',
        newStatus: 'contested',
        stabilityChange: -40,
      },
    },
    {
      id: 'attack-europe-2',
      time: 7,
      type: 'attack',
      locationId: 'uk-london',
      alienMessage: 'TARGETING UK COMMAND INFRASTRUCTURE',
      newsHeadline: 'London under attack',
      newsDetail: 'Explosions reported across the capital. Royal Family evacuated.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'uk-london',
        newStatus: 'contested',
        stabilityChange: -25,
      },
    },

    // === HOUR 10-15: NUCLEAR RESPONSE ===
    {
      id: 'human-nuclear-attempt',
      time: 10,
      type: 'human_response',
      alienMessage: 'DETECTING NUCLEAR LAUNCH PREPARATION. COUNTERMEASURES READY.',
      newsHeadline: 'DEFCON 1 declared',
      newsDetail: 'Multiple nations reportedly preparing nuclear response.',
      importance: 'critical',
    },
    {
      id: 'intercept-nukes',
      time: 11,
      type: 'destroy',
      alienMessage: 'NUCLEAR MISSILES INTERCEPTED. 23 WARHEADS NEUTRALIZED IN FLIGHT.',
      newsHeadline: 'Nuclear strike fails',
      newsDetail: 'Missiles apparently destroyed before reaching targets. "They shot them down like flies."',
      importance: 'critical',
    },
    {
      id: 'attack-silos-1',
      time: 12,
      type: 'attack',
      locationId: 'usa-minot',
      alienMessage: 'RETALIATORY STRIKE: ELIMINATING NUCLEAR THREAT',
      newsHeadline: 'Minot AFB destroyed',
      newsDetail: 'Nuclear arsenal reportedly annihilated in precision strike.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'usa-minot',
        newStatus: 'neutralized',
        newControlledBy: 'destroyed',
      },
    },

    // === HOUR 15-24: OCCUPATION BEGINS ===
    {
      id: 'occupy-1',
      time: 15,
      type: 'occupy',
      locationId: 'usa-new-york',
      alienMessage: 'INITIATING GROUND OCCUPATION: PRIMARY POPULATION CENTER',
      newsHeadline: 'Alien ground forces land in New York',
      newsDetail: 'Witnesses describe "metallic beings" emerging from landed craft. National Guard overwhelmed.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'usa-new-york',
        newStatus: 'occupied',
        newControlledBy: 'alien',
        stabilityChange: -50,
      },
    },
    {
      id: 'narrative-day1-end',
      time: 20,
      type: 'narrative',
      alienMessage: 'DAY ONE OBJECTIVES: 73% COMPLETE. RESISTANCE FRAGMENTING.',
      newsHeadline: 'Day of devastation ends with humanity reeling',
      newsDetail: 'Governments in disarray. Military command structures disrupted. Casualties estimated in millions.',
      importance: 'major',
    },

    // === DAY 2: CONSOLIDATION ===
    {
      id: 'day2-start',
      time: 24,
      type: 'narrative',
      alienMessage: 'COMMENCING DAY TWO OPERATIONS',
      newsHeadline: 'Dawn breaks on a changed world',
      importance: 'minor',
    },
    {
      id: 'occupy-2',
      time: 26,
      type: 'occupy',
      locationId: 'china-beijing',
      alienMessage: 'ASIAN THEATER: SECURING POPULATION CENTER',
      newsHeadline: 'Beijing falls to alien forces',
      newsDetail: 'Chinese military resistance ends after 6-hour battle.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'china-beijing',
        newStatus: 'occupied',
        newControlledBy: 'alien',
        stabilityChange: -60,
      },
    },
    {
      id: 'occupy-3',
      time: 30,
      type: 'occupy',
      locationId: 'russia-moscow',
      alienMessage: 'RUSSIAN SECTOR: OCCUPATION COMPLETE',
      newsHeadline: 'Moscow surrounded',
      newsDetail: 'Kremlin reportedly destroyed. Russian government status unknown.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'russia-moscow',
        newStatus: 'occupied',
        newControlledBy: 'alien',
        stabilityChange: -70,
      },
    },

    // === DAY 2-3: HUMANITY'S RESPONSE ===
    {
      id: 'resistance-forms',
      time: 36,
      type: 'human_response',
      alienMessage: 'DETECTING ORGANIZED RESISTANCE CELLS. MONITORING.',
      newsHeadline: 'Underground resistance movements forming',
      newsDetail: 'Encrypted communications suggest coordinated global response being organized.',
      importance: 'major',
    },
    {
      id: 'occupy-washington',
      time: 40,
      type: 'occupy',
      locationId: 'usa-washington',
      alienMessage: 'PRIORITY OBJECTIVE ACHIEVED: US CAPITAL SECURED',
      newsHeadline: 'Washington D.C. falls',
      newsDetail: 'White House destroyed. President\'s fate unknown. Government reportedly relocated.',
      importance: 'critical',
      focusCamera: true,
      effect: {
        locationId: 'usa-washington',
        newStatus: 'occupied',
        newControlledBy: 'alien',
        stabilityChange: -80,
      },
    },

    // === HOUR 48-72: CONSOLIDATION ===
    {
      id: 'broadcast',
      time: 48,
      type: 'narrative',
      alienMessage: 'INITIATING POPULATION BROADCAST. COMPLIANCE INSTRUCTIONS TRANSMITTING.',
      newsHeadline: 'Alien broadcast reaches all devices worldwide',
      newsDetail: '"Resistance is inefficient. Integration is inevitable." Message repeating in all languages.',
      importance: 'critical',
    },
    {
      id: 'day3-morning',
      time: 56,
      type: 'narrative',
      alienMessage: 'GLOBAL PACIFICATION: 67% COMPLETE',
      newsHeadline: 'Third day of invasion begins',
      newsDetail: 'Isolated pockets of resistance remain. Major cities under alien control.',
      importance: 'major',
    },
    {
      id: 'scenario-end',
      time: 72,
      type: 'narrative',
      alienMessage: 'PHASE ONE COMPLETE. PREPARING PHASE TWO: RESOURCE EXTRACTION.',
      newsHeadline: 'The new world order takes shape',
      newsDetail: 'As Day Three ends, humanity faces an uncertain future under alien dominion.',
      importance: 'critical',
    },
  ],
};
