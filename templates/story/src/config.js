/**
 * config.js - Parameterization surface for the Interactive Story template.
 *
 * Every tunable value lives here so that ArcadeForge (or a human) can
 * re-skin / re-write the story by editing a single file.
 */

const config = {
  colors: {
    background:    '#0a0a0a',
    text:          '#e0e0e0',
    accent:        '#7b68ee',
    characterName: '#f0c040',
    choiceDefault: '#2a2a3e',
    choiceHover:   '#3d3d5c',
    choiceBorder:  '#7b68ee',
    dialogueBox:   'rgba(10, 10, 10, 0.85)',
    menuButton:    '#1e1e2e',
    menuHover:     '#2e2e4e',
  },

  text: {
    speed:    40,       // characters per second for typewriter
    maxWidth: 700,      // max pixel width before word-wrap
    font:     '20px serif',
    nameFont: 'bold 18px sans-serif',
  },

  choices: {
    font:     '18px sans-serif',
    timeout:  0,        // seconds; 0 = no timeout
    maxVisible: 4,
  },

  transitions: {
    fadeDuration: 0.3,
    type: 'fade',       // 'fade' | 'slide' | 'none'
  },

  juice: {
    sceneTransition: true,
    typewriterSound: false,
  },

  autoAdvance: {
    enabled: false,
    delay:   3,         // seconds per dialogue line
  },

  saves: {
    maxSlots: 3,
  },

  game: {
    title: 'The Enchanted Gate',
  },

  visual: {
    style: 'geometric',
  },

  story: {
    startScene: 'intro',

    characters: {
      narrator: { name: 'Narrator', color: '#b0b0b0' },
      elara:    { name: 'Elara',    color: '#f0c040' },
    },

    scenes: {
      intro: {
        description: 'A mist-covered forest path stretches before you.',
        dialogue: [
          { speaker: 'narrator', text: 'The forest is thick with fog. Somewhere ahead, a faint glow pulses between the ancient trees.' },
          { speaker: 'narrator', text: 'You clutch your lantern and step forward, leaves crunching beneath your boots.' },
          { speaker: 'elara',    text: 'Wait... do you hear that? Something is calling from beyond the gate.' },
        ],
        next: 'the_gate',
      },

      the_gate: {
        description: 'A towering stone gate, overgrown with ivy, blocks the path.',
        dialogue: [
          { speaker: 'narrator', text: 'The gate looms above you, its surface covered in glowing runes. Two paths diverge on either side.' },
          { speaker: 'elara',    text: 'We can try to open the gate directly, or take the forest trail around it. Your call.' },
        ],
        choices: [
          { text: 'Touch the runes on the gate',  next: 'rune_path' },
          { text: 'Take the forest trail',         next: 'forest_path' },
          { text: 'Search for a hidden key',       next: 'search_key', condition: 'observant' },
        ],
      },

      rune_path: {
        description: 'The runes flare with blinding light as your hand touches the stone.',
        dialogue: [
          { speaker: 'narrator', text: 'Energy surges through your fingertips. The gate shudders and begins to open.' },
          { speaker: 'elara',    text: 'The magic... it recognizes you. But the runes are draining your strength!' },
        ],
        choices: [
          { text: 'Push through the pain',  next: 'good_ending', effects: { setFlags: ['brave'] } },
          { text: 'Pull your hand away',    next: 'bad_ending' },
        ],
      },

      forest_path: {
        description: 'The narrow trail winds through twisted oaks and whispering ferns.',
        dialogue: [
          { speaker: 'narrator', text: 'The trail is treacherous. Roots grab at your ankles and branches claw your cloak.' },
          { speaker: 'elara',    text: 'Look, there — carvings on that old oak. They tell a story about observant travelers.' },
          { speaker: 'narrator', text: 'You study the carvings carefully, committing the symbols to memory.' },
        ],
        effects: { setFlags: ['observant'] },
        next: 'the_gate',
      },

      search_key: {
        description: 'You kneel and examine the base of the gate, brushing away centuries of moss.',
        dialogue: [
          { speaker: 'narrator', text: 'Beneath the moss, your fingers find a small iron key lodged between the stones.' },
          { speaker: 'elara',    text: 'A hidden key! The carvings on the trail must have been a clue all along.' },
          { speaker: 'narrator', text: 'You turn the key. The gate swings open silently, revealing a sunlit meadow beyond.' },
        ],
        next: 'good_ending',
        effects: { setFlags: ['found_key'] },
      },

      good_ending: {
        description: 'Warm sunlight floods through the open gate. Birds sing in the canopy above.',
        dialogue: [
          { speaker: 'narrator', text: 'Beyond the gate lies a world untouched by shadow — emerald hills rolling toward a distant castle.' },
          { speaker: 'elara',    text: 'We made it. Whatever trials await us next, we face them together.' },
          { speaker: 'narrator', text: 'THE END — Thank you for playing.' },
        ],
        ending: true,
      },

      bad_ending: {
        description: 'The runes go dark. The forest falls silent.',
        dialogue: [
          { speaker: 'narrator', text: 'The magic dissipates, and the gate seals shut with a thunderous crack.' },
          { speaker: 'elara',    text: 'The path is closed to us now. We will have to find another way... someday.' },
          { speaker: 'narrator', text: 'THE END — Perhaps a different choice would have changed your fate.' },
        ],
        ending: true,
      },
    },
  },
};

export default config;
