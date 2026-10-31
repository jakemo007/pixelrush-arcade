import { createRng } from '@/lib/utils/random';

const SOURCE = `
about above actor acute adapt admit adopt adore adult after again agent agile agree
ahead alarm album alert alien align alike alive allow alone along aloud alpha alter
amaze amber amble amend ample amuse angel anger angle ankle anvil apart apple apply
apron arbor arena argue arise armor aroma arrow aside asset atlas attic audio audit
avoid await awake award aware awoke bacon badge bagel baker balmy banjo barge baron
basic basil basin batch baton bayou beach beard beast beefy begin beige being belly
bench bento berry birch birth bison black blade blame bland blank blast blaze bleak
blend bless blimp blind blink bliss blitz block blond bloom blown bluff blunt blurb
blush board boast bongo bonus boost booth bough bound boxer brace braid brain brake
brand brass brave bravo brawn bread break breed briar brick bride brief brine bring
brink brisk broad broil broke brood brook broom broth brown brush buddy budge bugle
build built bulky bunch bunny burly burst butte buyer cabin cable cacao cadet camel
cameo canal candy canoe caper carat cargo carol carry carve catch cater cause cedar
chain chair chalk champ chant chaos charm chart chase cheap check cheek cheer chess
chest chick chief child chili chill chime chimp chirp chive choir chomp chord chore
chunk cider cinch civic civil claim clamp clank clash clasp class clean clear clerk
click cliff climb cling cloak clock close cloth cloud clove clown cluck coach coast
cobra cocoa colon color comet comfy comic conch condo coral corgi couch cough count
court cover crack craft crane crash crate crawl crazy cream creek crepe crest crimp
crisp croak crook cross crowd crown crumb crush crust cubic cumin cupid curio curly
curry curve cycle daily dairy daisy dance daunt dealt decal decay decor decoy delay
delta delve denim dense depot depth derby detox diary digit diner dingy disco ditch
ditto diver dizzy dodge doing dolly donor donut dough dowel dozen draft drain drake
drama drank drape drawl drawn dread dream dress dried drift drill drink drive droll
drone droop drove duvet dwarf dwell eager eagle early earth easel eaten ebony elbow
elder elect elfin elite elope email ember emcee empty enjoy enter entry epoch equal
equip erase error essay ethic event every evoke exact exist extra exult fable facet
faint fairy faith false fancy feast fence feral ferry fetch fever fiber field fiery
fifth fifty final finch first flair flake flaky flame flank flash flask fleet flick
fling flint float flock flood floor flora flour fluid flume flute foamy focus foggy
folly force forge forte forth forty forum found frame fresh fried frisk frock frond
frost froth froze fruit fudge fully fungi funny furry gauge gavel gawky gecko giant
given gizmo glade glare glass glaze gleam glide glint gloat globe gloom glory glove
gnome goose gourd grace grade grail grain grand grant grape graph grasp grass grave
gravy great green greet grill grind groom group grove growl grown gruel gruff guard
guava guess guest guide gusto gusty habit happy harsh haste hasty hatch haunt haven
hazel heart heavy hedge hefty heist helix hello hence heron hinge hippo hobby hoist
holly honey honor horse hotel hound house hover human humid humor hurry husky hyena
icing ideal igloo image index inlet inner input irony issue ivory jaunt jazzy jelly
jewel jiffy joint joker jolly joust judge juice jumbo kayak kebab kiosk kitty knack
knead kneel knife knock known koala label labor ladle lanky lapel large larva laser
lasso latch later latte laugh layer leafy learn lease least leave ledge lemon lemur
level lever light lilac limit linen liner liver llama lobby local lodge lofty logic
loose lotus lower loyal lucky lunar lunch lunge lurch lyric macaw macro magic major
maker mambo mango manor maple march marsh match mauve maxim mayor meant medal media
melon mercy merge merit merry metal meter midst might mimic minor minty mirth mixer
mocha model moist money month moody moose moral mossy motif motor motto mound mount
mouse mouth movie muddy mulch mural music nacho naive nasal naval nerdy nerve never
newly niche nifty night ninja noble noise nomad north notch novel nudge nurse nutty
nylon oaken oasis ocean octet offer often olive omega onion opera optic orbit order
organ other otter ounce outdo outer owlet oxide ozone paint panda panel panic pansy
paper parka parry party pasta paste patch patio pause peace peach pearl pecan pedal
penny peony perch perky pesto petal phase phone photo piano piece piety pilot pinch
pitch pivot pixel pixie pizza place plaid plain plane plank plant plate plaza pluck
plumb plume plump plush point poise polar polka pooch poppy porch pouch pound power
prawn press price pride prime primp print prism prize probe prong proof proud prove
prowl prune pulse punch pupil puppy purse quack quail quake quart queen query quest
quick quiet quill quilt quirk quite quota quote radar radio rainy raise rally ranch
range rapid raven reach react ready realm rebel recap refer regal reign relax relay
relic remix renew reply retro rhino rhyme ridge right rigid rinse ripen risky rival
river roast robin robot rocky rodeo roost rough round route rowdy royal rugby ruler
rumba rumor rural rusty sable salad salon salsa salty sandy sassy satin sauce saucy
sauna savor savvy scald scale scaly scamp scarf scene scent scone scoop scoot scope
score scout scowl scrap scrub scuba sedan sense serve setup seven shade shady shake
shaky shape share shark sharp shawl sheep sheet shelf shell shift shine shiny shirt
shoal shock shore short shout shown shrew shrub shrug sight silky silly since siren
sixth sixty skate skill skirt skunk slant slate sleek sleep sleet slice slide slope
sloth small smart smell smile smirk smock smoke snack snail snake snare sneak sniff
snore snout snowy sober solar solid solve sonic sorry sound south space spade spare
spark spawn speak spear speed spell spend spice spicy spike spine spool spoon spore
sport spray sprig spunk squad squat squid stack staff stage stair stamp stand stare
start state steak steam steel steep stern stick still sting stock stoic stomp stone
stool stork storm story stout stove straw stray strip strut study stuff stunt style
suave sugar sunny super surge swamp swarm sweep sweet swift swing swoop sword synth
syrup tabby table taffy taken tango tasty tawny teach tempo tenth tepid thank theme
thick thing think third thorn three thumb tiara tiger tight timer title toast today
token tonic topaz topic torch torso total totem touch tough towel tower trace track
trade trail train trawl treat trend trial tribe trick troll trout trove truck truly
trunk trust truth tubby tulip tummy tunic turbo tutor tweak tweed twice twins twirl
twist udder ultra uncle under unify union unite unity until upper urban usage usual
vague valid valor value valve vapor vault vegan venue verse verve video vigil vigor
villa vinyl viola visit visor vista vital vivid vixen vocal vogue voice vowel wafer
wagon waist waltz watch water weary weave wedge whale wharf wheat wheel where which
whiff while whirl whisk white whole widen width windy witty woken woman world worry
worth would woven wrist write wrong yacht yearn yeast yield yodel yokel young youth
zebra zesty
`;

export const ANSWER_SEED = 0x5eed_0b0b;

export const ANSWER_SOURCE: readonly string[] = SOURCE.trim().split(/\s+/);

function shuffled(words: readonly string[], seed: number): string[] {
  const rng = createRng(seed);
  const out = [...words];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export const ANSWERS: readonly string[] = shuffled(ANSWER_SOURCE, ANSWER_SEED);
