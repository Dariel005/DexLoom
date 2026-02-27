export interface CharacterTeamByGameEntry {
  game: string;
  team: string;
}

export interface CharacterReferenceEntry {
  label: string;
  href?: string;
  note?: string;
}

export interface CharacterWikiEntry {
  slug: string;
  name: string;
  roleHint: string;
  gameTags: string[];
  regionLabel: string;
  portraitSrc: string;
  portraitFallbackSrc?: string;
  portraitAlt: string;
  portraitType: "local" | "remote";
  portraitCreditLabel: string;
  portraitCreditHref: string;
  portraitCreditNote?: string;
  overview: string;
  battleStyle: string;
  signaturePokemon: string[];
  quote: string;
  appearances: string[];
  teamsByGame: CharacterTeamByGameEntry[];
  tags: string[];
  references: CharacterReferenceEntry[];
}

type LocalPortraitSeed = {
  type: "local";
  src: string;
  file: string;
  creditLabel: string;
};

type RemotePortraitSeed = {
  type: "remote";
  file: string;
  creditLabel: string;
};

type CharacterSeed = {
  slug: string;
  name: string;
  roleHint: string;
  gameTags: string[];
  regionLabel: string;
  portraitAlt: string;
  portrait: LocalPortraitSeed | RemotePortraitSeed;
  battleStyle: string;
  signaturePokemon: string[];
  quote: string;
  appearance: string;
  teamGame: string;
  team: string;
  tags: string[];
  roleNote: string;
};

function toPortrait(seed: LocalPortraitSeed | RemotePortraitSeed) {
  const encodedFile = encodeURIComponent(seed.file);
  const remotePortraitSrc = `https://archives.bulbagarden.net/wiki/Special:Redirect/file/${encodedFile}`;
  const remoteLegacyPortraitSrc = `https://archives.bulbagarden.net/wiki/Special:FilePath/${encodedFile}`;

  if (seed.type === "local") {
    return {
      portraitSrc: seed.src,
      portraitFallbackSrc: remotePortraitSrc,
      portraitType: "local" as const,
      portraitCreditLabel: `Bulbagarden Archives - ${seed.creditLabel}`,
      portraitCreditHref: `https://archives.bulbagarden.net/wiki/File:${encodedFile}`,
      portraitCreditNote: "Official character artwork (local cached asset)."
    };
  }

  return {
    portraitSrc: remotePortraitSrc,
    portraitFallbackSrc: remoteLegacyPortraitSrc,
    portraitType: "remote" as const,
    portraitCreditLabel: `Bulbagarden Archives - ${seed.creditLabel}`,
    portraitCreditHref: `https://archives.bulbagarden.net/wiki/File:${encodedFile}`,
    portraitCreditNote: "Official character artwork (remote asset)."
  };
}

function buildCharacter(seed: CharacterSeed): CharacterWikiEntry {
  return {
    slug: seed.slug,
    name: seed.name,
    roleHint: seed.roleHint,
    gameTags: seed.gameTags,
    regionLabel: seed.regionLabel,
    ...toPortrait(seed.portrait),
    portraitAlt: seed.portraitAlt,
    overview: `${seed.name} is a major ${seed.regionLabel} character in the Pokemon storyline and battle framework.`,
    battleStyle: seed.battleStyle,
    signaturePokemon: seed.signaturePokemon,
    quote: seed.quote,
    appearances: [seed.appearance],
    teamsByGame: [{ game: seed.teamGame, team: seed.team }],
    tags: seed.tags,
    references: [{ label: "Role note", note: seed.roleNote }]
  };
}

const seeds: CharacterSeed[] = [
  {
    slug: "red", name: "Red", roleHint: "Silent protagonist and late-game boss trainer", gameTags: ["kanto", "johto", "alola"], regionLabel: "Kanto",
    portraitAlt: "Official art of Red from FireRed and LeafGreen",
    portrait: { type: "local", src: "/images/characters/official/red-frlg.png", file: "FireRed_LeafGreen_Red.png", creditLabel: "FireRed LeafGreen Red" },
    battleStyle: "Balanced offense with elite endgame pressure.", signaturePokemon: ["Pikachu", "Charizard", "Snorlax", "Venusaur"], quote: "A legend who lets battles speak.",
    appearance: "Pokemon Red / Blue / Yellow and later post-game legacy battles.", teamGame: "Gold / Silver / Crystal", team: "Pikachu, Espeon, Snorlax, Venusaur, Charizard, Blastoise.",
    tags: ["character", "protagonist", "boss-trainer", "kanto"], roleNote: "Classic post-game benchmark opponent."
  },
  {
    slug: "blue", name: "Blue", roleHint: "Primary rival and former Kanto Champion", gameTags: ["kanto", "johto", "alola"], regionLabel: "Kanto",
    portraitAlt: "Official art of Blue from FireRed and LeafGreen",
    portrait: { type: "local", src: "/images/characters/official/blue-frlg.png", file: "FireRed_LeafGreen_Blue.png", creditLabel: "FireRed LeafGreen Blue" },
    battleStyle: "Fast offensive sequencing and high tempo.", signaturePokemon: ["Pidgeot", "Alakazam", "Rhydon", "Arcanine"], quote: "Confident rival energy.",
    appearance: "Pokemon Red / Blue / Yellow rival arc and Johto Viridian Gym era.", teamGame: "Red / Blue / Yellow", team: "Pidgeot, Alakazam, Rhydon, Gyarados, Exeggutor, starter ace.",
    tags: ["character", "rival", "champion", "kanto"], roleNote: "Foundational rival archetype."
  },
  {
    slug: "cynthia", name: "Cynthia", roleHint: "Sinnoh Champion and cross-generation ace trainer", gameTags: ["sinnoh", "unova", "alola", "hisui"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Cynthia from Diamond and Pearl",
    portrait: { type: "local", src: "/images/characters/official/cynthia-dp.png", file: "Diamond_Pearl_Cynthia.png", creditLabel: "Diamond Pearl Cynthia" },
    battleStyle: "Disciplined coverage and high-pressure closing.", signaturePokemon: ["Garchomp", "Spiritomb", "Milotic", "Lucario"], quote: "Calm strategy, brutal endgame.",
    appearance: "Pokemon Diamond / Pearl / Platinum plus special appearances in later generations.", teamGame: "Diamond / Pearl / Platinum", team: "Spiritomb, Roserade, Gastrodon, Lucario, Milotic, Garchomp.",
    tags: ["character", "champion", "sinnoh", "boss-trainer"], roleNote: "One of the most recognized champion encounters."
  },
  {
    slug: "n", name: "N", roleHint: "Unova story rival with ideological arc", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of N from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_N.png", creditLabel: "Black White N" },
    battleStyle: "Narrative-driven rotating lineups.", signaturePokemon: ["Zoroark", "Reshiram", "Zekrom"], quote: "Ideals clash through battle.",
    appearance: "Pokemon Black / White and legacy encounters in Black 2 / White 2.", teamGame: "Black / White", team: "Route-themed rotations with legendary line finale.",
    tags: ["character", "rival", "unova", "antagonist-arc"], roleNote: "Team composition mirrors story themes."
  },
  {
    slug: "diantha", name: "Diantha", roleHint: "Kalos Champion", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Diantha from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Diantha.png", creditLabel: "XY Diantha" },
    battleStyle: "Composed control with Mega ace pressure.", signaturePokemon: ["Gardevoir", "Goodra", "Tyrantrum"], quote: "Elegant champion composure.",
    appearance: "Pokemon X / Y league finale.", teamGame: "Pokemon X / Y", team: "Hawlucha, Tyrantrum, Aurorus, Goodra, Gourgeist, Mega Gardevoir.",
    tags: ["character", "champion", "kalos"], roleNote: "Mega Gardevoir defines her final battle."
  },
  {
    slug: "leon", name: "Leon", roleHint: "Galar Champion and Champion Cup boss", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Leon from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Leon.png", creditLabel: "Sword Shield Leon" },
    battleStyle: "Relentless offense and momentum chains.", signaturePokemon: ["Charizard", "Aegislash", "Dragapult"], quote: "Forward pressure from turn one.",
    appearance: "Pokemon Sword / Shield championship and post-game rematches.", teamGame: "Sword / Shield", team: "Aegislash, Dragapult, Haxorus, coverage slot, Charizard ace.",
    tags: ["character", "champion", "galar", "boss-trainer"], roleNote: "Top offensive champion pacing."
  },
  {
    slug: "nemona", name: "Nemona", roleHint: "Paldea rival and Champion-rank trainer", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Nemona from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Nemona.png", creditLabel: "Scarlet Violet Nemona" },
    battleStyle: "Escalating rival pressure with flexible coverage.", signaturePokemon: ["Lycanroc", "Pawmot", "Goodra"], quote: "Always looking for a stronger battle.",
    appearance: "Pokemon Scarlet / Violet rival route and academy post-game.", teamGame: "Scarlet / Violet", team: "Lycanroc, Goodra, Dudunsparce, Orthworm, Pawmot, starter ace.",
    tags: ["character", "rival", "paldea", "champion-rank"], roleNote: "Built to mirror player growth."
  },
  {
    slug: "lance", name: "Lance", roleHint: "Elite Four member turned Champion", gameTags: ["johto", "kanto"], regionLabel: "Johto",
    portraitAlt: "Official art of Lance from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Lance.png", creditLabel: "HeartGold SoulSilver Lance" },
    battleStyle: "Dragon-heavy offense and high stats.", signaturePokemon: ["Dragonite", "Aerodactyl"], quote: "Classic dragon authority.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver.", teamGame: "Johto Championship", team: "Dragonite-centric core with flying/fire pressure.",
    tags: ["character", "champion", "dragon-specialist", "johto"], roleNote: "Early benchmark dragon endboss."
  },
  {
    slug: "steven", name: "Steven", roleHint: "Hoenn Champion and steel strategist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Steven from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Steven.png", creditLabel: "Omega Ruby Alpha Sapphire Steven" },
    battleStyle: "Defensive pivots into high-impact finishers.", signaturePokemon: ["Metagross", "Aggron", "Skarmory"], quote: "Calculated resilience.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS.", teamGame: "Hoenn Champion", team: "Skarmory, Claydol, Aggron, Cradily, Armaldo, Metagross.",
    tags: ["character", "champion", "hoenn", "steel-specialist"], roleNote: "Balanced champion architecture."
  },
  {
    slug: "alder", name: "Alder", roleHint: "Unova Champion with veteran philosophy", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Alder from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Alder.png", creditLabel: "Black White Alder" },
    battleStyle: "Coverage-heavy adaptive offense.", signaturePokemon: ["Volcarona", "Bouffalant"], quote: "Veteran reads over rigid archetypes.",
    appearance: "Pokemon Black / White and legacy content in B2/W2.", teamGame: "Unova legacy battle", team: "Accelgor, Bouffalant, Druddigon, Escavalier, Vanilluxe, Volcarona.",
    tags: ["character", "champion", "unova", "veteran"], roleNote: "Strong adaptation-focused champion design."
  },
  {
    slug: "iris", name: "Iris", roleHint: "Unova Champion and dragon powerhouse", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Iris from Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Iris.png", creditLabel: "Black 2 White 2 Iris" },
    battleStyle: "Explosive offense and tempo swings.", signaturePokemon: ["Haxorus", "Hydreigon"], quote: "Champion intensity.",
    appearance: "Pokemon Black / White arc and Champion role in B2/W2.", teamGame: "Black 2 / White 2", team: "Hydreigon, Druddigon, Aggron, Lapras, Archeops, Haxorus.",
    tags: ["character", "champion", "dragon-specialist", "unova"], roleNote: "High-pressure champion pacing."
  },
  {
    slug: "geeta", name: "Geeta", roleHint: "Top Champion and Paldea League chairwoman", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Geeta from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Geeta.png", creditLabel: "Scarlet Violet Geeta" },
    battleStyle: "Methodical sequencing with controlled finishers.", signaturePokemon: ["Glimmora", "Kingambit"], quote: "Executive precision.",
    appearance: "Pokemon Scarlet / Violet top champion route.", teamGame: "Top Champion battle", team: "Espathra, Gogoat, Veluza, Avalugg, Kingambit, Glimmora.",
    tags: ["character", "champion", "paldea", "league"], roleNote: "Defines Paldea's champion framework."
  },
  {
    slug: "penny", name: "Penny", roleHint: "Team Star strategist and technical specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Penny from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Penny.png", creditLabel: "Scarlet Violet Penny" },
    battleStyle: "Themed coverage built around Eeveelutions.", signaturePokemon: ["Sylveon", "Umbreon", "Vaporeon"], quote: "Quiet control through curated identity.",
    appearance: "Pokemon Scarlet / Violet Team Star finale.", teamGame: "Team Star final encounter", team: "Umbreon, Vaporeon, Jolteon, Flareon, Leafeon, Sylveon.",
    tags: ["character", "team-star", "paldea", "strategist"], roleNote: "One of Paldea's strongest themed rosters."
  },
  {
    slug: "hop", name: "Hop", roleHint: "Galar rival with growth-focused arc", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Hop from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Hop.png", creditLabel: "Sword Shield Hop" },
    battleStyle: "Adaptive rival tuning across milestones.", signaturePokemon: ["Dubwool", "Corviknight"], quote: "Growth through rivalry.",
    appearance: "Pokemon Sword / Shield main rival route.", teamGame: "Late-game rival", team: "Dubwool, Corviknight, support core, starter final evolution.",
    tags: ["character", "rival", "galar"], roleNote: "Progressive rival archetype."
  },
  {
    slug: "marnie", name: "Marnie", roleHint: "Galar rival and Spikemuth successor", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Marnie from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Marnie.png", creditLabel: "Sword Shield Marnie" },
    battleStyle: "Dark-themed pressure with disciplined pacing.", signaturePokemon: ["Morpeko", "Grimmsnarl"], quote: "Composed rival tempo.",
    appearance: "Pokemon Sword / Shield rival route and post-story gym arc.", teamGame: "Championship track", team: "Liepard, Toxicroak, Scrafty, Morpeko, Grimmsnarl.",
    tags: ["character", "rival", "galar", "dark-theme"], roleNote: "Strong identity with flexible execution."
  },
  {
    slug: "bede", name: "Bede", roleHint: "Galar rival with psychic/fairy specialist arc", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Bede from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Bede.png", creditLabel: "Sword Shield Bede" },
    battleStyle: "Special-attack pressure and archetype refinement.", signaturePokemon: ["Hatterene", "Gardevoir"], quote: "Precision over noise.",
    appearance: "Pokemon Sword / Shield rival route.", teamGame: "Late rival set", team: "Mawile, Gardevoir, Rapidash, Hatterene and flex slots.",
    tags: ["character", "rival", "galar", "psychic-fairy"], roleNote: "Team identity mirrors character development."
  },
  {
    slug: "hau", name: "Hau", roleHint: "Alola rival and island challenge companion", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Hau from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Hau.png", creditLabel: "Sun Moon Hau" },
    battleStyle: "Friendly rival escalation with balanced offense.", signaturePokemon: ["Raichu", "Starter final form"], quote: "Relaxed but improving.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon rival route.", teamGame: "Alola rival battles", team: "Raichu, starter final evolution, rotating support coverage.",
    tags: ["character", "rival", "alola"], roleNote: "Steady growth-driven rival curve."
  },
  {
    slug: "lillie", name: "Lillie", roleHint: "Alola story lead and narrative anchor", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Lillie from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Lillie.png", creditLabel: "Sun Moon Lillie" },
    battleStyle: "Story-focused role with selective battle presence.", signaturePokemon: ["Clefairy", "Cosmog line"], quote: "A core growth arc.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon main story.", teamGame: "Story context", team: "Limited direct battling; narrative-heavy role.",
    tags: ["character", "story-lead", "alola"], roleNote: "Narrative pillar more than standard rival."
  },
  {
    slug: "gladion", name: "Gladion", roleHint: "Alola rival with anti-hero progression", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Gladion from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Gladion.png", creditLabel: "Sun Moon Gladion" },
    battleStyle: "Aggressive mixed offense and emotional pacing.", signaturePokemon: ["Silvally", "Crobat", "Lucario"], quote: "High-intensity rival pressure.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon rival arc.", teamGame: "Alola rival battles", team: "Silvally core with fast offensive support.",
    tags: ["character", "rival", "anti-hero", "alola"], roleNote: "Lineups are tightly tied to story identity."
  },
  {
    slug: "calem", name: "Calem", roleHint: "Kalos protagonist counterpart", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Calem from Pokemon X and Y",
    portrait: { type: "remote", file: "X_Y_Calem.png", creditLabel: "X Y Calem" },
    battleStyle: "Starter-centric counterpart pacing.", signaturePokemon: ["Starter final form", "Absol"], quote: "Polished Kalos cadence.",
    appearance: "Pokemon X / Y counterpart rival route.", teamGame: "Kalos counterpart battles", team: "Starter evolution plus balanced regional support.",
    tags: ["character", "rival", "kalos", "counterpart"], roleNote: "Counterpart role depends on protagonist choice."
  },
  {
    slug: "serena", name: "Serena", roleHint: "Kalos protagonist counterpart", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Serena from Pokemon X and Y",
    portrait: { type: "remote", file: "X_Y_Serena.png", creditLabel: "X Y Serena" },
    battleStyle: "Steady rival growth with starter core.", signaturePokemon: ["Starter final form", "Absol"], quote: "Consistent rival pressure.",
    appearance: "Pokemon X / Y counterpart rival route.", teamGame: "Kalos counterpart battles", team: "Starter evolution plus balanced regional support.",
    tags: ["character", "rival", "kalos", "counterpart"], roleNote: "Counterpart role depends on protagonist choice."
  },
  {
    slug: "dawn", name: "Dawn", roleHint: "Sinnoh protagonist counterpart", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Dawn from Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Dawn.png", creditLabel: "Diamond Pearl Dawn" },
    battleStyle: "Balanced counterpart battles and starter pacing.", signaturePokemon: ["Starter line", "Pachirisu"], quote: "Companion and competitor.",
    appearance: "Pokemon Diamond / Pearl / Platinum and BDSP counterpart route.", teamGame: "Sinnoh counterpart battles", team: "Starter evolution with route-based support picks.",
    tags: ["character", "counterpart", "sinnoh"], roleNote: "Tracks Sinnoh route progression closely."
  },
  {
    slug: "lucas", name: "Lucas", roleHint: "Sinnoh protagonist counterpart", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Lucas from Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Lucas.png", creditLabel: "Diamond Pearl Lucas" },
    battleStyle: "Starter-led counterpart progression.", signaturePokemon: ["Starter line", "Staraptor"], quote: "Steady route escalation.",
    appearance: "Pokemon Diamond / Pearl / Platinum and BDSP counterpart route.", teamGame: "Sinnoh counterpart battles", team: "Starter evolution with route-based support picks.",
    tags: ["character", "counterpart", "sinnoh"], roleNote: "Mirrors Dawn depending on player choice."
  },
  {
    slug: "hilda", name: "Hilda", roleHint: "Unova protagonist counterpart", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Hilda from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Hilda.png", creditLabel: "Black White Hilda" },
    battleStyle: "Player-defined progression with starter optimization.", signaturePokemon: ["Starter final form", "Scolipede"], quote: "Unova protagonist energy.",
    appearance: "Pokemon Black / White protagonist identity.", teamGame: "Protagonist profile", team: "Player-built roster anchored by starter progression.",
    tags: ["character", "protagonist", "unova"], roleNote: "Female protagonist role in Unova."
  },
  {
    slug: "hilbert", name: "Hilbert", roleHint: "Unova protagonist counterpart", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Hilbert from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Hilbert.png", creditLabel: "Black White Hilbert" },
    battleStyle: "Adaptable offense through journey progression.", signaturePokemon: ["Starter final form", "Excadrill"], quote: "Unova path of adaptability.",
    appearance: "Pokemon Black / White protagonist identity.", teamGame: "Protagonist profile", team: "Player-built roster anchored by starter progression.",
    tags: ["character", "protagonist", "unova"], roleNote: "Male protagonist role in Unova."
  },
  {
    slug: "brendan", name: "Brendan", roleHint: "Hoenn protagonist/rival counterpart", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Brendan from Pokemon Ruby and Sapphire",
    portrait: { type: "remote", file: "Ruby_Sapphire_Brendan.png", creditLabel: "Ruby Sapphire Brendan" },
    battleStyle: "Starter-led balanced progression.", signaturePokemon: ["Sceptile", "Swampert", "Blaziken"], quote: "Classic Hoenn cadence.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS protagonist/counterpart role.", teamGame: "Hoenn counterpart battles", team: "Starter evolution core and route-tuned support.",
    tags: ["character", "protagonist", "rival", "hoenn"], roleNote: "Role changes by player character selection."
  },
  {
    slug: "may", name: "May", roleHint: "Hoenn protagonist/rival counterpart", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of May from Pokemon Ruby and Sapphire",
    portrait: { type: "remote", file: "Ruby_Sapphire_May.png", creditLabel: "Ruby Sapphire May" },
    battleStyle: "Progressive rival pacing and starter synergy.", signaturePokemon: ["Blaziken", "Swampert", "Sceptile"], quote: "Smooth Hoenn progression.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS protagonist/counterpart role.", teamGame: "Hoenn counterpart battles", team: "Starter evolution core and route-tuned support.",
    tags: ["character", "protagonist", "rival", "hoenn"], roleNote: "Role changes by player character selection."
  },
  {
    slug: "kieran", name: "Kieran", roleHint: "Kitakami rival and late-arc challenger", gameTags: ["paldea", "kitakami", "blueberry"], regionLabel: "Kitakami / Blueberry",
    portraitAlt: "Official art of Kieran from Scarlet and Violet DLC",
    portrait: { type: "remote", file: "Scarlet_Violet_Kieran.png", creditLabel: "Scarlet Violet Kieran" },
    battleStyle: "Escalating aggression across DLC arcs.", signaturePokemon: ["Dipplin", "Hydrapple"], quote: "Rival pressure that intensifies.",
    appearance: "Pokemon Scarlet / Violet DLC: Teal Mask and Indigo Disk.", teamGame: "DLC climax battles", team: "Upgraded pressure roster with stronger ace dynamics.",
    tags: ["character", "rival", "paldea-dlc", "kitakami"], roleNote: "One of the strongest modern escalation arcs."
  },
  {
    slug: "carmine", name: "Carmine", roleHint: "Kitakami rival and guardian-figure counterpart", gameTags: ["paldea", "kitakami"], regionLabel: "Kitakami",
    portraitAlt: "Official art of Carmine from Scarlet and Violet DLC",
    portrait: { type: "remote", file: "Scarlet_Violet_Carmine.png", creditLabel: "Scarlet Violet Carmine" },
    battleStyle: "Direct offensive openings and rivalry intensity.", signaturePokemon: ["Ninetales", "Sinistcha"], quote: "Fast, assertive rival tone.",
    appearance: "Pokemon Scarlet / Violet DLC: The Teal Mask.", teamGame: "Kitakami rival encounters", team: "Aggressive lineup built for quick tempo swings.",
    tags: ["character", "rival", "paldea-dlc", "kitakami"], roleNote: "Encounter design emphasizes immediate rivalry pressure."
  },
  {
    slug: "jacq", name: "Jacq", roleHint: "Paldea academy professor and researcher", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Jacq from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Jacq.png", creditLabel: "Scarlet Violet Jacq" },
    battleStyle: "Support-oriented instructional roster.", signaturePokemon: ["Farigiraf", "Mudsdale"], quote: "Research-first profile.",
    appearance: "Pokemon Scarlet / Violet academy progression support.", teamGame: "Academy encounters", team: "Instruction-focused lineup with broad coverage.",
    tags: ["character", "professor", "academy", "paldea"], roleNote: "Anchors academy-side progression systems."
  },
  {
    slug: "rika", name: "Rika", roleHint: "Paldea Elite Four member", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Rika from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Rika.png", creditLabel: "Scarlet Violet Rika" },
    battleStyle: "Measured control and stable pressure.", signaturePokemon: ["Clodsire", "Whiscash", "Donphan"], quote: "Composed elite pacing.",
    appearance: "Pokemon Scarlet / Violet Elite Four sequence.", teamGame: "Elite Four battle", team: "Ground-focused lineup with Clodsire anchor.",
    tags: ["character", "elite-four", "paldea"], roleNote: "Strong positional control archetype."
  },
  {
    slug: "larry", name: "Larry", roleHint: "Paldea Gym Leader and Elite Four member", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Larry from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Larry.png", creditLabel: "Scarlet Violet Larry" },
    battleStyle: "Straightforward sequencing with efficient role shifts.", signaturePokemon: ["Staraptor", "Komala", "Altaria"], quote: "Minimalist, efficient, dangerous.",
    appearance: "Pokemon Scarlet / Violet Medali Gym and Elite Four.", teamGame: "Dual role encounters", team: "Normal-focused gym set and stronger elite-adjusted lineup.",
    tags: ["character", "gym-leader", "elite-four", "paldea"], roleNote: "One of Paldea's most distinctive dual-role NPCs."
  },
  {
    slug: "hassel", name: "Hassel", roleHint: "Paldea Elite Four dragon specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Hassel from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Hassel.png", creditLabel: "Scarlet Violet Hassel" },
    battleStyle: "Dragon-forward offense with strong closing.", signaturePokemon: ["Baxcalibur", "Haxorus", "Noivern"], quote: "Mentor warmth, dragon pressure.",
    appearance: "Pokemon Scarlet / Violet Elite Four and academy role.", teamGame: "Elite Four battle", team: "Noivern, Dragalge, Flapple, Haxorus, Baxcalibur.",
    tags: ["character", "elite-four", "dragon-specialist", "paldea"], roleNote: "High-pressure elite offense check."
  },
  {
    slug: "poppy", name: "Poppy", roleHint: "Young Paldea Elite Four steel specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Poppy from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Poppy.png", creditLabel: "Scarlet Violet Poppy" },
    battleStyle: "Steel durability into heavy finishers.", signaturePokemon: ["Tinkaton", "Corviknight", "Copperajah"], quote: "Compact style, heavyweight roster.",
    appearance: "Pokemon Scarlet / Violet Elite Four sequence.", teamGame: "Elite Four battle", team: "Copperajah, Corviknight, Magnezone, Bronzong, Tinkaton.",
    tags: ["character", "elite-four", "steel-specialist", "paldea"], roleNote: "Durable steel-pressure template."
  },
  {
    slug: "giacomo", name: "Giacomo", roleHint: "Team Star dark crew boss", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Giacomo from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Giacomo.png", creditLabel: "Scarlet Violet Giacomo" },
    battleStyle: "Themed offense with starmobile spike.", signaturePokemon: ["Pawniard", "Sableye", "Revavroom"], quote: "Stylized boss pacing.",
    appearance: "Pokemon Scarlet / Violet Team Star dark crew route.", teamGame: "Team Star encounter", team: "Pawniard, Sableye, and dark Revavroom starmobile finisher.",
    tags: ["character", "team-star", "dark-theme", "paldea"], roleNote: "Introduces Team Star base-boss battle format."
  },
  {
    slug: "silver", name: "Silver", roleHint: "Johto rival with redemption arc", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Silver from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Silver.png", creditLabel: "HeartGold SoulSilver Silver" },
    battleStyle: "Aggressive rival tempo that evolves toward balanced discipline.", signaturePokemon: ["Sneasel", "Feraligatr", "Gengar"], quote: "Strength first, then growth.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver rival route.", teamGame: "Johto rival battles", team: "Starter final form plus dark/ghost coverage and evolving support.",
    tags: ["character", "rival", "johto"], roleNote: "One of the strongest character-development rival arcs."
  },
  {
    slug: "ethan", name: "Ethan", roleHint: "Johto protagonist counterpart", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Ethan from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Ethan.png", creditLabel: "HeartGold SoulSilver Ethan" },
    battleStyle: "Starter-led progression with balanced route coverage.", signaturePokemon: ["Typhlosion", "Ampharos", "Heracross"], quote: "Classic Johto hero route.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver protagonist profile.", teamGame: "Protagonist profile", team: "Player-built roster anchored by starter and Johto utility.",
    tags: ["character", "protagonist", "johto"], roleNote: "Male protagonist identity for Johto journeys."
  },
  {
    slug: "lyra", name: "Lyra", roleHint: "Johto protagonist counterpart", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Lyra from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Lyra.png", creditLabel: "HeartGold SoulSilver Lyra" },
    battleStyle: "Balanced progression with starter and route-adaptive support.", signaturePokemon: ["Meganium", "Lapras", "Espeon"], quote: "Johto adventure companion energy.",
    appearance: "Pokemon HeartGold / SoulSilver protagonist or counterpart role.", teamGame: "Protagonist profile", team: "Player-built roster anchored by starter and Johto route coverage.",
    tags: ["character", "protagonist", "johto"], roleNote: "Female protagonist identity for Johto journeys."
  },
  {
    slug: "barry", name: "Barry", roleHint: "Sinnoh high-energy rival", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Barry from Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Barry.png", creditLabel: "Diamond Pearl Barry" },
    battleStyle: "Fast-paced rival offense with frequent momentum spikes.", signaturePokemon: ["Staraptor", "Heracross", "Empoleon"], quote: "Impatient speed, constant pressure.",
    appearance: "Pokemon Diamond / Pearl / Platinum and BDSP rival route.", teamGame: "Sinnoh rival battles", team: "Starter final form with aggressive offensive support.",
    tags: ["character", "rival", "sinnoh"], roleNote: "Barry embodies high-tempo rival pacing."
  },
  {
    slug: "cheren", name: "Cheren", roleHint: "Unova rival and later Gym Leader", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Cheren from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Cheren.png", creditLabel: "Black White Cheren" },
    battleStyle: "Methodical, analytical sequencing with reliable coverage.", signaturePokemon: ["Stoutland", "Unfezant", "Serperior"], quote: "Precision over improvisation.",
    appearance: "Pokemon Black / White rival arc and B2/W2 Gym Leader role.", teamGame: "Unova rival route", team: "Starter line plus balanced normal/flying support.",
    tags: ["character", "rival", "gym-leader", "unova"], roleNote: "Strategic rival archetype with strong post-arc role transition."
  },
  {
    slug: "bianca", name: "Bianca", roleHint: "Unova rival with research-focused growth", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Bianca from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Bianca.png", creditLabel: "Black White Bianca" },
    battleStyle: "Flexible rival pacing with broad learning-driven lineup changes.", signaturePokemon: ["Musharna", "Stoutland", "Emboar"], quote: "Growth through experience.",
    appearance: "Pokemon Black / White rival route and B2/W2 research assistant role.", teamGame: "Unova rival route", team: "Starter line and balanced support reflecting character growth.",
    tags: ["character", "rival", "unova"], roleNote: "Bianca's progression emphasizes personal growth over pure competitiveness."
  },
  {
    slug: "hugh", name: "Hugh", roleHint: "Unova sequel rival with revenge motivation", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Hugh from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Hugh.png", creditLabel: "Black 2 White 2 Hugh" },
    battleStyle: "Direct offensive pressure backed by strong emotional drive.", signaturePokemon: ["Unfezant", "Bouffalant", "Starter final form"], quote: "Personal stakes fuel every battle.",
    appearance: "Pokemon Black 2 / White 2 rival route.", teamGame: "B2/W2 rival battles", team: "Starter final form plus physical pressure core and utility slots.",
    tags: ["character", "rival", "unova"], roleNote: "Hugh brings narrative urgency into rival battle structure."
  },
  {
    slug: "guzma", name: "Guzma", roleHint: "Team Skull boss", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Guzma from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Guzma.png", creditLabel: "Sun Moon Guzma" },
    battleStyle: "Aggressive offense centered on bug-themed pressure and disruption.", signaturePokemon: ["Golisopod", "Masquerain", "Pinsir"], quote: "Raw pressure with swagger.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon Team Skull arc.", teamGame: "Team Skull boss battles", team: "Bug-core offense with Golisopod ace pressure.",
    tags: ["character", "boss", "alola", "team-skull"], roleNote: "Guzma introduces a high-personality boss pace in Alola."
  },
  {
    slug: "lusamine", name: "Lusamine", roleHint: "Aether Foundation president and main antagonist arc", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Lusamine from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Lusamine.png", creditLabel: "Sun Moon Lusamine" },
    battleStyle: "High-impact boss encounters tied to story escalation.", signaturePokemon: ["Clefable", "Milotic", "Lilligant"], quote: "Control and obsession drive the conflict.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon core story arc.", teamGame: "Aether climax battles", team: "Story-driven high-threat roster with strong special offense.",
    tags: ["character", "antagonist", "alola"], roleNote: "One of Alola's main narrative conflict anchors."
  },
  {
    slug: "professor-kukui", name: "Professor Kukui", roleHint: "Alola professor and league architect", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Professor Kukui from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Professor_Kukui.png", creditLabel: "Sun Moon Professor Kukui" },
    battleStyle: "Balanced mentor lineup with tactical versatility.", signaturePokemon: ["Incineroar", "Lycanroc", "Braviary"], quote: "Mentor energy with championship bite.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon professor and final battle role.", teamGame: "Alola league climax", team: "Starter-variant ace plus balanced support and tempo options.",
    tags: ["character", "professor", "alola"], roleNote: "Kukui bridges professor role and final-battle authority."
  },
  {
    slug: "professor-burnet", name: "Professor Burnet", roleHint: "Alola dream researcher and support character", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Professor Burnet from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Professor_Burnet.png", creditLabel: "Sun Moon Professor Burnet" },
    battleStyle: "Research-support role with limited direct battle emphasis.", signaturePokemon: ["Slowbro", "Bewear"], quote: "Research-first character profile.",
    appearance: "Pokemon Sun / Moon and Ultra Sun / Ultra Moon research support arc.", teamGame: "Research encounter profile", team: "Support-focused roster with contextual battle presence.",
    tags: ["character", "professor", "alola"], roleNote: "Burnet is a key academic support figure in Alola."
  },
  {
    slug: "sonia", name: "Sonia", roleHint: "Galar researcher and story guide", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Sonia from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Sonia.png", creditLabel: "Sword Shield Sonia" },
    battleStyle: "Primarily narrative and research guidance role.", signaturePokemon: ["Yamper", "Boltund"], quote: "Research and lore progression anchor.",
    appearance: "Pokemon Sword / Shield story guidance and legend research arc.", teamGame: "Story guide profile", team: "Limited battle focus; lore and progression support.",
    tags: ["character", "researcher", "galar"], roleNote: "Sonia links Galar lore progression with player journey."
  },
  {
    slug: "raihan", name: "Raihan", roleHint: "Galar Gym Leader and weather specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Raihan from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Raihan.png", creditLabel: "Sword Shield Raihan" },
    battleStyle: "Weather-oriented tactical pressure and doubles-like control.", signaturePokemon: ["Duraludon", "Flygon", "Goodra"], quote: "Strategic weather control with showmanship.",
    appearance: "Pokemon Sword / Shield late-gym and tournament route.", teamGame: "Hammerlocke Gym / rematches", team: "Weather-synergy core anchored by Duraludon.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Raihan highlights weather strategy in Galar's gym circuit."
  },
  {
    slug: "bea", name: "Bea", roleHint: "Galar Gym Leader and fighting specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Bea from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Bea.png", creditLabel: "Sword Shield Bea" },
    battleStyle: "High-pressure physical offense with disciplined timing.", signaturePokemon: ["Machamp", "Hawlucha", "Sirfetchd"], quote: "Pure combat focus and precision.",
    appearance: "Pokemon Sword / Shield gym and tournament appearances.", teamGame: "Stow-on-Side Gym", team: "Fighting-core lineup with Gigantamax Machamp closer.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Bea exemplifies direct physical-pressure gym design."
  },
  {
    slug: "nessa", name: "Nessa", roleHint: "Galar Gym Leader and water specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Nessa from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Nessa.png", creditLabel: "Sword Shield Nessa" },
    battleStyle: "Water-control pacing with momentum-preserving swaps.", signaturePokemon: ["Drednaw", "Barraskewda", "Golisopod"], quote: "Controlled tempo, sharp execution.",
    appearance: "Pokemon Sword / Shield gym circuit and rematches.", teamGame: "Hulbury Gym", team: "Water-focused lineup led by Drednaw dynamics.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Nessa introduces early water-based tempo strategy in Galar."
  },
  {
    slug: "allister", name: "Allister", roleHint: "Galar Gym Leader and ghost specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Allister from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Allister.png", creditLabel: "Sword Shield Allister" },
    battleStyle: "Status and ghost pressure with matchup disruption.", signaturePokemon: ["Gengar", "Mimikyu", "Cursola"], quote: "Quiet style, dangerous ghost control.",
    appearance: "Pokemon Sword / Shield gym and tournament appearances.", teamGame: "Stow-on-Side Gym", team: "Ghost-core lineup with Gigantamax Gengar finish.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Allister emphasizes disruption and ghost tempo."
  },
  {
    slug: "piers", name: "Piers", roleHint: "Spikemuth Gym Leader and dark specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Piers from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Piers.png", creditLabel: "Sword Shield Piers" },
    battleStyle: "Dark-theme pressure without Dynamax reliance in core battle.", signaturePokemon: ["Obstagoon", "Skuntank", "Malamar"], quote: "No giant gimmicks, just pressure.",
    appearance: "Pokemon Sword / Shield Spikemuth route and post-story role.", teamGame: "Spikemuth Gym", team: "Dark-core lineup anchored by Obstagoon pace.",
    tags: ["character", "gym-leader", "galar", "dark-theme"], roleNote: "Piers stands out for non-Dynamax gym identity."
  },
  {
    slug: "oleana", name: "Oleana", roleHint: "Macro Cosmos executive and antagonist support", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Oleana from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Oleana.png", creditLabel: "Sword Shield Oleana" },
    battleStyle: "Corporate-antagonist tempo with tricky support choices.", signaturePokemon: ["Garbodor", "Froslass", "Milotic"], quote: "Calculated executive pressure.",
    appearance: "Pokemon Sword / Shield Macro Cosmos conflict arc.", teamGame: "Macro Cosmos battles", team: "Mixed coverage roster with Gigantamax Garbodor spotlight.",
    tags: ["character", "antagonist", "galar"], roleNote: "Oleana reinforces Galar's corporate conflict tone."
  },
  {
    slug: "akari", name: "Akari", roleHint: "Hisui counterpart and field survey partner", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Akari from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Akari.png", creditLabel: "Legends Arceus Akari" },
    battleStyle: "Survey-focused support pacing with expedition context.", signaturePokemon: ["Pikachu", "Munchlax"], quote: "Field survey companion with steady support.",
    appearance: "Pokemon Legends Arceus counterpart role.", teamGame: "Hisui expedition profile", team: "Supportive lineup tied to survey progression.",
    tags: ["character", "counterpart", "hisui"], roleNote: "Akari is the primary counterpart identity in PLA depending on choice."
  },
  {
    slug: "rei", name: "Rei", roleHint: "Hisui counterpart and field survey partner", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Rei from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Rei.png", creditLabel: "Legends Arceus Rei" },
    battleStyle: "Survey-focused support pacing with expedition context.", signaturePokemon: ["Pikachu", "Munchlax"], quote: "Exploration-first counterpart style.",
    appearance: "Pokemon Legends Arceus counterpart role.", teamGame: "Hisui expedition profile", team: "Supportive lineup tied to survey progression.",
    tags: ["character", "counterpart", "hisui"], roleNote: "Rei is the counterpart identity in PLA depending on choice."
  },
  {
    slug: "volo", name: "Volo", roleHint: "Hisui merchant with major antagonist reveal", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Volo from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Volo.png", creditLabel: "Legends Arceus Volo" },
    battleStyle: "High-end challenge roster with legendary-tier pressure.", signaturePokemon: ["Garchomp", "Togekiss", "Giratina"], quote: "One of PLA's toughest final checks.",
    appearance: "Pokemon Legends Arceus late-story and post-story climax.", teamGame: "PLA final challenge", team: "Full high-level roster into Giratina phase pressure.",
    tags: ["character", "antagonist", "hisui", "boss-trainer"], roleNote: "Volo is a flagship high-difficulty encounter in PLA."
  },
  {
    slug: "cyllene", name: "Cyllene", roleHint: "Galaxy Team captain and command authority", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Cyllene from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Cyllene.png", creditLabel: "Legends Arceus Cyllene" },
    battleStyle: "Command-focused role with limited direct battle emphasis.", signaturePokemon: ["Abra", "Golbat"], quote: "Strict command structure and discipline.",
    appearance: "Pokemon Legends Arceus command and mission progression arc.", teamGame: "Galaxy Team profile", team: "Command-role roster with narrative emphasis.",
    tags: ["character", "commander", "hisui"], roleNote: "Cyllene anchors institutional structure in Hisui."
  },
  {
    slug: "grusha", name: "Grusha", roleHint: "Paldea Gym Leader and ice specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Grusha from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Grusha.png", creditLabel: "Scarlet Violet Grusha" },
    battleStyle: "Ice-pressure sequencing with clean defensive checks.", signaturePokemon: ["Cetitan", "Altaria", "Beartic"], quote: "Cold precision and stable control.",
    appearance: "Pokemon Scarlet / Violet late gym route.", teamGame: "Glaseado Gym", team: "Ice-focused lineup with Cetitan and Altaria pressure.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Grusha defines Paldea's late-game ice-gym pacing."
  },
  {
    slug: "iono", name: "Iono", roleHint: "Paldea Gym Leader and electric specialist influencer", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Iono from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Iono.png", creditLabel: "Scarlet Violet Iono" },
    battleStyle: "Electric tempo with momentum tricks and audience-facing style.", signaturePokemon: ["Bellibolt", "Mismagius", "Luxio"], quote: "Streaming personality meets tactical pressure.",
    appearance: "Pokemon Scarlet / Violet mid-game gym route.", teamGame: "Levincia Gym", team: "Electric core with tricky ace conversion pressure.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Iono combines broadcast persona with strong tactical identity."
  },
  {
    slug: "miriam", name: "Miriam", roleHint: "Paldea academy nurse and support challenger", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Miriam from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Miriam.png", creditLabel: "Scarlet Violet Miriam" },
    battleStyle: "Supportive encounter pacing with academy context.", signaturePokemon: ["Mabosstiff", "Farigiraf"], quote: "Academy warmth with competitive edge.",
    appearance: "Pokemon Scarlet / Violet academy side content.", teamGame: "Academy challenge profile", team: "Balanced support roster built around academy progression.",
    tags: ["character", "academy", "paldea"], roleNote: "Miriam reinforces academy worldbuilding in Paldea."
  },
  {
    slug: "katy", name: "Katy", roleHint: "Paldea Gym Leader and bug specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Katy from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Katy.png", creditLabel: "Scarlet Violet Katy" },
    battleStyle: "Early-gym bug pressure with reliable structure.", signaturePokemon: ["Teddiursa", "Nymble", "Tarountula"], quote: "Disciplined opening-gym pacing.",
    appearance: "Pokemon Scarlet / Violet early gym route.", teamGame: "Cortondo Gym", team: "Bug-lineup anchored by strategic ace timing.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Katy sets early gym pacing in Paldea."
  },
  {
    slug: "brassius", name: "Brassius", roleHint: "Paldea Gym Leader and grass specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Brassius from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Brassius.png", creditLabel: "Scarlet Violet Brassius" },
    battleStyle: "Grass-focused pressure with artistic unpredictability.", signaturePokemon: ["Sudowoodo", "Petilil", "Smoliv"], quote: "Aesthetic expression through battle.",
    appearance: "Pokemon Scarlet / Violet early-mid gym route.", teamGame: "Artazon Gym", team: "Grass-core lineup with Terastal ace pivot.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Brassius links gym battle identity to artistic character tone."
  },
  {
    slug: "tulip", name: "Tulip", roleHint: "Paldea Gym Leader and psychic specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Tulip from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Tulip.png", creditLabel: "Scarlet Violet Tulip" },
    battleStyle: "Psychic pressure with controlled offense and setup threats.", signaturePokemon: ["Florges", "Espathra", "Gardevoir"], quote: "Style and precision in sync.",
    appearance: "Pokemon Scarlet / Violet late gym route.", teamGame: "Alfornada Gym", team: "Psychic-core roster with high special pressure.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Tulip emphasizes late-route psychic matchup checks."
  },
  {
    slug: "ryme", name: "Ryme", roleHint: "Paldea Gym Leader and ghost specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Ryme from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Ryme.png", creditLabel: "Scarlet Violet Ryme" },
    battleStyle: "Ghost-theme control with doubles-oriented pressure moments.", signaturePokemon: ["Toxtricity", "Mimikyu", "Houndstone"], quote: "Rhythm and pressure in tandem.",
    appearance: "Pokemon Scarlet / Violet mid-late gym route.", teamGame: "Montenevera Gym", team: "Ghost-focused lineup with disruptive pacing and ace pressure.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Ryme's format and style create a distinct gym tempo."
  },
  {
    slug: "kofu", name: "Kofu", roleHint: "Paldea Gym Leader and water specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Kofu from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Kofu.png", creditLabel: "Scarlet Violet Kofu" },
    battleStyle: "Water pressure and durable tempo lines.", signaturePokemon: ["Veluza", "Wugtrio", "Crabominable"], quote: "Big personality, steady pressure.",
    appearance: "Pokemon Scarlet / Violet water gym route.", teamGame: "Cascarrafa Gym", team: "Water-oriented lineup with tempo-preserving offense.",
    tags: ["character", "gym-leader", "paldea"], roleNote: "Kofu represents Paldea's mid-game water matchup checks."
  },
  {
    slug: "ortega", name: "Ortega", roleHint: "Team Star fairy crew boss", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Ortega from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Ortega.png", creditLabel: "Scarlet Violet Ortega" },
    battleStyle: "Fairy-oriented boss pressure with strong ace timing.", signaturePokemon: ["Azumarill", "Wigglytuff", "Revavroom"], quote: "Stylized fairy offense with bite.",
    appearance: "Pokemon Scarlet / Violet Team Star fairy crew route.", teamGame: "Team Star fairy base", team: "Fairy core and themed Revavroom starmobile finisher.",
    tags: ["character", "team-star", "paldea", "fairy-theme"], roleNote: "Ortega highlights Team Star's themed boss design."
  },
  {
    slug: "atticus", name: "Atticus", roleHint: "Team Star poison crew boss", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Atticus from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Atticus.png", creditLabel: "Scarlet Violet Atticus" },
    battleStyle: "Poison pressure with status and attrition lines.", signaturePokemon: ["Skuntank", "Muk", "Revavroom"], quote: "Thematic poison control and pressure.",
    appearance: "Pokemon Scarlet / Violet Team Star poison crew route.", teamGame: "Team Star poison base", team: "Poison lineup with starmobile ace finisher.",
    tags: ["character", "team-star", "paldea", "poison-theme"], roleNote: "Atticus emphasizes status-based attrition in Team Star encounters."
  },
  {
    slug: "eri", name: "Eri", roleHint: "Team Star fighting crew boss", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Eri from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Eri.png", creditLabel: "Scarlet Violet Eri" },
    battleStyle: "Heavy physical pressure with durable frontline options.", signaturePokemon: ["Annihilape", "Toxicroak", "Revavroom"], quote: "Frontline intensity and power.",
    appearance: "Pokemon Scarlet / Violet Team Star fighting crew route.", teamGame: "Team Star fighting base", team: "Fighting-heavy lineup with starmobile closer.",
    tags: ["character", "team-star", "paldea", "fighting-theme"], roleNote: "Eri's encounter is one of Team Star's hardest physical-pressure checks."
  },
  {
    slug: "mela", name: "Mela", roleHint: "Team Star fire crew boss", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Mela from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Mela.png", creditLabel: "Scarlet Violet Mela" },
    battleStyle: "Fire-theme offense with immediate early pressure.", signaturePokemon: ["Torkoal", "Armarouge", "Revavroom"], quote: "Direct firepower and fast tempo.",
    appearance: "Pokemon Scarlet / Violet Team Star fire crew route.", teamGame: "Team Star fire base", team: "Fire core and starmobile ace battle finisher.",
    tags: ["character", "team-star", "paldea", "fire-theme"], roleNote: "Mela defines Team Star's early high-pressure boss pacing."
  },
  {
    slug: "ghetsis", name: "Ghetsis", roleHint: "Plasma kingpin and major Unova antagonist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Ghetsis from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Ghetsis.png", creditLabel: "Black White Ghetsis" },
    battleStyle: "Control-heavy villain roster with brutal late-fight pressure.", signaturePokemon: ["Hydreigon", "Cofagrigus", "Seismitoad"], quote: "Manipulation backed by raw force.",
    appearance: "Pokemon Black / White climax and Black 2 / White 2 continuation.", teamGame: "Team Plasma final battle", team: "Hydreigon-led mixed coverage core with oppressive tempo.",
    tags: ["character", "antagonist", "unova", "boss-trainer"], roleNote: "Ghetsis is one of Unova's definitive high-stakes villain encounters."
  },
  {
    slug: "colress", name: "Colress", roleHint: "Plasma scientist and battle theorist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Colress from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Colress.png", creditLabel: "Black 2 White 2 Colress" },
    battleStyle: "Tech-oriented setups with steel-electric pressure.", signaturePokemon: ["Magnezone", "Klinklang", "Beheeyem"], quote: "Research and battle optimization in one profile.",
    appearance: "Pokemon Black 2 / White 2 Team Plasma and post-story arcs.", teamGame: "B2/W2 Plasma encounters", team: "Magnezone-centric tactical lineup with disruptive pivots.",
    tags: ["character", "scientist", "unova", "antagonist-arc"], roleNote: "Colress blends rival-like battle depth with villain-side narrative role."
  },
  {
    slug: "elesa", name: "Elesa", roleHint: "Nimbasa Gym Leader and electric specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Elesa from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Elesa.png", creditLabel: "Black White Elesa" },
    battleStyle: "High-mobility electric pressure with momentum loops.", signaturePokemon: ["Zebstrika", "Emolga", "Eelektross"], quote: "Showmanship and speed define the matchup.",
    appearance: "Pokemon Black / White and Black 2 / White 2 gym path.", teamGame: "Nimbasa Gym", team: "Fast electric core with coverage pivots and tempo control.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Elesa is a signature tempo-check gym battle in Unova."
  },
  {
    slug: "clay", name: "Clay", roleHint: "Driftveil Gym Leader and ground specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Clay from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Clay.png", creditLabel: "Black White Clay" },
    battleStyle: "Ground pressure with strong physical-stat anchors.", signaturePokemon: ["Excadrill", "Krokorok", "Palpitoad"], quote: "Direct offense with sturdy field control.",
    appearance: "Pokemon Black / White and Black 2 / White 2 gym progression.", teamGame: "Driftveil Gym", team: "Excadrill-led ground roster with durable frontline pressure.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Clay often marks a significant mid-route difficulty step."
  },
  {
    slug: "skyla", name: "Skyla", roleHint: "Mistralton Gym Leader and flying specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Skyla from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Skyla.png", creditLabel: "Black White Skyla" },
    battleStyle: "Aerial tempo with speed and pivot pressure.", signaturePokemon: ["Swanna", "Skarmory", "Unfezant"], quote: "Flight-path momentum and matchup reads.",
    appearance: "Pokemon Black / White and Black 2 / White 2 gym route.", teamGame: "Mistralton Gym", team: "Flying-focused roster that punishes weak electric/rock prep.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Skyla emphasizes speed-based aerial pressure in Unova."
  },
  {
    slug: "brycen", name: "Brycen", roleHint: "Icirrus Gym Leader and ice specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Brycen from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Brycen.png", creditLabel: "Black White Brycen" },
    battleStyle: "Ice matchup checks with clean defensive punish windows.", signaturePokemon: ["Beartic", "Vanillish", "Cryogonal"], quote: "Calm execution over flashy offense.",
    appearance: "Pokemon Black / White gym route and world tournament appearances.", teamGame: "Icirrus Gym", team: "Ice-core lineup with balanced utility and threat coverage.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Brycen's gym tests team flexibility against ice pressure."
  },
  {
    slug: "drayden", name: "Drayden", roleHint: "Opelucid Gym Leader and dragon specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Drayden from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Drayden.png", creditLabel: "Black White Drayden" },
    battleStyle: "Late-route dragon offense with heavy damage spikes.", signaturePokemon: ["Haxorus", "Druddigon", "Flygon"], quote: "Veteran dragon pressure with authority.",
    appearance: "Pokemon Black / White and Black 2 / White 2 gym storyline.", teamGame: "Opelucid Gym", team: "Dragon-centric lineup tuned for late-game stat pressure.",
    tags: ["character", "gym-leader", "unova", "dragon-specialist"], roleNote: "Drayden is one of Unova's core late-game gatekeepers."
  },
  {
    slug: "roxie", name: "Roxie", roleHint: "Virbank Gym Leader and poison specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Roxie from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Roxie.png", creditLabel: "Black 2 White 2 Roxie" },
    battleStyle: "Aggressive poison tempo with status pressure.", signaturePokemon: ["Whirlipede", "Koffing", "Scolipede"], quote: "Punk pace and toxic control.",
    appearance: "Pokemon Black 2 / White 2 early gym route.", teamGame: "Virbank Gym", team: "Poison-forward roster designed for early momentum disruption.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Roxie sets fast, status-focused pacing early in B2/W2."
  },
  {
    slug: "marlon", name: "Marlon", roleHint: "Humilau Gym Leader and water specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Marlon from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Marlon.png", creditLabel: "Black 2 White 2 Marlon" },
    battleStyle: "Water tempo with flexible offensive coverage.", signaturePokemon: ["Jellicent", "Carracosta", "Wailord"], quote: "Relaxed style, sharp battle control.",
    appearance: "Pokemon Black 2 / White 2 final gym progression.", teamGame: "Humilau Gym", team: "Water-centric late-gym lineup with broad matchup checks.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Marlon acts as Unova's final gym checkpoint in B2/W2."
  },
  {
    slug: "grimsley", name: "Grimsley", roleHint: "Unova Elite Four member and dark specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Grimsley from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Grimsley.png", creditLabel: "Black White Grimsley" },
    battleStyle: "Dark pressure and risk-reward tempo lines.", signaturePokemon: ["Bisharp", "Krookodile", "Scrafty"], quote: "Calculated gambles with lethal payoff.",
    appearance: "Pokemon Black / White Elite Four and legacy appearances.", teamGame: "Unova Elite Four", team: "Dark-forward lineup with punishing physical finishers.",
    tags: ["character", "elite-four", "unova", "dark-theme"], roleNote: "Grimsley represents Unova's high-risk dark specialist style."
  },
  {
    slug: "caitlin", name: "Caitlin", roleHint: "Unova Elite Four member and psychic specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Caitlin from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Caitlin.png", creditLabel: "Black White Caitlin" },
    battleStyle: "Psychic control with high special-pressure bursts.", signaturePokemon: ["Reuniclus", "Sigilyph", "Gothitelle"], quote: "Composed posture, dangerous output.",
    appearance: "Pokemon Black / White Elite Four and tournament content.", teamGame: "Unova Elite Four", team: "Psychic-focused roster with layered special offense.",
    tags: ["character", "elite-four", "unova"], roleNote: "Caitlin is a core special-offense check in Unova's league run."
  },
  {
    slug: "marshal", name: "Marshal", roleHint: "Unova Elite Four member and fighting specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Marshal from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Marshal.png", creditLabel: "Black White Marshal" },
    battleStyle: "Physical pressure and relentless close-range offense.", signaturePokemon: ["Conkeldurr", "Throh", "Sawk"], quote: "Pure force and discipline.",
    appearance: "Pokemon Black / White Elite Four and battle facilities.", teamGame: "Unova Elite Four", team: "Fighting-heavy lineup built around raw physical pressure.",
    tags: ["character", "elite-four", "unova"], roleNote: "Marshal is one of Unova's most direct physical offense gates."
  },
  {
    slug: "shauntal", name: "Shauntal", roleHint: "Unova Elite Four member and ghost specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Shauntal from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Shauntal.png", creditLabel: "Black White Shauntal" },
    battleStyle: "Ghost disruption and status-driven pressure lines.", signaturePokemon: ["Chandelure", "Cofagrigus", "Golurk"], quote: "Narrative charm with dangerous ghost control.",
    appearance: "Pokemon Black / White Elite Four and rematch content.", teamGame: "Unova Elite Four", team: "Ghost-core lineup with high special-pressure anchors.",
    tags: ["character", "elite-four", "unova", "ghost-theme"], roleNote: "Shauntal sets an early disruptive rhythm in Unova's Elite Four."
  },
  {
    slug: "nate", name: "Nate", roleHint: "Male protagonist of Black 2 and White 2", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Nate from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Nate.png", creditLabel: "Black 2 White 2 Nate" },
    battleStyle: "Player-defined progression with broad route adaptability.", signaturePokemon: ["Samurott", "Lucario", "Zoroark"], quote: "Story momentum through a custom build path.",
    appearance: "Pokemon Black 2 / White 2 main protagonist route.", teamGame: "B2/W2 campaign", team: "Starter-driven lineup with flexible role coverage by route choice.",
    tags: ["character", "protagonist", "unova"], roleNote: "Nate represents B2/W2's protagonist branch and progression arc."
  },
  {
    slug: "rosa", name: "Rosa", roleHint: "Female protagonist of Black 2 and White 2", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Rosa from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black_2_White_2_Rosa.png", creditLabel: "Black 2 White 2 Rosa" },
    battleStyle: "Player-defined team growth with consistent pace control.", signaturePokemon: ["Emboar", "Ampharos", "Lapras"], quote: "Confident route progression and flexible planning.",
    appearance: "Pokemon Black 2 / White 2 protagonist route and media appearances.", teamGame: "B2/W2 campaign", team: "Starter-led adaptable lineup shaped by route and preference.",
    tags: ["character", "protagonist", "unova"], roleNote: "Rosa is a flagship B2/W2 protagonist identity."
  },
  {
    slug: "wally", name: "Wally", roleHint: "Hoenn rival with late-game power spike", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Wally from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Wally.png", creditLabel: "Omega Ruby Alpha Sapphire Wally" },
    battleStyle: "Growth-arc rival pacing into high-threat late battles.", signaturePokemon: ["Gallade", "Roserade", "Gardevoir"], quote: "From timid beginner to elite rival pressure.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS expanded rival arc.", teamGame: "Victory Road / post-story rival", team: "Balanced high-level roster centered on Mega Gallade threat.",
    tags: ["character", "rival", "hoenn"], roleNote: "Wally is one of Hoenn's strongest character-growth rival designs."
  },
  {
    slug: "wallace", name: "Wallace", roleHint: "Sootopolis leader and Hoenn Champion variant", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Wallace from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Wallace.png", creditLabel: "Omega Ruby Alpha Sapphire Wallace" },
    battleStyle: "Elegant water control with specialized matchup pressure.", signaturePokemon: ["Milotic", "Ludicolo", "Whiscash"], quote: "Graceful style backed by tactical depth.",
    appearance: "Pokemon Emerald champion role and ORAS rematch context.", teamGame: "Hoenn league/champion profile", team: "Water-leaning champion-level roster with Milotic centerpiece.",
    tags: ["character", "champion", "hoenn", "water-specialist"], roleNote: "Wallace defines Hoenn's water-centric champion identity."
  },
  {
    slug: "roxanne", name: "Roxanne", roleHint: "Rustboro Gym Leader and rock specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Roxanne from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Roxanne.png", creditLabel: "Omega Ruby Alpha Sapphire Roxanne" },
    battleStyle: "Structured early-gym defense with type-discipline checks.", signaturePokemon: ["Nosepass", "Geodude", "Relicanth"], quote: "Academic precision in battle form.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS gym route.", teamGame: "Rustboro Gym", team: "Rock-focused setup designed to test early route preparation.",
    tags: ["character", "gym-leader", "hoenn"], roleNote: "Roxanne is Hoenn's foundational first-gym challenge."
  },
  {
    slug: "brawly", name: "Brawly", roleHint: "Dewford Gym Leader and fighting specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Brawly from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Brawly.png", creditLabel: "Omega Ruby Alpha Sapphire Brawly" },
    battleStyle: "Fast physical offense with straightforward pressure lines.", signaturePokemon: ["Makuhita", "Hariyama", "Breloom"], quote: "Energetic pressure and direct trades.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS gym circuit.", teamGame: "Dewford Gym", team: "Fighting-leaning lineup built for momentum and attack pressure.",
    tags: ["character", "gym-leader", "hoenn"], roleNote: "Brawly pushes early-mid route physical matchup checks."
  },
  {
    slug: "wattson", name: "Wattson", roleHint: "Mauville Gym Leader and electric specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Wattson from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Wattson.png", creditLabel: "Omega Ruby Alpha Sapphire Wattson" },
    battleStyle: "Electric tempo with paralysis and speed disruption.", signaturePokemon: ["Manectric", "Magneton", "Electrode"], quote: "Volatile speed control and pressure.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS gym progression.", teamGame: "Mauville Gym", team: "Electric lineup tuned for speed swings and status control.",
    tags: ["character", "gym-leader", "hoenn"], roleNote: "Wattson introduces strong tempo disruption in Hoenn's gym arc."
  },
  {
    slug: "flannery", name: "Flannery", roleHint: "Lavaridge Gym Leader and fire specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Flannery from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Flannery.png", creditLabel: "Omega Ruby Alpha Sapphire Flannery" },
    battleStyle: "High-heat offensive pressure with momentum bursts.", signaturePokemon: ["Torkoal", "Numel", "Slugma"], quote: "Aggressive fire pacing with growing confidence.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS gym route.", teamGame: "Lavaridge Gym", team: "Fire-forward lineup anchored by durable Torkoal pressure.",
    tags: ["character", "gym-leader", "hoenn"], roleNote: "Flannery marks Hoenn's fire-type strategic checkpoint."
  },
  {
    slug: "norman", name: "Norman", roleHint: "Petalburg Gym Leader and balanced normal specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Norman from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Norman.png", creditLabel: "Omega Ruby Alpha Sapphire Norman" },
    battleStyle: "Consistent neutral-pressure battles with efficient damage plans.", signaturePokemon: ["Slaking", "Vigoroth", "Spinda"], quote: "Disciplined fundamentals over gimmicks.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS family-gym arc.", teamGame: "Petalburg Gym", team: "Normal-core roster led by high-impact Slaking turns.",
    tags: ["character", "gym-leader", "hoenn"], roleNote: "Norman's encounter is a classic mid-game power check in Hoenn."
  },
  {
    slug: "winona", name: "Winona", roleHint: "Fortree Gym Leader and flying specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Winona from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Winona.png", creditLabel: "Omega Ruby Alpha Sapphire Winona" },
    battleStyle: "Aerial pressure with mixed offensive angles.", signaturePokemon: ["Altaria", "Pelipper", "Skarmory"], quote: "Graceful flight style with tactical edge.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS late gym route.", teamGame: "Fortree Gym", team: "Flying-specialist roster featuring Mega Altaria in rematches.",
    tags: ["character", "gym-leader", "hoenn"], roleNote: "Winona reinforces advanced flying matchups in late Hoenn."
  },
  {
    slug: "mustard", name: "Mustard", roleHint: "Isle of Armor master and dojo champion", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Mustard from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Mustard.png", creditLabel: "Sword Shield Mustard" },
    battleStyle: "Veteran pressure with adaptable offensive sequencing.", signaturePokemon: ["Urshifu", "Mienshao", "Luxray"], quote: "Dojo mastery and championship-level pacing.",
    appearance: "Pokemon Sword / Shield Isle of Armor DLC storyline.", teamGame: "Master Dojo final battle", team: "Urshifu-led elite lineup with broad coverage threats.",
    tags: ["character", "mentor", "galar", "boss-trainer"], roleNote: "Mustard is the central battle mentor and final gate of Isle of Armor."
  },
  {
    slug: "klara", name: "Klara", roleHint: "Isle of Armor rival and poison specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Klara from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Klara.png", creditLabel: "Sword Shield Klara" },
    battleStyle: "Poison tempo with trick plays and matchup disruption.", signaturePokemon: ["Slowbro", "Amoonguss", "Galarian Slowpoke"], quote: "Cunning pressure behind flashy persona.",
    appearance: "Pokemon Sword Isle of Armor rival route.", teamGame: "Isle of Armor rival battles", team: "Poison-focused lineup with tactical misdirection tools.",
    tags: ["character", "rival", "galar", "poison-theme"], roleNote: "Klara gives Sword's DLC route a distinct rival identity."
  },
  {
    slug: "avery", name: "Avery", roleHint: "Isle of Armor rival and psychic specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Avery from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Avery.png", creditLabel: "Sword Shield Avery" },
    battleStyle: "Psychic tricks and controlled battlefield momentum.", signaturePokemon: ["Slowking", "Alakazam", "Galarian Slowpoke"], quote: "Refined technique with tactical pressure.",
    appearance: "Pokemon Shield Isle of Armor rival route.", teamGame: "Isle of Armor rival battles", team: "Psychic-oriented lineup with setup and control pivots.",
    tags: ["character", "rival", "galar"], roleNote: "Avery provides Shield's DLC counterpart rival arc."
  },
  {
    slug: "milo", name: "Milo", roleHint: "Turffield Gym Leader and grass specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Milo from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Milo.png", creditLabel: "Sword Shield Milo" },
    battleStyle: "Steady opening-gym fundamentals with grass pressure.", signaturePokemon: ["Eldegoss", "Gossifleur", "Appletun"], quote: "Reliable pacing with grounded fundamentals.",
    appearance: "Pokemon Sword / Shield opening gym challenge.", teamGame: "Turffield Gym", team: "Grass-core first-gym roster led by Gigantamax Eldegoss.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Milo sets foundational gym pacing for Galar."
  },
  {
    slug: "kabu", name: "Kabu", roleHint: "Motostoke Gym Leader and fire specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Kabu from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Kabu.png", creditLabel: "Sword Shield Kabu" },
    battleStyle: "Disciplined fire offense with trap and pressure tools.", signaturePokemon: ["Centiskorch", "Arcanine", "Ninetales"], quote: "Veteran fire pacing with strict control.",
    appearance: "Pokemon Sword / Shield early-mid gym route.", teamGame: "Motostoke Gym", team: "Fire-focused lineup with Gigantamax Centiskorch closer.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Kabu is a notable difficulty jump in early Galar gyms."
  },
  {
    slug: "opal", name: "Opal", roleHint: "Ballonlea Gym Leader and fairy specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Opal from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Opal.png", creditLabel: "Sword Shield Opal" },
    battleStyle: "Fairy-themed pressure with unpredictable quiz-driven pacing.", signaturePokemon: ["Alcremie", "Togekiss", "Mawile"], quote: "Whimsical style with real tactical bite.",
    appearance: "Pokemon Sword / Shield mid-late gym route.", teamGame: "Ballonlea Gym", team: "Fairy-specialist roster centered on Gigantamax Alcremie.",
    tags: ["character", "gym-leader", "galar", "fairy-theme"], roleNote: "Opal stands out for both mechanics and distinct gym personality."
  },
  {
    slug: "adaman", name: "Adaman", roleHint: "Diamond Clan leader and key Hisui ally", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Adaman from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Adaman.png", creditLabel: "Legends Arceus Adaman" },
    battleStyle: "Fast initiative and aggressive reaction pressure.", signaturePokemon: ["Leafeon", "Vaporeon", "Lycanroc"], quote: "Decisive action with clan-leader confidence.",
    appearance: "Pokemon Legends Arceus main story and clan conflict arc.", teamGame: "Diamond Clan clashes", team: "Balanced offensive lineup supporting rapid tempo choices.",
    tags: ["character", "clan-leader", "hisui"], roleNote: "Adaman is central to Hisui's faction conflict and alliance arc."
  },
  {
    slug: "irida", name: "Irida", roleHint: "Pearl Clan leader and key Hisui ally", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Irida from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Irida.png", creditLabel: "Legends Arceus Irida" },
    battleStyle: "Measured tempo with defensive reads and setup timing.", signaturePokemon: ["Glaceon", "Espeon", "Umbreon"], quote: "Patience and precision under pressure.",
    appearance: "Pokemon Legends Arceus central story and post-ride progression.", teamGame: "Pearl Clan clashes", team: "Flexible lineup with balanced offense and control options.",
    tags: ["character", "clan-leader", "hisui"], roleNote: "Irida anchors one of PLA's major ideological perspectives."
  },
  {
    slug: "ingo", name: "Ingo", roleHint: "Warden and battle specialist with mystery arc", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Ingo from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Ingo.png", creditLabel: "Legends Arceus Ingo" },
    battleStyle: "Technical field control with veteran trainer instincts.", signaturePokemon: ["Sneasler", "Machamp", "Tangrowth"], quote: "Sharp tactics framed by fragmented memories.",
    appearance: "Pokemon Legends Arceus Coronet Highlands and warden storyline.", teamGame: "Highlands warden battles", team: "Well-rounded lineup with strong positional pressure.",
    tags: ["character", "warden", "hisui"], roleNote: "Ingo is one of PLA's strongest lore-connected side characters."
  },
  {
    slug: "kamado", name: "Kamado", roleHint: "Galaxy Team commander and major authority figure", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Kamado from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Kamado.png", creditLabel: "Legends Arceus Kamado" },
    battleStyle: "Command-style pressure with robust frontline choices.", signaturePokemon: ["Snorlax", "Golem", "Braviary"], quote: "Institutional authority tested by crisis.",
    appearance: "Pokemon Legends Arceus command and late-story confrontation.", teamGame: "Galaxy Team command battle", team: "Power-focused roster built around durable threats.",
    tags: ["character", "commander", "hisui"], roleNote: "Kamado is pivotal to PLA's governance and conflict escalation."
  },
  {
    slug: "cogita", name: "Cogita", roleHint: "Mysterious Hisui guide tied to ancient lore", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Cogita from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Cogita.png", creditLabel: "Legends Arceus Cogita" },
    battleStyle: "Lore-linked support role with selective battle presence.", signaturePokemon: ["Togekiss", "Garchomp"], quote: "Ancient knowledge and quiet certainty.",
    appearance: "Pokemon Legends Arceus late story and mythic lore route.", teamGame: "Hisui lore profile", team: "Limited battle role with high-lore significance.",
    tags: ["character", "lore", "hisui"], roleNote: "Cogita connects multiple mythic threads in PLA."
  },
  {
    slug: "professor-laventon", name: "Professor Laventon", roleHint: "Hisui professor and Pokedex coordinator", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Professor Laventon from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Professor_Laventon.png", creditLabel: "Legends Arceus Professor Laventon" },
    battleStyle: "Research-first profile with minimal battle emphasis.", signaturePokemon: ["Rowlet", "Cyndaquil", "Oshawott"], quote: "Scientific curiosity drives the expedition.",
    appearance: "Pokemon Legends Arceus expedition setup and research progression.", teamGame: "Survey Corps research profile", team: "Starter-linked educational context rather than battle focus.",
    tags: ["character", "professor", "hisui"], roleNote: "Laventon is the central academic engine for PLA's Pokedex loop."
  },
  {
    slug: "arezu", name: "Arezu", roleHint: "Warden of Lady Lilligant and mission specialist", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Arezu from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Arezu.png", creditLabel: "Legends Arceus Arezu" },
    battleStyle: "Quick-paced warden encounters with aggressive turns.", signaturePokemon: ["Lilligant", "Haunter", "Skuntank"], quote: "Direct attitude with fast tactical decisions.",
    appearance: "Pokemon Legends Arceus Crimson Mirelands mission arc.", teamGame: "Mirelands warden encounters", team: "Speed-focused lineup with status and offensive pressure.",
    tags: ["character", "warden", "hisui"], roleNote: "Arezu is a high-energy warden presence in early-mid PLA progression."
  },
  {
    slug: "mai", name: "Mai", roleHint: "Diamond Clan warden and key traversal gate", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Mai from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Mai.png", creditLabel: "Legends Arceus Mai" },
    battleStyle: "Compact battles with focused offensive pressure.", signaturePokemon: ["Munchlax", "Purugly", "Sneasel"], quote: "Warden duty with pragmatic toughness.",
    appearance: "Pokemon Legends Arceus Obsidian Fieldlands and ride progression.", teamGame: "Wyrdeer route progression", team: "Utility-forward roster supporting traversal milestones.",
    tags: ["character", "warden", "hisui"], roleNote: "Mai anchors one of PLA's earliest and most recurrent warden interactions."
  },
  {
    slug: "perrin", name: "Perrin", roleHint: "Photographer and Kitakami exploration guide", gameTags: ["paldea", "kitakami"], regionLabel: "Kitakami",
    portraitAlt: "Official art of Perrin from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Perrin.png", creditLabel: "Scarlet Violet Perrin" },
    battleStyle: "Exploration-linked encounters with measured pressure.", signaturePokemon: ["Growlithe", "Leafeon"], quote: "Field research and legends in motion.",
    appearance: "Pokemon Scarlet / Violet DLC sidequest progression.", teamGame: "Kitakami exploration profile", team: "Small but thematic lineup tied to lore-hunt objectives.",
    tags: ["character", "explorer", "paldea", "kitakami"], roleNote: "Perrin expands character storytelling through optional exploration arcs."
  },
  {
    slug: "crispin", name: "Crispin", roleHint: "Blueberry Elite Four member and fire specialist", gameTags: ["paldea", "blueberry"], regionLabel: "Blueberry Academy",
    portraitAlt: "Official art of Crispin from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Crispin.png", creditLabel: "Scarlet Violet Crispin" },
    battleStyle: "Explosive fire pacing with elite-level offensive pressure.", signaturePokemon: ["Magmortar", "Talonflame", "Blaziken"], quote: "Hot tempo and relentless attacks.",
    appearance: "Pokemon Scarlet / Violet The Indigo Disk Blueberry Elite Four.", teamGame: "Blueberry Elite Four", team: "Fire-leaning elite roster with aggressive closers.",
    tags: ["character", "elite-four", "paldea", "blueberry"], roleNote: "Crispin is one of Blueberry's high-pressure elite checkpoints."
  },
  {
    slug: "lacey", name: "Lacey", roleHint: "Blueberry Elite Four member and fairy specialist", gameTags: ["paldea", "blueberry"], regionLabel: "Blueberry Academy",
    portraitAlt: "Official art of Lacey from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Lacey.png", creditLabel: "Scarlet Violet Lacey" },
    battleStyle: "Fairy control with precision setup and punishing endgame.", signaturePokemon: ["Granbull", "Whimsicott", "Primarina"], quote: "Graceful tone, sharp tactical intent.",
    appearance: "Pokemon Scarlet / Violet The Indigo Disk Blueberry Elite Four.", teamGame: "Blueberry Elite Four", team: "Fairy-focused roster with strong special-pressure finishers.",
    tags: ["character", "elite-four", "paldea", "blueberry", "fairy-theme"], roleNote: "Lacey provides Blueberry's technical fairy matchup test."
  },
  {
    slug: "drayton", name: "Drayton", roleHint: "Blueberry Elite Four member and dragon specialist", gameTags: ["paldea", "blueberry"], regionLabel: "Blueberry Academy",
    portraitAlt: "Official art of Drayton from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Drayton.png", creditLabel: "Scarlet Violet Drayton" },
    battleStyle: "Dragon pressure with elite pacing and heavy damage spikes.", signaturePokemon: ["Archaludon", "Sceptile", "Dragonite"], quote: "Confident elite presence with serious bite.",
    appearance: "Pokemon Scarlet / Violet The Indigo Disk Blueberry Elite Four.", teamGame: "Blueberry Elite Four", team: "Dragon-heavy lineup tuned for high stat-pressure exchanges.",
    tags: ["character", "elite-four", "paldea", "blueberry", "dragon-specialist"], roleNote: "Drayton is one of Indigo Disk's key high-threat battles."
  },
  {
    slug: "amarys", name: "Amarys", roleHint: "Blueberry Elite Four member and steel specialist", gameTags: ["paldea", "blueberry"], regionLabel: "Blueberry Academy",
    portraitAlt: "Official art of Amarys from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Amarys.png", creditLabel: "Scarlet Violet Amarys" },
    battleStyle: "Steel discipline with clean defensive punish windows.", signaturePokemon: ["Metagross", "Empoleon", "Magnezone"], quote: "Reserved presence with elite precision.",
    appearance: "Pokemon Scarlet / Violet The Indigo Disk Blueberry Elite Four.", teamGame: "Blueberry Elite Four", team: "Steel-centric roster with layered defensive-offensive transitions.",
    tags: ["character", "elite-four", "paldea", "blueberry", "steel-specialist"], roleNote: "Amarys reinforces Blueberry's tactical elite-battle identity."
  },
  {
    slug: "gordie", name: "Gordie", roleHint: "Circhester Gym Leader and rock specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Gordie from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Gordie.png", creditLabel: "Sword Shield Gordie" },
    battleStyle: "Rock-forward offense with strong physical exchanges.", signaturePokemon: ["Coalossal", "Barbaracle", "Shuckle"], quote: "Powerful swings with durable pressure.",
    appearance: "Pokemon Sword Circhester Gym route and championship rematches.", teamGame: "Circhester Gym (Sword)", team: "Rock-focused lineup anchored by Gigantamax Coalossal.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Gordie adds a high-impact physical matchup in Sword's gym path."
  },
  {
    slug: "melony", name: "Melony", roleHint: "Circhester Gym Leader and ice specialist", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Melony from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Melony.png", creditLabel: "Sword Shield Melony" },
    battleStyle: "Ice control with status pressure and careful pacing.", signaturePokemon: ["Lapras", "Frosmoth", "Eiscue"], quote: "Calm strategy with cold punish windows.",
    appearance: "Pokemon Shield Circhester Gym route and championship rematches.", teamGame: "Circhester Gym (Shield)", team: "Ice-centric lineup led by Gigantamax Lapras.",
    tags: ["character", "gym-leader", "galar"], roleNote: "Melony provides Shield's ice-oriented version of Circhester."
  },
  {
    slug: "chairman-rose", name: "Chairman Rose", roleHint: "Macro Cosmos chairman and Galar main antagonist arc", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Chairman Rose from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Chairman_Rose.png", creditLabel: "Sword Shield Chairman Rose" },
    battleStyle: "Steel-heavy executive roster with high narrative pressure.", signaturePokemon: ["Copperajah", "Ferrothorn", "Perrserker"], quote: "Corporate vision pushed to the limit.",
    appearance: "Pokemon Sword / Shield late-story Energy Plant conflict.", teamGame: "Rose Tower / Energy Plant battles", team: "Steel-oriented lineup with Gigantamax Copperajah finisher.",
    tags: ["character", "antagonist", "galar", "boss-trainer"], roleNote: "Rose drives Galar's central crisis and endgame escalation."
  },
  {
    slug: "sidney", name: "Sidney", roleHint: "Hoenn Elite Four member and dark specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Sidney from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Sidney.png", creditLabel: "Omega Ruby Alpha Sapphire Sidney" },
    battleStyle: "Dark pressure with aggressive physical and mixed threats.", signaturePokemon: ["Mightyena", "Absol", "Shiftry"], quote: "Laid-back style with sharp dark offense.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS Elite Four.", teamGame: "Hoenn Elite Four", team: "Dark-core lineup tuned for offensive momentum and coverage.",
    tags: ["character", "elite-four", "hoenn", "dark-theme"], roleNote: "Sidney opens Hoenn's Elite Four with immediate tempo pressure."
  },
  {
    slug: "phoebe", name: "Phoebe", roleHint: "Hoenn Elite Four member and ghost specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Phoebe from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Phoebe.png", creditLabel: "Omega Ruby Alpha Sapphire Phoebe" },
    battleStyle: "Ghost disruption with status and defensive pivots.", signaturePokemon: ["Dusclops", "Sableye", "Banette"], quote: "Relaxed confidence with tricky ghost control.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS Elite Four.", teamGame: "Hoenn Elite Four", team: "Ghost-focused roster balancing sustain and pressure turns.",
    tags: ["character", "elite-four", "hoenn", "ghost-theme"], roleNote: "Phoebe introduces layered status pressure in Hoenn's league run."
  },
  {
    slug: "glacia", name: "Glacia", roleHint: "Hoenn Elite Four member and ice specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Glacia from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Glacia.png", creditLabel: "Omega Ruby Alpha Sapphire Glacia" },
    battleStyle: "Ice-specialist control with bulky special-pressure anchors.", signaturePokemon: ["Walrein", "Glalie", "Froslass"], quote: "Elegant composure with punishing type pressure.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS Elite Four.", teamGame: "Hoenn Elite Four", team: "Ice-heavy roster featuring durable pivots and special pressure.",
    tags: ["character", "elite-four", "hoenn"], roleNote: "Glacia is Hoenn's primary ice matchup checkpoint in the league."
  },
  {
    slug: "drake-hoenn", name: "Drake", roleHint: "Hoenn Elite Four member and dragon specialist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Drake from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Drake.png", creditLabel: "Omega Ruby Alpha Sapphire Drake" },
    battleStyle: "Dragon pressure with high-stat closing patterns.", signaturePokemon: ["Salamence", "Flygon", "Altaria"], quote: "Veteran discipline with overwhelming dragon force.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS Elite Four finale phase.", teamGame: "Hoenn Elite Four", team: "Dragon-forward roster with high-damage finishers and durable cores.",
    tags: ["character", "elite-four", "hoenn", "dragon-specialist"], roleNote: "Drake is Hoenn's final Elite Four gate before the champion."
  },
  {
    slug: "beni", name: "Beni", roleHint: "Jubilife chef with hidden late-story battle role", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Beni from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Beni.png", creditLabel: "Legends Arceus Beni" },
    battleStyle: "Unexpected high-difficulty pressure with fast tactical pivots.", signaturePokemon: ["Mismagius", "Sneasler", "Gallade"], quote: "Quiet support role with a dangerous reveal.",
    appearance: "Pokemon Legends Arceus Jubilife Village and late climax battle.", teamGame: "Kamado route showdown", team: "Sharp high-level lineup designed to surprise and punish.",
    tags: ["character", "hisui", "boss-trainer"], roleNote: "Beni is one of PLA's most memorable hidden-power battle reveals."
  },
  {
    slug: "melli", name: "Melli", roleHint: "Diamond Clan warden tied to noble conflicts", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Melli from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Melli.png", creditLabel: "Legends Arceus Melli" },
    battleStyle: "Poison-oriented pressure with disruptive status tempo.", signaturePokemon: ["Skuntank", "Zubat", "Crobat"], quote: "Provocative style with persistent pressure.",
    appearance: "Pokemon Legends Arceus Coronet Highlands storyline.", teamGame: "Electrode arc encounters", team: "Status-leaning roster with poison pressure and positional control.",
    tags: ["character", "warden", "hisui", "poison-theme"], roleNote: "Melli provides one of PLA's strongest friction-driven character arcs."
  },
  {
    slug: "sabi", name: "Sabi", roleHint: "Pearl Clan warden and clairvoyant figure", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Sabi from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Sabi.png", creditLabel: "Legends Arceus Sabi" },
    battleStyle: "Trickier encounter pacing with prediction-heavy turns.", signaturePokemon: ["Braviary", "Rhyperior", "Magmortar"], quote: "Playful tone with serious tactical checks.",
    appearance: "Pokemon Legends Arceus highland and temple progression arc.", teamGame: "Temple trials and warden battles", team: "Mixed-coverage lineup supporting late progression gates.",
    tags: ["character", "warden", "hisui"], roleNote: "Sabi links traversal progression with late-story mission pressure."
  },
  {
    slug: "iscan", name: "Iscan", roleHint: "Pearl Clan warden of Basculegion", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Iscan from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Iscan.png", creditLabel: "Legends Arceus Iscan" },
    battleStyle: "Supportive progression profile with occasional tactical battles.", signaturePokemon: ["Basculegion", "Mantine", "Qwilfish"], quote: "Cautious personality with key route impact.",
    appearance: "Pokemon Legends Arceus Cobalt Coastlands route progression.", teamGame: "Basculegion progression profile", team: "Water-linked support roster tied to traversal milestones.",
    tags: ["character", "warden", "hisui", "coastlands"], roleNote: "Iscan anchors one of PLA's most important traversal unlock arcs."
  },
  {
    slug: "palina", name: "Palina", roleHint: "Pearl Clan warden tied to Arcanine arc", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Palina from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Palina.png", creditLabel: "Legends Arceus Palina" },
    battleStyle: "Steady support pacing with selective pressure moments.", signaturePokemon: ["Arcanine", "Growlithe"], quote: "Protective resolve under escalating danger.",
    appearance: "Pokemon Legends Arceus Coastlands noble storyline.", teamGame: "Noble Arcanine profile", team: "Story-centric roster around Arcanine line progression.",
    tags: ["character", "warden", "hisui"], roleNote: "Palina is central to one of PLA's key noble calm-down chapters."
  },
  {
    slug: "gaeric", name: "Gaeric", roleHint: "Pearl Clan warden and rugged highlands presence", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Gaeric from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Gaeric.png", creditLabel: "Legends Arceus Gaeric" },
    battleStyle: "Physical resilience and power-focused exchanges.", signaturePokemon: ["Avalugg", "Glalie", "Machoke"], quote: "Hardline strength with direct battle posture.",
    appearance: "Pokemon Legends Arceus Alabaster Icelands mission arc.", teamGame: "Noble Avalugg profile", team: "Power-weighted roster linked to icy late-game objectives.",
    tags: ["character", "warden", "hisui", "icelands"], roleNote: "Gaeric reinforces PLA's harsh late-region tone and challenge pacing."
  },
  {
    slug: "anthe", name: "Anthe", roleHint: "Jubilife clothier with side-story battle profile", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Anthe from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Anthe.png", creditLabel: "Legends Arceus Anthe" },
    battleStyle: "Light support encounters with worldbuilding focus.", signaturePokemon: ["Wurmple", "Beautifly"], quote: "Town-side role with memorable side content.",
    appearance: "Pokemon Legends Arceus Jubilife side quests and boutique context.", teamGame: "Jubilife side profile", team: "Limited side-encounter lineup tied to town interactions.",
    tags: ["character", "hisui", "jubilife"], roleNote: "Anthe contributes to PLA's everyday-life character texture."
  },
  {
    slug: "lian", name: "Lian", roleHint: "Diamond Clan warden of Kleavor", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Lian from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Lian.png", creditLabel: "Legends Arceus Lian" },
    battleStyle: "Early progression challenge with sharp tactical bursts.", signaturePokemon: ["Kleavor", "Onix", "Geodude"], quote: "Young warden confidence under pressure.",
    appearance: "Pokemon Legends Arceus Obsidian Fieldlands noble arc.", teamGame: "Kleavor progression profile", team: "Rock-leaning lineup connected to first noble encounter pacing.",
    tags: ["character", "warden", "hisui", "fieldlands"], roleNote: "Lian is one of the first major warden checkpoints in PLA."
  },
  {
    slug: "roark", name: "Roark", roleHint: "Oreburgh Gym Leader and rock specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Roark from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Roark.png", creditLabel: "Diamond Pearl Roark" },
    battleStyle: "Early-gym rock pressure with straightforward physical trades.", signaturePokemon: ["Cranidos", "Onix", "Geodude"], quote: "Solid fundamentals and steady pressure.",
    appearance: "Pokemon Diamond / Pearl / Platinum early gym route.", teamGame: "Oreburgh Gym", team: "Rock-core opening gym lineup built around physical offense.",
    tags: ["character", "gym-leader", "sinnoh"], roleNote: "Roark sets the first structured gym benchmark in Sinnoh."
  },
  {
    slug: "gardenia", name: "Gardenia", roleHint: "Eterna Gym Leader and grass specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Gardenia from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Gardenia.png", creditLabel: "Diamond Pearl Gardenia" },
    battleStyle: "Grass pressure with status support and sustain.", signaturePokemon: ["Roserade", "Turtwig", "Cherubi"], quote: "Calm setup into steady offensive rhythm.",
    appearance: "Pokemon Diamond / Pearl / Platinum gym progression.", teamGame: "Eterna Gym", team: "Grass-focused lineup with Roserade as the tactical anchor.",
    tags: ["character", "gym-leader", "sinnoh"], roleNote: "Gardenia enforces early route checks against grass control."
  },
  {
    slug: "maylene", name: "Maylene", roleHint: "Veilstone Gym Leader and fighting specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Maylene from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Maylene.png", creditLabel: "Diamond Pearl Maylene" },
    battleStyle: "Fast physical offense with close-range pressure.", signaturePokemon: ["Lucario", "Machoke", "Meditite"], quote: "Disciplined strikes and compact tempo.",
    appearance: "Pokemon Diamond / Pearl / Platinum mid-game gym route.", teamGame: "Veilstone Gym", team: "Fighting-core roster with Lucario-led pressure turns.",
    tags: ["character", "gym-leader", "sinnoh"], roleNote: "Maylene is a key mid-route power spike in Sinnoh."
  },
  {
    slug: "crasher-wake", name: "Crasher Wake", roleHint: "Pastoria Gym Leader and water specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Crasher Wake from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Crasher_Wake.png", creditLabel: "Diamond Pearl Crasher Wake" },
    battleStyle: "Water offense with durable frontline pressure.", signaturePokemon: ["Floatzel", "Gyarados", "Quagsire"], quote: "Heavy momentum and constant pressure.",
    appearance: "Pokemon Diamond / Pearl / Platinum gym progression and story events.", teamGame: "Pastoria Gym", team: "Water-leaning lineup balancing speed and durability.",
    tags: ["character", "gym-leader", "sinnoh"], roleNote: "Crasher Wake is one of Sinnoh's most physical gym encounters."
  },
  {
    slug: "fantina", name: "Fantina", roleHint: "Hearthome Gym Leader and ghost specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Fantina from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Fantina.png", creditLabel: "Diamond Pearl Fantina" },
    battleStyle: "Ghost disruption with evasive and status lines.", signaturePokemon: ["Mismagius", "Drifblim", "Haunter"], quote: "Style-forward battles with tricky control.",
    appearance: "Pokemon Diamond / Pearl / Platinum gym route.", teamGame: "Hearthome Gym", team: "Ghost-themed roster focused on disruption and special pressure.",
    tags: ["character", "gym-leader", "sinnoh", "ghost-theme"], roleNote: "Fantina introduces advanced disruption patterns in Sinnoh gyms."
  },
  {
    slug: "byron", name: "Byron", roleHint: "Canalave Gym Leader and steel specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Byron from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Byron.png", creditLabel: "Diamond Pearl Byron" },
    battleStyle: "Steel resilience with strong defensive pivots.", signaturePokemon: ["Bastiodon", "Steelix", "Bronzor"], quote: "Measured defense and heavy counter pressure.",
    appearance: "Pokemon Diamond / Pearl / Platinum late gym route.", teamGame: "Canalave Gym", team: "Steel-core lineup with high durability and punish potential.",
    tags: ["character", "gym-leader", "sinnoh", "steel-specialist"], roleNote: "Byron delivers one of Sinnoh's most defensive gym tests."
  },
  {
    slug: "candice", name: "Candice", roleHint: "Snowpoint Gym Leader and ice specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Candice from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Candice.png", creditLabel: "Diamond Pearl Candice" },
    battleStyle: "Ice matchup pressure with mixed offensive options.", signaturePokemon: ["Abomasnow", "Froslass", "Sneasel"], quote: "Fast reads and cold punish windows.",
    appearance: "Pokemon Diamond / Pearl / Platinum late gym progression.", teamGame: "Snowpoint Gym", team: "Ice-focused lineup with tempo swings and type pressure.",
    tags: ["character", "gym-leader", "sinnoh"], roleNote: "Candice is a major late-route matchup gate in Sinnoh."
  },
  {
    slug: "volkner", name: "Volkner", roleHint: "Sunyshore Gym Leader and electric specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Volkner from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Volkner.png", creditLabel: "Diamond Pearl Volkner" },
    battleStyle: "Electric tempo and high-speed finishing patterns.", signaturePokemon: ["Luxray", "Electivire", "Jolteon"], quote: "High voltage pacing with elite-level pressure.",
    appearance: "Pokemon Diamond / Pearl / Platinum final gym route.", teamGame: "Sunyshore Gym", team: "Electric-centric late-gym roster with strong speed control.",
    tags: ["character", "gym-leader", "sinnoh"], roleNote: "Volkner is Sinnoh's final gym gate before the league."
  },
  {
    slug: "aaron", name: "Aaron", roleHint: "Sinnoh Elite Four member and bug specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Aaron from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Aaron.png", creditLabel: "Diamond Pearl Aaron" },
    battleStyle: "Bug-pressure pacing with aggressive setup windows.", signaturePokemon: ["Drapion", "Heracross", "Vespiquen"], quote: "Calm approach with dangerous scaling.",
    appearance: "Pokemon Diamond / Pearl / Platinum Elite Four route.", teamGame: "Sinnoh Elite Four", team: "Bug-themed lineup with coverage-heavy ace threats.",
    tags: ["character", "elite-four", "sinnoh"], roleNote: "Aaron opens Sinnoh's Elite Four with immediate tempo pressure."
  },
  {
    slug: "bertha", name: "Bertha", roleHint: "Sinnoh Elite Four member and ground specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Bertha from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Bertha.png", creditLabel: "Diamond Pearl Bertha" },
    battleStyle: "Ground control with durable, punish-oriented sequencing.", signaturePokemon: ["Hippowdon", "Golem", "Whiscash"], quote: "Methodical pressure with steady control.",
    appearance: "Pokemon Diamond / Pearl / Platinum Elite Four challenge.", teamGame: "Sinnoh Elite Four", team: "Ground-core roster with defensive bulk and heavy hits.",
    tags: ["character", "elite-four", "sinnoh"], roleNote: "Bertha is one of Sinnoh's strongest attrition-oriented checks."
  },
  {
    slug: "flint", name: "Flint", roleHint: "Sinnoh Elite Four member and fire specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Flint from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Flint.png", creditLabel: "Diamond Pearl Flint" },
    battleStyle: "Explosive fire offense with aggressive tempo shifts.", signaturePokemon: ["Infernape", "Rapidash", "Magmortar"], quote: "High-energy offense from the first turn.",
    appearance: "Pokemon Diamond / Pearl / Platinum league route.", teamGame: "Sinnoh Elite Four", team: "Fire-centric lineup with mixed coverage and fast pressure.",
    tags: ["character", "elite-four", "sinnoh"], roleNote: "Flint creates one of the most aggressive tempo battles in Sinnoh's league."
  },
  {
    slug: "lucian", name: "Lucian", roleHint: "Sinnoh Elite Four member and psychic specialist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Lucian from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Lucian.png", creditLabel: "Diamond Pearl Lucian" },
    battleStyle: "Psychic control with layered special-offense lines.", signaturePokemon: ["Gallade", "Mr. Mime", "Alakazam"], quote: "Composed reads and disciplined execution.",
    appearance: "Pokemon Diamond / Pearl / Platinum Elite Four and rematches.", teamGame: "Sinnoh Elite Four", team: "Psychic-focused lineup with balanced speed and power.",
    tags: ["character", "elite-four", "sinnoh"], roleNote: "Lucian is Sinnoh's tactical special-pressure checkpoint."
  },
  {
    slug: "hala", name: "Hala", roleHint: "Melemele kahuna and fighting specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Hala from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Hala.png", creditLabel: "Sun Moon Hala" },
    battleStyle: "Fighting fundamentals with veteran matchup discipline.", signaturePokemon: ["Crabominable", "Hariyama", "Primeape"], quote: "Traditional strength and clean execution.",
    appearance: "Pokemon Sun / Moon island challenge and league context.", teamGame: "Melemele grand trial", team: "Fighting-forward roster with durable physical pressure.",
    tags: ["character", "kahuna", "alola"], roleNote: "Hala defines Alola's opening high-authority battle benchmark."
  },
  {
    slug: "olivia", name: "Olivia", roleHint: "Akala kahuna and rock specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Olivia from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Olivia.png", creditLabel: "Sun Moon Olivia" },
    battleStyle: "Rock pressure with matchup-heavy punish patterns.", signaturePokemon: ["Lycanroc", "Nosepass", "Probopass"], quote: "Relaxed tone with sharp tactical pressure.",
    appearance: "Pokemon Sun / Moon and Ultra route progression.", teamGame: "Akala grand trial", team: "Rock-core lineup with strong physical and utility balance.",
    tags: ["character", "kahuna", "alola"], roleNote: "Olivia is one of Alola's most memorable trial climax battles."
  },
  {
    slug: "nanu", name: "Nanu", roleHint: "Ulaula kahuna and dark specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Nanu from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Nanu.png", creditLabel: "Sun Moon Nanu" },
    battleStyle: "Dark-type pressure with stubborn defensive pivots.", signaturePokemon: ["Alolan Persian", "Krookodile", "Sableye"], quote: "Dry humor and hard-to-break tempo.",
    appearance: "Pokemon Sun / Moon and Ultra island challenge arcs.", teamGame: "Ulaula grand trial", team: "Dark-oriented roster with disruption and sustained pressure.",
    tags: ["character", "kahuna", "alola", "dark-theme"], roleNote: "Nanu offers one of Alola's most distinct personality-driven battles."
  },
  {
    slug: "acerola", name: "Acerola", roleHint: "Ghost trial captain and Alola Elite Four member", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Acerola from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Acerola.png", creditLabel: "Sun Moon Acerola" },
    battleStyle: "Ghost disruption with high tempo swing potential.", signaturePokemon: ["Palossand", "Mimikyu", "Drifblim"], quote: "Playful style with dangerous ghost control.",
    appearance: "Pokemon Sun / Moon trial path and Alola league.", teamGame: "Alola Elite Four", team: "Ghost-centric lineup with disruptive setup and pressure.",
    tags: ["character", "elite-four", "alola", "ghost-theme"], roleNote: "Acerola bridges trial identity and league-level challenge."
  },
  {
    slug: "kahili", name: "Kahili", roleHint: "Alola Elite Four member and flying specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Kahili from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Kahili.png", creditLabel: "Sun Moon Kahili" },
    battleStyle: "Aerial precision with speed-based punish lines.", signaturePokemon: ["Toucannon", "Oricorio", "Mandibuzz"], quote: "Graceful tempo with elite precision.",
    appearance: "Pokemon Sun / Moon and Ultra league-endgame route.", teamGame: "Alola Elite Four", team: "Flying-specialist roster with fast offensive coverage.",
    tags: ["character", "elite-four", "alola"], roleNote: "Kahili provides one of Alola's sharpest speed-control checks."
  },
  {
    slug: "ilima", name: "Ilima", roleHint: "Melemele trial captain and normal specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Ilima from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Ilima.png", creditLabel: "Sun Moon Ilima" },
    battleStyle: "Clean opening pressure with technical normal-type fundamentals.", signaturePokemon: ["Smeargle", "Yungoos", "Gumshoos"], quote: "Refined trial pacing from the start.",
    appearance: "Pokemon Sun / Moon opening trial progression.", teamGame: "Melemele trial", team: "Normal-focused trial roster with utility and tempo control.",
    tags: ["character", "trial-captain", "alola"], roleNote: "Ilima frames the early trial structure and tone in Alola."
  },
  {
    slug: "lana", name: "Lana", roleHint: "Akala trial captain and water specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Lana from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Lana.png", creditLabel: "Sun Moon Lana" },
    battleStyle: "Water control with tactical sustain and pressure turns.", signaturePokemon: ["Araquanid", "Wishiwashi", "Primarina"], quote: "Calm demeanor with dangerous water tempo.",
    appearance: "Pokemon Sun / Moon and Ultra Akala trial route.", teamGame: "Brooklet Hill trial", team: "Water-linked trial roster centered on Totem pressure.",
    tags: ["character", "trial-captain", "alola"], roleNote: "Lana's trial is a defining mid-early challenge in Alola."
  },
  {
    slug: "mallow", name: "Mallow", roleHint: "Akala trial captain and grass specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Mallow from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Mallow.png", creditLabel: "Sun Moon Mallow" },
    battleStyle: "Grass-based tempo with setup and sustain options.", signaturePokemon: ["Tsareena", "Lurantis", "Shiinotic"], quote: "Warm personality backed by sharp trial pressure.",
    appearance: "Pokemon Sun / Moon and Ultra Akala trial storyline.", teamGame: "Lush Jungle trial", team: "Grass-oriented trial lineup with utility and burst turns.",
    tags: ["character", "trial-captain", "alola"], roleNote: "Mallow is central to one of Alola's signature trial sequences."
  },
  {
    slug: "kiawe", name: "Kiawe", roleHint: "Akala trial captain and fire specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Kiawe from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Kiawe.png", creditLabel: "Sun Moon Kiawe" },
    battleStyle: "Fire offense with direct tempo and damage pressure.", signaturePokemon: ["Marowak", "Turtonator", "Salazzle"], quote: "Bold pacing and immediate offensive intent.",
    appearance: "Pokemon Sun / Moon and Ultra Akala trial path.", teamGame: "Wela Volcano trial", team: "Fire-focused trial structure with hard-hitting exchanges.",
    tags: ["character", "trial-captain", "alola"], roleNote: "Kiawe brings one of the strongest tempo shifts in Alola's trial order."
  },
  {
    slug: "sophocles", name: "Sophocles", roleHint: "Ulaula trial captain and electric specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Sophocles from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Sophocles.png", creditLabel: "Sun Moon Sophocles" },
    battleStyle: "Electric utility with tech-style disruption and control.", signaturePokemon: ["Togedemaru", "Charjabug", "Magnezone"], quote: "Technical planning and controlled pressure.",
    appearance: "Pokemon Sun / Moon and Ultra Ulaula trial progression.", teamGame: "Vast Poni Canyon trial profile", team: "Electric-leaning trial lineup with utility pressure.",
    tags: ["character", "trial-captain", "alola"], roleNote: "Sophocles adds a technical identity to Alola's trial roster."
  },
  {
    slug: "mina", name: "Mina", roleHint: "Poni trial captain and fairy specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Mina from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Mina.png", creditLabel: "Sun Moon Mina" },
    battleStyle: "Fairy matchups with creative setup and finish patterns.", signaturePokemon: ["Ribombee", "Granbull", "Mawile"], quote: "Artful style with deceptive tactical depth.",
    appearance: "Pokemon Ultra Sun / Ultra Moon late island trial arc.", teamGame: "Poni trial", team: "Fairy-centered lineup tuned for late-route adaptability.",
    tags: ["character", "trial-captain", "alola", "fairy-theme"], roleNote: "Mina closes the trial-captain arc with a distinct fairy identity."
  },
  {
    slug: "plumeria", name: "Plumeria", roleHint: "Team Skull admin and poison specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Plumeria from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Plumeria.png", creditLabel: "Sun Moon Plumeria" },
    battleStyle: "Poison pressure with strong mid-story boss pacing.", signaturePokemon: ["Salazzle", "Golbat", "Gengar"], quote: "Hard edge with tactical discipline.",
    appearance: "Pokemon Sun / Moon and Ultra Team Skull conflict arc.", teamGame: "Team Skull admin battles", team: "Poison-forward boss lineup with status pressure and burst damage.",
    tags: ["character", "boss", "alola", "poison-theme"], roleNote: "Plumeria is Team Skull's main tactical enforcer."
  },
  {
    slug: "falkner", name: "Falkner", roleHint: "Violet Gym Leader and flying specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Falkner from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Falkner.png", creditLabel: "HeartGold SoulSilver Falkner" },
    battleStyle: "Early-gym aerial pressure with speed-first decisions.", signaturePokemon: ["Pidgeotto", "Pidgey", "Noctowl"], quote: "Clean flying fundamentals from turn one.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver gym route.", teamGame: "Violet Gym", team: "Flying-forward opening gym roster centered on speed and tempo.",
    tags: ["character", "gym-leader", "johto"], roleNote: "Falkner sets the first strategic test in Johto's gym circuit."
  },
  {
    slug: "bugsy", name: "Bugsy", roleHint: "Azalea Gym Leader and bug specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Bugsy from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Bugsy.png", creditLabel: "HeartGold SoulSilver Bugsy" },
    battleStyle: "Bug pressure with tactical setup and chip control.", signaturePokemon: ["Scyther", "Metapod", "Kakuna"], quote: "Technical precision with sharp matchup reads.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver second gym route.", teamGame: "Azalea Gym", team: "Bug-core lineup anchored by high-pressure Scyther.",
    tags: ["character", "gym-leader", "johto"], roleNote: "Bugsy is a notable early skill check due to Scyther tempo."
  },
  {
    slug: "whitney", name: "Whitney", roleHint: "Goldenrod Gym Leader and normal specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Whitney from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Whitney.png", creditLabel: "HeartGold SoulSilver Whitney" },
    battleStyle: "Normal-type pressure with abrupt momentum spikes.", signaturePokemon: ["Miltank", "Clefairy", "Lickitung"], quote: "Playful tone, brutal pressure windows.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver gym progression.", teamGame: "Goldenrod Gym", team: "Normal-focused roster with Miltank as dominant tempo anchor.",
    tags: ["character", "gym-leader", "johto"], roleNote: "Whitney is one of the most remembered mid-early gym difficulty jumps."
  },
  {
    slug: "morty", name: "Morty", roleHint: "Ecruteak Gym Leader and ghost specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Morty from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Morty.png", creditLabel: "HeartGold SoulSilver Morty" },
    battleStyle: "Ghost disruption with status and evasive pacing.", signaturePokemon: ["Gengar", "Haunter", "Misdreavus"], quote: "Measured control with sudden threat spikes.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver ghost-gym route.", teamGame: "Ecruteak Gym", team: "Ghost-centered lineup focused on status and special pressure.",
    tags: ["character", "gym-leader", "johto", "ghost-theme"], roleNote: "Morty links Johto gym progression to legendary tower lore."
  },
  {
    slug: "chuck", name: "Chuck", roleHint: "Cianwood Gym Leader and fighting specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Chuck from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Chuck.png", creditLabel: "HeartGold SoulSilver Chuck" },
    battleStyle: "Direct physical offense with reliable pressure turns.", signaturePokemon: ["Poliwrath", "Primeape", "Machoke"], quote: "Simple game plan, heavy impact.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver island gym route.", teamGame: "Cianwood Gym", team: "Fighting-focused lineup with high physical-pressure consistency.",
    tags: ["character", "gym-leader", "johto"], roleNote: "Chuck is Johto's key mid-game physical offense checkpoint."
  },
  {
    slug: "jasmine", name: "Jasmine", roleHint: "Olivine Gym Leader and steel specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Jasmine from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Jasmine.png", creditLabel: "HeartGold SoulSilver Jasmine" },
    battleStyle: "Steel resilience with controlled defensive pressure.", signaturePokemon: ["Steelix", "Magnemite", "Magnezone"], quote: "Quiet style backed by durable steel control.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver coastal arc.", teamGame: "Olivine Gym", team: "Steel-core lineup anchored by defensive Steelix pressure.",
    tags: ["character", "gym-leader", "johto", "steel-specialist"], roleNote: "Jasmine is one of Johto's clearest defensive matchup checks."
  },
  {
    slug: "pryce", name: "Pryce", roleHint: "Mahogany Gym Leader and ice specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Pryce from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Pryce.png", creditLabel: "HeartGold SoulSilver Pryce" },
    battleStyle: "Ice control with patient punish-and-counter pacing.", signaturePokemon: ["Piloswine", "Dewgong", "Seel"], quote: "Veteran discipline and steady pressure.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver late gym route.", teamGame: "Mahogany Gym", team: "Ice-oriented lineup with durable defensive transitions.",
    tags: ["character", "gym-leader", "johto"], roleNote: "Pryce is a classic veteran gym archetype in Johto."
  },
  {
    slug: "clair", name: "Clair", roleHint: "Blackthorn Gym Leader and dragon specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Clair from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Clair.png", creditLabel: "HeartGold SoulSilver Clair" },
    battleStyle: "Dragon pressure with high-stat late-gym threat spikes.", signaturePokemon: ["Kingdra", "Dragonair", "Gyarados"], quote: "Elite confidence and dangerous endgame pace.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver final gym route.", teamGame: "Blackthorn Gym", team: "Dragon-focused roster that acts as Johto's final gym gate.",
    tags: ["character", "gym-leader", "johto", "dragon-specialist"], roleNote: "Clair is Johto's last major test before the league."
  },
  {
    slug: "will-johto", name: "Will", roleHint: "Johto Elite Four member and psychic specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Will from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Will.png", creditLabel: "HeartGold SoulSilver Will" },
    battleStyle: "Psychic control with status tempo and special pressure.", signaturePokemon: ["Xatu", "Jynx", "Slowbro"], quote: "Masked calm with precise psychic control.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver Elite Four.", teamGame: "Johto Elite Four", team: "Psychic-oriented lineup featuring layered special offense.",
    tags: ["character", "elite-four", "johto"], roleNote: "Will opens Johto's Elite Four with tactical special-pressure pacing."
  },
  {
    slug: "koga-johto", name: "Koga", roleHint: "Johto Elite Four member and poison specialist", gameTags: ["johto", "kanto"], regionLabel: "Johto",
    portraitAlt: "Official art of Koga from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Koga.png", creditLabel: "HeartGold SoulSilver Koga" },
    battleStyle: "Poison attrition with evasive and status-heavy routes.", signaturePokemon: ["Crobat", "Muk", "Forretress"], quote: "Ninja tempo with layered disruption.",
    appearance: "HeartGold / SoulSilver Johto Elite Four and legacy Kanto role.", teamGame: "Johto Elite Four", team: "Poison-centric lineup with utility and sustained chip pressure.",
    tags: ["character", "elite-four", "johto", "poison-theme"], roleNote: "Koga is a legacy Kanto leader elevated into Johto league endgame."
  },
  {
    slug: "bruno-johto", name: "Bruno", roleHint: "Johto Elite Four member and fighting specialist", gameTags: ["johto", "kanto"], regionLabel: "Johto",
    portraitAlt: "Official art of Bruno from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Bruno.png", creditLabel: "HeartGold SoulSilver Bruno" },
    battleStyle: "Pure physical pressure with durable frontline attackers.", signaturePokemon: ["Machamp", "Hitmonlee", "Onix"], quote: "Raw force and disciplined exchanges.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver Elite Four.", teamGame: "Johto Elite Four", team: "Fighting-heavy lineup built around direct physical trades.",
    tags: ["character", "elite-four", "johto"], roleNote: "Bruno remains a consistent physical offense benchmark across regions."
  },
  {
    slug: "karen-johto", name: "Karen", roleHint: "Johto Elite Four member and dark specialist", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Karen from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Karen.png", creditLabel: "HeartGold SoulSilver Karen" },
    battleStyle: "Dark pressure with flexible archetype and anti-meta picks.", signaturePokemon: ["Houndoom", "Umbreon", "Murkrow"], quote: "Win with your favorites, then outplay the field.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver league route.", teamGame: "Johto Elite Four", team: "Dark-leaning mixed roster with strong adaptation potential.",
    tags: ["character", "elite-four", "johto", "dark-theme"], roleNote: "Karen is one of the most iconic personality-driven Elite Four trainers."
  },
  {
    slug: "janine", name: "Janine", roleHint: "Fuchsia Gym Leader and poison specialist", gameTags: ["kanto", "johto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Janine from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Janine.png", creditLabel: "HeartGold SoulSilver Janine" },
    battleStyle: "Poison trickery and clone-themed confusion pressure.", signaturePokemon: ["Venomoth", "Ariados", "Crobat"], quote: "Disguise tactics paired with status disruption.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver Kanto postgame.", teamGame: "Fuchsia Gym", team: "Poison-heavy roster with speed and status pressure.",
    tags: ["character", "gym-leader", "kanto", "poison-theme"], roleNote: "Janine continues Koga's poison legacy in Kanto postgame."
  },
  {
    slug: "eusine", name: "Eusine", roleHint: "Mystic seeker tied to Suicune storyline", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Eusine from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Eusine.png", creditLabel: "HeartGold SoulSilver Eusine" },
    battleStyle: "Story-driven encounters with glass-cannon special pressure.", signaturePokemon: ["Hypno", "Electrode", "Haunter"], quote: "Obsessive pursuit of legendary truth.",
    appearance: "Pokemon Crystal and HeartGold / SoulSilver Suicune side arc.", teamGame: "Suicune storyline encounters", team: "Eclectic special-focused lineup tied to narrative progression.",
    tags: ["character", "story", "johto"], roleNote: "Eusine is a signature lore character in Johto's legendary narrative."
  },
  {
    slug: "professor-elm", name: "Professor Elm", roleHint: "Johto professor and Pokemon research lead", gameTags: ["johto"], regionLabel: "Johto",
    portraitAlt: "Official art of Professor Elm from HeartGold and SoulSilver",
    portrait: { type: "remote", file: "HeartGold_SoulSilver_Professor_Elm.png", creditLabel: "HeartGold SoulSilver Professor Elm" },
    battleStyle: "Research-centric role with minimal direct battle focus.", signaturePokemon: ["Chikorita", "Cyndaquil", "Totodile"], quote: "Discovery first, battle second.",
    appearance: "Pokemon Gold / Silver / Crystal and HeartGold / SoulSilver opening arc.", teamGame: "Johto research profile", team: "Starter distribution and lab guidance role rather than trainer progression.",
    tags: ["character", "professor", "johto"], roleNote: "Elm drives Johto's starter and egg research narrative foundation."
  },
  {
    slug: "clemont", name: "Clemont", roleHint: "Lumiose Gym Leader and electric specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Clemont from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Clemont.png", creditLabel: "XY Clemont" },
    battleStyle: "Electric utility with invention-themed tactical pressure.", signaturePokemon: ["Heliolisk", "Magneton", "Luxray"], quote: "Analysis and adaptation through technology.",
    appearance: "Pokemon X / Y Lumiose route and gym progression.", teamGame: "Lumiose Gym", team: "Electric-leaning roster with mixed utility and speed control.",
    tags: ["character", "gym-leader", "kalos"], roleNote: "Clemont combines inventor identity with strong electric matchup checks."
  },
  {
    slug: "bonnie", name: "Bonnie", roleHint: "Kalos support character in Lumiose storyline", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Bonnie from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Bonnie.png", creditLabel: "XY Bonnie" },
    battleStyle: "Narrative support role with limited battle emphasis.", signaturePokemon: ["Dedenne"], quote: "Bright support presence through the journey.",
    appearance: "Pokemon X / Y central story support scenes.", teamGame: "Kalos support profile", team: "Support narrative role without full trainer-battle progression.",
    tags: ["character", "support", "kalos"], roleNote: "Bonnie contributes to Kalos route character chemistry."
  },
  {
    slug: "korrina", name: "Korrina", roleHint: "Shalour Gym Leader and fighting specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Korrina from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Korrina.png", creditLabel: "XY Korrina" },
    battleStyle: "Fast offensive pressure with Mega evolution showcase.", signaturePokemon: ["Lucario", "Hawlucha", "Machoke"], quote: "Momentum and mastery through close combat.",
    appearance: "Pokemon X / Y gym route and Mega ring arc.", teamGame: "Shalour Gym", team: "Fighting-centric lineup with Lucario as iconic ace.",
    tags: ["character", "gym-leader", "kalos"], roleNote: "Korrina anchors Kalos's early Mega evolution teaching arc."
  },
  {
    slug: "grant", name: "Grant", roleHint: "Cyllage Gym Leader and rock specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Grant from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Grant.png", creditLabel: "XY Grant" },
    battleStyle: "Rock durability with decisive physical punish lines.", signaturePokemon: ["Tyrunt", "Amaura", "Onix"], quote: "Climber precision and stable battle fundamentals.",
    appearance: "Pokemon X / Y early gym progression.", teamGame: "Cyllage Gym", team: "Rock-centered roster designed for controlled early pressure.",
    tags: ["character", "gym-leader", "kalos"], roleNote: "Grant is a foundational early-type checkpoint in Kalos."
  },
  {
    slug: "ramos", name: "Ramos", roleHint: "Coumarine Gym Leader and grass specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Ramos from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Ramos.png", creditLabel: "XY Ramos" },
    battleStyle: "Grass setup and sustain with patient tempo shifts.", signaturePokemon: ["Gogoat", "Jumpluff", "Weepinbell"], quote: "Veteran calm and measured growth strategy.",
    appearance: "Pokemon X / Y mid-route gym progression.", teamGame: "Coumarine Gym", team: "Grass-focused roster with balanced offense and control.",
    tags: ["character", "gym-leader", "kalos"], roleNote: "Ramos introduces slower, setup-oriented grass pacing in Kalos."
  },
  {
    slug: "valerie", name: "Valerie", roleHint: "Laverre Gym Leader and fairy specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Valerie from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Valerie.png", creditLabel: "XY Valerie" },
    battleStyle: "Fairy pressure with elegant matchup control.", signaturePokemon: ["Sylveon", "Mawile", "Mr. Mime"], quote: "Fashioned precision with tactical bite.",
    appearance: "Pokemon X / Y late gym route.", teamGame: "Laverre Gym", team: "Fairy-core lineup featuring controlled special and utility pressure.",
    tags: ["character", "gym-leader", "kalos", "fairy-theme"], roleNote: "Valerie introduces Kalos's defining fairy-type gym identity."
  },
  {
    slug: "olympia", name: "Olympia", roleHint: "Anistar Gym Leader and psychic specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Olympia from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Olympia.png", creditLabel: "XY Olympia" },
    battleStyle: "Psychic control with tactical prediction and setup.", signaturePokemon: ["Meowstic", "Slowking", "Sigilyph"], quote: "Future-sight tempo and composed execution.",
    appearance: "Pokemon X / Y final gym sequence.", teamGame: "Anistar Gym", team: "Psychic-specialist roster tuned for late-route strategic checks.",
    tags: ["character", "gym-leader", "kalos"], roleNote: "Olympia is a key late-gym tactical gate before Kalos league."
  },
  {
    slug: "wulfric", name: "Wulfric", roleHint: "Snowbelle Gym Leader and ice specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Wulfric from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Wulfric.png", creditLabel: "XY Wulfric" },
    battleStyle: "Ice power with high durability and late-route pressure.", signaturePokemon: ["Avalugg", "Abomasnow", "Cryogonal"], quote: "Strong fundamentals and heavyweight control.",
    appearance: "Pokemon X / Y final gym route.", teamGame: "Snowbelle Gym", team: "Ice-focused final gym lineup built around robust defensive pressure.",
    tags: ["character", "gym-leader", "kalos"], roleNote: "Wulfric is Kalos's final gym gate before Elite Four."
  },
  {
    slug: "malva", name: "Malva", roleHint: "Kalos Elite Four member and fire specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Malva from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Malva.png", creditLabel: "XY Malva" },
    battleStyle: "Fire offense with relentless pace and pressure spikes.", signaturePokemon: ["Talonflame", "Pyroar", "Chandelure"], quote: "Aggressive momentum with no breathing room.",
    appearance: "Pokemon X / Y Elite Four challenge and media role.", teamGame: "Kalos Elite Four", team: "Fire-heavy lineup with high-speed offensive sequencing.",
    tags: ["character", "elite-four", "kalos"], roleNote: "Malva defines Kalos's pure offensive elite pace."
  },
  {
    slug: "drasna", name: "Drasna", roleHint: "Kalos Elite Four member and dragon specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Drasna from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Drasna.png", creditLabel: "XY Drasna" },
    battleStyle: "Dragon resilience with disciplined damage trading.", signaturePokemon: ["Dragalge", "Noivern", "Druddigon"], quote: "Composed veteran style with dangerous dragon pressure.",
    appearance: "Pokemon X / Y league route and rematch contexts.", teamGame: "Kalos Elite Four", team: "Dragon-forward roster blending offense and defensive pivots.",
    tags: ["character", "elite-four", "kalos", "dragon-specialist"], roleNote: "Drasna reinforces Kalos league with sustained dragon matchup checks."
  },
  {
    slug: "siebold", name: "Siebold", roleHint: "Kalos Elite Four member and water specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Siebold from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Siebold.png", creditLabel: "XY Siebold" },
    battleStyle: "Water control with refined tactical pacing.", signaturePokemon: ["Clawitzer", "Gyarados", "Starmie"], quote: "Culinary precision mirrored in battle execution.",
    appearance: "Pokemon X / Y Elite Four route.", teamGame: "Kalos Elite Four", team: "Water-centric lineup with balanced speed, utility, and special pressure.",
    tags: ["character", "elite-four", "kalos"], roleNote: "Siebold is Kalos's precision-control elite archetype."
  },
  {
    slug: "wikstrom", name: "Wikstrom", roleHint: "Kalos Elite Four member and steel specialist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Wikstrom from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Wikstrom.png", creditLabel: "XY Wikstrom" },
    battleStyle: "Steel durability with knight-themed pressure lines.", signaturePokemon: ["Aegislash", "Klefki", "Scizor"], quote: "Chivalric poise and hard defensive checks.",
    appearance: "Pokemon X / Y Elite Four gauntlet.", teamGame: "Kalos Elite Four", team: "Steel-focused lineup anchored by Aegislash tactical pressure.",
    tags: ["character", "elite-four", "kalos", "steel-specialist"], roleNote: "Wikstrom is a defining steel matchup challenge in Kalos league."
  },
  {
    slug: "victor", name: "Victor", roleHint: "Male protagonist of Pokemon Sword and Shield", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Victor from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Victor.png", creditLabel: "Sword Shield Victor" },
    battleStyle: "Player-defined competitive growth with flexible route adaptation.", signaturePokemon: ["Cinderace", "Corviknight", "Dragapult"], quote: "Progression-driven style with broad tactical options.",
    appearance: "Pokemon Sword / Shield main campaign and postgame.", teamGame: "Galar league route", team: "Starter-led custom lineup with strong modern coverage options.",
    tags: ["character", "protagonist", "galar"], roleNote: "Victor represents one of Galar's core player-avatar identities."
  },
  {
    slug: "gloria", name: "Gloria", roleHint: "Female protagonist of Pokemon Sword and Shield", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Gloria from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Gloria.png", creditLabel: "Sword Shield Gloria" },
    battleStyle: "Player-shaped roster progression with tempo-flexible builds.", signaturePokemon: ["Inteleon", "Toxtricity", "Aegislash"], quote: "Confident progression through adaptable team construction.",
    appearance: "Pokemon Sword / Shield story and champion route.", teamGame: "Galar championship route", team: "Customizable starter-based lineup with broad coverage profiles.",
    tags: ["character", "protagonist", "galar"], roleNote: "Gloria is the alternate player-avatar branch in Galar."
  },
  {
    slug: "peony", name: "Peony", roleHint: "Crown Tundra expedition leader and former Champion", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Peony from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Sword_Shield_Peony.png", creditLabel: "Sword Shield Peony" },
    battleStyle: "Heavy offense with adventure-themed high-energy pacing.", signaturePokemon: ["Copperajah", "Aggron", "Perrserker"], quote: "Bold expedition momentum and relentless pressure.",
    appearance: "Pokemon Sword / Shield Crown Tundra DLC storyline.", teamGame: "Crown Tundra route", team: "Steel-leaning veteran roster with strong physical damage output.",
    tags: ["character", "mentor", "galar", "dlc"], roleNote: "Peony drives Crown Tundra narrative exploration and battle flow."
  },
  {
    slug: "maxie", name: "Maxie", roleHint: "Team Magma leader and Hoenn antagonist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Maxie from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Maxie.png", creditLabel: "Omega Ruby Alpha Sapphire Maxie" },
    battleStyle: "Ground-fire villain pressure with strong offensive escalation.", signaturePokemon: ["Camerupt", "Mightyena", "Crobat"], quote: "Ideological certainty backed by forceful tempo.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS main conflict arc.", teamGame: "Team Magma climax battles", team: "Aggressive mixed lineup culminating in Mega Camerupt pressure.",
    tags: ["character", "antagonist", "hoenn", "boss-trainer"], roleNote: "Maxie is a flagship villain profile in Hoenn's core storyline."
  },
  {
    slug: "archie", name: "Archie", roleHint: "Team Aqua leader and Hoenn antagonist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Archie from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Archie.png", creditLabel: "Omega Ruby Alpha Sapphire Archie" },
    battleStyle: "Water-dark pressure with direct high-tempo offense.", signaturePokemon: ["Sharpedo", "Muk", "Crobat"], quote: "Aggressive command style with relentless momentum.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS antagonist route.", teamGame: "Team Aqua climax battles", team: "Offensive roster featuring Mega Sharpedo as core threat.",
    tags: ["character", "antagonist", "hoenn", "boss-trainer"], roleNote: "Archie anchors Hoenn's Aqua conflict and late-story tempo spikes."
  },
  {
    slug: "briar", name: "Briar", roleHint: "Blueberry Academy teacher and Indigo Disk guide", gameTags: ["paldea", "blueberry"], regionLabel: "Blueberry Academy",
    portraitAlt: "Official art of Briar from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet_Violet_Briar.png", creditLabel: "Scarlet Violet Briar" },
    battleStyle: "Narrative-first progression role with focused challenge moments.", signaturePokemon: ["Polteageist", "Lapras"], quote: "Academic drive with escalating expedition stakes.",
    appearance: "Pokemon Scarlet / Violet The Indigo Disk storyline.", teamGame: "Blueberry expedition profile", team: "Story-linked roster with selective high-impact encounters.",
    tags: ["character", "academy", "paldea", "blueberry"], roleNote: "Briar is central to Indigo Disk narrative progression and mystery framing."
  },
  {
    slug: "wicke", name: "Wicke", roleHint: "Aether Foundation assistant chief and support lead", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Wicke from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Wicke.png", creditLabel: "Sun Moon Wicke" },
    battleStyle: "Support-oriented story role with limited direct battle focus.", signaturePokemon: ["Clefable", "Alolan Vulpix"], quote: "Operational calm under narrative pressure.",
    appearance: "Pokemon Sun / Moon and Ultra Aether Foundation arc.", teamGame: "Aether support profile", team: "Minimal battle emphasis with story-support identity.",
    tags: ["character", "support", "alola"], roleNote: "Wicke reinforces the institutional side of Alola's central storyline."
  },
  {
    slug: "faba", name: "Faba", roleHint: "Aether Branch Chief and antagonistic support role", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Faba from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Faba.png", creditLabel: "Sun Moon Faba" },
    battleStyle: "Psychic utility and disruptive support with villain-side pacing.", signaturePokemon: ["Hypno", "Slowbro", "Alakazam"], quote: "Scheming tactics wrapped in institutional authority.",
    appearance: "Pokemon Sun / Moon and Ultra Aether conflict arcs.", teamGame: "Aether antagonist-support encounters", team: "Psychic-heavy support-villain roster with control tools.",
    tags: ["character", "antagonist", "alola"], roleNote: "Faba adds manipulative institutional conflict inside the Aether narrative."
  },
  {
    slug: "brock", name: "Brock", roleHint: "Pewter Gym Leader and rock specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Brock from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Brock.png", creditLabel: "FireRed LeafGreen Brock" },
    battleStyle: "Defensive rock pressure with straightforward physical lines.", signaturePokemon: ["Onix", "Geodude", "Golem"], quote: "Foundational gym discipline and durable offense.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen gym route.", teamGame: "Pewter Gym", team: "Rock-focused opening gym roster with durable matchup control.",
    tags: ["character", "gym-leader", "kanto"], roleNote: "Brock is Kanto's classic first-gym benchmark."
  },
  {
    slug: "misty", name: "Misty", roleHint: "Cerulean Gym Leader and water specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Misty from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Misty.png", creditLabel: "FireRed LeafGreen Misty" },
    battleStyle: "Water tempo with speed control and clean pressure turns.", signaturePokemon: ["Starmie", "Staryu", "Gyarados"], quote: "Fast tactical pacing with sharp execution.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen gym progression.", teamGame: "Cerulean Gym", team: "Water-core lineup with strong special and speed pressure.",
    tags: ["character", "gym-leader", "kanto"], roleNote: "Misty defines early water-tempo battles in Kanto."
  },
  {
    slug: "erika", name: "Erika", roleHint: "Celadon Gym Leader and grass specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Erika from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Erika.png", creditLabel: "FireRed LeafGreen Erika" },
    battleStyle: "Grass sustain with status and setup pressure.", signaturePokemon: ["Vileplume", "Tangela", "Victreebel"], quote: "Calm style with layered control tools.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen mid-gym route.", teamGame: "Celadon Gym", team: "Grass-centric roster emphasizing status and tactical attrition.",
    tags: ["character", "gym-leader", "kanto"], roleNote: "Erika is a key status-based matchup check in Kanto."
  },
  {
    slug: "sabrina", name: "Sabrina", roleHint: "Saffron Gym Leader and psychic specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Sabrina from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Sabrina.png", creditLabel: "FireRed LeafGreen Sabrina" },
    battleStyle: "Psychic burst damage with high-speed special pressure.", signaturePokemon: ["Alakazam", "Mr. Mime", "Hypno"], quote: "Focused precision and punishing tempo.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen late gym route.", teamGame: "Saffron Gym", team: "Psychic-heavy lineup with elite special-offense pacing.",
    tags: ["character", "gym-leader", "kanto"], roleNote: "Sabrina is one of Kanto's strongest tactical gym walls."
  },
  {
    slug: "blaine", name: "Blaine", roleHint: "Cinnabar Gym Leader and fire specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Blaine from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Blaine.png", creditLabel: "FireRed LeafGreen Blaine" },
    battleStyle: "Fire offense with immediate tempo and heavy punishes.", signaturePokemon: ["Arcanine", "Magmar", "Rapidash"], quote: "Quiz-master energy with aggressive pressure.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen late gym sequence.", teamGame: "Cinnabar Gym", team: "Fire-focused lineup with strong offensive momentum.",
    tags: ["character", "gym-leader", "kanto"], roleNote: "Blaine gives Kanto one of its fastest high-pressure gym battles."
  },
  {
    slug: "giovanni", name: "Giovanni", roleHint: "Viridian Gym Leader and Team Rocket boss", gameTags: ["kanto", "johto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Giovanni from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Giovanni.png", creditLabel: "FireRed LeafGreen Giovanni" },
    battleStyle: "Ground-centric boss pressure with command-level pacing.", signaturePokemon: ["Nidoking", "Rhydon", "Persian"], quote: "Calculated authority with overwhelming force.",
    appearance: "Pokemon Red / Blue / Yellow, FireRed / LeafGreen, and Team Rocket legacy arcs.", teamGame: "Viridian Gym / Rocket boss fights", team: "Ground-heavy villain roster with high damage and control pressure.",
    tags: ["character", "gym-leader", "antagonist", "kanto", "boss-trainer"], roleNote: "Giovanni bridges gym leadership and core villain identity in Kanto."
  },
  {
    slug: "lorelei", name: "Lorelei", roleHint: "Kanto Elite Four member and ice specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Lorelei from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Lorelei.png", creditLabel: "FireRed LeafGreen Lorelei" },
    battleStyle: "Ice-water control with high special-defense pressure.", signaturePokemon: ["Lapras", "Cloyster", "Jynx"], quote: "Cool composure and layered matchup control.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen league route.", teamGame: "Kanto Elite Four", team: "Ice-centric lineup with durable special-pressure pivots.",
    tags: ["character", "elite-four", "kanto"], roleNote: "Lorelei opens Kanto's league gauntlet with strong control pacing."
  },
  {
    slug: "agatha", name: "Agatha", roleHint: "Kanto Elite Four member and ghost specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Agatha from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Agatha.png", creditLabel: "FireRed LeafGreen Agatha" },
    battleStyle: "Ghost-poison disruption with status-driven attrition.", signaturePokemon: ["Gengar", "Golbat", "Arbok"], quote: "Veteran menace with relentless status pressure.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen Elite Four.", teamGame: "Kanto Elite Four", team: "Disruption-focused ghost/poison roster with strong chip pressure.",
    tags: ["character", "elite-four", "kanto", "ghost-theme"], roleNote: "Agatha is one of Kanto's defining attrition-style league battles."
  },
  {
    slug: "koga-kanto", name: "Koga", roleHint: "Kanto Gym Leader legacy profile and poison specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Koga from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Koga.png", creditLabel: "FireRed LeafGreen Koga" },
    battleStyle: "Poison tempo with evasive and status disruption.", signaturePokemon: ["Weezing", "Muk", "Venomoth"], quote: "Ninja precision and layered pressure.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen Fuchsia Gym era.", teamGame: "Fuchsia Gym (Kanto era)", team: "Poison-heavy roster emphasizing disruption and chip control.",
    tags: ["character", "gym-leader", "kanto", "poison-theme"], roleNote: "This entry captures Koga's original Kanto gym identity."
  },
  {
    slug: "lance-kanto", name: "Lance", roleHint: "Kanto Elite Four dragon specialist profile", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Lance from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Lance.png", creditLabel: "FireRed LeafGreen Lance" },
    battleStyle: "Dragon-oriented elite pressure with high-stat finishers.", signaturePokemon: ["Dragonite", "Gyarados", "Aerodactyl"], quote: "Classic dragon authority with endgame force.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen Elite Four route.", teamGame: "Kanto Elite Four", team: "Dragon-led late-gauntlet roster with heavy offensive spikes.",
    tags: ["character", "elite-four", "kanto", "dragon-specialist"], roleNote: "This entry tracks Lance's original Kanto Elite Four role."
  },
  {
    slug: "bruno-kanto", name: "Bruno", roleHint: "Kanto Elite Four fighting specialist profile", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Bruno from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Bruno.png", creditLabel: "FireRed LeafGreen Bruno" },
    battleStyle: "Physical offense with direct, high-impact exchanges.", signaturePokemon: ["Machamp", "Onix", "Hitmonchan"], quote: "Straightforward force with constant pressure.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen Elite Four.", teamGame: "Kanto Elite Four", team: "Fighting-leaning lineup with rock support and raw damage output.",
    tags: ["character", "elite-four", "kanto"], roleNote: "This entry reflects Bruno's original Kanto league role."
  },
  {
    slug: "professor-oak", name: "Professor Oak", roleHint: "Kanto professor and foundational Pokedex authority", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Professor Oak from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Professor_Oak.png", creditLabel: "FireRed LeafGreen Professor Oak" },
    battleStyle: "Research-centric role with legacy battle references.", signaturePokemon: ["Bulbasaur", "Charmander", "Squirtle"], quote: "Pokedex research begins with first steps.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen opening and guidance arcs.", teamGame: "Kanto research profile", team: "Starter distribution and research leadership role.",
    tags: ["character", "professor", "kanto"], roleNote: "Oak is one of the franchise's primary research anchors."
  },
  {
    slug: "bill", name: "Bill", roleHint: "Pokemon storage system inventor and Kanto support figure", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Bill from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed_LeafGreen_Bill.png", creditLabel: "FireRed LeafGreen Bill" },
    battleStyle: "Technical support role with minimal direct battle profile.", signaturePokemon: ["Eevee", "Porygon"], quote: "Systems engineering that powers trainer progression.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen support storyline.", teamGame: "Kanto support profile", team: "Primarily non-combat role focused on storage infrastructure.",
    tags: ["character", "support", "kanto"], roleNote: "Bill is central to the PC storage framework across generations."
  },
  {
    slug: "cilan", name: "Cilan", roleHint: "Striaton Gym Leader trio member and grass specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Cilan from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Cilan.png", creditLabel: "Black White Cilan" },
    battleStyle: "Context-driven opening gym pressure with grass utility.", signaturePokemon: ["Pansage", "Lilligant", "Simisage"], quote: "Refined service style and tactical reads.",
    appearance: "Pokemon Black / White opening gym route and side appearances.", teamGame: "Striaton Gym", team: "Grass-aligned lineup within trio-format opening gym battles.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Cilan is one-third of Unova's unique opening gym trio."
  },
  {
    slug: "chili", name: "Chili", roleHint: "Striaton Gym Leader trio member and fire specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Chili from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Chili.png", creditLabel: "Black White Chili" },
    battleStyle: "Fire tempo with aggressive early momentum.", signaturePokemon: ["Pansear", "Simisear"], quote: "Hot-headed pace with direct offensive intent.",
    appearance: "Pokemon Black / White opening gym progression.", teamGame: "Striaton Gym", team: "Fire-aligned trio roster designed for starter-counter pressure.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Chili represents the fire branch of Striaton's trio design."
  },
  {
    slug: "cress", name: "Cress", roleHint: "Striaton Gym Leader trio member and water specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Cress from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Cress.png", creditLabel: "Black White Cress" },
    battleStyle: "Water control with steady opening battle pacing.", signaturePokemon: ["Panpour", "Simipour"], quote: "Composed flow with measured pressure.",
    appearance: "Pokemon Black / White first gym route and follow-up content.", teamGame: "Striaton Gym", team: "Water-aligned trio lineup tuned for starter matchup control.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Cress rounds out Unova's opening elemental trio."
  },
  {
    slug: "lenora", name: "Lenora", roleHint: "Nacrene Gym Leader and normal specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Lenora from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Lenora.png", creditLabel: "Black White Lenora" },
    battleStyle: "Normal-control pacing with disruptive tempo checks.", signaturePokemon: ["Watchog", "Herdier"], quote: "Museum curator precision in battle form.",
    appearance: "Pokemon Black / White early gym route and museum arc.", teamGame: "Nacrene Gym", team: "Normal-focused roster with retaliatory pressure tools.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Lenora is one of Unova's first major tactical difficulty spikes."
  },
  {
    slug: "burgh", name: "Burgh", roleHint: "Castelia Gym Leader and bug specialist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Burgh from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Burgh.png", creditLabel: "Black White Burgh" },
    battleStyle: "Bug tempo with creative offensive and utility patterns.", signaturePokemon: ["Leavanny", "Dwebble", "Whirlipede"], quote: "Artful expression through tactical pressure.",
    appearance: "Pokemon Black / White Castelia route and gym progression.", teamGame: "Castelia Gym", team: "Bug-core lineup with balanced offense and setup pressure.",
    tags: ["character", "gym-leader", "unova"], roleNote: "Burgh adds personality-heavy pacing to Unova's urban gym arc."
  },
  {
    slug: "professor-juniper", name: "Professor Juniper", roleHint: "Unova professor and Pokedex modernization lead", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Professor Juniper from Pokemon Black and White",
    portrait: { type: "remote", file: "Black_White_Juniper.png", creditLabel: "Black White Juniper" },
    battleStyle: "Research-first profile with limited direct battle role.", signaturePokemon: ["Cinccino", "Minccino"], quote: "Curiosity-driven science and field support.",
    appearance: "Pokemon Black / White and Black 2 / White 2 main research storyline.", teamGame: "Unova research profile", team: "Primarily advisory role in trainer progression and Pokedex research.",
    tags: ["character", "professor", "unova"], roleNote: "Juniper is a central academic guide in Unova's generation arc."
  },
  {
    slug: "cyrus", name: "Cyrus", roleHint: "Team Galactic boss and Sinnoh main antagonist", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Cyrus from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Cyrus.png", creditLabel: "Diamond Pearl Cyrus" },
    battleStyle: "Cold high-stakes offense tied to legendary climax battles.", signaturePokemon: ["Weavile", "Honchkrow", "Gyarados"], quote: "Absolute control pursued through cosmic ambition.",
    appearance: "Pokemon Diamond / Pearl / Platinum Team Galactic storyline.", teamGame: "Galactic climax battles", team: "Offensive villain roster with high-pressure legendary arc pacing.",
    tags: ["character", "antagonist", "sinnoh", "boss-trainer"], roleNote: "Cyrus is Sinnoh's central ideological antagonist."
  },
  {
    slug: "mars", name: "Mars", roleHint: "Team Galactic commander and recurring boss", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Mars from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Mars.png", creditLabel: "Diamond Pearl Mars" },
    battleStyle: "Fast commander pressure with disruptive aggressive turns.", signaturePokemon: ["Purugly", "Golbat", "Bronzor"], quote: "Command presence with direct tactical pressure.",
    appearance: "Pokemon Diamond / Pearl / Platinum Galactic commander encounters.", teamGame: "Team Galactic commander battles", team: "Aggressive mixed lineup centered on Purugly tempo spikes.",
    tags: ["character", "antagonist", "sinnoh"], roleNote: "Mars is one of Sinnoh's most recurrent commander battles."
  },
  {
    slug: "jupiter", name: "Jupiter", roleHint: "Team Galactic commander and strategic enforcer", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Jupiter from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Jupiter.png", creditLabel: "Diamond Pearl Jupiter" },
    battleStyle: "Poison-dark leaning control with sustained pressure turns.", signaturePokemon: ["Skuntank", "Golbat", "Bronzong"], quote: "Methodical command with dangerous matchup checks.",
    appearance: "Pokemon Diamond / Pearl / Platinum commander routes.", teamGame: "Team Galactic commander battles", team: "Control-focused villain lineup with status and pressure synergy.",
    tags: ["character", "antagonist", "sinnoh"], roleNote: "Jupiter adds tactical variance to Galactic commander encounters."
  },
  {
    slug: "saturn", name: "Saturn", roleHint: "Team Galactic commander and late-story threat", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Saturn from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Saturn.png", creditLabel: "Diamond Pearl Saturn" },
    battleStyle: "Calculated offense with dangerous special-pressure moments.", signaturePokemon: ["Toxicroak", "Bronzong", "Golbat"], quote: "Quiet command style with high-threat intent.",
    appearance: "Pokemon Diamond / Pearl / Platinum Galactic HQ and climax arc.", teamGame: "Team Galactic commander battles", team: "Balanced commander roster with strong offensive pivots.",
    tags: ["character", "antagonist", "sinnoh"], roleNote: "Saturn serves as one of the final commander-level hurdles in Sinnoh."
  },
  {
    slug: "cheryl", name: "Cheryl", roleHint: "Sinnoh partner trainer with support-focused route role", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Cheryl from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Cheryl.png", creditLabel: "Diamond Pearl Cheryl" },
    battleStyle: "Companion battle support with defensive utility.", signaturePokemon: ["Blissey", "Chansey"], quote: "Reliable field support and team sustain.",
    appearance: "Pokemon Diamond / Pearl / Platinum side-route partner events.", teamGame: "Eterna Forest partner profile", team: "Support-centric partner roster with healing-oriented identity.",
    tags: ["character", "support", "sinnoh"], roleNote: "Cheryl is one of Sinnoh's key temporary partner trainers."
  },
  {
    slug: "mira", name: "Mira", roleHint: "Sinnoh partner trainer and psychic support character", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Mira from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Mira.png", creditLabel: "Diamond Pearl Mira" },
    battleStyle: "Psychic support and special-oriented partner pressure.", signaturePokemon: ["Kadabra", "Alakazam"], quote: "Optimistic support with tactical utility.",
    appearance: "Pokemon Diamond / Pearl / Platinum partner cave routes.", teamGame: "Wayward Cave partner profile", team: "Special-leaning partner lineup supporting exploration battles.",
    tags: ["character", "support", "sinnoh"], roleNote: "Mira contributes to Sinnoh's optional partner-trainer structure."
  },
  {
    slug: "buck", name: "Buck", roleHint: "Sinnoh partner trainer tied to postgame areas", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Buck from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Buck.png", creditLabel: "Diamond Pearl Buck" },
    battleStyle: "Offensive support with strong fire-ground style pressure.", signaturePokemon: ["Claydol", "Rapidash", "Snorlax"], quote: "Adventurous pace with high-impact support turns.",
    appearance: "Pokemon Diamond / Pearl / Platinum postgame partner routes.", teamGame: "Stark Mountain partner profile", team: "Mixed offensive partner roster with postgame scaling.",
    tags: ["character", "support", "sinnoh", "postgame"], roleNote: "Buck is one of Sinnoh's major postgame companion profiles."
  },
  {
    slug: "marley", name: "Marley", roleHint: "Sinnoh partner trainer known for calm battle support", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Marley from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Marley.png", creditLabel: "Diamond Pearl Marley" },
    battleStyle: "Fast partner support with speed-focused pressure.", signaturePokemon: ["Arcanine", "Persian"], quote: "Quiet delivery with efficient tactical tempo.",
    appearance: "Pokemon Diamond / Pearl / Platinum partner route events.", teamGame: "Victory Road partner profile", team: "Speed-oriented partner roster for high-level encounters.",
    tags: ["character", "support", "sinnoh"], roleNote: "Marley adds late-route partner battle depth in Sinnoh."
  },
  {
    slug: "riley", name: "Riley", roleHint: "Sinnoh partner trainer and aura-focused battler", gameTags: ["sinnoh"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Riley from Pokemon Diamond and Pearl",
    portrait: { type: "remote", file: "Diamond_Pearl_Riley.png", creditLabel: "Diamond Pearl Riley" },
    battleStyle: "Steel-fighting partner pressure with balanced utility.", signaturePokemon: ["Lucario", "Metagross"], quote: "Composed aura style and reliable battle support.",
    appearance: "Pokemon Diamond / Pearl / Platinum Iron Island partner arc.", teamGame: "Iron Island partner profile", team: "Balanced support lineup with Lucario-led threat profile.",
    tags: ["character", "support", "sinnoh"], roleNote: "Riley is one of Sinnoh's most iconic partner trainers."
  },
  {
    slug: "shauna", name: "Shauna", roleHint: "Kalos friendly rival and recurring companion trainer", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Shauna from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Shauna.png", creditLabel: "XY Shauna" },
    battleStyle: "Adaptive rival pacing with support-focused narrative rhythm.", signaturePokemon: ["Goodra", "Delcatty", "starter counterpart"], quote: "Friendly energy with steady growth curve.",
    appearance: "Pokemon X / Y central rival group storyline.", teamGame: "Kalos rival encounters", team: "Balanced rival lineup evolving with player progression.",
    tags: ["character", "rival", "kalos"], roleNote: "Shauna is one of the core rival presences in Kalos."
  },
  {
    slug: "tierno", name: "Tierno", roleHint: "Kalos rival focused on dance and rhythm", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Tierno from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Tierno.png", creditLabel: "XY Tierno" },
    battleStyle: "Mid-tempo rival matches with broad type variety.", signaturePokemon: ["Raichu", "Crawdaunt", "Roserade"], quote: "Energetic style and upbeat tactical pace.",
    appearance: "Pokemon X / Y companion-rival routes.", teamGame: "Kalos rival encounters", team: "Varied rival roster with dance-themed personality flair.",
    tags: ["character", "rival", "kalos"], roleNote: "Tierno adds tonal variety to Kalos rival encounters."
  },
  {
    slug: "trevor", name: "Trevor", roleHint: "Kalos rival with Pokedex-completion focus", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Trevor from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Trevor.png", creditLabel: "XY Trevor" },
    battleStyle: "Collector-style battles with measured pressure.", signaturePokemon: ["Florges", "Aerodactyl", "Raichu"], quote: "Knowledge-first approach with steady progression.",
    appearance: "Pokemon X / Y rival-group storyline.", teamGame: "Kalos rival encounters", team: "Evolving generalist lineup tied to research/collection identity.",
    tags: ["character", "rival", "kalos"], roleNote: "Trevor reflects Kalos's exploration and collection theme."
  },
  {
    slug: "lysandre", name: "Lysandre", roleHint: "Team Flare boss and Kalos main antagonist", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Lysandre from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Lysandre.png", creditLabel: "XY Lysandre" },
    battleStyle: "High-stakes boss pacing with heavy offensive pressure.", signaturePokemon: ["Gyarados", "Pyroar", "Honchkrow"], quote: "Extreme ideals backed by overwhelming force.",
    appearance: "Pokemon X / Y Team Flare climax and legendary conflict arcs.", teamGame: "Team Flare boss battles", team: "Aggressive villain lineup centered on Mega Gyarados threat.",
    tags: ["character", "antagonist", "kalos", "boss-trainer"], roleNote: "Lysandre drives Kalos's central conflict and final escalation."
  },
  {
    slug: "professor-sycamore", name: "Professor Sycamore", roleHint: "Kalos professor and Mega evolution research lead", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Professor Sycamore from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Professor_Sycamore.png", creditLabel: "XY Professor Sycamore" },
    battleStyle: "Research mentor role with selective battle demonstrations.", signaturePokemon: ["Venusaur", "Charizard", "Blastoise"], quote: "Curiosity, elegance, and Mega-focused research.",
    appearance: "Pokemon X / Y main storyline and Mega evolution guidance.", teamGame: "Kalos research profile", team: "Starter-themed demonstration roster tied to mentor role.",
    tags: ["character", "professor", "kalos"], roleNote: "Sycamore anchors Kalos's scientific and Mega evolution narrative."
  },
  {
    slug: "dexio", name: "Dexio", roleHint: "Kalos researcher and assistant to Professor Sycamore", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Dexio from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Dexio.png", creditLabel: "XY Dexio" },
    battleStyle: "Supportive researcher profile with occasional tactical battles.", signaturePokemon: ["Espeon", "Slowking"], quote: "Field research with practical battle support.",
    appearance: "Pokemon X / Y support storyline and follow-up appearances.", teamGame: "Kalos research support profile", team: "Compact support roster tied to research assistance role.",
    tags: ["character", "support", "kalos"], roleNote: "Dexio supports player progression through research-side encounters."
  },
  {
    slug: "sina", name: "Sina", roleHint: "Kalos researcher and assistant to Professor Sycamore", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Sina from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Sina.png", creditLabel: "XY Sina" },
    battleStyle: "Analytical support role with light but meaningful battles.", signaturePokemon: ["Glaceon", "Delcatty"], quote: "Methodical support and route guidance.",
    appearance: "Pokemon X / Y research and support encounters.", teamGame: "Kalos research support profile", team: "Support-focused lineup emphasizing thematic research roles.",
    tags: ["character", "support", "kalos"], roleNote: "Sina complements Dexio in Kalos's research-team framework."
  },
  {
    slug: "az", name: "AZ", roleHint: "Ancient Kalos figure tied to ultimate weapon lore", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of AZ from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_AZ.png", creditLabel: "XY AZ" },
    battleStyle: "Story-climax battle with symbolic high-impact roster.", signaturePokemon: ["Torkoal", "Sigilyph", "Floette"], quote: "Centuries of regret carried into a final confrontation.",
    appearance: "Pokemon X / Y late-story and post-league resolution arc.", teamGame: "Kalos story climax battle", team: "Narrative-heavy lineup with unique Floette identity.",
    tags: ["character", "lore", "kalos", "boss-trainer"], roleNote: "AZ is one of Kalos's deepest lore anchors."
  },
  {
    slug: "emma", name: "Emma", roleHint: "Kalos side-story character tied to Looker missions", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Emma from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Emma.png", creditLabel: "XY Emma" },
    battleStyle: "Side-arc progression with identity-driven encounter pacing.", signaturePokemon: ["Espurr", "Meowstic"], quote: "Personal growth through high-risk side missions.",
    appearance: "Pokemon X / Y postgame Looker Bureau storyline.", teamGame: "Looker sidequest profile", team: "Story-linked roster with sidequest progression emphasis.",
    tags: ["character", "support", "kalos", "postgame"], roleNote: "Emma is central to Kalos's strongest postgame character arc."
  },
  {
    slug: "aliana", name: "Aliana", roleHint: "Team Flare scientist and executive battler", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Aliana from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Aliana.png", creditLabel: "XY Aliana" },
    battleStyle: "Scientist boss pacing with targeted coverage pressure.", signaturePokemon: ["Mightyena", "Liepard"], quote: "Clinical execution with villain-side precision.",
    appearance: "Pokemon X / Y Team Flare admin encounters.", teamGame: "Team Flare scientist battles", team: "Compact specialist roster supporting Flare operation arcs.",
    tags: ["character", "antagonist", "kalos"], roleNote: "Aliana is one of the core Team Flare admin threats."
  },
  {
    slug: "bryony", name: "Bryony", roleHint: "Team Flare scientist and executive battler", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Bryony from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Bryony.png", creditLabel: "XY Bryony" },
    battleStyle: "Fast admin skirmishes with pressure-focused sequencing.", signaturePokemon: ["Liepard", "Bisharp"], quote: "Efficient offense with villain-team discipline.",
    appearance: "Pokemon X / Y Team Flare executive routes.", teamGame: "Team Flare scientist battles", team: "Aggressive admin lineup with sharp tempo transitions.",
    tags: ["character", "antagonist", "kalos"], roleNote: "Bryony helps define Team Flare's recurring executive pressure."
  },
  {
    slug: "celosia", name: "Celosia", roleHint: "Team Flare scientist and executive battler", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Celosia from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Celosia.png", creditLabel: "XY Celosia" },
    battleStyle: "Admin-level pressure with dark-poison leaning disruption.", signaturePokemon: ["Manectric", "Mightyena"], quote: "Strategic aggression in Team Flare operations.",
    appearance: "Pokemon X / Y Team Flare conflict phases.", teamGame: "Team Flare scientist battles", team: "Villain-support roster with focused pressure and utility.",
    tags: ["character", "antagonist", "kalos"], roleNote: "Celosia is a recurring tactical gate in Team Flare arcs."
  },
  {
    slug: "mable", name: "Mable", roleHint: "Team Flare scientist and executive battler", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Mable from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Mable.png", creditLabel: "XY Mable" },
    battleStyle: "Support-villain pressure with efficient damage lines.", signaturePokemon: ["Houndoom", "Toxicroak"], quote: "Controlled aggression under executive command.",
    appearance: "Pokemon X / Y Team Flare operation routes.", teamGame: "Team Flare scientist battles", team: "Specialized admin lineup built for narrative boss checkpoints.",
    tags: ["character", "antagonist", "kalos"], roleNote: "Mable reinforces Team Flare's multi-admin battle structure."
  },
  {
    slug: "xerosic", name: "Xerosic", roleHint: "Team Flare scientist and postgame threat", gameTags: ["kalos"], regionLabel: "Kalos",
    portraitAlt: "Official art of Xerosic from Pokemon X and Y",
    portrait: { type: "remote", file: "XY_Xerosic.png", creditLabel: "XY Xerosic" },
    battleStyle: "Tech-scientist disruption with late-story tactical pressure.", signaturePokemon: ["Malamar", "Crobat"], quote: "Cold calculations powering villain tech strategy.",
    appearance: "Pokemon X / Y Team Flare arc and postgame missions.", teamGame: "Team Flare scientist battles", team: "Disruptive science-themed roster with control-oriented pacing.",
    tags: ["character", "antagonist", "kalos", "postgame"], roleNote: "Xerosic extends Team Flare's threat profile beyond the main climax."
  },
  {
    slug: "calaba", name: "Calaba", roleHint: "Hisui elder and warden linked to Ursaluna arc", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Calaba from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Calaba.png", creditLabel: "Legends Arceus Calaba" },
    battleStyle: "Story-gate role with measured challenge moments.", signaturePokemon: ["Ursaring", "Ursaluna"], quote: "Traditional wisdom and firm battlefield resolve.",
    appearance: "Pokemon Legends Arceus Crimson Mirelands progression arc.", teamGame: "Ursaluna route profile", team: "Narrative-centric roster connected to traversal progression.",
    tags: ["character", "warden", "hisui"], roleNote: "Calaba is a key gatekeeper in PLA's mid-route exploration flow."
  },
  {
    slug: "choy", name: "Choy", roleHint: "Jubilife merchant and side-story support character", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Choy from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Choy.png", creditLabel: "Legends Arceus Choy" },
    battleStyle: "Town support profile with minor battle presence.", signaturePokemon: ["Gengar", "Parasect"], quote: "Merchant pragmatism with occasional tactical insight.",
    appearance: "Pokemon Legends Arceus Jubilife side content and requests.", teamGame: "Jubilife support profile", team: "Limited support roster tied to city-side quest progression.",
    tags: ["character", "support", "hisui"], roleNote: "Choy contributes to PLA's town-economy character texture."
  },
  {
    slug: "ginter", name: "Ginter", roleHint: "Ginkgo Guild merchant and rare-item specialist", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Ginter from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Ginter.png", creditLabel: "Legends Arceus Ginter" },
    battleStyle: "Primarily commerce-focused with light combat relevance.", signaturePokemon: ["Scyther", "Tangela"], quote: "Mystery stock and opportunistic timing.",
    appearance: "Pokemon Legends Arceus Jubilife marketplace and side interactions.", teamGame: "Ginkgo Guild profile", team: "Minimal combat profile; economy and rare-item narrative role.",
    tags: ["character", "support", "hisui"], roleNote: "Ginter deepens PLA's merchant and exploration economy narrative."
  },
  {
    slug: "pesselle", name: "Pesselle", roleHint: "Jubilife corps member and quest-side character", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Pesselle from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Pesselle.png", creditLabel: "Legends Arceus Pesselle" },
    battleStyle: "Supportive side-role pacing with minor battle context.", signaturePokemon: ["Petilil", "Psyduck"], quote: "Practical support through daily Corps work.",
    appearance: "Pokemon Legends Arceus village support requests.", teamGame: "Jubilife requests profile", team: "Quest-oriented support roster with low direct battle emphasis.",
    tags: ["character", "support", "hisui"], roleNote: "Pesselle helps represent everyday Survey Corps support operations."
  },
  {
    slug: "sanqua", name: "Sanqua", roleHint: "Hisui craft specialist and village support figure", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Sanqua from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends_Arceus_Sanqua.png", creditLabel: "Legends Arceus Sanqua" },
    battleStyle: "Utility-focused support profile with minimal direct combat.", signaturePokemon: ["Bronzor", "Misdreavus"], quote: "Craft and logistics sustaining expedition momentum.",
    appearance: "Pokemon Legends Arceus Jubilife support and side content.", teamGame: "Village support profile", team: "Low-combat profile centered on service and progression support.",
    tags: ["character", "support", "hisui"], roleNote: "Sanqua reinforces PLA's settlement-building character ecosystem."
  },
  {
    slug: "courtney", name: "Courtney", roleHint: "Team Magma admin and Hoenn villain lieutenant", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Courtney from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Courtney.png", creditLabel: "Omega Ruby Alpha Sapphire Courtney" },
    battleStyle: "Admin-level pressure with ground-fire tactical sequencing.", signaturePokemon: ["Camerupt", "Mightyena"], quote: "Precision execution for Team Magma operations.",
    appearance: "Omega Ruby / Alpha Sapphire Team Magma storyline.", teamGame: "Team Magma admin battles", team: "Specialized villain roster supporting Magma escalation arcs.",
    tags: ["character", "antagonist", "hoenn"], roleNote: "Courtney is one of ORAS's signature admin battle identities."
  },
  {
    slug: "tabitha", name: "Tabitha", roleHint: "Team Magma admin and recurring Hoenn antagonist", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Tabitha from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Tabitha.png", creditLabel: "Omega Ruby Alpha Sapphire Tabitha" },
    battleStyle: "Aggressive admin pacing with bulky offensive pressure.", signaturePokemon: ["Mightyena", "Golbat", "Crobat"], quote: "Loyal enforcer with high-tempo battle intent.",
    appearance: "Omega Ruby / Alpha Sapphire Team Magma operations.", teamGame: "Team Magma admin battles", team: "Villain-support lineup tuned for direct pressure and momentum.",
    tags: ["character", "antagonist", "hoenn"], roleNote: "Tabitha reinforces Magma's recurring command pressure through the story."
  },
  {
    slug: "shelly", name: "Shelly", roleHint: "Team Aqua admin and Hoenn villain lieutenant", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Shelly from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Shelly.png", creditLabel: "Omega Ruby Alpha Sapphire Shelly" },
    battleStyle: "Water-leaning admin control with tactical support pressure.", signaturePokemon: ["Sharpedo", "Mightyena"], quote: "Controlled execution behind Aqua strategy.",
    appearance: "Omega Ruby / Alpha Sapphire Team Aqua narrative arcs.", teamGame: "Team Aqua admin battles", team: "Aqua-side roster with focused pressure and utility support.",
    tags: ["character", "antagonist", "hoenn"], roleNote: "Shelly is a primary tactical counterpart in Team Aqua command structure."
  },
  {
    slug: "matt", name: "Matt", roleHint: "Team Aqua admin and frontline enforcer", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Matt from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Matt.png", creditLabel: "Omega Ruby Alpha Sapphire Matt" },
    battleStyle: "Heavy offensive admin pressure with straightforward aggression.", signaturePokemon: ["Sharpedo", "Muk", "Crobat"], quote: "Frontline force carrying Aqua momentum.",
    appearance: "Omega Ruby / Alpha Sapphire Team Aqua conflict route.", teamGame: "Team Aqua admin battles", team: "Offensive admin roster built around direct battle pressure.",
    tags: ["character", "antagonist", "hoenn"], roleNote: "Matt is Team Aqua's primary physical-pressure lieutenant."
  },
  {
    slug: "professor-birch", name: "Professor Birch", roleHint: "Hoenn professor and regional field-research lead", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Professor Birch from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega_Ruby_Alpha_Sapphire_Professor_Birch.png", creditLabel: "Omega Ruby Alpha Sapphire Professor Birch" },
    battleStyle: "Research-centric role with introductory support focus.", signaturePokemon: ["Treecko", "Torchic", "Mudkip"], quote: "Field studies and starter guidance define the journey.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS opening research arc.", teamGame: "Hoenn research profile", team: "Starter distribution and advisory role with minimal direct battling.",
    tags: ["character", "professor", "hoenn"], roleNote: "Birch anchors Hoenn's research and starter narrative foundation."
  },
  {
    slug: "hapu", name: "Hapu", roleHint: "Poni kahuna and ground specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Hapu from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Hapu.png", creditLabel: "Sun Moon Hapu" },
    battleStyle: "Ground pressure with sturdy defensive-offense transitions.", signaturePokemon: ["Mudsdale", "Golurk", "Flygon"], quote: "Rural strength and unwavering battle discipline.",
    appearance: "Pokemon Sun / Moon and Ultra late island challenge route.", teamGame: "Poni grand trial", team: "Ground-oriented kahuna roster with high physical pressure.",
    tags: ["character", "kahuna", "alola"], roleNote: "Hapu completes Alola's kahuna structure in late-game progression."
  },
  {
    slug: "molayne", name: "Molayne", roleHint: "Alola Elite Four member and steel specialist", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Molayne from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun_Moon_Molayne.png", creditLabel: "Sun Moon Molayne" },
    battleStyle: "Steel precision with controlled high-level pressure.", signaturePokemon: ["Alolan Dugtrio", "Magnezone", "Klefki"], quote: "Technical steel pacing with elite discipline.",
    appearance: "Pokemon Ultra Sun / Ultra Moon Alola league route.", teamGame: "Alola Elite Four (USUM)", team: "Steel-specialist lineup emphasizing synergy and defensive punish windows.",
    tags: ["character", "elite-four", "alola", "steel-specialist"], roleNote: "Molayne extends Alola's league identity in Ultra routes."
  },
  {
    slug: "lt-surge", name: "Lt. Surge", roleHint: "Vermilion Gym Leader and electric specialist", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Lt. Surge from FireRed and LeafGreen",
    portrait: { type: "remote", file: "FireRed LeafGreen Lt Surge.png", creditLabel: "FireRed LeafGreen Lt Surge" },
    battleStyle: "Electric tempo with aggressive status and speed control.", signaturePokemon: ["Raichu", "Electrode", "Magneton"], quote: "Military precision with high-voltage pressure.",
    appearance: "Pokemon Red / Blue / Yellow and FireRed / LeafGreen gym progression.", teamGame: "Vermilion Gym", team: "Electric-heavy lineup with paralysis pressure and tempo swings.",
    tags: ["character", "gym-leader", "kanto"], roleNote: "Lt. Surge is a classic mid-early speed-control test in Kanto."
  },
  {
    slug: "leaf", name: "Leaf", roleHint: "Kanto female protagonist branch in FRLG canon", gameTags: ["kanto"], regionLabel: "Kanto",
    portraitAlt: "Official art of Leaf from FireRed and LeafGreen",
    portrait: { type: "remote", file: "Leaf FRLG OD.png", creditLabel: "Leaf FRLG OD" },
    battleStyle: "Player-defined growth route with broad team flexibility.", signaturePokemon: ["Venusaur", "Blastoise", "Charizard"], quote: "Custom progression style with full Kanto route coverage.",
    appearance: "Pokemon FireRed / LeafGreen protagonist branch and related media.", teamGame: "Kanto campaign profile", team: "Starter-driven customizable roster shaped by player route choices.",
    tags: ["character", "protagonist", "kanto"], roleNote: "Leaf represents FRLG's alternate player-avatar identity."
  },
  {
    slug: "arven", name: "Arven", roleHint: "Paldea companion and Path of Legends co-lead", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Arven from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Violet Arven.png", creditLabel: "Violet Arven" },
    battleStyle: "Story-driven progression with defensive-support pivots.", signaturePokemon: ["Mabosstiff", "Greedent", "Toedscruel"], quote: "Personal stakes and tactical grit shape every battle.",
    appearance: "Pokemon Scarlet / Violet Path of Legends and Area Zero climax.", teamGame: "Path of Legends / Area Zero", team: "Balanced companion roster centered on Mabosstiff and late-story support.",
    tags: ["character", "companion", "paldea"], roleNote: "Arven is one of Paldea's most narrative-critical battle allies."
  },
  {
    slug: "clavell", name: "Clavell", roleHint: "Paldea academy director and central story authority", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Clavell from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet Clavell.png", creditLabel: "Scarlet Clavell" },
    battleStyle: "Institutional mentor profile with selective boss-level battles.", signaturePokemon: ["Quaquaval", "Skeledirge", "Meowscarada"], quote: "Guidance and discipline under academy leadership.",
    appearance: "Pokemon Scarlet / Violet academy arc and Team Star resolution.", teamGame: "Academy director battles", team: "Starter-based challenge roster with story-context role shifts.",
    tags: ["character", "academy", "paldea", "boss-trainer"], roleNote: "Clavell is a major authority node in Paldea's narrative structure."
  },
  {
    slug: "professor-sada", name: "Professor Sada", roleHint: "Scarlet research lead tied to Area Zero paradox arc", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Professor Sada from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Scarlet Sada.png", creditLabel: "Scarlet Sada" },
    battleStyle: "High-stakes paradox roster with intense endgame pressure.", signaturePokemon: ["Koraidon", "Brute Bonnet", "Scream Tail"], quote: "Ancient ambition driving extreme final confrontations.",
    appearance: "Pokemon Scarlet Area Zero finale and professor AI storyline.", teamGame: "Scarlet final professor battle", team: "Paradox-focused roster with narrative climax intensity.",
    tags: ["character", "antagonist-arc", "paldea", "boss-trainer"], roleNote: "Sada anchors Scarlet's final narrative conflict."
  },
  {
    slug: "professor-turo", name: "Professor Turo", roleHint: "Violet research lead tied to Area Zero paradox arc", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Professor Turo from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "Violet Turo.png", creditLabel: "Violet Turo" },
    battleStyle: "Futurist paradox strategy with high-tech endgame pacing.", signaturePokemon: ["Miraidon", "Iron Hands", "Iron Bundle"], quote: "Future-focused drive culminating in decisive final battles.",
    appearance: "Pokemon Violet Area Zero finale and professor AI storyline.", teamGame: "Violet final professor battle", team: "Paradox-leaning roster with advanced offensive pressure patterns.",
    tags: ["character", "antagonist-arc", "paldea", "boss-trainer"], roleNote: "Turo defines Violet's final narrative and battle escalation."
  },
  {
    slug: "dendra", name: "Dendra", roleHint: "Paldea academy instructor and battle studies specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Dendra from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "VSDendra.png", creditLabel: "VS Dendra" },
    battleStyle: "Instruction-driven offense with fighting-leaning tempo.", signaturePokemon: ["Medicham", "Hawlucha", "Tauros"], quote: "Training intensity translated into practical battle execution.",
    appearance: "Pokemon Scarlet / Violet academy and classroom challenge routes.", teamGame: "Academy instructor profile", team: "Teaching-oriented roster with direct offensive fundamentals.",
    tags: ["character", "academy", "paldea"], roleNote: "Dendra expands Paldea's academy trainer ecosystem."
  },
  {
    slug: "saguaro", name: "Saguaro", roleHint: "Paldea academy instructor and home economics teacher", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Saguaro from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "VSSaguaro.png", creditLabel: "VS Saguaro" },
    battleStyle: "Supportive strategy with resilient and steady pace control.", signaturePokemon: ["Arboliva", "Dachsbun", "Farigiraf"], quote: "Calm classroom style with practical battle consistency.",
    appearance: "Pokemon Scarlet / Violet academy interactions and side challenges.", teamGame: "Academy instructor profile", team: "Balanced support-leaning roster tied to academy character events.",
    tags: ["character", "academy", "paldea"], roleNote: "Saguaro contributes to Paldea's teacher-side worldbuilding and challenge content."
  },
  {
    slug: "raifort", name: "Raifort", roleHint: "Paldea academy history teacher and lore specialist", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Raifort from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "VSRaifort.png", creditLabel: "VS Raifort" },
    battleStyle: "Lore-linked tactical battles with measured pressure pacing.", signaturePokemon: ["Gengar", "Houndoom", "Mismagius"], quote: "Historical curiosity paired with sharp combat insight.",
    appearance: "Pokemon Scarlet / Violet academy classes and side progression.", teamGame: "Academy instructor profile", team: "Thematic roster supporting lore-focused side content.",
    tags: ["character", "academy", "paldea"], roleNote: "Raifort connects Paldea classes with deeper historical lore threads."
  },
  {
    slug: "salvatore", name: "Salvatore", roleHint: "Paldea language teacher and academy trainer", gameTags: ["paldea"], regionLabel: "Paldea",
    portraitAlt: "Official art of Salvatore from Pokemon Scarlet and Violet",
    portrait: { type: "remote", file: "VSSalvatore.png", creditLabel: "VS Salvatore" },
    battleStyle: "Utility-focused academy battles with controlled pace.", signaturePokemon: ["Meowstic", "Persian", "Umbreon"], quote: "Gentle instruction with tactical fundamentals.",
    appearance: "Pokemon Scarlet / Violet academy class routes and side events.", teamGame: "Academy instructor profile", team: "Generalist support lineup tied to class-based progression.",
    tags: ["character", "academy", "paldea"], roleNote: "Salvatore broadens Paldea's academy cast with language-class side arcs."
  },
  {
    slug: "peonia", name: "Peonia", roleHint: "Crown Tundra partner and Max Lair guide", gameTags: ["galar"], regionLabel: "Galar",
    portraitAlt: "Official art of Peonia from Pokemon Sword and Shield",
    portrait: { type: "remote", file: "Peonia SwSh.png", creditLabel: "Peonia SwSh" },
    battleStyle: "DLC-side pacing with quick offensive support choices.", signaturePokemon: ["Tyrantrum", "Tyranitar", "Aggron"], quote: "Exploration-first attitude with sharp battle instincts.",
    appearance: "Pokemon Sword / Shield Crown Tundra side routes.", teamGame: "Crown Tundra partner profile", team: "Compact support roster tied to expedition and Max Lair progression.",
    tags: ["character", "support", "galar", "dlc"], roleNote: "Peonia adds personality and guidance to Crown Tundra exploration arcs."
  },
  {
    slug: "samson-oak", name: "Samson Oak", roleHint: "Alola professor figure and regional variant researcher", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Samson Oak from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Samson Oak SM.png", creditLabel: "Samson Oak SM" },
    battleStyle: "Research-support profile with occasional focused encounters.", signaturePokemon: ["Exeggutor", "Alolan Meowth"], quote: "Regional research with playful mentor tone.",
    appearance: "Pokemon Sun / Moon and Ultra support/research storyline.", teamGame: "Alola research profile", team: "Limited battle emphasis around variant-focused research identity.",
    tags: ["character", "professor", "alola"], roleNote: "Samson Oak supports Alola's regional forms and research context."
  },
  {
    slug: "ryuki", name: "Ryuki", roleHint: "Alola dragon specialist and late-route challenger", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Ryuki from Pokemon Sun and Moon",
    portrait: { type: "remote", file: "Sun Moon Ryuki.png", creditLabel: "Sun Moon Ryuki" },
    battleStyle: "Dragon-themed pressure with burst-heavy tempo lines.", signaturePokemon: ["Turtonator", "Drampa", "Kommo-o"], quote: "Performance flair with hard-hitting dragon pressure.",
    appearance: "Pokemon Sun / Moon and Ultra side challenges and league-adjacent content.", teamGame: "Alola special challenger profile", team: "Dragon-forward lineup with aggressive matchup pressure.",
    tags: ["character", "specialist", "alola", "dragon-specialist"], roleNote: "Ryuki is a notable late-content dragon specialist in Alola."
  },
  {
    slug: "mohn", name: "Mohn", roleHint: "Aether-linked figure central to Lusamine family arc", gameTags: ["alola"], regionLabel: "Alola",
    portraitAlt: "Official art of Mohn from Pokemon Sun and Moon prerelease materials",
    portrait: { type: "remote", file: "SM Prerelease Mohn.png", creditLabel: "SM Prerelease Mohn" },
    battleStyle: "Narrative-focused character with limited direct battle emphasis.", signaturePokemon: ["Nihilego", "Magearna"], quote: "Memory and identity at the center of Alola's emotional arc.",
    appearance: "Pokemon Sun / Moon and Ultra post-story family narrative references.", teamGame: "Aether narrative profile", team: "Story-centric role with minimal formal trainer-battle identity.",
    tags: ["character", "lore", "alola"], roleNote: "Mohn is key to the deeper emotional thread of Alola's story."
  },
  {
    slug: "looker", name: "Looker", roleHint: "International Police agent with cross-region investigations", gameTags: ["sinnoh", "hoenn", "kalos", "alola"], regionLabel: "Sinnoh",
    portraitAlt: "Official art of Looker from Pokemon Platinum",
    portrait: { type: "remote", file: "Platinum Looker.png", creditLabel: "Platinum Looker" },
    battleStyle: "Investigation-first role with selective tactical encounters.", signaturePokemon: ["Croagunk", "Mightyena"], quote: "Case-driven persistence across multiple regions.",
    appearance: "Pokemon Platinum, ORAS postgame, and Kalos postgame Looker Bureau arcs.", teamGame: "International Police profile", team: "Limited combat profile focused on story and investigative support.",
    tags: ["character", "support", "cross-region", "postgame"], roleNote: "Looker bridges multiple generations through connected investigation plots."
  },
  {
    slug: "tate-liza", name: "Tate & Liza", roleHint: "Mossdeep Gym duo and double-battle psychic specialists", gameTags: ["hoenn"], regionLabel: "Hoenn",
    portraitAlt: "Official art of Tate and Liza from Omega Ruby and Alpha Sapphire",
    portrait: { type: "remote", file: "Omega Ruby Alpha Sapphire Liza & Tate.png", creditLabel: "Omega Ruby Alpha Sapphire Liza and Tate" },
    battleStyle: "Double-battle coordination with synchronized psychic pressure.", signaturePokemon: ["Solrock", "Lunatone", "Xatu"], quote: "Twin strategy focused on timing and battlefield synergy.",
    appearance: "Pokemon Ruby / Sapphire / Emerald and ORAS gym sequence.", teamGame: "Mossdeep Gym", team: "Doubles-oriented psychic roster with coordinated setup and pressure.",
    tags: ["character", "gym-leader", "hoenn", "double-battle"], roleNote: "Tate and Liza are iconic for doubles-focused gym mechanics."
  },
  {
    slug: "anthea-concordia", name: "Anthea & Concordia", roleHint: "N's caretakers and Team Plasma narrative figures", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Anthea and Concordia from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black 2 White 2 Anthea and Concordia.png", creditLabel: "Black 2 White 2 Anthea and Concordia" },
    battleStyle: "Story-support profile with minimal direct battle emphasis.", signaturePokemon: ["Minccino", "Audino"], quote: "Compassion-driven guidance within Unova's ideological conflict.",
    appearance: "Pokemon Black / White and Black 2 / White 2 Team Plasma story context.", teamGame: "Unova narrative support profile", team: "Primarily non-combat story roles with light support associations.",
    tags: ["character", "support", "unova"], roleNote: "Anthea and Concordia reinforce N's humanizing narrative thread."
  },
  {
    slug: "zinzolin", name: "Zinzolin", roleHint: "Team Plasma operative and recurring Unova antagonist", gameTags: ["unova"], regionLabel: "Unova",
    portraitAlt: "Official art of Zinzolin from Pokemon Black 2 and White 2",
    portrait: { type: "remote", file: "Black 2 White 2 Zinzolin.png", creditLabel: "Black 2 White 2 Zinzolin" },
    battleStyle: "Status-heavy villain battles with tactical disruption.", signaturePokemon: ["Weavile", "Cryogonal", "Mismagius"], quote: "Cold strategy and relentless pressure in Plasma operations.",
    appearance: "Pokemon Black / White and Black 2 / White 2 antagonist routes.", teamGame: "Team Plasma operative battles", team: "Control-oriented villain roster with speed and disruption focus.",
    tags: ["character", "antagonist", "unova"], roleNote: "Zinzolin is one of Team Plasma's most recurring tactical threats."
  },
  {
    slug: "vessa", name: "Vessa", roleHint: "Hisui spirit-seeker tied to wisp sidequest arc", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official art of Vessa from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "Legends Arceus Vessa.png", creditLabel: "Legends Arceus Vessa" },
    battleStyle: "Quest-centric profile with selective high-impact encounters.", signaturePokemon: ["Spiritomb"], quote: "A mysterious guide through one of PLA's deepest side arcs.",
    appearance: "Pokemon Legends Arceus wisp collection and Spiritomb questline.", teamGame: "Hisui wisp quest profile", team: "Single-theme narrative roster centered on Spiritomb culmination.",
    tags: ["character", "lore", "hisui", "sidequest"], roleNote: "Vessa anchors PLA's large-scale wisp side content."
  },
  {
    slug: "zisu", name: "Zisu", roleHint: "Jubilife training captain and combat mentor", gameTags: ["hisui"], regionLabel: "Hisui",
    portraitAlt: "Official battle portrait of Zisu from Pokemon Legends Arceus",
    portrait: { type: "remote", file: "VSZisu.png", creditLabel: "VS Zisu" },
    battleStyle: "Training-focused battles with balanced offensive structure.", signaturePokemon: ["Lucario", "Machoke", "Gengar"], quote: "Hands-on training and practical combat development.",
    appearance: "Pokemon Legends Arceus village training grounds and side content.", teamGame: "Jubilife training profile", team: "Mentor-style roster emphasizing practical move and role fundamentals.",
    tags: ["character", "mentor", "hisui"], roleNote: "Zisu is a core combat-training figure in Jubilife Village."
  }
];

export const CHARACTER_WIKI_INDEX: CharacterWikiEntry[] = seeds.map(buildCharacter);

export function getCharacterBySlug(slug: string) {
  return CHARACTER_WIKI_INDEX.find((entry) => entry.slug === slug) ?? null;
}
