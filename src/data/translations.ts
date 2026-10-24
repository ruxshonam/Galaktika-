import type { Language } from '../types/astronomy';

export const UI_TEXT = {
  en: {
    navExplorer: 'Explorer',
    navPlanets: 'Planets',
    navStars: 'Stars',
    navMissions: 'Missions',
    navLearn: 'Learn',
    navSearchAction: 'Search Universe',

    // Hero (Home)
    heroHeadline: 'Explore the Universe in 3D.',
    heroSubtitle: 'Koinotni yangi o‘lchamda kashf eting.',
    heroDescription:
      'Interactive 3D solar system observatory powered by NASA JPL J2000 orbital mechanics, physically inspired planetary surfaces, ten notable stars, and space exploration history.',
    ctaExploreCosmos: 'Kosmosni kashf etish',
    ctaExploreCosmosSub: 'Launch 3D Explorer',
    ctaViewPlanets: 'Sayyoralarni ko‘rish',
    ctaViewPlanetsSub: 'Planets & Moons',
    heroQuickTour: 'Start Guided Tour',
    heroScaleNotice:
      'Exploratory 3D Scale: Planetary radii and orbital distances are non-linearly scaled so moons, rings, and outer worlds remain visible together.',

    // Explorer HUD & Dock
    play: 'Resume',
    pause: 'Pause',
    liveJ2000: 'Real-Time J2000',
    liveJ2000Desc: 'Documented NASA JPL J2000 Keplerian Ephemeris (1s = 1s UTC)',
    eduSimDesc: 'Accelerated Educational Visualization (Keplerian Orbits)',
    resetNow: 'Sync UTC Now',
    resetCamera: 'Reset Overview',
    returnToSystem: 'Return to Solar System',
    orbitsToggle: 'Orbits',
    labelsToggle: 'Labels',
    beltsToggle: 'Belts',
    proportionalToggle: 'Relative Planet Sizes',
    exploratoryToggle: 'Exploratory Sizes',
    hideControls: 'Hide Controls',
    showControls: 'Show Controls',
    startTour: 'Guided Tour',
    exitTour: 'Exit Tour',
    prevStop: 'Previous',
    nextStop: 'Next Stop',
    bookmarks: 'Saved',
    noBookmarks: 'No bookmarked celestial bodies yet. Click the bookmark icon on any planet, moon, or star to save it here.',
    searchPlaceholder: 'Search planets, moons, dwarf planets, stars, or missions...',
    noSearchResults: 'No matching celestial objects or missions found.',

    // Categories
    catAll: 'All Bodies',
    catPlanets: 'Planets',
    catMoons: 'Moons',
    catDwarf: 'Dwarf Planets',
    catSmall: 'Belts & Comets',
    catStar: 'Star',

    // Inspector Metrics
    diameter: 'Mean Diameter',
    mass: 'Mass',
    gravity: 'Surface Gravity',
    orbitalPeriod: 'Orbital Period',
    distanceFromSun: 'Distance from Sun',
    meanTemperature: 'Mean Temperature',
    atmosphere: 'Atmosphere',
    knownMoons: 'Confirmed Moons',
    majorMoonsIn3D: 'Interactive Moons',
    parentBody: 'Orbits',
    factsHeading: 'Confirmed Scientific Facts',
    explorationHeading: 'Exploration & Missions',
    sourceLabel: 'Data & Ephemeris Source',
    inspectIn3D: 'Fly to Object in 3D',
    saveBookmark: 'Bookmark',
    savedBookmark: 'Bookmarked',
    dataUnavailable: 'Data unavailable',

    // Planets & Comparison Page
    planetsTitle: 'Planets, Dwarf Planets & Moons',
    planetsSubtitle:
      'Explore all eight major planets and five IAU-recognized dwarf planets with verified physical measurements, atmospheric compositions, and interactive moon systems.',
    compareTitle: 'Interactive Planetary Comparison Lab',
    compareSubtitle:
      'Select any two worlds to compare true relative diameters, surface gravity, orbital periods, and thermal environments.',
    bodyA: 'Primary World',
    bodyB: 'Comparison World',
    weightCalcLabel: 'If you weigh 70 kg on Earth, here you would weigh:',

    // Stars Page
    starsTitle: 'Ten Notable Stars in Earth’s Sky',
    starsSubtitle:
      'Explore ten of the brightest and most scientifically celebrated stars visible from Earth — spanning our G2V Sun to colossal red supergiants.',
    starsScientificNote:
      'Scientific Distinction: These ten stars are selected for observational prominence and astrophysical diversity — they are NOT the ten largest stars in the universe. Apparent magnitude (m_V) measures brightness as seen from Earth, whereas intrinsic luminosity (L☉) measures true total energy output.',
    compareWithSun3D: 'Show Sun Scale Reference in 3D',
    spectralClass: 'Spectral Classification',
    distanceEarth: 'Distance from Earth',
    surfaceTemp: 'Effective Temperature',
    luminosity: 'Intrinsic Luminosity',
    apparentMag: 'Apparent Magnitude (m_V)',
    stellarRadius: 'Radius (Solar = 1 R☉)',
    stellarMass: 'Mass (Solar = 1 M☉)',
    tempSpectrumTitle: 'Stellar Blackbody Temperature & Radius Comparison',

    // Missions Page
    missionsTitle: 'Historic & Active Space Missions',
    missionsSubtitle:
      'Landmark robotic observatories, planetary orbiters, landers, and interstellar probes from NASA, ESA, and JAXA.',
    filterAllAgencies: 'All Missions',
    filterActive: 'Active Only',
    filterCompleted: 'Completed',
    officialSource: 'Official Mission Archive',
    keyDiscoveries: 'Confirmed Mission Milestones',
    spacecraftSpecs: 'Spacecraft & Instruments',

    // Learning Center
    learnTitle: 'Astronomy Learning Center',
    learnSubtitle:
      'Interactive physics labs, cosmic scale calculators, beginner-friendly astrophysics guides, and a knowledge check quiz.',
    lightTimeTitle: 'Interactive Speed-of-Light Signal Lab',
    lightTimeDesc:
      'Light travels at exactly 299,792.458 km/s in vacuum. Select a destination to calculate how long sunlight or a spacecraft radio signal takes to travel.',
    fromSun: 'Sunlight from Sun',
    fromEarth: 'Radio Signal from Earth (Min Approach)',
    keplerLabTitle: 'Interactive Keplerian Orbit & Eccentricity Lab',
    keplerLabDesc:
      'Adjust orbital eccentricity (e) to observe how planets sweep equal areas in equal times — accelerating near perihelion and slowing near aphelion.',
    eccentricityLabel: 'Orbital Eccentricity (e)',
    quizTitle: 'Solar System & Stellar Astronomy Quiz',
    quizSubtitle: 'Test your knowledge across 8 verified astronomy questions.',
    checkAnswer: 'Submit Answer',
    nextQuestion: 'Next Question',
    restartQuiz: 'Retake Quiz',
    quizComplete: 'Assessment Complete',
    yourScore: 'Final Score',

    // WebGL Fallback
    webglFallbackTitle: 'Interactive 2D Solar System Atlas (WebGL Unavailable)',
    webglFallbackDesc:
      'Your current browser or hardware environment has disabled WebGL 3D acceleration. Explore all planets, moons, and verified NASA data using this interactive 2D orbital diagram.',
  },
  uz: {
    navExplorer: '3D Tizim',
    navPlanets: 'Sayyoralar',
    navStars: 'Yulduzlar',
    navMissions: 'Missiyalar',
    navLearn: 'Ta’lim',
    navSearchAction: 'Qidiruv',

    // Hero (Home)
    heroHeadline: 'Explore the Universe in 3D.',
    heroSubtitle: 'Koinotni yangi o‘lchamda kashf eting.',
    heroDescription:
      'NASA JPL J2000 orbital mexanikasi, realistik sayyora yuzalari, o‘nta mashhur yulduz va kosmik missiyalar tarixiga asoslangan interaktiv 3D astronomiya platformasi.',
    ctaExploreCosmos: 'Kosmosni kashf etish',
    ctaExploreCosmosSub: '3D Quyosh tizimini ochish',
    ctaViewPlanets: 'Sayyoralarni ko‘rish',
    ctaViewPlanetsSub: 'Sayyoralar va yo‘ldoshlar',
    heroQuickTour: 'Ekskursiyani boshlash',
    heroScaleNotice:
      'Vizual masshtab eslatmasi: Yo‘ldoshlar, halqalar va uzoq sayyoralar bir sahnada aniq ko‘rinishi uchun o‘lchamlar va masofalar mutanosib ravishda moslashtirilgan.',

    // Explorer HUD & Dock
    play: 'Davom ettirish',
    pause: 'To‘xtatish',
    liveJ2000: 'Real vaqt (J2000)',
    liveJ2000Desc: 'Hujjatlashtirilgan NASA JPL J2000 Kepler efemeridasi (1s = 1s UTC)',
    eduSimDesc: 'Tezlashtirilgan o‘quv vizualizatsiyasi (Kepler orbitalari)',
    resetNow: 'Hozirgi UTC vaqt',
    resetCamera: 'Umumiy ko‘rinish',
    returnToSystem: 'Quyosh tizimiga qaytish',
    orbitsToggle: 'Orbitalar',
    labelsToggle: 'Yorliqlar',
    beltsToggle: 'Kamarlar',
    proportionalToggle: 'Nisbiy o‘lchamlar',
    exploratoryToggle: 'Qulay masshtab',
    hideControls: 'Panelni yashirish',
    showControls: 'Panelni ko‘rsatish',
    startTour: 'Sayohat rejimi',
    exitTour: 'Sayohatdan chiqish',
    prevStop: 'Oldingi',
    nextStop: 'Keyingi manzil',
    bookmarks: 'Saqlanganlar',
    noBookmarks: 'Hozircha saqlangan osmon jismlari yo‘q. Istalgan sayyora, yo‘ldosh yoki yulduzdagi xatcho‘p tugmasini bosing.',
    searchPlaceholder: 'Sayyora, yo‘ldosh, mitti sayyora, yulduz yoki missiyani qidiring...',
    noSearchResults: 'Hech qanday osmon jismi yoki missiya topilmadi.',

    // Categories
    catAll: 'Barchasi',
    catPlanets: 'Sayyoralar',
    catMoons: 'Yo‘ldoshlar',
    catDwarf: 'Mitti sayyoralar',
    catSmall: 'Kamarlar va kometalar',
    catStar: 'Yulduz',

    // Inspector Metrics
    diameter: 'O‘rtacha diametri',
    mass: 'Massasi',
    gravity: 'Sirt tortishish kuchi',
    orbitalPeriod: 'Orbital davri',
    distanceFromSun: 'Quyoshdan masofasi',
    meanTemperature: 'O‘rtacha harorati',
    atmosphere: 'Atmosferasi',
    knownMoons: 'Tasdiqlangan yo‘ldoshlar',
    majorMoonsIn3D: 'Interaktiv yo‘ldoshlar',
    parentBody: 'Aylanish markazi',
    factsHeading: 'Tasdiqlangan ilmiy faktlar',
    explorationHeading: 'Tadqiqotlar tarixi va missiyalar',
    sourceLabel: 'Ma’lumotlar manbasi',
    inspectIn3D: '3D sahnada ko‘rish',
    saveBookmark: 'Saqlash',
    savedBookmark: 'Saqlangan',
    dataUnavailable: 'Ma’lumot mavjud emas',

    // Planets & Comparison Page
    planetsTitle: 'Sayyoralar, mitti sayyoralar va yo‘ldoshlar',
    planetsSubtitle:
      'Sakkizta asosiy sayyora va Xalqaro Astronomiya Ittifoqi tomonidan tan olingan beshta mitti sayyoraning aniq fizik ko‘rsatkichlari hamda tabiiy yo‘ldoshlarini o‘rganing.',
    compareTitle: 'Sayyoralarni taqqoslash laboratoriyasi',
    compareSubtitle:
      'Ikki osmon jismini tanlab, ularning haqiqiy nisbiy o‘lchami, tortishish kuchi, orbital davri va haroratini solishtiring.',
    bodyA: 'Birinchi jism',
    bodyB: 'Ikkinchi jism',
    weightCalcLabel: 'Agar Yerdagi vazningiz 70 kg bo‘lsa, bu yerda vazningiz:',

    // Stars Page
    starsTitle: 'Osmondagi o‘nta mashhur yulduz',
    starsSubtitle:
      'Yerdan kuzatiladigan eng yorqin va ilmiy jihatdan muhim o‘nta yulduz — bizning G2V sinfidagi Quyoshimizdan tortib ulkan qizil o‘ta gigantlargacha.',
    starsScientificNote:
      'Ilmiy izoh: Ushbu o‘nta yulduz kuzatuv yorqinligi va astrofizik ahamiyati bo‘yicha tanlangan — ular koinotdagi eng katta 10 ta yulduz EMAS. Ko‘rinma yulduz kattaligi (m_V) Yerdan ko‘rinadigan yorqinlikni, asl yorqinlik (L☉) esa yulduz chiqaradigan haqiqiy quvvatni ifodalaydi.',
    compareWithSun3D: '3D sahnada Quyosh bilan solishtirish',
    spectralClass: 'Spektral sinfi',
    distanceEarth: 'Yerdan masofasi',
    surfaceTemp: 'Sirt harorati',
    luminosity: 'Asl yorqinligi (L☉)',
    apparentMag: 'Ko‘rinma kattaligi (m_V)',
    stellarRadius: 'Radiusi (Quyosh = 1 R☉)',
    stellarMass: 'Massasi (Quyosh = 1 M☉)',
    tempSpectrumTitle: 'Yulduzlar harorati va radiusi taqqoslanmasi',

    // Missions Page
    missionsTitle: 'Tarixiy va faol kosmik missiyalar',
    missionsSubtitle:
      'NASA, ESA va JAXA tomonidan uchirilgan eng muhim kosmik teleskoplar, sayyoralararo zondlar va marsoxodlar.',
    filterAllAgencies: 'Barcha missiyalar',
    filterActive: 'Faol missiyalar',
    filterCompleted: 'Yakunlangan',
    officialSource: 'Rasmiy missiya sahifasi',
    keyDiscoveries: 'Muhim ilmiy natijalar',
    spacecraftSpecs: 'Qurilma va asboblar',

    // Learning Center
    learnTitle: 'Astronomiya ta’lim markazi',
    learnSubtitle:
      'Interaktiv fizika laboratoriyalari, yorug‘lik tezligi kalkulyatori, boshlovchilar uchun qo‘llanmalar va astronomik test.',
    lightTimeTitle: 'Yorug‘lik tezligi va radioaloqa laboratoriyasi',
    lightTimeDesc:
      'Yorug‘lik vakuumda soniyasiga aniq 299 792,458 km tezlikda harakatlanadi. Quyosh nuri yoki Yerdan yuborilgan radiosignal qancha vaqtda yetib borishini hisoblang.',
    fromSun: 'Quyoshdan nur yetib borishi',
    fromEarth: 'Yerdan radiosignal (yaqin masofa)',
    keplerLabTitle: 'Kepler qonunlari va ekssentrisitet simulyatori',
    keplerLabDesc:
      'Orbita ekssentrisitetini (e) o‘zgartirib, sayyoraning perigeliyda tezlashishi va afeliyda sekinlashishini kuzating.',
    eccentricityLabel: 'Orbita ekssentrisiteti (e)',
    quizTitle: 'Quyosh tizimi va yulduzlar bo‘yicha Viktorina',
    quizSubtitle: '8 ta tasdiqlangan ilmiy savol orqali bilimingizni sinab ko‘ring.',
    checkAnswer: 'Javobni tekshirish',
    nextQuestion: 'Keyingi savol',
    restartQuiz: 'Qayta boshlash',
    quizComplete: 'Viktorina yakunlandi',
    yourScore: 'Natijangiz',

    // WebGL Fallback
    webglFallbackTitle: 'Interaktiv 2D Quyosh tizimi xaritasi (WebGL o‘chirilgan)',
    webglFallbackDesc:
      'Brauzeringizda WebGL 3D tezlatgichi mavjud emas. Ushbu interaktiv 2D sxema orqali barcha sayyoralar va NASA ma’lumotlarini o‘rganishingiz mumkin.',
  },
} as const;

export function tText(obj: { en: string; uz: string }, lang: Language): string {
  return obj[lang] || obj.en;
}
