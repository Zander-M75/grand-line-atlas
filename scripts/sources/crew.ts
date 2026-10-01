/**
 * The ten Straw Hats and the anime episode each one officially joins in. Every join point
 * was checked against the wiki's episode summaries; the quoted text is from them.
 * build-crew re-checks each one against the cached episode page and the arc's episode range.
 */
import type { CrewMember } from '../../src/types';

export const CREW: CrewMember[] = [
  // Captain from the first episode.
  {
    id: 'luffy',
    name: 'Monkey D. Luffy',
    role: 'Captain',
    joinedArcId: 'romance-dawn',
    joinedEpisode: 1,
  },
  // Episode 3: "Luffy convinces Zoro to join his crew".
  {
    id: 'zoro',
    name: 'Roronoa Zoro',
    role: 'Swordsman',
    joinedArcId: 'romance-dawn',
    joinedEpisode: 3,
  },
  // Ambiguous: Nami travels with the crew from Orange Town and navigates for them from
  // episode 9 ("forming an alliance with the crew as their navigator (though not as a
  // member)"), but officially joins in episode 44: she "decides to officially join".
  {
    id: 'nami',
    name: 'Nami',
    role: 'Navigator',
    joinedArcId: 'arlong-park',
    joinedEpisode: 44,
  },
  // Episode 17: the crew "accept Usopp as a new crew member". He leaves during Water 7 and
  // rejoins in episode 323; the crew list keeps him aboard throughout.
  {
    id: 'usopp',
    name: 'Usopp',
    role: 'Sniper',
    joinedArcId: 'syrup-village',
    joinedEpisode: 17,
  },
  // Episode 30, "Departure! Sea Chef and Luffy Travel Together!": Sanji leaves the Baratie.
  {
    id: 'sanji',
    name: 'Sanji',
    role: 'Cook',
    joinedArcId: 'baratie',
    joinedEpisode: 30,
  },
  // Episode 91: "Chopper joins the Straw Hat crew".
  {
    id: 'chopper',
    name: 'Tony Tony Chopper',
    role: 'Doctor',
    joinedArcId: 'drum-island',
    joinedEpisode: 91,
  },
  // Episode 130: Robin "manages to persuade the crew to let her join".
  {
    id: 'robin',
    name: 'Nico Robin',
    role: 'Archaeologist',
    joinedArcId: 'arabasta',
    joinedEpisode: 130,
  },
  // Episode 322: "Franky decides to join Luffy".
  {
    id: 'franky',
    name: 'Franky',
    role: 'Shipwright',
    joinedArcId: 'post-enies-lobby',
    joinedEpisode: 322,
  },
  // Episode 381: Brook "asks if he can join the crew, which Luffy approves of".
  {
    id: 'brook',
    name: 'Brook',
    role: 'Musician',
    joinedArcId: 'thriller-bark',
    joinedEpisode: 381,
  },
  // Ambiguous: Luffy invites Jinbe at Fish-Man Island (episode 568) and Jinbe pledges to
  // join during Whole Cake Island, but he's officially aboard in Wano, episode 980, where he
  // "announces to all that he's joining the Straw Hat Pirates".
  {
    id: 'jinbe',
    name: 'Jinbe',
    role: 'Helmsman',
    joinedArcId: 'wano-country',
    joinedEpisode: 980,
  },
];
