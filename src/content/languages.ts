/**
 * Every Kenyan language Lugha Zetu tracks. Languages with a `course` have a hand-written course;
 * all others get a community course built by native speakers translating the Kiswahili course.
 * Community sizes are ethnic-group populations from the 2019 Kenya census where known.
 */
export type Family = 'Bantu' | 'Nilotic' | 'Cushitic' | 'Other';
export interface KenyanLanguage {
  id: string;
  name: string;
  family: Family;
  region: string;
  community?: string;
  /** Id of a hand-written course, when one exists. */
  course?: string;
  note?: string;
}

export const LANGUAGES: KenyanLanguage[] = [
  // Bantu
  { id: 'sw', name: 'Kiswahili', family: 'Bantu', region: 'All of Kenya', community: 'National language', course: 'sw' },
  { id: 'ki', name: 'Gĩkũyũ', family: 'Bantu', region: 'Central Kenya', community: '~8.1M people', course: 'ki' },
  { id: 'luy', name: 'Oluluhya', family: 'Bantu', region: 'Western Kenya', community: '~6.8M people', note: 'Many varieties — Lubukusu, Lulogooli, Olunyore, Luwanga, Lwidakho, Lwisukha, Olukabarasi, Olusamia and more. Say which one in the notes.' },
  { id: 'kam', name: 'Kikamba', family: 'Bantu', region: 'Machakos · Kitui · Makueni', community: '~4.7M people' },
  { id: 'guz', name: 'Ekegusii', family: 'Bantu', region: 'Kisii · Nyamira', community: '~2.7M people' },
  { id: 'nyf', name: 'Kigiryama (Mijikenda)', family: 'Bantu', region: 'Coast', community: '~2.5M Mijikenda', note: 'Other Mijikenda languages (Chidigo, Chiduruma, Kichonyi, Kirabai…) are welcome as notes.' },
  { id: 'mer', name: 'Kimeru', family: 'Bantu', region: 'Meru · Tharaka-Nithi', community: '~2.0M people' },
  { id: 'ebu', name: 'Kiembu', family: 'Bantu', region: 'Embu' },
  { id: 'mbeere', name: 'Kimbeere', family: 'Bantu', region: 'Embu (Mbeere)' },
  { id: 'thk', name: 'Kitharaka', family: 'Bantu', region: 'Tharaka-Nithi' },
  { id: 'cuh', name: 'Kichuka', family: 'Bantu', region: 'Tharaka-Nithi' },
  { id: 'dav', name: 'Kidawida (Taita)', family: 'Bantu', region: 'Taita-Taveta' },
  { id: 'tvs', name: 'Kitaveta', family: 'Bantu', region: 'Taita-Taveta' },
  { id: 'dig', name: 'Chidigo', family: 'Bantu', region: 'Kwale' },
  { id: 'dug', name: 'Chiduruma', family: 'Bantu', region: 'Kwale' },
  { id: 'pkb', name: 'Kipokomo', family: 'Bantu', region: 'Tana River' },
  { id: 'kuj', name: 'Kikuria', family: 'Bantu', region: 'Migori' },
  { id: 'suba', name: 'Olusuba', family: 'Bantu', region: 'Homa Bay · Migori' },
  // Nilotic
  { id: 'luo', name: 'Dholuo', family: 'Nilotic', region: 'Western Kenya', community: '~5.1M people', course: 'luo' },
  { id: 'kln', name: 'Kalenjin', family: 'Nilotic', region: 'Rift Valley', community: '~6.3M people', course: 'kln' },
  { id: 'sgc', name: 'Kipsigis', family: 'Nilotic', region: 'Kericho · Bomet' },
  { id: 'niq', name: 'Nandi', family: 'Nilotic', region: 'Nandi' },
  { id: 'tuy', name: 'Tugen', family: 'Nilotic', region: 'Baringo' },
  { id: 'keiyo', name: 'Keiyo', family: 'Nilotic', region: 'Elgeyo-Marakwet' },
  { id: 'mrt', name: 'Markweeta (Marakwet)', family: 'Nilotic', region: 'Elgeyo-Marakwet' },
  { id: 'spy', name: 'Sabaot', family: 'Nilotic', region: 'Mt Elgon' },
  { id: 'pko', name: 'Pökoot', family: 'Nilotic', region: 'West Pokot · Baringo' },
  { id: 'mas', name: 'Maa', family: 'Nilotic', region: 'Narok · Kajiado', community: '~1.2M people', course: 'mas' },
  { id: 'saq', name: 'Samburu', family: 'Nilotic', region: 'Samburu' },
  { id: 'tuv', name: "Ng'aturkana", family: 'Nilotic', region: 'Turkana', community: '~1.0M people' },
  { id: 'teo', name: 'Ateso', family: 'Nilotic', region: 'Busia' },
  { id: 'oki', name: 'Ogiek', family: 'Nilotic', region: 'Mau Forest · Mt Elgon' },
  // Cushitic
  { id: 'so', name: 'Af-Soomaali', family: 'Cushitic', region: 'North Eastern Kenya', community: '~2.8M people', course: 'so' },
  { id: 'gax', name: 'Afaan Borana', family: 'Cushitic', region: 'Marsabit · Isiolo' },
  { id: 'rel', name: 'Rendille', family: 'Cushitic', region: 'Marsabit' },
  { id: 'gabra', name: 'Gabra', family: 'Cushitic', region: 'Marsabit' },
  { id: 'orc', name: 'Orma', family: 'Cushitic', region: 'Tana River' },
  { id: 'dsh', name: 'Daasanach', family: 'Cushitic', region: 'Lake Turkana (Ileret)' },
  { id: 'bji', name: 'Burji', family: 'Cushitic', region: 'Marsabit' },
  { id: 'aww', name: 'Aweer (Boni)', family: 'Cushitic', region: 'Lamu' },
  { id: 'dal', name: 'Dahalo', family: 'Cushitic', region: 'Tana River', note: 'Endangered — recordings are especially valuable.' },
  { id: 'elo', name: 'El Molo', family: 'Cushitic', region: 'Lake Turkana', note: 'Critically endangered — every recording helps preserve it.' },
  // Other
  { id: 'sheng', name: 'Sheng', family: 'Other', region: 'Urban Kenya', course: 'sheng' },
  { id: 'xki', name: 'Kenyan Sign Language', family: 'Other', region: 'All of Kenya', note: 'Contributors can describe signs in the notes; video support is planned.' },
  { id: 'kcn', name: 'Kinubi', family: 'Other', region: 'Kibera · Bombo', note: 'Arabic-based creole of the Nubian community.' },
];

export const languageById = (id: string) => LANGUAGES.find((l) => l.id === id);
export const communityLanguages = () => LANGUAGES.filter((l) => !l.course);
