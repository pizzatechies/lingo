import { chat, defineCourse, g, lesson, s, unit, w } from '../builder';

export default defineCourse({
  meta: {
    id: 'mas', name: 'Maa', nativeName: 'ɔl Maa', tagline: 'Spoken by the Maasai and Samburu of southern and northern Kenya',
    region: 'Southern Rift · Narok · Kajiado', community: '~1.2M Maasai (2019 census)', status: 'beta', icon: '🐄', color: '#C2302E',
    specialChars: ["'"], learnFrom: ['en', 'sw'],
  },
  hints: { oleng: ['very', 'sana'] },
  units: [
    unit('Sopa', 'Greetings', '👋', 'Greet people and say thank you.', [
      g('Greeting by age and gender', 'Greetings in Maa depend on who you greet. "Sopa" is a general hello (reply "Epa"); women are often greeted with "Takwenya", answered with "Iko".'),
    ], [
      lesson('Hello', [
        w('sidai', 'good', '👍', { sw: 'nzuri', enAlts: ['fine'] }),
        w('oleng', 'very', '💯', { sw: 'sana', enAlts: ['a lot'] }),
        s('Sopa!', 'Hello!', { sw: 'Jambo!', alts: ['Supa!'], enAlts: ['Hi!'] }),
        s('Epa!', 'Hello! (reply)', { sw: 'Jambo! (jibu)', alts: ['Ipa!', 'Hepa!'], enAlts: ['Hello!', 'Hi!'] }),
        s('Takwenya!', 'Hello! (to a woman)', { sw: 'Jambo! (kwa mwanamke)', enAlts: ['Hello!'] }),
        s('Iko!', 'Hello! (reply to Takwenya)', { sw: 'Jambo! (jibu)', enAlts: ['Hello!'] }),
        s('Ashe.', 'Thank you.', { sw: 'Asante.', enAlts: ['Thanks.'] }),
        s('Ashe oleng.', 'Thank you very much.', { sw: 'Asante sana.', enAlts: ['Thanks a lot.'] }),
      ], [
        chat('Sopa!', 'Hello!', 'Epa!', 'Hello! (reply)', ['Ashe oleng.', 'Iko!'], '"Sopa" is answered with "Epa".'),
        chat('Takwenya!', 'Hello! (to a woman)', 'Iko!', 'Hello! (reply)', ['Epa!', 'Sidai.'], '"Takwenya" is answered with "Iko".'),
      ]),
    ]),
    unit('Inkanaiyioi', 'Numbers', '🔢', 'Count from one to ten.', [g('Counting cattle', 'Cattle are at the heart of Maasai life, and counting them well has always mattered.')], [
      lesson('One to ten', [
        w('nabo', 'one', '1️⃣', { sw: 'moja', enAlts: ['1'] }),
        w('are', 'two', '2️⃣', { sw: 'mbili', enAlts: ['2'] }),
        w('uni', 'three', '3️⃣', { sw: 'tatu', enAlts: ['3'] }),
        w("ong'uan", 'four', '4️⃣', { sw: 'nne', enAlts: ['4'] }),
        w('imiet', 'five', '5️⃣', { sw: 'tano', enAlts: ['5'] }),
        w('ile', 'six', '6️⃣', { sw: 'sita', enAlts: ['6'] }),
        w('naapishana', 'seven', '7️⃣', { sw: 'saba', enAlts: ['7'] }),
        w('isiet', 'eight', '8️⃣', { sw: 'nane', enAlts: ['8'] }),
        w('naudo', 'nine', '9️⃣', { sw: 'tisa', enAlts: ['9'] }),
        w('tomon', 'ten', '🔟', { sw: 'kumi', enAlts: ['10'] }),
      ]),
    ]),
    unit('Enkang', 'Home & Cattle', '🏡', 'Cattle, water, milk and the homestead.', [
      g('Nairobi\'s name', 'Nairobi comes from the Maa phrase "Enkare Nairobi" — "the place of cool waters".'),
      g('Adumu', 'The famous jumping dance of young Maasai men is called adumu. Red shuka cloths and colourful beadwork carry meaning about age and status.'),
    ], [
      lesson('Home', [
        w('enkiteng', 'cow', '🐄', { sw: "ng'ombe" }),
        w('inkishu', 'cattle', '🐂', { sw: "ng'ombe wengi" }),
        w('enkare', 'water', '💧', { sw: 'maji' }),
        w('kule', 'milk', '🥛', { sw: 'maziwa' }),
        w('enkang', 'homestead', '🏡', { sw: 'boma', enAlts: ['home', 'village'] }),
        w('enkerai', 'child', '🧒', { sw: 'mtoto' }),
      ]),
    ]),
  ],
});
