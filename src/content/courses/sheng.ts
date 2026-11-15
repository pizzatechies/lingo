import { chat, defineCourse, g, lesson, s, unit, w } from '../builder';

export default defineCourse({
  meta: {
    id: 'sheng', name: 'Sheng', nativeName: 'Sheng', tagline: "Nairobi's street language — Swahili and English, remixed",
    region: 'Nairobi & urban Kenya', community: 'Millions of young urban Kenyans', status: 'beta', icon: '🎧', color: '#0F7C80',
    ttsLang: 'sw', learnFrom: ['en', 'sw'], morphology: 'swahili',
  },
  hints: { niko: ['I am (at)', 'niko'], sina: ["I don't have", 'sina'], ni: ['is', 'ni'], gani: ['which / what', 'gani'], leo: ['today', 'leo'], baadaye: ['later', 'baadaye'], yuko: ['is (at)', 'yuko'], ameenda: ['has gone', 'ameenda'], nimeenda: ['I have gone', 'nimeenda'], sana: ['very', 'sana'] },
  units: [
    unit('Salamu za Mtaa', 'Street Greetings', '✌️', 'Greet like a Nairobian.', [
      g('What is Sheng?', 'Sheng grew up in Nairobi\'s Eastlands estates from the 1960s–70s, mixing Swahili grammar with English and other Kenyan languages. Words change fast and vary by neighbourhood — keep it for friends, not job interviews!'),
    ], [
      lesson('Niaje!', [
        w('msee', 'guy', '🧍', { sw: 'jamaa', enAlts: ['dude', 'man'] }),
        w('wasee', 'guys', '👥', { sw: 'jamaa', enAlts: ['people', 'everyone'] }),
        w('manze', 'man!', '😮', { sw: 'jamani', enAlts: ['dude', 'man'] }),
        w('beshte', 'best friend', '🫂', { sw: 'rafiki', enAlts: ['bestie', 'friend'] }),
        w('fiti', 'fine', '👌', { sw: 'nzuri', enAlts: ['good', 'great'] }),
        s('Niaje?', "What's up?", { sw: 'Habari?', enAlts: ['How are you?', 'Hi.'] }),
        s('Poa!', 'Cool!', { sw: 'Nzuri!', enAlts: ['Fine!', 'Good!'] }),
        s('Sasa?', "What's up?", { sw: 'Habari?', enAlts: ['Hi.', 'How are you?'] }),
        s('Niaje msee?', "What's up, man?", { sw: 'Habari jamaa?', enAlts: ["What's up, guy?", "What's up, bro?"] }),
        s('Poa sana, manze.', 'Very cool, man.', { sw: 'Nzuri sana, jamani.', enAlts: ['Really good, man.'] }),
      ], [chat('Niaje?', "What's up?", 'Poa!', 'Cool!', ['Shikamoo.', 'Marahaba.'], 'Keep it casual — "Poa" or "Fiti".')]),
    ]),
    unit('Mtaa', 'Around Town', '🏙️', 'Home, money, matatus and family.', [
      g('Kanairo & shags', '"Kanairo" is Nairobi. "Shags" (or "ocha") is your rural home upcountry — where many people go for Christmas.'),
    ], [
      lesson('Town', [
        w('keja', 'house', '🏠', { sw: 'nyumba', enAlts: ['home', 'crib'] }),
        w('mat', 'matatu', '🚐', { sw: 'matatu' }),
        w('nduthi', 'motorbike', '🏍️', { sw: 'pikipiki', enAlts: ['boda boda'] }),
        w('doh', 'money', '💵', { sw: 'pesa', alts: ['ganji'], enAlts: ['cash'] }),
        w('Kanairo', 'Nairobi', '🏙️', { sw: 'Nairobi' }),
        w('shags', 'upcountry', '🌾', { sw: 'mashambani', enAlts: ['village', 'rural home', 'countryside'] }),
        w('mathe', 'mother', '👩', { sw: 'mama', enAlts: ['mom', 'mum'] }),
        w('buda', 'father', '👨', { sw: 'baba', enAlts: ['dad'] }),
        s('Niko keja.', 'I am at home.', { sw: 'Niko nyumbani.', enAlts: ['I am home.'] }),
        s('Nimeenda shags.', 'I have gone upcountry.', { sw: 'Nimeenda mashambani.', enAlts: ['I went upcountry.', 'I have gone to the village.'] }),
        s('Sina doh.', "I don't have money.", { sw: 'Sina pesa.', alts: ['Sina ganji.'], enAlts: ['I have no money.', 'I am broke.'] }),
        s('Tupande mat.', "Let's take a matatu.", { sw: 'Tupande matatu.', enAlts: ["Let's board a matatu."] }),
        s('Mathe yuko keja.', 'Mom is at home.', { sw: 'Mama yuko nyumbani.', enAlts: ['Mother is at home.', 'Mum is at home.'] }),
        s('Buda ameenda job.', 'Dad has gone to work.', { sw: 'Baba ameenda kazini.', enAlts: ['Father has gone to work.', 'Dad went to work.'] }),
      ]),
    ]),
    unit('Rada', 'Making Plans', '📡', 'Ask for the plan, hang out and talk.', [
      g('Form ni gani?', '"Form" or "rada" is the plan or the latest info. "Form ni gani?" is the classic way to ask what\'s happening.'),
    ], [
      lesson('Plans', [
        w('rada', 'info', '📡', { sw: 'habari', enAlts: ['plan', 'news'] }),
        w('form', 'plan', '📅', { sw: 'mpango' }),
        w('kuchill', 'to chill', '🛋️', { sw: 'kupumzika', enAlts: ['to relax', 'to hang out'] }),
        w('kubonga', 'to talk', '🗣️', { sw: 'kuongea', enAlts: ['to chat'] }),
        w('kudai', 'to want', '🙏', { sw: 'kutaka' }),
        s('Form ni gani?', "What's the plan?", { sw: 'Mpango ni upi?', enAlts: ['What is the plan?'] }),
        s('Rada ni gani?', "What's the news?", { sw: 'Habari gani?', enAlts: ["What's the plan?", "What's the info?"] }),
        s('Tuchill keja leo.', "Let's chill at home today.", { sw: 'Tupumzike nyumbani leo.', enAlts: ["Let's relax at home today."] }),
        s('Tubonge baadaye.', "Let's talk later.", { sw: 'Tuongee baadaye.', enAlts: ['Talk later.'] }),
        s('Imenoma!', "It's gotten serious!", { sw: 'Imekuwa ngumu!', enAlts: ["It's tough!", "It's serious!"] }),
        s('Nadai kuchill.', 'I want to chill.', { sw: 'Nataka kupumzika.', enAlts: ['I want to relax.'] }),
      ], [chat('Form ni gani?', "What's the plan?", 'Tuchill keja leo.', "Let's chill at home today.", ['Shikamoo, mzee.', 'Kwaheri ya kuonana.'], 'Answer with a plan.')]),
    ]),
  ],
});
