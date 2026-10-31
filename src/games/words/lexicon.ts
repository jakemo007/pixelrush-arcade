import { FIVE_LETTER_WORDS } from './five-letter';

const THREE = `
ace act add ado age ago aid ail aim air ale all and ant any ape apt arc
are ark arm art ash ask ate awe axe aye bad bag ban bar bat bay bed bee
beg bet bib bid big bin bit boa bob bog boo bow box boy bud bug bun bus
but buy bye cab can cap car cat cod cog cop cot cow coy cry cub cue cup
cur cut dab dad dam day den dew did die dig dim din dip doe dog don dot
dry due dug dye ear eat ebb eel egg ego elf elk elm emu end era eve ewe
eye fad fan far fat fax fed fee few fig fin fir fit fix flu fly foe fog
for fox fry fun fur gab gag gal gap gas gel gem get gig gnu got gum gun
gut guy gym had ham has hat hay hen her hew hey hid him hip his hit hog
hop hot how hub hue hug hum hut ice icy ill imp ink inn ion ire irk its
ivy jab jam jar jaw jay jet jig job jog jot joy jug jut keg key kid kin
kit lab lad lag lap law lax lay led leg let lid lie lip lit log lot low
lug mad man map mat maw may men met mid mix mob mom mop mud mug mum nab
nag nap net new nib nil nip nod nor not now nun nut oak oar oat odd ode
off oft oil old one opt orb ore our out owe owl own pad pal pan par pat
paw pay pea peg pen pep per pet pew pie pig pin pit ply pod pop pot pro
pry pub pug pun pup put rag ram ran rap rat raw ray red rib rid rig rim
rip rob rod roe rot row rub rug run rut rye sad sag sap sat saw say sea
see set sew she shy sip sir sit six ski sky sly sob sod son sow soy spa
spy sty sub sue sum sun sup tab tad tag tan tap tar tax tea tee ten the
thy tie tin tip toe ton too top tot tow toy try tub tug two urn use van
vat vet vex via vie vow wad wag war was wax way web wed wee wet who why
wig win wit woe wok won woo wow yak yam yap yaw yes yet yew you zap zen
zip zoo
`;

const FOUR = `
able ache acid acne acre acts aged ages aide aids aims airy ajar akin alas ally aloe also
alto amid ants apex aqua arch area aria arid arms army arts atom aunt aura auto avid away
awed awry axes axis axle baby back bade bags bail bait bake bald bale ball balm band bang
bank bare bark barn base bash bass bath bead beak beam bean bear beat beef been beep beer
bees beet bell belt bend bent best bias bike bill bind bird bite blew blob blog blot blow
blue blur boar boat body boil bold bolt bomb bond bone book boom boon boot bore born boss
both bout bowl brag bran brat bred brew brim brow buck buds buff bugs bulb bulk bull bump
bunk buns buoy burn burp bury bush bust busy buys buzz cafe cage cake calf call calm came
camp cane cape card care cars cart case cash cast cave cell cent chap chat chef chew chin
chip chop cite city clad clam clan clap claw clay clip clog clot club clue coal coat coax
code coil coin cola cold colt comb come cone cook cool coop cope copy cord core cork corn
cost cozy crab crew crib crop crow cube cuff cull cult curb curd cure curl cute dame damp
dare dark darn dart dash data date dawn days daze dead deaf deal dean dear debt deck deed
deem deep deer deft defy demo dent deny desk dial dice died diet digs dime dine dire dirt
disc dish disk dive dock doer does dogs dole doll dome done doom door dose dote dots dove
down doze drab drag draw drew drip drop drum dual duck duct dude duel dues duet duke dull
duly dumb dump dune dusk dust duty each earl earn ears ease east easy eats echo edge edgy
edit eels eggs else emit envy epic even ever evil exam exit eyed eyes face fact fade fail
fair fake fall fame fang fare farm fast fate fawn faze fear feat feed feel fees feet fell
felt fend fern feud figs file fill film find fine fire firm fish fist five fizz flag flak
flap flat flaw flax flea fled flee flew flex flip flit floe flog flop flow flue flux foal
foam foes fold folk fond font food fool foot ford fore fork form fort foul four fowl foxy
fray free fret frog from fuel full fume fund funk furl fury fuse fuss fuzz gain gait gala
gale gall game gang gape garb gash gasp gate gave gaze gear geek gems gene germ gift gild
gill gilt girl gist give glad glee glen glib glow glue glum glut gnat gnaw goad goal goat
goes gold golf gone gong good goof gore gory gosh gown grab gram gray grew grey grid grim
grin grip grit grow grub gulf gull gulp gums gush gust guts hack hail hair hale half hall
halo halt hand hang hard hare harm harp hash hate haul have hawk haze hazy head heal heap
hear heat heed heel heft heir held helm help hems herb herd here hero hers hide high hike
hill hilt hind hint hire hiss hive hoax hold hole holy home hone honk hood hoof hook hoop
hoot hope horn hose host hour howl hubs huge hulk hull hump hums hung hunk hunt hurl hurt
hush husk hymn icon idea idle idol inch info into iron isle itch item jabs jack jade jail
jamb jams jars jaws jazz jeep jeer jest jets jive jobs jogs join joke jolt jots joys judo
jugs jump junk jury just keel keen keep kelp kept keys kick kids kill kiln kilo kilt kind
king kiss kite kits kiwi knee knew knit knob knot know lace lack lacy lady laid lair lake
lamb lame lamp land lane lard lark lash last late lava lawn laws lazy lead leaf leak lean
leap leek left lend lens lent less lest liar lice lick lids lied lies lieu life lift like
lilt lily limb lime limp line link lint lion lips lisp list live load loaf loam loan lobe
lock loft logo logs lone long look loom loop loot lord lore lose loss lost lots loud love
lows luck lull lump lung lure lurk lush lute lynx made maid mail main make male mall malt
mane many maps mare mark mart mash mask mass mast mate math maze meal mean meat meek meet
meld melt memo mend menu meow mere mesh mess mica mice mild mile milk mill mime mind mine
mini mink mint mist mite mitt moan moat mock mode mold mole molt monk mood moon moor moot
mope more moss most moth move much muck muff mule mull muse mush musk must mute myth nail
name nape navy near neat neck need neon nerd nest news newt next nice nick nine node none
nook noon norm nose note noun null numb nuts oaks oars oath oats obey odds odor ogle ogre
oils oily okay omen omit once ones only onto onus ooze opal open opts oral orbs ores ouch
ours oust outs oval oven over owed owes owls owns pace pack pact pads page paid pail pain
pair pale palm pane pang pans pant papa park part pass past path pave pawn paws peak peal
pear peas peat peck peek peel peep peer pegs pelt pens perk pert pest pets pews pick pier
pies pigs pike pile pill pine ping pink pins pint pipe pity plan play plea plod plop plot
plow ploy plug plum plus pods poem poet poke pole poll polo pond pony pool poor pore port
pose posh post posy pots pour pout pram pray prey prim prod prom prop prow puck puff pull
pulp puma pump punk puns pure purr push puts quay quip quit quiz race rack raft rage rags
raid rail rain rake ramp rang rank rant rare rash rate rave rays raze read real ream reap
rear reed reef reek reel rein rely rent rest ribs rice rich ride rife rift rind ring rink
riot ripe rise risk rite road roam roar robe rock rode role roll romp roof rook room root
rope rose rosy rote rout rove rows ruby rude rued rugs ruin rule rump rune rung runs runt
ruse rush rust sack safe saga sage said sail sake sale salt same sand sane sang sank sash
sate save sawn says scab scam scan scar seal seam sear seas seat sect seed seek seem seen
seep self sell semi send sent sets sewn shed shin ship shoe shoo shop shot show shun shut
sick side sift sigh sign silk sill silo silt sing sink sips sire site sits size skew skid
skim skin skip skis skit slab slam slap slat slaw sled slew slid slim slip slit slog slop
slot slow slug slum slur smog snag snap snip snob snow snub snug soak soap soar sobs sock
soda sofa soft soil sold sole solo some song soon soot sore sort soul soup sour sown soya
span spar spat spec sped spin spit spot spry spud spun spur stab stag star stay stem step
stew stir stop stow stub stud stun such suds suit sulk sumo sums sung sunk suns sure surf
swab swam swan swap swat sway swig swim tabs tack taco tact tags tail take tale talk tall
tame tang tank tape taps tarp tart task taxi teak teal team tear teas teem teen tees tell
temp tend tens tent term test text than that thaw them then they thin this thud thug thus
tick tide tidy tied tier ties tile till tilt time tint tiny tips tire toad toed toes tofu
toga toil told toll tomb tome tone tong tons took tool toot tops tore torn toss tote tour
tout town toys tram trap tray tree trek trim trio trip trod trot true tuba tube tuck tuft
tuna tune turf turn tusk tutu twig twin twos type typo ugly undo unit unto upon urge used
user uses vain vale vane vary vase vast veal veer veil vein vent verb very vest veto vets
vial vibe vice view vile vine visa void vole volt vote vows wade waft wage wail wait wake
walk wall wand wane want ward ware warm warn warp wart wary wash wasp watt wave wavy waxy
ways weak wean wear weed week weep weld well welt went wept were west wets wham what when
whet whey whim whip whir whiz whoa whom wick wide wife wigs wild will wilt wily wind wine
wing wink wins wipe wire wiry wise wish wisp with wits woes woke wolf womb wood woof wool
word wore work worm worn wove wrap wren writ yaks yams yank yard yarn yawn year yell yelp
yeti yoga yogi yoke yolk your yowl zany zeal zero zest zinc zing zone zoom
`;

export const THREE_LETTER_WORDS: readonly string[] = THREE.trim().split(/\s+/);
export const FOUR_LETTER_WORDS: readonly string[] = FOUR.trim().split(/\s+/);

let lexicon: Set<string> | null = null;

export function crosswordLexicon(): ReadonlySet<string> {
  lexicon ??= new Set([...THREE_LETTER_WORDS, ...FOUR_LETTER_WORDS, ...FIVE_LETTER_WORDS]);
  return lexicon;
}
