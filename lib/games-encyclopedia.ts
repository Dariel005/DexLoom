export interface GameReleaseEntry {
  title: string;
  platform: string;
  releaseWindow: string;
  note: string;
  imageSrc: string;
  imageAlt: string;
}

export interface MainlineGenerationEntry {
  key: string;
  generationLabel: string;
  eraLabel: string;
  regionLabel: string;
  summary: string;
  highlights: string[];
  coverImageSrc: string;
  coverImageAlt: string;
  releases: GameReleaseEntry[];
}

export interface SecondarySagaEntry {
  key: string;
  title: string;
  focus: string;
  summary: string;
  notableGames: string[];
  imageSrc: string;
  imageAlt: string;
}

export interface MobileGameEntry {
  key: string;
  title: string;
  platform: string;
  launchLabel: string;
  category: string;
  loop: string;
  imageSrc: string;
  imageAlt: string;
}

export const MAINLINE_GENERATIONS: MainlineGenerationEntry[] = [
  {
    key: "gen1",
    generationLabel: "Generation I",
    eraLabel: "1996-1999",
    regionLabel: "Kanto",
    summary: "The original RPG formula starts here: capture, train, trade, and challenge the league.",
    highlights: ["151 base Pokemon", "Link cable trading", "Classic Indigo League structure"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/8/80/Red_EN_boxart.png/600px-Red_EN_boxart.png",
    coverImageAlt: "Pokemon Red cover art",
    releases: [
      {
        title: "Pokemon Red Version",
        platform: "Game Boy",
        releaseWindow: "1996-1998",
        note: "Foundational release that established the core capture and battle loop.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/04/13/pokemon-red-button-2022-1649888301240.jpg",
        imageAlt: "Pokemon Red Version key art"
      },
      {
        title: "Pokemon Green Version",
        platform: "Game Boy",
        releaseWindow: "1996",
        note: "Original Japan companion version in the first-generation launch lineup.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/11/15/pokemongreen-1668488714297.jpg",
        imageAlt: "Pokemon Green Version key art"
      },
      {
        title: "Pokemon Blue Version",
        platform: "Game Boy",
        releaseWindow: "1996-1998",
        note: "Complements the original pair and anchors early trade completion goals.",
        imageSrc: "https://assets-prd.ignimgs.com/2021/12/14/pokemonblue-1639518061112.jpg",
        imageAlt: "Pokemon Blue Version key art"
      },
      {
        title: "Pokemon Yellow: Special Pikachu Edition",
        platform: "Game Boy",
        releaseWindow: "1998-1999",
        note: "Enhanced variant inspired by the anime era with Pikachu as the starter.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-yellow---button-1558057648010.jpg",
        imageAlt: "Pokemon Yellow key art"
      }
    ]
  },
  {
    key: "gen2",
    generationLabel: "Generation II",
    eraLabel: "1999-2001",
    regionLabel: "Johto",
    summary: "Expands depth with breeding, day/night cycles, and a major postgame region revisit.",
    highlights: ["Breeding system", "Day and night cycle", "Postgame access to Kanto"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/c/c7/Gold_EN_boxart.png/600px-Gold_EN_boxart.png",
    coverImageAlt: "Pokemon Gold cover art",
    releases: [
      {
        title: "Pokemon Gold Version",
        platform: "Game Boy Color",
        releaseWindow: "1999-2000",
        note: "Introduces Johto and 100 new species with a two-region endgame route.",
        imageSrc: "https://assets-prd.ignimgs.com/2021/12/14/pokemongold-1639518454781.jpg",
        imageAlt: "Pokemon Gold Version key art"
      },
      {
        title: "Pokemon Silver Version",
        platform: "Game Boy Color",
        releaseWindow: "1999-2000",
        note: "Companion release with version-exclusive encounters and trades.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-silver---button-1558057647925.jpg",
        imageAlt: "Pokemon Silver Version key art"
      },
      {
        title: "Pokemon Crystal Version",
        platform: "Game Boy Color",
        releaseWindow: "2000-2001",
        note: "Refined edition with extra events, animation polish, and expanded character focus.",
        imageSrc: "https://assets-prd.ignimgs.com/2021/12/14/pokemoncrystal-1639519080473.jpg",
        imageAlt: "Pokemon Crystal Version key art"
      }
    ]
  },
  {
    key: "gen3",
    generationLabel: "Generation III",
    eraLabel: "2002-2006",
    regionLabel: "Hoenn + Kanto",
    summary: "Game Boy Advance era with a major technical refresh and early remake strategy.",
    highlights: ["Abilities and natures", "Contest systems", "Kanto remakes"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/6/65/Emerald_EN_boxart.jpg/600px-Emerald_EN_boxart.jpg",
    coverImageAlt: "Pokemon Emerald cover art",
    releases: [
      {
        title: "Pokemon Ruby Version",
        platform: "Game Boy Advance",
        releaseWindow: "2002-2003",
        note: "Defines Hoenn with new battle systems, abilities, and nature mechanics.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-ruby---button-sm-1558057647902.jpg",
        imageAlt: "Pokemon Ruby Version key art"
      },
      {
        title: "Pokemon Sapphire Version",
        platform: "Game Boy Advance",
        releaseWindow: "2002-2003",
        note: "Companion Hoenn release with mirrored team conflicts and roster splits.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-sapphire---button-1558057647915.jpg",
        imageAlt: "Pokemon Sapphire Version key art"
      },
      {
        title: "Pokemon FireRed Version",
        platform: "Game Boy Advance",
        releaseWindow: "2004",
        note: "Modernized return to Kanto with updated mechanics and wireless functionality.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/01/31/pokemon-firered-button-crop-1643616703712.jpg",
        imageAlt: "Pokemon FireRed Version key art"
      },
      {
        title: "Pokemon LeafGreen Version",
        platform: "Game Boy Advance",
        releaseWindow: "2004",
        note: "Parallel Kanto remake with version-exclusive routes and encounters.",
        imageSrc:
          "https://assets-prd.ignimgs.com/2022/01/31/pokemon-leafgreen-button-crop-v3-1643617153926.jpg",
        imageAlt: "Pokemon LeafGreen Version key art"
      },
      {
        title: "Pokemon Emerald Version",
        platform: "Game Boy Advance",
        releaseWindow: "2004-2005",
        note: "Expanded Hoenn edition with Battle Frontier and broader postgame challenge.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/02/08/pokemonemerald-sq-1644346782465.jpg",
        imageAlt: "Pokemon Emerald Version key art"
      }
    ]
  },
  {
    key: "gen4",
    generationLabel: "Generation IV",
    eraLabel: "2006-2010",
    regionLabel: "Sinnoh + Johto",
    summary: "Nintendo DS jump with broad online features and deeper competitive structure.",
    highlights: ["Nintendo Wi-Fi era", "Physical/special move split", "Johto remakes"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/6/69/Diamond_EN_boxart.jpg/600px-Diamond_EN_boxart.jpg",
    coverImageAlt: "Pokemon Diamond cover art",
    releases: [
      {
        title: "Pokemon Diamond Version",
        platform: "Nintendo DS",
        releaseWindow: "2006-2007",
        note: "Sinnoh debut and broad online integration through Nintendo Wi-Fi services.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/01/31/pokemon-diamond-button-crop-1643616517892.jpg",
        imageAlt: "Pokemon Diamond Version key art"
      },
      {
        title: "Pokemon Pearl Version",
        platform: "Nintendo DS",
        releaseWindow: "2006-2007",
        note: "Companion Sinnoh release with version-specific legendary routes.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/01/31/pokemon-pearl-button-crop1-1643617138694.jpg",
        imageAlt: "Pokemon Pearl Version key art"
      },
      {
        title: "Pokemon Platinum Version",
        platform: "Nintendo DS",
        releaseWindow: "2008-2009",
        note: "Improved pacing and expanded Distortion World storyline structure.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-platinum---button-1558057647849.jpg",
        imageAlt: "Pokemon Platinum Version key art"
      },
      {
        title: "Pokemon HeartGold Version",
        platform: "Nintendo DS",
        releaseWindow: "2009-2010",
        note: "High-content Johto remake with extensive postgame and feature upgrades.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-heartgold---button-1558055594925.jpg",
        imageAlt: "Pokemon HeartGold Version key art"
      },
      {
        title: "Pokemon SoulSilver Version",
        platform: "Nintendo DS",
        releaseWindow: "2009-2010",
        note: "Parallel Johto remake retaining dual-region progression and broad content scope.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-soulsilver---button-1558057647951.jpg",
        imageAlt: "Pokemon SoulSilver Version key art"
      }
    ]
  },
  {
    key: "gen5",
    generationLabel: "Generation V",
    eraLabel: "2010-2013",
    regionLabel: "Unova",
    summary: "Narrative-driven generation with direct sequels in the same regional timeline.",
    highlights: ["Story-forward direction", "Strong regional dex focus", "Direct numbered sequels"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/3/34/Black_2_EN_boxart.png/600px-Black_2_EN_boxart.png",
    coverImageAlt: "Pokemon Black 2 cover art",
    releases: [
      {
        title: "Pokemon Black Version",
        platform: "Nintendo DS",
        releaseWindow: "2010-2011",
        note: "Creative reset with a new regional dex and stronger narrative focus.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-black---button-1558054992405.jpg",
        imageAlt: "Pokemon Black Version key art"
      },
      {
        title: "Pokemon White Version",
        platform: "Nintendo DS",
        releaseWindow: "2010-2011",
        note: "Companion Unova launch with alternate city and encounter distribution.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-white---button-1558057647982.jpg",
        imageAlt: "Pokemon White Version key art"
      },
      {
        title: "Pokemon Black Version 2",
        platform: "Nintendo DS",
        releaseWindow: "2012",
        note: "Direct sequel that expands the same timeline and route structure.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-black-2---button-1558054992410.jpg",
        imageAlt: "Pokemon Black Version 2 key art"
      },
      {
        title: "Pokemon White Version 2",
        platform: "Nintendo DS",
        releaseWindow: "2012",
        note: "Companion sequel release with alternate legendary and progression route.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-white-2---button-1558057647984.jpg",
        imageAlt: "Pokemon White Version 2 key art"
      }
    ]
  },
  {
    key: "gen6",
    generationLabel: "Generation VI",
    eraLabel: "2013-2016",
    regionLabel: "Kalos + Hoenn",
    summary: "First full 3D mainline era and the introduction of Mega Evolution battles.",
    highlights: ["Full 3D transition", "Mega Evolution system", "Hoenn remake cycle"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/2/27/X_EN_boxart.png/600px-X_EN_boxart.png",
    coverImageAlt: "Pokemon X cover art",
    releases: [
      {
        title: "Pokemon X",
        platform: "Nintendo 3DS",
        releaseWindow: "2013",
        note: "Kalos launch and the first fully 3D mainline battle presentation.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-x---button-1558057647988.jpg",
        imageAlt: "Pokemon X key art"
      },
      {
        title: "Pokemon Y",
        platform: "Nintendo 3DS",
        releaseWindow: "2013",
        note: "Companion Kalos release with parallel progression and roster splits.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-y---button-1558057648001.jpg",
        imageAlt: "Pokemon Y key art"
      },
      {
        title: "Pokemon Omega Ruby Version",
        platform: "Nintendo 3DS",
        releaseWindow: "2014",
        note: "Hoenn remake with Primal mechanics and Delta Episode postgame arc.",
        imageSrc:
          "https://assets-prd.ignimgs.com/2022/01/08/pokemon-omega-ruby-version-button-blur-1641603897734.jpg",
        imageAlt: "Pokemon Omega Ruby key art"
      },
      {
        title: "Pokemon Alpha Sapphire Version",
        platform: "Nintendo 3DS",
        releaseWindow: "2014",
        note: "Companion Hoenn remake with mirrored story route and legendary split.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-alphasapphire---button-1558055142101.jpg",
        imageAlt: "Pokemon Alpha Sapphire key art"
      }
    ]
  },
  {
    key: "gen7",
    generationLabel: "Generation VII",
    eraLabel: "2016-2018",
    regionLabel: "Alola + Kanto",
    summary: "Island-trial structure and cinematic narrative pacing across core releases.",
    highlights: ["Island challenge model", "Regional forms", "Lets Go transition release"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/0/06/Sun_EN_boxart.png/600px-Sun_EN_boxart.png",
    coverImageAlt: "Pokemon Sun cover art",
    releases: [
      {
        title: "Pokemon Sun Version",
        platform: "Nintendo 3DS",
        releaseWindow: "2016",
        note: "Replaces classic gyms with island trials and totem boss progression.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-sun---button-1558057647960.jpg",
        imageAlt: "Pokemon Sun Version key art"
      },
      {
        title: "Pokemon Moon Version",
        platform: "Nintendo 3DS",
        releaseWindow: "2016",
        note: "Companion Alola release with alternate day/night timing and exclusives.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-moon---button-1558055594983.jpg",
        imageAlt: "Pokemon Moon Version key art"
      },
      {
        title: "Pokemon Ultra Sun Version",
        platform: "Nintendo 3DS",
        releaseWindow: "2017",
        note: "Expanded Alola route with revised story beats and additional features.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-ultrasun---button-1558057647977.jpg",
        imageAlt: "Pokemon Ultra Sun Version key art"
      },
      {
        title: "Pokemon Ultra Moon Version",
        platform: "Nintendo 3DS",
        releaseWindow: "2017",
        note: "Companion Ultra release with mirrored content variants and roster differences.",
        imageSrc: "https://assets1.ignimgs.com/2019/05/17/pokemon-ultramoon---button-1558057647973.jpg",
        imageAlt: "Pokemon Ultra Moon Version key art"
      },
      {
        title: "Pokemon: Let's Go, Pikachu!",
        platform: "Nintendo Switch",
        releaseWindow: "2018",
        note: "Accessible Kanto reinterpretation that bridges GO-style catch flow.",
        imageSrc: "https://assets1.ignimgs.com/2018/11/12/pokemon-lets-go-pikachu---button-fin-1542047719936.jpg",
        imageAlt: "Pokemon Let's Go, Pikachu! key art"
      },
      {
        title: "Pokemon: Let's Go, Eevee!",
        platform: "Nintendo Switch",
        releaseWindow: "2018",
        note: "Companion Let's Go release with parallel story route and partner focus.",
        imageSrc: "https://assets1.ignimgs.com/2018/11/12/pokemon-lets-go-eevee---button-fin-1542048068542.jpg",
        imageAlt: "Pokemon Let's Go, Eevee! key art"
      }
    ]
  },
  {
    key: "gen8",
    generationLabel: "Generation VIII",
    eraLabel: "2019-2022",
    regionLabel: "Galar + Sinnoh + Hisui",
    summary: "Switch era with the Wild Area shift, remake cycle, and the first Legends branch release.",
    highlights: ["Wild Area", "Switch-first mainline era", "Pokemon Legends branch"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/4/47/Sword_EN_boxart.png/600px-Sword_EN_boxart.png",
    coverImageAlt: "Pokemon Sword cover art",
    releases: [
      {
        title: "Pokemon Sword",
        platform: "Nintendo Switch",
        releaseWindow: "2019",
        note: "Mainline Switch launch introducing Wild Area and Max Raid systems.",
        imageSrc: "https://assets1.ignimgs.com/2019/08/27/pokemon-sword---eshop---button-1566932968514.jpg",
        imageAlt: "Pokemon Sword key art"
      },
      {
        title: "Pokemon Shield",
        platform: "Nintendo Switch",
        releaseWindow: "2019",
        note: "Companion Galar release with version-exclusive gyms and roster differences.",
        imageSrc: "https://assets1.ignimgs.com/2019/08/27/pokemon-shield---eshop---button-1566933024769.jpg",
        imageAlt: "Pokemon Shield key art"
      },
      {
        title: "Pokemon: Brilliant Diamond",
        platform: "Nintendo Switch",
        releaseWindow: "2021",
        note: "Modern remake cycle that returns the Sinnoh route progression.",
        imageSrc:
          "https://assets-prd.ignimgs.com/2021/02/26/pokemon-brilliant-diamond-button-1614365098142.jpg",
        imageAlt: "Pokemon Brilliant Diamond key art"
      },
      {
        title: "Pokemon: Shining Pearl",
        platform: "Nintendo Switch",
        releaseWindow: "2021",
        note: "Companion Sinnoh remake with mirrored exclusives and legendary split.",
        imageSrc:
          "https://assets-prd.ignimgs.com/2021/02/26/pokemon-shining-pearl-button-1614365557149.jpg",
        imageAlt: "Pokemon Shining Pearl key art"
      },
      {
        title: "Pokemon Legends: Arceus",
        platform: "Nintendo Switch",
        releaseWindow: "2022",
        note: "Exploration-focused structure in Hisui with real-time catch transitions.",
        imageSrc: "https://assets-prd.ignimgs.com/2021/11/04/pokmon-legends-arceus-button-fomn-1636006738698.jpg",
        imageAlt: "Pokemon Legends: Arceus key art"
      }
    ]
  },
  {
    key: "gen9",
    generationLabel: "Generation IX",
    eraLabel: "2022-2026",
    regionLabel: "Paldea + Kalos",
    summary: "Open-world progression in Paldea followed by the upcoming Kalos-focused Legends return.",
    highlights: ["Open-world route design", "Three-path campaign", "Legends: Z-A branch"],
    coverImageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/5/5f/Scarlet_EN_boxart.png/600px-Scarlet_EN_boxart.png",
    coverImageAlt: "Pokemon Scarlet cover art",
    releases: [
      {
        title: "Pokemon Scarlet",
        platform: "Nintendo Switch",
        releaseWindow: "2022",
        note: "Open-world mainline structure with co-op support in the Paldea region.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/08/03/pokemon-scarlet-1659542292648.jpg",
        imageAlt: "Pokemon Scarlet key art"
      },
      {
        title: "Pokemon Violet",
        platform: "Nintendo Switch",
        releaseWindow: "2022",
        note: "Companion Paldea release with parallel campaign structure and roster split.",
        imageSrc: "https://assets-prd.ignimgs.com/2022/08/03/pokemon-violet-1659542326365.jpg",
        imageAlt: "Pokemon Violet key art"
      },
      {
        title: "Pokemon Legends: Z-A",
        platform: "Nintendo Switch",
        releaseWindow: "2025",
        note: "Mainline-adjacent Legends release centered on Lumiose City and Kalos.",
        imageSrc: "https://assets-prd.ignimgs.com/2025/05/28/pokemonzas1-1748458147334.jpg",
        imageAlt: "Pokemon Legends: Z-A key art"
      },
      {
        title: "Pokemon Legends: Z-A Nintendo Switch 2 Edition",
        platform: "Nintendo Switch 2",
        releaseWindow: "2025",
        note: "Nintendo Switch 2 edition listed separately in IGN's mainline playlist.",
        imageSrc: "https://assets-prd.ignimgs.com/2025/05/28/pokemonzaswitch2-1748458174501.jpg",
        imageAlt: "Pokemon Legends: Z-A Nintendo Switch 2 Edition key art"
      }
    ]
  }
];

export const SECONDARY_SAGAS: SecondarySagaEntry[] = [
  {
    key: "stadium",
    title: "Stadium and Console Battle Line",
    focus: "3D battle simulation",
    summary: "Console-focused battle line built around presentation and match-centric play.",
    notableGames: [
      "Pokemon Stadium",
      "Pokemon Stadium 2",
      "Pokemon Colosseum",
      "Pokemon XD: Gale of Darkness",
      "Pokken Tournament / DX"
    ],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/8/8b/Pokk%C3%A9n_Tournament_EN_boxart.png",
    imageAlt: "Pokken Tournament DX cover"
  },
  {
    key: "mystery-dungeon",
    title: "Pokemon Mystery Dungeon",
    focus: "Dungeon crawler RPG",
    summary: "Turn-based rescue RPGs starring Pokemon teams with narrative-heavy structure.",
    notableGames: [
      "Rescue Team Red / Blue",
      "Explorers of Time / Darkness / Sky",
      "Gates to Infinity",
      "Super Mystery Dungeon",
      "Rescue Team DX"
    ],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/3/3b/MD_Sky_EN_boxart.jpg/600px-MD_Sky_EN_boxart.jpg",
    imageAlt: "Pokemon Mystery Dungeon Explorers of Sky cover"
  },
  {
    key: "ranger",
    title: "Pokemon Ranger",
    focus: "Stylus action adventure",
    summary: "Mission-driven gameplay with temporary captures and field-based action loops.",
    notableGames: [
      "Pokemon Ranger",
      "Pokemon Ranger: Shadows of Almia",
      "Pokemon Ranger: Guardian Signs"
    ],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/3/33/Ranger_GS_EN_boxart.png/600px-Ranger_GS_EN_boxart.png",
    imageAlt: "Pokemon Ranger Guardian Signs cover"
  },
  {
    key: "snap",
    title: "Pokemon Snap",
    focus: "Photography adventure",
    summary: "On-rails exploration and behavior tracking through environment photography.",
    notableGames: ["Pokemon Snap", "New Pokemon Snap"],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/e/ee/New_Pok%C3%A9mon_Snap_EN_boxart.png",
    imageAlt: "New Pokemon Snap cover"
  },
  {
    key: "strategy-fighters",
    title: "Strategy and Fighters",
    focus: "Subgenre experiments",
    summary: "Tactical and arena-combat branches that explore non-mainline combat formats.",
    notableGames: ["Pokemon Conquest", "Pokken Tournament", "Pokken Tournament DX"],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/3/31/Conquest_EN_boxart.jpg/600px-Conquest_EN_boxart.jpg",
    imageAlt: "Pokemon Conquest cover"
  },
  {
    key: "arcade-light",
    title: "Arcade and Short Session Titles",
    focus: "Fast loop design",
    summary: "Compact, high-replay experiences built for quick sessions and broad audiences.",
    notableGames: [
      "Pokemon Pinball",
      "Pokemon Pinball: Ruby & Sapphire",
      "Pokemon Rumble",
      "Super Pokemon Rumble",
      "Pokemon Rumble World"
    ],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/1/16/Pinball_EN_boxart.png/600px-Pinball_EN_boxart.png",
    imageAlt: "Pokemon Pinball cover"
  },
  {
    key: "adventure-detective",
    title: "Narrative Adventure",
    focus: "Story-first design",
    summary: "Adventure-led titles centered on investigation, dialogue, and character scenes.",
    notableGames: ["Detective Pikachu", "Detective Pikachu Returns"],
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/3/38/Detective_Pikachu_Returns_EN_Boxart.jpg/600px-Detective_Pikachu_Returns_EN_Boxart.jpg",
    imageAlt: "Detective Pikachu Returns cover"
  }
];

export const MOBILE_AND_SERVICE_GAMES: MobileGameEntry[] = [
  {
    key: "pokemon-go",
    title: "Pokemon GO",
    platform: "iOS / Android",
    launchLabel: "Since 2016",
    category: "AR exploration",
    loop: "Real-world capture, raids, PvP leagues, and rotating seasonal events.",
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/3/3d/Pokemon_Go_Logo.png/600px-Pokemon_Go_Logo.png",
    imageAlt: "Pokemon GO logo"
  },
  {
    key: "pokemon-masters-ex",
    title: "Pokemon Masters EX",
    platform: "iOS / Android",
    launchLabel: "Since 2019",
    category: "Team battle RPG",
    loop: "3v3 sync-pair combat with recurring story arcs and event rotations.",
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/5/5d/Pok%C3%A9mon_Masters_Logo.png/600px-Pok%C3%A9mon_Masters_Logo.png",
    imageAlt: "Pokemon Masters EX artwork"
  },
  {
    key: "pokemon-unite",
    title: "Pokemon UNITE",
    platform: "Switch / iOS / Android",
    launchLabel: "Since 2021",
    category: "MOBA",
    loop: "Objective-based team matches with role drafts, map pressure, and score timing.",
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/0/0d/Pok%C3%A9mon_UNITE_logo.png/600px-Pok%C3%A9mon_UNITE_logo.png",
    imageAlt: "Pokemon UNITE icon"
  },
  {
    key: "pokemon-cafe-remix",
    title: "Pokemon Cafe ReMix",
    platform: "Switch / iOS / Android",
    launchLabel: "Since 2020",
    category: "Puzzle management",
    loop: "Short puzzle loops with cafe progression and rotating service events.",
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/a/a8/Pok%C3%A9mon_Caf%C3%A9_ReMix_logo.png",
    imageAlt: "Pokemon Cafe ReMix icon"
  },
  {
    key: "pokemon-sleep",
    title: "Pokemon Sleep",
    platform: "iOS / Android",
    launchLabel: "Since 2023",
    category: "Lifestyle tracker",
    loop: "Sleep tracking tied to daily progression and collection-style discoveries.",
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/0/05/Pok%C3%A9mon_Sleep_logo.png/600px-Pok%C3%A9mon_Sleep_logo.png",
    imageAlt: "Pokemon Sleep logo"
  },
  {
    key: "pokemon-tcg-pocket",
    title: "Pokemon TCG Pocket",
    platform: "iOS / Android",
    launchLabel: "Since 2024",
    category: "Card collection",
    loop: "Digital pack opening with compact card battles and collection milestones.",
    imageSrc:
      "https://archives.bulbagarden.net/media/upload/thumb/7/70/Pok%C3%A9mon_Trading_Card_Game_Pocket_logo.png/600px-Pok%C3%A9mon_Trading_Card_Game_Pocket_logo.png",
    imageAlt: "Pokemon TCG Pocket logo"
  }
];


