/**
 * Every arc's and every place's summary, written for this project (PLAN.md §2.4): one or two
 * sentences in our own words, never wiki prose. build-arcs and build-locations copy them into
 * the generated JSON, and check-summaries flags any run of words shared with a wiki page.
 *
 * They're spoiler-light by rule, because of where they show:
 *
 * - An arc's summary shows from its first episode on: a viewer partway through an arc sees it
 *   (src/data/spoilers.ts). So it sets the scene and names the goal, never the outcome. Crew
 *   who join during an arc aren't said to join.
 * - A place's summary shows from the crew's first visit on, so it describes the place as they
 *   find it, not what becomes of it later.
 */

export const ARC_SUMMARIES: Record<string, string> = {
  // East Blue Saga
  'romance-dawn':
    'Luffy, a boy whose body stretches like rubber, puts out to sea alone, set on becoming the Pirate King. First he needs a crew, and he has heard of a swordsman tied up at a Marine base.',
  'orange-town':
    'A flashback shows how the pirate Shanks inspired Luffy’s dream. Back in the present, a giant bird drops Luffy in a harbor town held by Buggy the Clown, where a thief named Nami is working an angle of her own.',
  'syrup-village':
    'In search of a real ship, the crew lands at a quiet village and meets Usopp, a teenage liar whose tall tales keep a sickly rich girl smiling.',
  baratie:
    'Wanting a cook before the Grand Line, the crew visits the Baratie, a floating restaurant whose chefs fight as hard as they cook. Luffy wrecks part of it on arrival and has to work off the damage.',
  'arlong-park':
    'Nami makes off with the ship, and the crew follows her home to the Conomi Islands, where the Fish-Man pirate Arlong has ruled the villages for years and takes tribute from all of them.',
  'buggy-side-story':
    'A side story without the Straw Hats: Buggy the Clown, left with little more than his head, hands, and feet after Orange Town, goes looking for the rest of himself and his crew.',
  loguetown:
    'With a bounty on Luffy’s head for the first time, the crew stops at Loguetown, where the Pirate King was born and executed. It’s their last port before the Grand Line, and the Marines there are on watch.',

  // Arabasta Saga
  'warship-island':
    'The crew fishes a runaway girl named Apis out of the sea. She has escaped a Marine warship and wants to go home to Warship Island, but the Marines want her back.',
  'reverse-mountain':
    'The crew rides an ocean current up the Red Line and over Reverse Mountain, the gateway to the Grand Line. Waiting at the bottom is a whale the size of an island.',
  'whisky-peak':
    'At Whisky Peak, their first stop on the Grand Line, the whole town turns out to throw the crew a feast that lasts all night. A welcome this warm seems almost too good to be true.',
  'koby-and-helmeppo':
    'A side story without the Straw Hats: Koby, the boy Luffy befriended in the first episodes, and the spoiled Helmeppo are now lowly Marine recruits, both hoping to make something of themselves.',
  'little-garden':
    'With Princess Vivi aboard and her kingdom in danger, the crew lands on Little Garden, a jungle island where dinosaurs still roam. Two giants have been fighting a duel there for a hundred years.',
  'drum-island':
    'When Nami falls dangerously ill, the crew turns aside to Drum Island, a snowbound kingdom with almost no doctors left, to find one before it’s too late.',
  arabasta:
    'The crew finally reaches Arabasta, Vivi’s desert kingdom, where drought and rebellion are pushing the country toward civil war. Behind it all is Crocodile, a Warlord of the Sea the people see as a hero.',
  'post-arabasta':
    'Five standalone episodes aboard the ship after Arabasta, each one looking back at a crewmate’s past or chasing a crewmate’s dream.',

  // Sky Island Saga
  'goat-island':
    'Fleeing Marine warships through fog and reefs, the crew finds an uncharted island where an old man lives with his goats and a half-built ship.',
  'ruluka-island':
    'The crew lands on Ruluka, an island taxed into poverty to pay for a giant tower, where a scientist studies the Rainbow Mist, a fog said to swallow ships whole.',
  jaya: 'A galleon crashes down out of the sky and the crew’s compass points straight up, so they put in at Jaya, a lawless pirate island, to find a way up there.',
  skypiea:
    'Launched into the sky by a giant ocean current, the crew reaches Skypiea, a land of islands made of cloud. Its people live in fear of a god who punishes anyone who trespasses.',
  'g-8':
    'Coming down from the sky, the ship splashes into the middle of a Marine fortress. The crew scatters in disguise, hoping to get their ship back and escape.',

  // Water 7 Saga
  'long-ring-long-land':
    'On an island where everything grows long and thin, the Foxy Pirates challenge the crew to a Davy Back Fight: a series of games in which the winning side takes crewmates from the losers.',
  'oceans-dream':
    'The crew wakes up with no memory of their time together. Only Robin remembers, and someone took the others’ memories on purpose.',
  'foxys-return':
    'In a storm, the crew pulls Foxy and two of his crewmates out of a sinking boat. Before long, they’re up to their old tricks.',
  'water-7':
    'With the Going Merry badly worn, the crew sails to Water 7, a city of canals and master shipwrights, to have her repaired and find a shipwright of their own.',
  'enies-lobby':
    'The crew storms Enies Lobby, the World Government’s island of justice, to rescue Robin before she is taken through the Gates of Justice for good.',
  'post-enies-lobby':
    'Back at Water 7, the crew rests up from the battle while Franky builds them a new ship. Meanwhile, news of what they did spreads around the world.',

  // Thriller Bark Saga
  'ice-hunter':
    'On the new ship’s first voyage, the crew stops to help a battered pirate ship and ends up herded into a field of icebergs.',
  'thriller-bark':
    'Drifting into the Florian Triangle, a foggy sea where ships vanish, the crew meets a talking skeleton and comes upon a ship as big as an island.',
  'spa-island':
    'The crew takes a break at a floating resort of hot springs and water slides, until Foxy shows up there too.',

  // Summit War Saga
  'sabaody-archipelago':
    'Halfway along the Grand Line, the crew needs their ship coated so it can sail underwater, beneath the Red Line. Sabaody, where that’s done, is crowded with pirates, slave traders, and the world’s nobility.',
  'amazon-lily':
    'Separated from his crew, Luffy falls out of the sky onto Amazon Lily, home to a tribe of warrior women who allow no men. All he wants is to get back to his friends.',
  'impel-down':
    'Luffy breaks into Impel Down, the World Government’s underwater prison, to rescue his brother Ace before his execution.',
  'little-east-blue':
    'Outside the main story: a giant beetle carries half the crew off to an island settled by people from East Blue, who want nothing to do with pirates.',
  marineford:
    'Marine Headquarters braces for war as Ace’s execution nears. Whitebeard’s fleet is on its way to save him, and Luffy is racing to get there too.',
  'post-war':
    'In the war’s aftermath, a grieving Luffy recovers on a Calm Belt island and memories of his childhood with Ace come back to him.',

  // Fish-Man Island Saga
  'return-to-sabaody':
    'Two years later, the crew makes its way back to Sabaody to meet up again, though a gang of impostors is already using their names.',
  'fish-man-island':
    'Diving under the sea, the crew reaches Fish-Man Island, a kingdom of Fish-Men and merfolk ten thousand meters down, where a pirate gang is stirring up hatred of humans.',

  // Dressrosa Saga
  'zs-ambition':
    'In a stretch of the New World with impossible weather, the crew crosses paths with the Neo Marines, former Marines sworn to wipe out every pirate.',
  'punk-hazard':
    'Answering a distress call, Luffy lands on Punk Hazard, a forbidden island burning on one side and frozen on the other, with the Marines not far behind.',
  'caesar-retrieval':
    'On the way to Dressrosa, an intruder slips aboard and kidnaps Caesar, the scientist the alliance is holding as a hostage.',
  dressrosa:
    'The crew and their new ally, Law, sail to Dressrosa to bring down its king, the Warlord Doflamingo, in a country of flowers, gladiators, and living toys.',

  // Whole Cake Island Saga
  'silver-mine':
    'Luffy and Bartolomeo are kidnapped in their sleep and taken to a fortress built on a silver mine.',
  zou: 'Luffy’s group climbs onto Zou, an island carried on a giant elephant’s back, to meet the crewmates who went on ahead.',
  'marine-rookie':
    'Starving on the way to Big Mom’s territory, Luffy’s group raids a Marine base for food, where an eager young officer has plans of his own.',
  'whole-cake-island':
    'Luffy leads a small team into Totto Land, the territory of the Emperor Big Mom, to bring Sanji back before his arranged wedding to one of her daughters.',
  levely:
    'Kings and queens from around the world gather at Mary Geoise, home of the World Government’s rulers, for a summit held once every four years.',

  // Wano Country Saga
  'wano-country':
    'The alliance arrives in Wano, a land of samurai sealed off from the world and ruled by a tyrant shogun and the Emperor Kaido, and starts gathering forces for a war to free it.',
  'cidre-guild':
    'When the ship runs out of the cola that powers it, Luffy goes ashore for more and runs into the Cidre Guild, bounty hunters out for the crew.',
  'utas-past':
    'A flashback to years before the story began: Shanks’s crew stops at Foosha Village with a girl named Uta, and young Luffy meets her.',

  // Final Saga
  egghead:
    'Leaving Wano, the crew arrives at Egghead, a futuristic island where the world’s greatest scientist, Dr. Vegapunk, keeps his laboratory.',
  elbaph:
    'Sailing with the giants, the crew sets course at last for Elbaph, the homeland of the giants that Usopp has dreamed of seeing since the voyage began.',
};

export const LOCATION_SUMMARIES: Record<string, string> = {
  // East Blue
  'foosha-village': 'A quiet windmill village on Dawn Island in East Blue, where Luffy grew up.',
  'shells-town': 'An East Blue port town with a Marine base, run with an iron fist by its captain.',
  'orange-town':
    'A small harbor town in East Blue. When Luffy turns up, Buggy the Clown’s pirates have taken it over and its people have fled.',
  'syrup-village': 'A peaceful village on the Gecko Islands in East Blue, and Usopp’s hometown.',
  'island-of-rare-animals':
    'A small East Blue island full of strange hybrid animals, guarded by a man stuck in a treasure chest.',
  baratie:
    'A restaurant ship out on the sea near the Grand Line, run by Chef Zeff, whose cooks are as rough as their customers.',
  'arlong-park':
    'The seaside fortress of Arlong’s Fish-Man pirates, built to rule the Conomi Islands.',
  loguetown:
    'The town where the Pirate King was born and executed, and the last big port before the Grand Line.',
  'warship-island': 'An island shaped like a battleship, and Apis’s home.',

  // The Red Line and the Grand Line
  'reverse-mountain':
    'A mountain on the Red Line whose currents run uphill from the four Blues and spill down into the Grand Line. It’s the usual way in for ships from the Blues.',
  'twin-cape':
    'The cape at the foot of Reverse Mountain, where the Grand Line begins. An old doctor keeps the lighthouse.',
  'whisky-peak':
    'A town on Cactus Island, the first stop for many ships on the Grand Line, known for welcoming pirates with open arms.',
  'little-garden': 'A jungle island in Paradise whose ancient climate has kept dinosaurs alive.',
  'drum-island':
    'A snow-covered winter island in Paradise, home to the Drum Kingdom and the castle on its highest mountain.',
  arabasta:
    'A vast desert kingdom in Paradise and Princess Vivi’s home, where the rain has stopped falling.',
  'goat-island': 'An uncharted island hidden in fog and reefs, home to an old man and his goats.',
  'ruluka-island':
    'An island in Paradise whose waters hide a strange phenomenon, the Rainbow Mist.',
  jaya: 'An island in Paradise with no law at all, whose harbor, Mock Town, is crowded with rowdy pirates.',
  skypiea:
    'A country high in the sky above Paradise, where the islands are made of cloud and the sea is white.',
  navarone:
    'An island fortress in Paradise, home to Marine Base G-8 and walled in by sheer cliffs.',
  'long-ring-long-land':
    'A chain of islands in Paradise where everything, from trees to horses to people, grows extra long.',
  'water-7':
    'A city of canals and fountains in Paradise, famous for its shipwrights and home to the shipbuilding company Galley-La.',
  'enies-lobby':
    'The World Government’s judicial island, where the sun never sets and prisoners are sent on through the Gates of Justice.',
  'lovely-land':
    'The icy headquarters of the Accino Family, a band of bounty hunters, hidden in a sea of icebergs.',
  'thriller-bark':
    'A ship the size of an island, lurking in the fog of the Florian Triangle, a stretch of sea where ships disappear.',
  'spa-island':
    'A floating resort of hot springs, pools, and slides, a place to rest after the Florian Triangle.',
  'sabaody-archipelago':
    'A forest of giant mangrove trees near the Red Line, the last stop in Paradise, where ships are coated to sail down to Fish-Man Island.',
  'amazon-lily':
    'A Calm Belt island ruled by the Kuja, a tribe of warrior women, where men are forbidden.',
  'impel-down':
    'The World Government’s undersea prison for its most dangerous criminals, sunk deep beneath the Calm Belt.',
  'little-east-blue': 'An island settled by people from East Blue, far from their home sea.',
  marineford:
    'The home of Marine Headquarters: a fortress town on the Grand Line, close to Mary Geoise and Sabaody, reached through the Gates of Justice.',
  rusukaina:
    'A harsh Calm Belt island near Amazon Lily, where the weather cycles through a new season every week or so.',
  'fish-man-island':
    'An undersea kingdom ten thousand meters down, home to Fish-Men and merfolk, and a way into the New World beneath the Red Line.',

  // The New World
  'punk-hazard':
    'A forbidden New World island, scorching on one side and frozen solid on the other.',
  dressrosa:
    'A New World kingdom of flowers, passion, and toys, ruled by the Warlord Donquixote Doflamingo.',
  'silver-mine':
    'A deserted New World island near Dressrosa, honeycombed by a silver mine and the fortress built over it.',
  zou: 'An island that rides on a thousand-year-old elephant as it wades through the New World, home to the Mink Tribe.',
  'whole-cake-island':
    'The heart of Totto Land, the island nation ruled by Big Mom, one of the Four Emperors, where much of the land is good enough to eat.',
  'mary-geoise':
    'The World Government’s capital, perched high on the Red Line, where the world’s highest nobles live.',
  'wano-country':
    'An island nation of samurai in the New World, closed off from the rest of the world behind towering cliffs and waterfalls.',
  egghead:
    'A New World winter island that the scientist Dr. Vegapunk turned into a laboratory city, built to be five hundred years ahead of its time.',
  elbaph:
    'The homeland of the giants, a fiercely independent nation in the New World famed for its warriors.',
};
