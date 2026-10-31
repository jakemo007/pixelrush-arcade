export interface Theme {
  id: string;
  name: string;
  words: readonly string[];
}

export const THEMES: readonly Theme[] = [
  {
    id: 'ocean',
    name: 'Ocean Life',
    words: ['DOLPHIN', 'OCTOPUS', 'STARFISH', 'SEAHORSE', 'JELLYFISH', 'CORAL', 'WHALE', 'SHARK', 'LOBSTER', 'OYSTER', 'SQUID', 'TURTLE', 'CRAB', 'KELP', 'SEAL', 'SHRIMP', 'MANATEE', 'URCHIN', 'ANCHOVY', 'PLANKTON'],
  },
  {
    id: 'space',
    name: 'Outer Space',
    words: ['PLANET', 'COMET', 'GALAXY', 'NEBULA', 'ORBIT', 'ROCKET', 'ASTEROID', 'METEOR', 'SATELLITE', 'ECLIPSE', 'COSMOS', 'GRAVITY', 'TELESCOPE', 'ASTRONAUT', 'SATURN', 'JUPITER', 'MARS', 'VENUS', 'LUNAR', 'QUASAR'],
  },
  {
    id: 'fruit',
    name: 'Fruit Bowl',
    words: ['APPLE', 'BANANA', 'CHERRY', 'MANGO', 'PAPAYA', 'ORANGE', 'LEMON', 'GRAPE', 'KIWI', 'PEACH', 'PLUM', 'APRICOT', 'COCONUT', 'LYCHEE', 'GUAVA', 'MELON', 'FIG', 'PEAR', 'BLUEBERRY', 'RASPBERRY'],
  },
  {
    id: 'weather',
    name: 'Wild Weather',
    words: ['THUNDER', 'CLOUD', 'SNOW', 'SLEET', 'HAIL', 'BREEZE', 'STORM', 'TORNADO', 'RAINBOW', 'FOG', 'DRIZZLE', 'BLIZZARD', 'MONSOON', 'FROST', 'HUMID', 'SUNNY', 'WINDY', 'DEW', 'MIST', 'HURRICANE'],
  },
  {
    id: 'music',
    name: 'Music Room',
    words: ['GUITAR', 'PIANO', 'VIOLIN', 'DRUMS', 'FLUTE', 'TRUMPET', 'CELLO', 'HARP', 'BANJO', 'TUBA', 'MELODY', 'RHYTHM', 'CHORD', 'TEMPO', 'CHORUS', 'HARMONY', 'OBOE', 'CLARINET', 'SAXOPHONE', 'UKULELE'],
  },
  {
    id: 'garden',
    name: 'In the Garden',
    words: ['TULIP', 'DAISY', 'ROSE', 'ORCHID', 'LILY', 'SUNFLOWER', 'POPPY', 'VIOLET', 'FERN', 'IVY', 'MOSS', 'SHOVEL', 'RAKE', 'SEEDS', 'COMPOST', 'HOSE', 'TROWEL', 'BLOSSOM', 'PETAL', 'LAVENDER'],
  },
  {
    id: 'sports',
    name: 'Game Day',
    words: ['SOCCER', 'TENNIS', 'HOCKEY', 'GOLF', 'RUGBY', 'CRICKET', 'BASEBALL', 'CYCLING', 'ROWING', 'SKIING', 'ARCHERY', 'KARATE', 'BOXING', 'SURFING', 'NETBALL', 'BADMINTON', 'VOLLEYBALL', 'JUDO', 'SPRINT', 'RELAY'],
  },
  {
    id: 'kitchen',
    name: 'Kitchen Drawer',
    words: ['SPATULA', 'WHISK', 'LADLE', 'KETTLE', 'TOASTER', 'BLENDER', 'OVEN', 'SKILLET', 'COLANDER', 'GRATER', 'TEAPOT', 'APRON', 'TONGS', 'SAUCEPAN', 'FORK', 'SPOON', 'PLATE', 'BOWL', 'MIXER', 'CUTLERY'],
  },
  {
    id: 'safari',
    name: 'Safari and Jungle',
    words: ['ELEPHANT', 'GIRAFFE', 'ZEBRA', 'LION', 'TIGER', 'CHEETAH', 'LEOPARD', 'RHINO', 'HIPPO', 'GORILLA', 'MONKEY', 'PARROT', 'TOUCAN', 'PYTHON', 'JAGUAR', 'MEERKAT', 'BUFFALO', 'ANTELOPE', 'CROCODILE', 'BABOON'],
  },
  {
    id: 'transport',
    name: 'On the Move',
    words: ['TRAIN', 'BICYCLE', 'SCOOTER', 'AIRPLANE', 'HELICOPTER', 'SUBMARINE', 'TRAM', 'FERRY', 'CANOE', 'TRUCK', 'TRACTOR', 'BUS', 'TAXI', 'YACHT', 'GONDOLA', 'MONORAIL', 'SAILBOAT', 'WAGON', 'SLED', 'BALLOON'],
  },
  {
    id: 'camping',
    name: 'Camping Trip',
    words: ['TENT', 'CAMPFIRE', 'LANTERN', 'COMPASS', 'BACKPACK', 'HIKING', 'TRAIL', 'CANTEEN', 'FLASHLIGHT', 'MAP', 'CABIN', 'FOREST', 'RIVER', 'KINDLING', 'BINOCULARS', 'TARP', 'ROPE', 'MOUNTAIN', 'STARS', 'HAMMOCK'],
  },
  {
    id: 'colors',
    name: 'Colour Palette',
    words: ['CRIMSON', 'SCARLET', 'AMBER', 'INDIGO', 'VIOLET', 'TURQUOISE', 'MAGENTA', 'LAVENDER', 'MAROON', 'OLIVE', 'TEAL', 'BEIGE', 'IVORY', 'CORAL', 'SILVER', 'GOLD', 'BRONZE', 'CHARCOAL', 'EMERALD', 'SAPPHIRE'],
  },
  {
    id: 'bakery',
    name: 'Bakery Window',
    words: ['BREAD', 'MUFFIN', 'CROISSANT', 'BAGEL', 'SCONE', 'PRETZEL', 'DONUT', 'CUPCAKE', 'BROWNIE', 'COOKIE', 'PIE', 'TART', 'ECLAIR', 'BAGUETTE', 'BISCUIT', 'PASTRY', 'FLOUR', 'DOUGH', 'WAFFLE', 'PANCAKE'],
  },
  {
    id: 'bugs',
    name: 'Creepy Crawlies',
    words: ['BEETLE', 'BUTTERFLY', 'LADYBUG', 'DRAGONFLY', 'CRICKET', 'ANT', 'BEE', 'MOTH', 'WASP', 'HORNET', 'FIREFLY', 'TERMITE', 'MOSQUITO', 'CICADA', 'MANTIS', 'APHID', 'WEEVIL', 'EARWIG', 'LOCUST', 'SPIDER'],
  },
  {
    id: 'school',
    name: 'Back to School',
    words: ['PENCIL', 'ERASER', 'RULER', 'NOTEBOOK', 'BACKPACK', 'TEACHER', 'LIBRARY', 'SCIENCE', 'HISTORY', 'RECESS', 'CRAYON', 'MARKER', 'GLOBE', 'LESSON', 'CALCULATOR', 'DESK', 'CHALK', 'HOMEWORK', 'SPELLING', 'ATLAS'],
  },
];
