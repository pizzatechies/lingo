import { chat, defineCourse, g, lesson, s, unit, w } from '../builder';

export default defineCourse({
  meta: {
    id: 'sheng', name: 'Sheng', nativeName: 'Sheng', tagline: "Nairobi's street language — Swahili and English, remixed",
    region: 'Nairobi & urban Kenya', community: 'Millions of young urban Kenyans', status: 'beta', icon: '🎧', color: '#0F7C80',
    ttsLang: 'sw', learnFrom: ['en', 'sw'], morphology: 'swahili',
  },
  hints: { niko: ['I am (at)', 'niko'], sina: ["I don't have", 'sina'], ni: ['is', 'ni'], gani: ['which / what', 'gani'], leo: ['today', 'leo'], baadaye: ['later', 'baadaye'], yuko: ['is (at)', 'yuko'], ameenda: ['has gone', 'ameenda'], nimeenda: ['I have gone', 'nimeenda'], sana: ['very', 'sana'], tudishi: ["let's eat", 'tule'], nadai: ['I want', 'nataka'], na: ['and / with', 'na'], tu: ['only', 'tu'], nipe: ['give me', 'nipe'], hiyo: ['that', 'hiyo'], wacha: ['let / leave it', 'acha'], kwa: ['at / by', 'kwa'], wako: ['they are (at)', 'wako'], tukutane: ["let's meet", 'tukutane'], nitumie: ['send me', 'nitumie'], zimeisha: ['are finished', 'zimeisha'] },
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
    unit('Doh na Dishi', 'Money & Food', '🍽️', 'Street food and the slang for shillings.', [
      g('Money slang', '"Mbao" is 20 bob, "soo" is 100 and "thao" is 1,000. You will hear them at every kiosk and matatu stage.'),
      g('Street food', 'Chapo (chapati), smokie (a sausage, often split with kachumbari — "smokie pasua") and mutura are Nairobi street favourites.'),
    ], [
      lesson('Food', [
        w('chapo', 'chapati', '🫓', { sw: 'chapati' }),
        w('smokie', 'sausage', '🌭', { sw: 'soseji', enAlts: ['smokie'] }),
        w('mutura', 'mutura', '🍖', { sw: 'mutura', enAlts: ['Kenyan sausage'] }),
        w('kudishi', 'to eat', '😋', { sw: 'kula', enAlts: ['eat'] }),
        s('Tudishi chapo na smokie.', "Let's eat chapati and smokies.", { sw: 'Tule chapati na soseji.', enAlts: ['Let us eat chapati and smokies.'] }),
        s('Nadai kudishi.', 'I want to eat.', { sw: 'Nataka kula.' }),
      ]),
      lesson('Money', [
        w('mbao', 'twenty bob', '🪙', { sw: 'shilingi ishirini', enAlts: ['twenty shillings', '20 shillings'] }),
        w('soo', 'a hundred bob', '💵', { sw: 'shilingi mia moja', enAlts: ['one hundred shillings', '100 shillings'] }),
        w('thao', 'a thousand bob', '💰', { sw: 'shilingi elfu moja', enAlts: ['one thousand shillings', '1000 shillings'] }),
        s('Ni soo.', "It's a hundred bob.", { sw: 'Ni shilingi mia moja.', enAlts: ['It is a hundred shillings.'] }),
        s('Niko na thao tu.', 'I only have a thousand.', { sw: 'Nina elfu moja tu.', enAlts: ['I only have a thousand bob.'] }),
        s('Nipe mbao.', 'Give me twenty bob.', { sw: 'Nipe shilingi ishirini.' }),
      ]),
    ]),
    unit('Vibes', 'Feelings & Vibes', '😎', 'Bored, angry, winning — say it the Nairobi way.', [
      g('Noma', '"Noma" can mean awesome or tough — tone and context decide. "Hiyo ni noma!" is usually praise.'),
    ], [
      lesson('Vibes', [
        w('kuboeka', 'to be bored', '😑', { sw: 'kuchoka', enAlts: ['be bored'] }),
        w('kujam', 'to get angry', '😠', { sw: 'kukasirika', enAlts: ['get angry', 'to be angry'] }),
        w('kuomoka', 'to make it', '🤑', { sw: 'kufanikiwa', enAlts: ['to get rich', 'to succeed'] }),
        w('kuhepa', 'to leave', '🏃', { sw: 'kuondoka', enAlts: ['to run off', 'leave'] }),
        w('noma', 'awesome', '🔥', { sw: 'nzuri sana', enAlts: ['tough', 'intense'] }),
        s('Nimeboeka.', "I'm bored.", { sw: 'Nimechoka.', enAlts: ['I am bored.'] }),
        s('Usijam.', "Don't get angry.", { sw: 'Usikasirike.', enAlts: ['Do not get angry.'] }),
        s('Ameomoka.', 'He has made it.', { sw: 'Amefanikiwa.', enAlts: ['She has made it.', 'He got rich.', 'She got rich.'] }),
        s('Wacha nihepe.', 'Let me leave.', { sw: 'Acha niondoke.', enAlts: ['Let me go.'] }),
        s('Hiyo ni noma!', "That's awesome!", { sw: 'Hiyo ni nzuri sana!', enAlts: ['That is awesome!'] }),
      ]),
    ]),
    unit('Watu na Place', 'People & Places', '🏙️', 'Who is who around the hood.', [
      g('Karao & kanjo', '"Karao" are the police; "kanjo" are city council askaris. The "stage" is where matatus pick up passengers.'),
    ], [
      lesson('People & places', [
        w('dem', 'girl', '👩', { sw: 'msichana' }),
        w('msupa', 'pretty girl', '💃', { sw: 'msichana mrembo', enAlts: ['beautiful girl'] }),
        w('mzae', 'parent', '🧓', { sw: 'mzazi', enAlts: ['old man', 'dad'] }),
        w('karao', 'police officer', '👮', { sw: 'polisi', enAlts: ['police', 'cop'] }),
        w('kanjo', 'city council officer', '🦺', { sw: 'askari wa kanjo', enAlts: ['council askari'] }),
        w('base', 'hangout spot', '🛋️', { sw: 'maskani', enAlts: ['spot', 'hangout'] }),
        w('stage', 'matatu stop', '🚏', { sw: 'kituo', enAlts: ['stage', 'bus stop'] }),
        s('Karao wako kwa stage.', 'The police are at the stage.', { sw: 'Polisi wako kituoni.', enAlts: ['The cops are at the stage.'] }),
        s('Tukutane base.', "Let's meet at the spot.", { sw: 'Tukutane maskani.', enAlts: ["Let's meet at the hangout."] }),
        s('Mzae ameenda shags.', 'Dad has gone upcountry.', { sw: 'Mzazi ameenda mashambani.', enAlts: ['My parent has gone upcountry.'] }),
      ]),
    ]),
    unit('Simu na Doh', 'Phone & M-Pesa', '📱', 'Missed calls, airtime and bundles.', [
      g('Flashing', 'To "flash" someone is to give them a missed call so they call you back — a classic when you are out of credo (airtime).'),
    ], [
      lesson('Phone life', [
        w('kuflash', 'to give a missed call', '📳', { sw: 'kupiga simu ya kukata', enAlts: ['to flash', 'flash'] }),
        w('credo', 'airtime', '📶', { sw: 'salio la simu', enAlts: ['credit'] }),
        w('bundles', 'data bundles', '🌐', { sw: 'kifurushi cha data', enAlts: ['data'] }),
        s('Nitakuflash.', "I'll give you a missed call.", { sw: 'Nitakupigia simu ya kukata.', enAlts: ["I'll flash you.", 'I will flash you.'] }),
        s('Sina credo.', "I don't have airtime.", { sw: 'Sina salio.', enAlts: ['I have no airtime.', 'I have no credit.'] }),
        s('Nitumie doh kwa M-Pesa.', 'Send me money on M-Pesa.', { sw: 'Nitumie pesa kwa M-Pesa.', enAlts: ['Send me money via M-Pesa.'] }),
        s('Bundles zimeisha.', 'My data is finished.', { sw: 'Kifurushi kimeisha.', enAlts: ['The bundles are finished.', 'My bundles are finished.'] }),
      ]),
    ]),
  ],
});
