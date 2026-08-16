export type Creator = {
  slug: string;
  name: string;
  handle: string;
  bio: string;
  address: `0x${string}`;
  initials: string;
  accent: string;
  verified: boolean;
  supporters: number;
  raised: number;
  goal: number;
  campaign: string;
  category: string;
  image?: string;
  isDemo: boolean;
  unregistered?: boolean;
};

export const creators: Creator[] = [
  {
    slug: "maya-builds",
    name: "Maya Okafor",
    handle: "@mayabuilds",
    bio: "Designing small, useful tools that make self-custody feel less intimidating.",
    address: "0x2C0552e5dCb79B064Fd23E358A86810BC5994244",
    initials: "MO",
    accent: "violet",
    verified: false,
    supporters: 128,
    raised: 842_500,
    goal: 1_000_000,
    campaign: "Ship the self-custody starter kit",
    category: "Product design",
    isDemo: true,
  },
  {
    slug: "open-source-ada",
    name: "Ada Mensah",
    handle: "@adaoss",
    bio: "Open-source developer building accessible payment primitives for African creators.",
    address: "0xBAa17c9A086E5e8a2bB37A5DDd2A0Ed3622367910",
    initials: "AM",
    accent: "blue",
    verified: false,
    supporters: 94,
    raised: 621_000,
    goal: 900_000,
    campaign: "Fund three months of public goods work",
    category: "Open source",
    isDemo: true,
  },
  {
    slug: "verse-frames",
    name: "Kola Frames",
    handle: "@kolaframes",
    bio: "Illustrations, motion, and visual stories inspired by internet-native communities.",
    address: "0xf86540382E2a3230d6D3Dfc2F6a57eee2f42fb1D",
    initials: "KF",
    accent: "pink",
    verified: false,
    supporters: 67,
    raised: 404_000,
    goal: 750_000,
    campaign: "Create the next Verse community short",
    category: "Visual art",
    isDemo: true,
  },
];

export const featuredCreator = creators[0];

export const demoActivity = [
  { from: "0x346E…a2Bd", amount: 25_000, message: "Keep making the hard things simple.", time: "8m" },
  { from: "0x54fb…fbD0", amount: 10_000, message: "The starter kit is brilliant.", time: "42m" },
  { from: "0x4Db0…8247", amount: 5_000, message: "For the next release.", time: "2h" },
];
