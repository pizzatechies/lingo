import { chat, defineCourse, g, lesson, s, unit, w } from '../builder';

export default defineCourse({
  meta: {
    id: 'ki', name: 'Gĩkũyũ', nativeName: 'Gĩkũyũ', tagline: 'Spoken around Mount Kenya and across central Kenya',
    region: 'Central Kenya', community: '~8.1M people (2019 census)', status: 'beta', icon: '⛰️', color: '#2E8B57',
    specialChars: ['ĩ', 'ũ', 'Ĩ', 'Ũ', "'"], learnFrom: ['en', 'sw'],
  },
  hints: { waku: ['your', 'yako'], wakwa: ['my', 'wangu'], yakwa: ['my', 'yangu'], rĩakwa: ['my', 'langu'], nĩ: ['is / it is', 'ni'], na: ['and / with', 'na'], ndĩ: ['I am', 'mimi ni'], ũyũ: ['this (person)', 'huyu'], mũno: ['very', 'sana'], kũ: ['where', 'wapi'], atĩa: ['how', 'vipi'], ngwenda: ['I want', 'ninataka'] },
  units: [
    unit('Ũhoro', 'Greetings', '👋', 'Say hello, thank you and goodbye.', [
      g('"Nĩ wega" does a lot', '"Nĩ wega" literally means "it is good" and is a common way to say thank you. "Nĩ ngatho" (it is gratitude) also means thanks.'),
      g('Leaving well', 'The person leaving says "Tigwo na wega" (stay well); the person staying says "Thiĩ na wega" (go well).'),
    ], [
      lesson('Hello', [
        w('ĩĩ', 'yes', '✅', { sw: 'ndiyo' }),
        w('aca', 'no', '❌', { sw: 'hapana' }),
        w('mwega', 'good', '👍', { sw: 'mzuri', enAlts: ['well', 'fine'] }),
        w('ngatho', 'gratitude', '🙏', { sw: 'shukrani', enAlts: ['thanks'] }),
        w('mũno', 'very', '💯', { sw: 'sana', enAlts: ['a lot'] }),
        s('Wĩ mwega?', 'Are you well?', { sw: 'Hujambo?', enAlts: ['How are you?', 'Are you fine?'] }),
        s('Ĩĩ, ndĩ mwega.', 'Yes, I am well.', { sw: 'Ndiyo, sijambo.', enAlts: ['Yes, I am fine.', 'Yes, I am good.'] }),
        s('Nĩ wega.', 'Thank you.', { sw: 'Asante.', alts: ['Nĩ ngatho.'], enAlts: ['Thanks.', 'It is good.'] }),
        s('Nĩ wega mũno.', 'Thank you very much.', { sw: 'Asante sana.', alts: ['Nĩ ngatho mũno.'], enAlts: ['Thanks a lot.', 'Thank you so much.'] }),
      ], [chat('Wĩ mwega?', 'Are you well?', 'Ĩĩ, ndĩ mwega.', 'Yes, I am well.', ['Thiĩ na wega.', 'Aca.'], 'Answer "Wĩ mwega?" with "Ĩĩ, ndĩ mwega".')]),
      lesson('News', [
        w('ũhoro', 'news', '📰', { sw: 'habari' }),
        s('Ũhoro waku?', 'How are you?', { sw: 'Habari yako?', enAlts: ['What is your news?'] }),
        s('Nĩ mwega.', 'It is good.', { sw: 'Nzuri.', enAlts: ['Good.', 'Fine.', 'It is fine.'] }),
        s('Mũrĩ ega?', 'Are you all well?', { sw: 'Hamjambo?', enAlts: ['How are you all?'] }),
        s('Tũrĩ ega.', 'We are well.', { sw: 'Hatujambo.', enAlts: ['We are fine.', 'We are good.'] }),
      ]),
      lesson('Goodbye', [
        w('thiĩ', 'go', '🚶', { sw: 'nenda' }),
        w('ũka', 'come', '👋', { sw: 'njoo', enAlts: ['come here'] }),
        s('Tigwo na wega.', 'Stay well.', { sw: 'Kaa salama.', enAlts: ['Goodbye.', 'Remain well.'], note: 'Said by the person who is leaving.' }),
        s('Thiĩ na wega.', 'Go well.', { sw: 'Nenda salama.', enAlts: ['Goodbye.', 'Go in peace.'], note: 'Said to the person who is leaving.' }),
      ], [chat('Tigwo na wega.', 'Stay well.', 'Thiĩ na wega.', 'Go well.', ['Wĩ mwega?', 'Ũka.'], 'The one staying wishes the traveller a good journey.')]),
    ]),
    unit('Andũ', 'People & Names', '🙋', 'Introduce yourself and the people around you.', [
      g('Names', 'Children are traditionally named after grandparents — the first son after the paternal grandfather, the first daughter after the paternal grandmother.'),
    ], [
      lesson('Names', [
        w('rĩĩtwa', 'name', '🏷️', { sw: 'jina' }),
        w('mũciĩ', 'home', '🏡', { sw: 'nyumbani' }),
        s('Wĩtagwo atĩa?', 'What is your name?', { sw: 'Unaitwa nani?', enAlts: ['What are you called?'] }),
        s('Njĩtagwo Wanjikũ.', 'I am called Wanjikũ.', { sw: 'Ninaitwa Wanjikũ.', enAlts: ['My name is Wanjikũ.'] }),
        s('Rĩĩtwa rĩakwa nĩ Kamau.', 'My name is Kamau.', { sw: 'Jina langu ni Kamau.' }),
        s('Wĩ kũ?', 'Where are you?', { sw: 'Uko wapi?' }),
        s('Ndĩ mũciĩ.', 'I am at home.', { sw: 'Niko nyumbani.', enAlts: ['I am home.'] }),
      ]),
      lesson('People', [
        w('mũndũ', 'person', '🧍', { sw: 'mtu' }),
        w('andũ', 'people', '👥', { sw: 'watu' }),
        w('mũrata', 'friend', '🧑‍🤝‍🧑', { sw: 'rafiki' }),
        w('mwarimũ', 'teacher', '🧑‍🏫', { sw: 'mwalimu' }),
        w('mũthuuri', 'man', '👨', { sw: 'mwanamume', enAlts: ['husband', 'elder'] }),
        w('mũtumia', 'woman', '👩', { sw: 'mwanamke', enAlts: ['wife'] }),
        s('Ũyũ nĩ mũrata wakwa.', 'This is my friend.', { sw: 'Huyu ni rafiki yangu.' }),
        s('Ndĩ mwarimũ.', 'I am a teacher.', { sw: 'Mimi ni mwalimu.' }),
      ]),
    ]),
    unit('Mũciĩ', 'Family', '👨‍👩‍👧', 'Mother, father, children and grandparents.', [
      g('Mount Kenya', 'Mount Kenya is called Kĩrĩnyaga, often explained as "the place of brightness". In tradition it was the dwelling place of Ngai (God).'),
    ], [
      lesson('Family', [
        w('maitũ', 'mother', '👩', { sw: 'mama', enAlts: ['my mother', 'mom'] }),
        w('baba', 'father', '👨', { sw: 'baba', enAlts: ['dad'] }),
        w('mwana', 'child', '🧒', { sw: 'mtoto' }),
        w('ciana', 'children', '👧', { sw: 'watoto' }),
        w('cũcũ', 'grandmother', '👵', { sw: 'bibi', enAlts: ['grandma'] }),
        w('guka', 'grandfather', '👴', { sw: 'babu', enAlts: ['grandpa'] }),
        w('nyũmba', 'house', '🏠', { sw: 'nyumba' }),
        s('Ũyũ nĩ maitũ.', 'This is my mother.', { sw: 'Huyu ni mama yangu.' }),
        s('Ũyũ nĩ baba.', 'This is my father.', { sw: 'Huyu ni baba yangu.' }),
        s('Ũyũ nĩ mwana wakwa.', 'This is my child.', { sw: 'Huyu ni mtoto wangu.' }),
        s('Ũyũ nĩ cũcũ.', 'This is grandmother.', { sw: 'Huyu ni bibi.', enAlts: ['This is my grandmother.'] }),
      ]),
    ]),
    unit('Irio na Mĩgero', 'Food & Numbers', '🔢', 'Count to ten and ask for food and drink.', [
      g('Pronunciation', 'Gĩkũyũ has seven vowels: ĩ sounds close to "e" in "bed" said with tight lips, ũ close to "o" in "go". "c" is said like "sh": cai (tea) sounds like "shai".'),
    ], [
      lesson('One to ten', [
        w('ĩmwe', 'one', '1️⃣', { sw: 'moja', enAlts: ['1'] }),
        w('igĩrĩ', 'two', '2️⃣', { sw: 'mbili', enAlts: ['2'] }),
        w('ithatũ', 'three', '3️⃣', { sw: 'tatu', enAlts: ['3'] }),
        w('inya', 'four', '4️⃣', { sw: 'nne', enAlts: ['4'] }),
        w('ithano', 'five', '5️⃣', { sw: 'tano', enAlts: ['5'] }),
        w('ithathatũ', 'six', '6️⃣', { sw: 'sita', enAlts: ['6'] }),
        w('mũgwanja', 'seven', '7️⃣', { sw: 'saba', enAlts: ['7'] }),
        w('inyanya', 'eight', '8️⃣', { sw: 'nane', enAlts: ['8'] }),
        w('kenda', 'nine', '9️⃣', { sw: 'tisa', enAlts: ['9'] }),
        w('ikũmi', 'ten', '🔟', { sw: 'kumi', enAlts: ['10'] }),
      ]),
      lesson('Food', [
        w('maaĩ', 'water', '💧', { sw: 'maji' }),
        w('iria', 'milk', '🥛', { sw: 'maziwa' }),
        w('irio', 'food', '🍲', { sw: 'chakula' }),
        w('cai', 'tea', '🫖', { sw: 'chai' }),
        w('ngima', 'ugali', '🌽', { sw: 'ugali' }),
        w('nyama', 'meat', '🥩', { sw: 'nyama' }),
        s('Ngwenda maaĩ.', 'I want water.', { sw: 'Ninataka maji.' }),
        s('Ngwenda cai.', 'I want tea.', { sw: 'Ninataka chai.' }),
        s('Ngwenda kũrĩa.', 'I want to eat.', { sw: 'Ninataka kula.' }),
        s('Ngwenda kũnyua iria.', 'I want to drink milk.', { sw: 'Ninataka kunywa maziwa.' }),
      ]),
      lesson('Animals', [
        w("ng'ombe", 'cow', '🐄', { sw: "ng'ombe" }),
        w('mbũri', 'goat', '🐐', { sw: 'mbuzi' }),
        w('ngui', 'dog', '🐕', { sw: 'mbwa' }),
        w('ngũkũ', 'chicken', '🐔', { sw: 'kuku' }),
        w('nyaũ', 'cat', '🐈', { sw: 'paka' }),
        w('njogu', 'elephant', '🐘', { sw: 'tembo' }),
        w('mũrũthi', 'lion', '🦁', { sw: 'simba' }),
      ]),
    ]),
    unit('Mwĩrĩ', 'The Body', '🙆', 'Head, hands, eyes and more.', [
      g('Help wanted', 'This unit is short on purpose. Native speakers can add more through the course builder (Community → Build courses).'),
    ], [
      lesson('The body', [
        w('mũtwe', 'head', '🙆', { sw: 'kichwa' }),
        w('guoko', 'hand', '✋', { sw: 'mkono', enAlts: ['arm'] }),
        w('kũgũrũ', 'leg', '🦵', { sw: 'mguu', enAlts: ['foot'] }),
        w('riitho', 'eye', '👁️', { sw: 'jicho' }),
        w('gũtũ', 'ear', '👂', { sw: 'sikio' }),
        w('iniũrũ', 'nose', '👃', { sw: 'pua' }),
        w('kanua', 'mouth', '👄', { sw: 'mdomo' }),
      ]),
    ]),
    unit('Mahinda na Mĩario', 'Time & Useful Phrases', '💬', 'Today, tomorrow and phrases you will use every day.', [
      g('Going somewhere?', '"Ũrathiĩ kũ?" (where are you going?) is a friendly everyday question, often answered "Ndĩrathiĩ mũciĩ" (I am going home).'),
    ], [
      lesson('Time words', [
        w('ũmũthĩ', 'today', '📍', { sw: 'leo' }),
        w('rũciũ', 'tomorrow', '📅', { sw: 'kesho' }),
        w('ira', 'yesterday', '⏮️', { sw: 'jana' }),
        w('rĩu', 'now', '⏰', { sw: 'sasa' }),
      ]),
      lesson('Everyday phrases', [
        s('Ũrathiĩ kũ?', 'Where are you going?', { sw: 'Unaenda wapi?' }),
        s('Ndĩrathiĩ mũciĩ.', 'I am going home.', { sw: 'Ninaenda nyumbani.' }),
        s('Ũka gũkũ.', 'Come here.', { sw: 'Njoo hapa.' }),
        s('Ikara thĩ.', 'Sit down.', { sw: 'Kaa chini.' }),
        s('Ndiũĩ.', "I don't know.", { sw: 'Sijui.', enAlts: ['I do not know.'] }),
        s('Nĩ ngwendete.', 'I love you.', { sw: 'Nakupenda.' }),
      ], [
        chat('Ũrathiĩ kũ?', 'Where are you going?', 'Ndĩrathiĩ mũciĩ.', 'I am going home.', ['Ikara thĩ.', 'Nĩ wega.'], 'Answer where you are going.'),
      ]),
      lesson('More food', [
        w('mbembe', 'maize', '🌽', { sw: 'mahindi', enAlts: ['corn'] }),
        w('mboco', 'beans', '🫘', { sw: 'maharagwe' }),
        w('githeri', 'githeri', '🥘', { sw: 'githeri', enAlts: ['maize and beans'], note: 'A dish of boiled maize and beans.' }),
        w('mũgate', 'bread', '🍞', { sw: 'mkate' }),
        w('marigũ', 'bananas', '🍌', { sw: 'ndizi' }),
      ]),
    ]),
  ],
  sounds: [
    { sym: 'ĩ', sound: 'Close to "e" in "bed", with lips tighter.', example: 'ĩmwe', exampleEn: 'one' },
    { sym: 'ũ', sound: 'Close to "o" in "go".', example: 'mũndũ', exampleEn: 'person' },
    { sym: 'c', sound: 'Like "sh" in "shoe".', example: 'cai', exampleEn: 'tea' },
    { sym: 'th', sound: 'Like "th" in "this".', example: 'thiĩ', exampleEn: 'go' },
    { sym: "ng'", sound: 'The "ng" in "singer".', example: "ng'ombe", exampleEn: 'cow' },
  ],
  culture: [g('Irio', 'Besides meaning "food", irio is a well-known dish of mashed potatoes, peas, greens and maize.')],
});
