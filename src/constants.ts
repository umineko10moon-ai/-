import { Verb } from './types';

export const VERBS: Verb[] = [
  {
    infinitive: 'lernen',
    meaning: '学ぶ',
    conjugations: {
      'ich': 'lerne',
      'du': 'lernst',
      'er/sie/es': 'lernt',
      'wir': 'lernen',
      'ihr': 'lernt',
      'sie/Sie': 'lernen',
    }
  },
  {
    infinitive: 'trinken',
    meaning: '飲む',
    conjugations: {
      'ich': 'trinke',
      'du': 'trinkst',
      'er/sie/es': 'trinkt',
      'wir': 'trinken',
      'ihr': 'trinkt',
      'sie/Sie': 'trinken',
    }
  },
  {
    infinitive: 'kommen',
    meaning: '来る',
    conjugations: {
      'ich': 'komme',
      'du': 'kommst',
      'er/sie/es': 'kommt',
      'wir': 'kommen',
      'ihr': 'kommt',
      'sie/Sie': 'kommen',
    }
  },
  {
    infinitive: 'wohnen',
    meaning: '住んでいる',
    conjugations: {
      'ich': 'wohne',
      'du': 'wohnst',
      'er/sie/es': 'wohnt',
      'wir': 'wohnen',
      'ihr': 'wohnt',
      'sie/Sie': 'wohnen',
    }
  },
  {
    infinitive: 'arbeiten',
    meaning: '働く',
    conjugations: {
      'ich': 'arbeite',
      'du': 'arbeitest',
      'er/sie/es': 'arbeitet',
      'wir': 'arbeiten',
      'ihr': 'arbeitet',
      'sie/Sie': 'arbeiten',
    }
  },
  {
    infinitive: 'küssen',
    meaning: 'キスする',
    conjugations: {
      'ich': 'küsse',
      'du': 'küsst',
      'er/sie/es': 'küsst',
      'wir': 'küssen',
      'ihr': 'küsst',
      'sie/Sie': 'küssen',
    }
  },
  {
    infinitive: 'lächeln',
    meaning: '微笑む',
    conjugations: {
      'ich': 'lächle',
      'du': 'lächelst',
      'er/sie/es': 'lächelt',
      'wir': 'lächeln',
      'ihr': 'lächelt',
      'sie/Sie': 'lächeln',
    }
  },
  {
    infinitive: 'finden',
    meaning: '見つける、思う',
    conjugations: {
      'ich': 'finde',
      'du': 'findest',
      'er/sie/es': 'findet',
      'wir': 'finden',
      'ihr': 'findet',
      'sie/Sie': 'finden',
    }
  },
  {
    infinitive: 'tanzen',
    meaning: '踊る',
    conjugations: {
      'ich': 'tanze',
      'du': 'tanzt',
      'er/sie/es': 'tanzt',
      'wir': 'tanzen',
      'ihr': 'tanzt',
      'sie/Sie': 'tanzen',
    }
  },
  {
    infinitive: 'sein',
    meaning: 'いる、ある、である',
    conjugations: {
      'ich': 'bin',
      'du': 'bist',
      'er/sie/es': 'ist',
      'wir': 'sind',
      'ihr': 'seid',
      'sie/Sie': 'sind',
    }
  },
  {
    infinitive: 'haben',
    meaning: '持っている',
    conjugations: {
      'ich': 'habe',
      'du': 'hast',
      'er/sie/es': 'hat',
      'wir': 'haben',
      'ihr': 'habt',
      'sie/Sie': 'haben',
    }
  },
  {
    infinitive: 'werden',
    meaning: '〜になる',
    conjugations: {
      'ich': 'werde',
      'du': 'wirst',
      'er/sie/es': 'wird',
      'wir': 'werden',
      'ihr': 'werdet',
      'sie/Sie': 'werden',
    }
  },
  {
    infinitive: 'spielen',
    meaning: '〜する(≒play)',
    conjugations: {
      'ich': 'spiele',
      'du': 'spielst',
      'er/sie/es': 'spielt',
      'wir': 'spielen',
      'ihr': 'spielt',
      'sie/Sie': 'spielen',
    }
  }
];

export const SUBJECTS: string[] = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];
export const PLAYER_RADIUS = 7.5;
export const ENEMY_SPAWN_INTERVAL = 4000;
export const MAX_HEALTH = 4;
