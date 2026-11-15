import { chat, defineCourse, g, lesson, s, unit, w } from '../builder';

export default defineCourse({
  meta: {
    id: 'luo', name: 'Dholuo', nativeName: 'Dholuo', tagline: 'The language of the Luo people around Lake Victoria',
    region: 'Western Kenya · Lake Victoria', community: '~5.1M people (2019 census)', status: 'beta', icon: '🐟', color: '#1B6CA8',
    specialChars: ["'"], learnFrom: ['en', 'sw'],
  },
  hints: { maber: ['well / good', 'vizuri'], ahinya: ['very', 'sana'], nade: ['how', 'vipi'], en: ['is', 'ni'], gi: ['and / with', 'na'], ma: ['this', 'huyu'], kure: ['where', 'wapi'], adhi: ['I go', 'ninaenda'], adwaro: ['I want', 'ninataka'] },
  units: [
    unit('Mos', 'Greetings', '👋', 'Greet people at any time of day.', [
      g('Going well', '"Idhi nade?" literally asks "How are you going?" and the answer "Adhi maber" means "I am going well".'),
      g('Tone', 'Dholuo is a tonal language: pitch can change meaning, but tones are not written. Listen to native speakers when you can — and record yourself in the Community tab.'),
    ], [
      lesson('Hello', [
        w('ber', 'good', '👍', { sw: 'nzuri' }),
        w('ahinya', 'very', '💯', { sw: 'sana', enAlts: ['a lot'] }),
        w('ee', 'yes', '✅', { sw: 'ndiyo' }),
        w('ooyo', 'no', '❌', { sw: 'hapana' }),
        s('Misawa!', 'Hello!', { sw: 'Jambo!', enAlts: ['Hi!'] }),
        s('Idhi nade?', 'How are you?', { sw: 'Habari yako?', enAlts: ['How are you doing?'] }),
        s('Adhi maber.', 'I am fine.', { sw: 'Nzuri.', enAlts: ['I am well.', 'I am doing well.', 'I am good.'] }),
        s('Erokamano.', 'Thank you.', { sw: 'Asante.', enAlts: ['Thanks.'] }),
        s('Erokamano ahinya.', 'Thank you very much.', { sw: 'Asante sana.', enAlts: ['Thanks a lot.', 'Thank you so much.'] }),
      ], [chat('Idhi nade?', 'How are you?', 'Adhi maber.', 'I am fine.', ['Oriti!', 'Ooyo.'], 'Answer with "Adhi maber" — "I am going well".')]),
      lesson('Morning & night', [
        s('Oyawore!', 'Good morning!', { sw: 'Habari za asubuhi!' }),
        s('Oimore!', 'Good evening!', { sw: 'Habari za jioni!' }),
        s('Inindo nade?', 'How did you sleep?', { sw: 'Umelalaje?', enAlts: ['Did you sleep well?'] }),
        s('Anindo maber.', 'I slept well.', { sw: 'Nimelala salama.' }),
        s('Oriti!', 'Goodbye!', { sw: 'Kwaheri!', enAlts: ['Bye!'] }),
      ], [chat('Inindo nade?', 'How did you sleep?', 'Anindo maber.', 'I slept well.', ['Misawa!', 'Erokamano ahinya.'], 'Reply about how you slept.')]),
    ]),
    unit('Nying', 'Names & People', '🙋', 'Introduce yourself and say where you come from.', [
      g('Names tell the time', 'Many Luo names record when a child was born. O- names are for boys, A- for girls: Otieno/Atieno (at night), Omondi/Amondi (early morning), Onyango/Anyango (mid-morning), Ochieng/Achieng (when the sun is high), Odhiambo/Adhiambo (evening), Okoth/Akoth (in the rain).'),
    ], [
      lesson('Names', [
        w('nying', 'name', '🏷️', { sw: 'jina' }),
        s("Nyingi ng'a?", 'What is your name?', { sw: 'Jina lako ni nani?' }),
        s("Nyinga en Achieng'.", "My name is Achieng'.", { sw: "Jina langu ni Achieng'.", enAlts: ['My name is Achieng.'] }),
        s('Iwuok kure?', 'Where are you from?', { sw: 'Unatoka wapi?', enAlts: ['Where do you come from?'] }),
        s('Awuok Kisumu.', 'I come from Kisumu.', { sw: 'Ninatoka Kisumu.', enAlts: ['I am from Kisumu.'] }),
      ]),
      lesson('People', [
        w('dhano', 'person', '🧍', { sw: 'mtu' }),
        w('ji', 'people', '👥', { sw: 'watu' }),
        w('osiep', 'friend', '🧑‍🤝‍🧑', { sw: 'rafiki' }),
        w('japuonj', 'teacher', '🧑‍🏫', { sw: 'mwalimu' }),
        w('nyathi', 'child', '🧒', { sw: 'mtoto' }),
        w('nyithindo', 'children', '👧', { sw: 'watoto' }),
        s('Ma en osiepna.', 'This is my friend.', { sw: 'Huyu ni rafiki yangu.' }),
      ]),
    ]),
    unit('Dala', 'Family & Home', '🏡', 'Family members and home.', [
      g('Dala', '"Dala" is the family homestead — the rural home many city families return to for holidays and important events.'),
    ], [
      lesson('Family', [
        w('mama', 'mother', '👩', { sw: 'mama' }),
        w('baba', 'father', '👨', { sw: 'baba' }),
        w('dani', 'grandmother', '👵', { sw: 'bibi', enAlts: ['grandma'] }),
        w('kwaro', 'grandfather', '👴', { sw: 'babu', enAlts: ['grandpa'] }),
        w('ot', 'house', '🏠', { sw: 'nyumba' }),
        w('dala', 'home', '🏡', { sw: 'nyumbani', enAlts: ['homestead'] }),
        s('Adhi dala.', 'I am going home.', { sw: 'Ninaenda nyumbani.' }),
      ]),
    ]),
    unit('Kwan gi Chiemo', 'Numbers & Food', '🔢', 'Count to ten, order food and name animals.', [
      g('Fish from the lake', 'Fish (rech) is central to Luo cooking — especially tilapia (ngege), often served with kuon (ugali) and greens. Lake Victoria is called Nam Lolwe.'),
    ], [
      lesson('One to ten', [
        w('achiel', 'one', '1️⃣', { sw: 'moja', enAlts: ['1'] }),
        w('ariyo', 'two', '2️⃣', { sw: 'mbili', enAlts: ['2'] }),
        w('adek', 'three', '3️⃣', { sw: 'tatu', enAlts: ['3'] }),
        w("ang'wen", 'four', '4️⃣', { sw: 'nne', enAlts: ['4'] }),
        w('abich', 'five', '5️⃣', { sw: 'tano', enAlts: ['5'] }),
        w('auchiel', 'six', '6️⃣', { sw: 'sita', enAlts: ['6'] }),
        w('abiriyo', 'seven', '7️⃣', { sw: 'saba', enAlts: ['7'] }),
        w('aboro', 'eight', '8️⃣', { sw: 'nane', enAlts: ['8'] }),
        w('ochiko', 'nine', '9️⃣', { sw: 'tisa', enAlts: ['9'] }),
        w('apar', 'ten', '🔟', { sw: 'kumi', enAlts: ['10'] }),
      ]),
      lesson('Food', [
        w('pi', 'water', '💧', { sw: 'maji' }),
        w('chiemo', 'food', '🍲', { sw: 'chakula' }),
        w('rech', 'fish', '🐟', { sw: 'samaki' }),
        w('chak', 'milk', '🥛', { sw: 'maziwa' }),
        w('kuon', 'ugali', '🌽', { sw: 'ugali' }),
        w("ring'o", 'meat', '🥩', { sw: 'nyama' }),
        s('Adwaro pi.', 'I want water.', { sw: 'Ninataka maji.' }),
        s('Kech kaya.', 'I am hungry.', { sw: 'Nina njaa.', note: 'Literally "hunger is biting me".' }),
        s('Adwaro kuon gi rech.', 'I want ugali and fish.', { sw: 'Ninataka ugali na samaki.', enAlts: ['I want ugali with fish.'] }),
      ]),
      lesson('Animals & nature', [
        w("dhiang'", 'cow', '🐄', { sw: "ng'ombe" }),
        w('diel', 'goat', '🐐', { sw: 'mbuzi' }),
        w('guok', 'dog', '🐕', { sw: 'mbwa' }),
        w('gweno', 'chicken', '🐔', { sw: 'kuku' }),
        w('nam', 'lake', '🏞️', { sw: 'ziwa' }),
        w("chieng'", 'sun', '☀️', { sw: 'jua' }),
        w('koth', 'rain', '🌧️', { sw: 'mvua' }),
      ]),
    ]),
  ],
  sounds: [
    { sym: 'dh', sound: 'Like "th" in "this".', example: 'dhano', exampleEn: 'person' },
    { sym: "ng'", sound: 'The "ng" in "singer".', example: "ring'o", exampleEn: 'meat' },
    { sym: 'ny', sound: 'Like Spanish "ñ".', example: 'nyathi', exampleEn: 'child' },
    { sym: 'Tone', sound: 'Pitch matters but is not written.', example: 'pi', exampleEn: 'water' },
  ],
});
