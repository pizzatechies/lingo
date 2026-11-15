import { defineCourse, g, lesson, s, unit, w } from '../builder';

export default defineCourse({
  meta: {
    id: 'kln', name: 'Kalenjin', nativeName: 'Kalenjin', tagline: 'A family of closely related languages of the Rift Valley',
    region: 'Rift Valley', community: '~6.3M people (2019 census)', status: 'beta', icon: '🏃', color: '#7B4BA0',
    specialChars: ["'"], learnFrom: ['en', 'sw'],
  },
  hints: { missing: ['very much', 'sana'] },
  units: [
    unit('Chamgei', 'Greetings', '👋', 'The essential greeting and thanks.', [
      g('A family of languages', 'Kalenjin covers related languages such as Kipsigis, Nandi, Keiyo, Tugen and Marakwet. Words here follow common Kipsigis/Nandi usage — local forms may differ.'),
    ], [
      lesson('Hello & thanks', [
        w('missing', 'very much', '💯', { sw: 'sana', alts: ['mising'] }),
        s('Chamgei!', 'Hello!', { sw: 'Jambo!', alts: ['Chamge!'], enAlts: ['Hi!'] }),
        s('Kongoi.', 'Thank you.', { sw: 'Asante.', enAlts: ['Thanks.'] }),
        s('Kongoi missing.', 'Thank you very much.', { sw: 'Asante sana.', alts: ['Kongoi mising.'], enAlts: ['Thanks a lot.'] }),
      ]),
    ]),
    unit('Kipsengwet', 'Numbers', '🔢', 'Count from one to ten.', [
      g('Runners', 'Many of the world\'s great distance runners — like Kipchoge Keino and Eliud Kipchoge — come from Kalenjin communities in the highlands of the Rift Valley.'),
    ], [
      lesson('One to ten', [
        w('agenge', 'one', '1️⃣', { sw: 'moja', enAlts: ['1'] }),
        w("aeng'", 'two', '2️⃣', { sw: 'mbili', enAlts: ['2'] }),
        w('somok', 'three', '3️⃣', { sw: 'tatu', enAlts: ['3'] }),
        w('angwan', 'four', '4️⃣', { sw: 'nne', enAlts: ['4'] }),
        w('mut', 'five', '5️⃣', { sw: 'tano', enAlts: ['5'] }),
        w('lo', 'six', '6️⃣', { sw: 'sita', enAlts: ['6'] }),
        w('tisap', 'seven', '7️⃣', { sw: 'saba', enAlts: ['7'] }),
        w('sisit', 'eight', '8️⃣', { sw: 'nane', enAlts: ['8'] }),
        w('sogol', 'nine', '9️⃣', { sw: 'tisa', enAlts: ['9'] }),
        w('taman', 'ten', '🔟', { sw: 'kumi', enAlts: ['10'] }),
      ]),
    ]),
    unit('Omitwogik', 'Food & Animals', '🥛', 'Milk, mursik and cattle.', [
      g('Mursik', 'Mursik is milk fermented in a gourd (sotet) that has been seasoned with ash. It is served at celebrations and to welcome returning heroes.'),
      g('Names', 'Boys\' names often start with Kip- and girls\' with Che- or Jep- (Kiprotich, Chebet, Jepkosgei). Names frequently reflect the circumstances of birth.'),
    ], [
      lesson('Food & cattle', [
        w('beek', 'water', '💧', { sw: 'maji' }),
        w('chego', 'milk', '🥛', { sw: 'maziwa' }),
        w('mursik', 'fermented milk', '🍶', { sw: 'maziwa lala', enAlts: ['mursik', 'sour milk'] }),
        w('kimyet', 'ugali', '🌽', { sw: 'ugali' }),
        w('tany', 'cow', '🐄', { sw: "ng'ombe" }),
      ]),
    ]),
  ],
});
