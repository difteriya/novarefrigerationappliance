/* Static site generator for Nova Refrigeration & Appliance Repair
 * Run: node build.js
 * Outputs plain static HTML into the project root (index.html, services/, areas/, ...).
 * All content is sourced from nova.txt. Contact details are PLACEHOLDERS — search
 * for the values in the CONFIG block below and replace them with the real ones. */

const fs = require("fs");
const path = require("path");

/* ----------------------------------------------------------------------- */
/* CONFIG — replace these placeholders with real business details          */
/* ----------------------------------------------------------------------- */
const CONFIG = {
  name: "Nova Refrigeration & Appliance Repair",
  shortName: "Nova Appliance Repair",
  phoneDisplay: "(512) 740-0408",          // real phone
  phoneTel: "+15127400408",                 // real phone (E.164)
  smsBody: "Hi Nova, I need appliance repair service.",
  email: "info@novarefrigerationappliance.com", // TODO: real email
  cityState: "Austin, Texas",
  hours: "Mon–Sat: 7:00 AM – 7:00 PM",
  domain: "novarefrigerationappliance.com",
  mapQuery: "Austin, Texas",
  // Web3Forms access key — get a free one (no login) at https://web3forms.com
  // by entering the email where you want submissions delivered, then paste it here.
  web3formsKey: "3e3a576c-d904-49e5-871f-ee45dd499aa2",
};

/* ----------------------------------------------------------------------- */
/* DATA (from nova.txt)                                                    */
/* ----------------------------------------------------------------------- */
const SERVICES = [
  {
    slug: "refrigerator-repair",
    name: "Refrigerator Repair",
    icon: "❄️",
    blurb: "Fridge not cooling, leaking, or making noise? We diagnose and fix all refrigerator problems fast.",
    metaDesc: "Same-day refrigerator repair in Austin, TX. Not cooling, leaking or noisy — built-in and sealed-system specialists. Call (512) 740-0408.",
    intro: "A failing refrigerator can spoil hundreds of dollars in food in a matter of hours. Our technicians repair every major refrigerator brand and problem, often the same day.",
    issues: ["Not cooling", "Warm refrigerator section", "Warm freezer section", "Ice buildup / defrost issues", "Water leaks", "Noisy operation", "Temperature control issues", "Control board replacement", "Fan motor replacement", "Sensor replacement", "Thermostat replacement"],
  },
  {
    slug: "ice-maker-repair",
    name: "Ice Maker Repair",
    icon: "🧊",
    blurb: "No ice, slow ice, or an overflowing ice maker? We get it producing again.",
    metaDesc: "Ice maker repair in Austin, TX. No ice, slow ice or overflowing? We fix hard-water scale, fill valves and dispenser freeze-ups. Call (512) 740-0408.",
    intro: "From built-in ice makers to refrigerator dispensers, we repair the assemblies, valves, and controls that keep the ice flowing.",
    issues: ["No ice production", "Slow ice production", "Overflowing ice maker", "Ice dispenser issues", "Water valve replacement", "Ice maker assembly replacement"],
  },
  {
    slug: "freezer-repair",
    name: "Freezer Repair",
    icon: "🥶",
    blurb: "Freezer not freezing or building up frost? Protect your frozen goods with a fast repair.",
    metaDesc: "Freezer repair in Austin, TX. Not freezing, frost buildup or running warm — chest, upright and built-in freezers. Same-day service available.",
    intro: "Whether it's a stand-alone freezer or the freezer compartment of your fridge, we restore proper temperatures and stop frost problems at the source.",
    issues: ["Not freezing", "Excessive frost buildup", "Temperature fluctuations", "Door seal issues"],
  },
  {
    slug: "washer-repair",
    name: "Washer Repair",
    icon: "🌀",
    blurb: "Washer won't drain, spin, or start? We repair top-load and front-load washers.",
    metaDesc: "Washer repair in Austin, TX. Won't drain, spin or start? Front-load and top-load repair on all major brands. Same-day appointments available.",
    intro: "A broken washer disrupts the whole household. We diagnose error codes, leaks, and mechanical failures and get your laundry moving again.",
    issues: ["Not draining", "Not spinning", "Not starting", "Control board issues", "Water leaks", "Error codes"],
  },
  {
    slug: "dryer-repair",
    name: "Dryer Repair",
    icon: "🔥",
    blurb: "Dryer not heating or taking forever? Gas and electric dryer repair, including vent issues.",
    metaDesc: "Dryer repair in Austin, TX. No heat, long cycles or vent problems — gas and electric dryers, all major brands. Call (512) 740-0408.",
    intro: "A dryer that won't heat is often a quick fix — and a safety concern when vents are clogged. We service gas and electric dryers and address ventilation problems.",
    issues: ["Not heating", "Long drying times", "Won't start", "Thermal fuse replacement", "Heating element replacement", "Gas dryer repair", "Ventilation-related issues"],
  },
  {
    slug: "dishwasher-repair",
    name: "Dishwasher Repair",
    icon: "🍽️",
    blurb: "Dishes not getting clean or water pooling at the bottom? We fix it.",
    metaDesc: "Dishwasher repair in Austin, TX. Standing water, poor cleaning or leaks — including panel-ready and integrated units. Same-day service.",
    intro: "From clogged pumps to failed control boards and leaks, we restore your dishwasher to spotless, leak-free performance.",
    issues: ["Not cleaning properly", "Not draining", "Water leaks", "Control board replacement", "Pump replacement"],
  },
  {
    slug: "oven-repair",
    name: "Oven & Range Repair",
    icon: "🔆",
    blurb: "Oven not heating or heating unevenly? Gas and electric oven & range repair.",
    metaDesc: "Oven and range repair in Austin, TX. Not heating, uneven baking or igniter faults — gas, electric and dual-fuel. Call (512) 740-0408.",
    intro: "Don't let a broken oven ruin dinner. We repair gas and electric ovens and ranges — from ignition problems to uneven baking and control issues.",
    issues: ["Not heating", "Uneven heating", "Ignition problems", "Control board issues", "Temperature sensor replacement", "Gas and electric ovens"],
  },
  {
    slug: "cooktop-repair",
    name: "Cooktop Repair",
    icon: "🍳",
    blurb: "Burner or igniter trouble on your cooktop? We repair gas and electric cooktops.",
    metaDesc: "Cooktop repair in Austin, TX. Burner, igniter and element faults on gas, electric and induction cooktops. Same-day appointments available.",
    intro: "We fix burner, igniter, switch, and gas valve problems on gas and electric cooktops so every burner lights and heats the way it should.",
    issues: ["Burner issues", "Igniter problems", "Switch replacement", "Gas valve replacement"],
  },
  {
    slug: "microwave-repair",
    name: "Microwave Repair",
    icon: "📻",
    blurb: "Microwave not heating or door not latching? We repair built-in and OTR microwaves.",
    metaDesc: "Microwave repair in Austin, TX. Not heating, door latch faults or turntable problems — built-in and over-the-range units. Call (512) 740-0408.",
    intro: "We repair over-the-range and built-in microwaves — heating problems, door and switch failures, and control board faults.",
    issues: ["Door issues", "Heating issues", "Switch replacement", "Control board repair"],
  },
];

const SPECIALIZED = [
  {
    name: "Sealed System Refrigeration Repair",
    intro: "Sealed-system work is the most technical refrigeration repair there is — and a specialty of ours.",
    issues: ["Compressor replacement", "Refrigerant leak diagnosis", "Leak repair", "Filter drier replacement", "System evacuation and recharge", "Capillary tube restrictions", "Sealed system rebuilds"],
  },
  {
    name: "Built-In Refrigerator Repair",
    intro: "Specialized experience with high-end built-in refrigeration brands.",
    issues: ["Sub-Zero", "Thermador", "Viking", "Bosch", "GE Monogram"],
  },
];

const BRANDS = ["Samsung","LG","Whirlpool","Maytag","KitchenAid","GE Appliances","Frigidaire","Electrolux","Bosch","Thermador","Sub-Zero","Viking","JennAir","Wolf"];

/* Per-city content. Everything below the slug/name is unique to that city so
 * the area pages are genuinely distinct pages rather than one template with a
 * name swapped in — see the SEO notes in README.md. */
const AREAS = [
  {
    slug: "austin", name: "Austin", county: "Travis County",
    title: "Austin Appliance Repair, TX | Nova Refrigeration",
    desc: "Same-day appliance and refrigerator repair across Austin, from Hyde Park bungalows to downtown condos. All major brands. Call (512) 740-0408.",
    heroSub: "From 1950s bungalows in Hyde Park to downtown high-rises — repair anywhere inside the city, often the same day.",
    intro: "Austin is really a dozen housing markets in one city, and the appliances tell the story. A 1954 bungalow in Crestview, a 2018 condo off Rainey Street and a Mueller row house each fail in completely different ways, and each needs a different fix. We work across all of them, from central Austin out to the far edges of the city limits.",
    homesH2: "Older central Austin kitchens",
    homes: "Kitchens in Hyde Park, Travis Heights, Allandale and North Loop were laid out decades before 36-inch French-door refrigerators existed. Squeezing a modern unit into a tight galley leaves the condenser almost no room to breathe, and the first symptom is a fridge that runs constantly and still sits at 45&deg;F. Before condemning a compressor we check clearances, condenser airflow and the condenser fan — in older homes that is the fault far more often than the sealed system.",
    condoH2: "Condos, lofts and stacked laundry",
    condo: "Downtown, Rainey and East Riverside buildings are full of counter-depth and panel-ready refrigerators and stacked washer-dryer closets. Those closets run short, tightly bent vent runs that pack with lint fast, which is why a downtown dryer usually fails on heat rather than on the drum. We work with building management on loading dock and elevator access so a service call does not turn into a wasted afternoon.",
    commonH2: "What we get called for most in Austin",
    common: [
      ["Refrigerator running warm in a tight cabinet", "Restricted condenser airflow, a failed condenser fan, or a defrost system that iced over."],
      ["Stacked dryer with no heat", "Lint-packed short vent runs in condo laundry closets, plus failed thermal fuses and heating elements."],
      ["Dishwasher retrofitted into an older kitchen", "Drain loops, disposal knockouts and inlet valves that were never installed right in the first place."]
    ],
    waterH2: "Austin water and your ice maker",
    water: "Austin Water is moderately hard, and over several years that mineral load shows up as slow or hollow ice cubes, cloudy dishwasher glassware and scaled heating elements. When we diagnose an ice maker here we always check the fill valve and water line for scale before quoting a new ice maker assembly.",
    hoods: ["Hyde Park", "Crestview", "Allandale", "North Loop", "Travis Heights", "Zilker", "Barton Hills", "Mueller", "East Austin", "South Congress", "Downtown", "Riverside", "Windsor Park", "Brentwood"],
    faqs: [
      ["Do you service downtown Austin condo buildings?", "Yes. We regularly work in downtown, Rainey Street and East Riverside buildings. Let us know at booking if your building requires a certificate of insurance, loading dock reservation or elevator booking and we will coordinate it with management before the visit."],
      ["How quickly can you reach central Austin?", "Central Austin is our shortest drive, so same-day slots are usually available if you call in the morning. Traffic on I-35 and MoPac is the main variable, and we give you a call-ahead window rather than an all-day one."]
    ]
  },
  {
    slug: "round-rock", name: "Round Rock", county: "Williamson County",
    title: "Round Rock Appliance Repair, TX | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Round Rock, TX. Hard-water ice maker and dishwasher specialists for Teravista, Forest Creek and Behrens Ranch.",
    heroSub: "Same-day repair across Round Rock — and the hard-water experience that Williamson County kitchens need.",
    intro: "Most of Round Rock went up between the mid-1990s and the late 2000s, which means an entire city of appliances is now hitting the 15-to-25 year mark at roughly the same time. Teravista, Forest Creek, Behrens Ranch and Paloma Lake all call us for the same handful of failures, and after enough of them you learn which ones are worth fixing and which are not.",
    homesH2: "Appliances aging out together",
    homes: "A side-by-side refrigerator installed when a Behrens Ranch home was built has been running non-stop for two decades. At that age the honest question is not whether we can fix it but whether you should — a control board or a defrost heater is usually worth it, while a failed compressor on a base-model unit rarely is. We give you the part cost and the realistic remaining life before you decide, not after.",
    condoH2: "Two-story homes and long vent runs",
    condo: "Round Rock floor plans often put the laundry upstairs or on an interior wall, which means dryer vents that run fifteen feet or more with several elbows before they reach daylight. Those runs choke with lint far faster than a short exterior wall vent, and the dryer shows it as long cycles and clothes that come out damp. We check the full run, not just the lint trap.",
    commonH2: "The Round Rock repair list",
    common: [
      ["Ice maker producing little or no ice", "Scale in the fill valve and water line — by far the most common call we get in Williamson County."],
      ["Dishwasher leaving a white film", "Hard-water mineral buildup on spray arms and the heating element, often mistaken for a failed pump."],
      ["Dryer taking two cycles to dry", "Restricted long vent runs in two-story floor plans, plus worn heating elements."]
    ],
    waterH2: "Williamson County hard water",
    water: "Round Rock water is hard enough that it is the single biggest cause of appliance failure we see here. Mineral scale builds inside ice maker fill valves, dishwasher spray arms and washing machine inlet screens, and it does it quietly over years. Descaling and a fill-valve replacement often restore an ice maker that a homeowner had already written off.",
    hoods: ["Teravista", "Forest Creek", "Behrens Ranch", "Paloma Lake", "Stone Oak", "Sonoma", "Chandler Creek", "Mayfield Ranch", "Vista Oaks", "Greenhawe"],
    faqs: [
      ["Is it worth repairing a 15-year-old refrigerator?", "Often yes. Control boards, defrost heaters, fan motors and door gaskets are inexpensive relative to a new unit and can add years. A failed compressor or a refrigerant leak on a base-model refrigerator is where we usually tell homeowners to put the money toward a replacement instead."],
      ["Why does my ice maker keep failing in Round Rock?", "Hard water. Mineral scale narrows the fill valve until the ice maker underfills, which produces small, hollow or infrequent cubes. Replacing the ice maker without addressing the valve and line means the new one fails the same way."]
    ]
  },
  {
    slug: "cedar-park", name: "Cedar Park", county: "Williamson County",
    title: "Cedar Park Appliance Repair, TX | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Cedar Park, TX — including garage refrigerators that quit in the Texas summer heat. Same-day service available.",
    heroSub: "Repair across Cedar Park, from Buttercup Creek to Twin Creeks — including the garage fridge that quits every July.",
    intro: "Cedar Park is family-sized homes on family-sized schedules, which is why most of our calls here are about the two appliances a household cannot go a day without: the refrigerator and the washer. The city built out heavily through the 2000s, so Buttercup Creek, Cypress Canyon and Ranch at Brushy Creek are all working through the same generation of appliances.",
    homesH2: "The garage refrigerator problem",
    homes: "Almost every Cedar Park home has a second refrigerator in the garage, and almost every one of them struggles from June through September. A standard refrigerator is designed to work in a room below roughly 110&deg;F — an uninsulated Central Texas garage goes well past that, and the compressor short-cycles until the freezer thaws. Sometimes the fix is a repair; sometimes the honest answer is that the unit needs to be garage-rated. We will tell you which.",
    condoH2: "Front-load laundry in daily use",
    condo: "Cedar Park households run laundry hard, and front-load washers here fail on drain pumps and door boots long before anything else. A coin or a hairpin in the drain pump is a same-visit fix. A torn boot that has been leaking quietly behind the machine is a bigger job, and catching it early is the difference between a gasket and a floor.",
    commonH2: "Common Cedar Park repairs",
    common: [
      ["Garage refrigerator freezing or thawing", "Ambient heat pushing a non-garage-rated unit past its design range, plus dirty condensers full of garage dust."],
      ["Front-load washer that will not drain", "Blocked drain pumps, clogged filters and worn door boots."],
      ["Oven that will not reach temperature", "Failed bake igniters on gas ranges and burnt-out elements or sensors on electric."]
    ],
    waterH2: "Hard water on the Williamson County side",
    water: "Cedar Park shares Williamson County water, so the same mineral scale that plagues Round Rock ice makers shows up here. If your dishwasher has started leaving grit on the bottom rack or your refrigerator water tastes flat, the fix is usually in the fill valve, the filter and the spray arms rather than in the appliance itself.",
    hoods: ["Buttercup Creek", "Ranch at Brushy Creek", "Cypress Canyon", "Twin Creeks", "Forest Oaks", "Whitestone", "Silverado West", "Anderson Mill West", "Carriage Hills"],
    faqs: [
      ["Why does my garage refrigerator stop working every summer?", "Standard refrigerators are rated for ambient temperatures up to about 110&deg;F. A Central Texas garage exceeds that on a July afternoon, so the compressor runs constantly, the freezer section warms and the unit can shut down entirely. We clean the condenser and check the controls first, then tell you honestly whether the unit can survive another summer."],
      ["Can you repair a washer and a refrigerator in the same visit?", "Yes, and we would rather do that than charge you two trips. Tell us about every appliance that is acting up when you book and we will bring parts for both."]
    ]
  },
  {
    slug: "georgetown", name: "Georgetown", county: "Williamson County",
    title: "Georgetown Appliance Repair, TX | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Georgetown, TX, including Sun City, Wolf Ranch and Berry Creek. Hard-water specialists. Call (512) 740-0408.",
    heroSub: "Repair across Georgetown — Sun City, Wolf Ranch, Berry Creek and the historic square.",
    intro: "Georgetown covers two very different worlds: the single-story Sun City homes north of the river, and the older houses around the historic courthouse square and Berry Creek. Sun City alone is thousands of homes whose original builder appliances are now well past a decade old, and its residents overwhelmingly want those appliances repaired rather than replaced.",
    homesH2: "Sun City and repair-first homeowners",
    homes: "Sun City households call us because a working appliance today beats a delivery date three weeks out. That suits how we work: we carry the parts that fail most on 2000s and 2010s builder-installed appliances, we quote before we start, and we do not push a replacement on a unit that has good years left. Single-story layouts also make access straightforward, which usually keeps the visit short.",
    condoH2: "Historic homes near the square",
    condo: "The older houses around the courthouse square and along University Avenue have kitchens that have been remodeled once or twice, and remodels leave traces — dishwashers plumbed without a high loop, ranges on undersized circuits, refrigerators pushed into alcoves with no rear clearance. We look at the installation as well as the appliance, because in these homes the install is often what is actually failing.",
    commonH2: "Frequent Georgetown calls",
    common: [
      ["Ice maker scaled shut", "Georgetown water is hard, and fill valves narrow with mineral deposits until ice production drops off."],
      ["Wall oven control board failures", "Common on the built-in wall ovens installed throughout Sun City in the 2000s."],
      ["Dishwasher not drying or heating", "Failed heating elements and thermostats, frequently combined with heavy scale."]
    ],
    waterH2: "Some of the hardest water in the metro",
    water: "Georgetown water carries a heavy mineral load, and appliances show it sooner here than almost anywhere else we work. Ice makers, dishwasher heating elements and washing machine inlet valves are the first casualties. If you have a whole-home softener, tell us — it changes the diagnosis, because a scaled part in a softened house usually points to a different underlying fault.",
    hoods: ["Sun City Texas", "Wolf Ranch", "Berry Creek", "Old Town", "Serenada", "River Ridge", "Cimarron Hills", "Georgetown Village", "Rivery Park"],
    faqs: [
      ["Do you service Sun City Georgetown?", "Yes, regularly. Sun City is one of the neighborhoods we visit most in Georgetown. We are used to the builder-installed appliance packages there and carry the parts that fail most often on them."],
      ["Will you tell me if an appliance is not worth repairing?", "Always, and before we start work. We quote the repair and give you an honest read on the remaining life of the unit. If the repair costs more than the appliance is worth, we say so — that call has kept us in business here."]
    ]
  },
  {
    slug: "pflugerville", name: "Pflugerville", county: "Travis County",
    title: "Pflugerville Appliance Repair, TX | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Pflugerville, TX. Smart and Wi-Fi appliance diagnostics for Blackhawk, Falcon Pointe and Highland Park.",
    heroSub: "Same-day repair across Pflugerville — including the smart appliances in newer Blackhawk and Falcon Pointe builds.",
    intro: "Pflugerville built out late, which makes it the newest-appliance city we serve. Blackhawk, Falcon Pointe, Highland Park and Avalon are full of French-door refrigerators with through-door ice and water, front-load laundry pairs and Wi-Fi connected ranges installed between 2010 and 2020. Newer does not mean trouble-free — it means the failures are electronic rather than mechanical.",
    homesH2: "Smart appliances and error codes",
    homes: "A connected refrigerator that pushes an error code to your phone has told you something is wrong, not what is wrong. We read the manufacturer diagnostic mode directly at the machine, which distinguishes a genuine sealed-system fault from a temperature sensor reporting nonsense. That matters, because a control board swap on a guess is an expensive way to not fix a refrigerator.",
    condoH2: "Through-door ice and water systems",
    condo: "The most common Pflugerville refrigerator call is a through-door ice dispenser that has stopped working. Ninety percent of the time the cause is a freeze-up in the dispenser chute or the fill tube rather than a dead ice maker — a repair measured in parts you can hold in one hand. We clear the freeze-up, find why it happened, and fix that too.",
    commonH2: "What fails in newer Pflugerville homes",
    common: [
      ["Ice dispenser frozen or jammed", "Fill tube and chute freeze-ups on French-door refrigerators, often from a warped door gasket."],
      ["Front-load washer error codes", "Drain pump faults, unbalanced-load errors and door lock assemblies."],
      ["Range or oven electronic control faults", "Touch panels and control boards on ranges installed in the last decade."]
    ],
    waterH2: "Water quality and filter cycles",
    water: "Pflugerville water is on the harder side, and the refrigerator water filter is the part homeowners forget. A filter left in past its cycle restricts flow enough to underfill the ice maker, which produces exactly the symptoms of a failing ice maker. We check the filter and the inlet valve before we quote anything larger.",
    hoods: ["Blackhawk", "Falcon Pointe", "Highland Park", "Avalon", "Springbrook", "Sorento", "Bohls Place", "Commons at Rowe Lane", "Windermere"],
    faqs: [
      ["Can you repair smart or Wi-Fi connected appliances?", "Yes. We run the manufacturer diagnostic routines on the appliance itself rather than relying on the app, which is the only way to tell a real fault from a sensor reporting incorrectly. We work on connected Samsung, LG, Whirlpool, GE and Bosch units."],
      ["My refrigerator app says there is an error — do I still need a technician?", "Usually yes. App error codes tell you which system reported a problem, not which component failed. The same code can point to a sensor, a fan, a defrost heater or a control board, and only one of those needs replacing."]
    ]
  },
  {
    slug: "lakeway", name: "Lakeway", county: "Travis County",
    title: "Lakeway Appliance Repair, TX | Nova Refrigeration",
    desc: "Built-in and high-end appliance repair in Lakeway, TX. Sub-Zero, Thermador, Viking and Wolf specialists serving Rough Hollow and Lakeway Highlands.",
    heroSub: "Built-in refrigeration, outdoor kitchens and high-end appliance repair across the Lake Travis area.",
    intro: "Lakeway homes are built around entertaining, and that shows up in the appliance list: built-in and column refrigeration, wine and beverage centers, second refrigerators at wet bars, and outdoor kitchens with their own ice makers. These are not the appliances a general handyman should be opening, and sealed-system work on them is exactly what we specialize in.",
    homesH2: "Built-in and column refrigeration",
    homes: "A built-in Sub-Zero, Thermador or Viking column is a sealed refrigeration system in a cabinet, and it is worth restoring rather than replacing — a replacement is a five-figure project involving cabinetry, not just an appliance delivery. We handle condenser cleaning, evaporator fan and defrost faults, door gaskets and hinge alignment, and sealed-system diagnosis on units that have been in place for fifteen or twenty years.",
    condoH2: "Outdoor kitchens and bar refrigeration",
    condo: "Outdoor ice makers, beverage centers and undercounter refrigerators live a hard life in Hill Country summers. Most of the failures we find are heat-related and preventable: condensers packed with cedar pollen and dust, restricted ventilation in a masonry surround, or an indoor-rated unit installed outdoors where it was never going to survive. We diagnose the installation as well as the appliance.",
    commonH2: "Typical Lakeway service calls",
    common: [
      ["Built-in refrigerator not holding temperature", "Condenser fouling, evaporator fan failures and defrost faults on Sub-Zero and Thermador built-ins."],
      ["Wine or beverage center running warm", "Compressor and thermostat faults, plus ventilation restricted by cabinetry."],
      ["Outdoor ice maker producing nothing", "Heat-related shutdowns, scaled water systems and condensers full of pollen and dust."]
    ],
    waterH2: "Hill Country dust and condenser care",
    water: "Cedar pollen and limestone dust are hard on refrigeration out here. A built-in condenser that has never been cleaned will run hot, shorten compressor life and eventually cost far more than the cleaning would have. On every built-in call we service the condenser as part of the visit and tell you how often it needs doing.",
    hoods: ["Rough Hollow", "Lakeway Highlands", "Flintrock Falls", "The Peninsula", "Lakeway Village", "Vineyard Bay", "Yacht Harbor", "Live Oak"],
    faqs: [
      ["Do you repair built-in Sub-Zero refrigerators in Lakeway?", "Yes — built-in and column refrigeration is our specialty. We are sealed-system trained and EPA certified, which is a legal requirement for handling refrigerant and something most general appliance technicians are not equipped for."],
      ["Can you service an outdoor ice maker or beverage center?", "Yes. Outdoor units fail differently from indoor ones, usually from heat and airflow rather than from component wear. We check the installation, the ventilation and the condenser before assuming a component has failed."]
    ]
  },
  {
    slug: "bee-cave", name: "Bee Cave", county: "Travis County",
    title: "Bee Cave Appliance Repair, TX | Nova Refrigeration",
    desc: "High-end appliance and refrigerator repair in Bee Cave, TX. Panel-ready, integrated and column refrigeration service for Spanish Oaks and Falconhead.",
    heroSub: "Integrated, panel-ready and column appliance repair across Bee Cave and the surrounding Hill Country.",
    intro: "Bee Cave homes are newer and specified higher than almost anywhere else in the metro. Spanish Oaks, Falconhead, Lake Pointe and Uplands kitchens are full of integrated refrigeration hidden behind cabinet panels, dual-fuel ranges and panel-ready dishwashers — appliances that are designed to disappear into the millwork and are correspondingly awkward to service.",
    homesH2: "Integrated and panel-ready appliances",
    homes: "Pulling a panel-ready refrigerator or dishwasher without damaging custom cabinet fronts takes patience and the right approach, and it is where careless service calls turn into cabinetry bills. We remove and reinstall integrated units carefully, and we check door and panel alignment on the way back in — misaligned panels are a common cause of the door seal problems that bring us back out.",
    condoH2: "Column refrigeration and dual-fuel ranges",
    condo: "Separate refrigerator and freezer columns are common in Bee Cave, and they fail independently — a warm freezer column next to a perfectly cold refrigerator column is normal, not a mystery. Dual-fuel ranges bring their own split personality: gas surface faults are usually igniters and burner caps, while the electric oven side fails on elements, sensors and control boards.",
    commonH2: "What we see in Bee Cave kitchens",
    common: [
      ["Freezer column warm while the refrigerator is fine", "Independent sealed systems mean one column can fail on its own — evaporator fans and defrost faults lead the list."],
      ["Panel-ready dishwasher leaking or not draining", "Drain pumps and door seals, often complicated by panel weight and alignment."],
      ["Dual-fuel range with oven heat problems", "Elements, temperature sensors and control boards on the electric oven side."]
    ],
    waterH2: "Water systems and filtered refrigeration",
    water: "Many Bee Cave homes run filtered or softened water to the kitchen, which helps ice makers considerably — but a filter past its cycle causes the same low-flow symptoms as hard water. When an ice maker underperforms here, the filter, the inlet valve and the water line are the first three things we check.",
    hoods: ["Spanish Oaks", "Falconhead", "Lake Pointe", "Uplands", "Homestead", "Ladera", "Sweetwater", "Barton Creek Lakeside"],
    faqs: [
      ["Do you work on panel-ready and integrated appliances?", "Yes. We are set up to remove and reinstall integrated refrigerators and dishwashers without damaging custom panels, and we realign doors and panels afterward so the seals sit correctly."],
      ["One of my refrigerator columns is warm but the other is fine. Is that normal?", "It is normal for one to fail alone. Refrigerator and freezer columns are separate sealed systems with their own fans, defrost circuits and controls, so a fault in one does not affect the other. It does need diagnosing rather than waiting out."]
    ]
  },
  {
    slug: "west-lake-hills", name: "West Lake Hills", county: "Travis County",
    title: "West Lake Hills Appliance Repair | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in West Lake Hills, TX. Sub-Zero and built-in refrigeration restoration for established Eanes-area homes.",
    heroSub: "Restoring built-in refrigeration and high-end appliances in West Lake Hills and Rollingwood.",
    intro: "West Lake Hills homes were largely built between the 1970s and the 1990s and remodeled since, which produces an unusual mix: original built-in refrigeration that is now twenty-five or thirty years old, sitting in kitchens that have been updated around it. Those older built-ins are frequently worth restoring, and that is work we do every week.",
    homesH2: "Restoring 25-year-old built-ins",
    homes: "A Sub-Zero built-in from the 1990s was engineered to be serviced, not discarded. Condenser fans, evaporator fans, defrost heaters, door gaskets and hinge cartridges are all replaceable, and a unit that has been maintained will keep running long after a modern freestanding refrigerator would have been hauled away. We give you a straight assessment of the sealed system before you spend money on the parts around it.",
    condoH2: "Hillside access and service planning",
    condo: "Steep driveways, narrow turnarounds and multi-level entries are the norm on these lots, and they matter more than they sound: pulling a built-in refrigerator out of a hillside home is a planned job, not an improvised one. We ask about access when you book so we arrive with the right equipment and the right number of people.",
    commonH2: "Common West Lake Hills repairs",
    common: [
      ["Built-in refrigerator cycling or running warm", "Aging condenser and evaporator fans, defrost heater failures and tired door gaskets."],
      ["Doors that no longer seal", "Worn hinge cartridges and compressed gaskets on built-ins with decades of use."],
      ["Wall oven and cooktop faults after a remodel", "Control boards, igniters and wiring issues left behind by kitchen renovations."]
    ],
    waterH2: "Softened water and older plumbing",
    water: "Many homes here run water softeners, which spares ice makers a great deal of scale. What we do find is older copper and plastic supply lines to the refrigerator that have hardened or kinked behind the unit — a slow fill that looks exactly like a failing ice maker but is really the line feeding it.",
    hoods: ["Rollingwood", "Westlake Drive", "Camp Craft", "Redbud Trail", "Terrace Mountain", "Cedar Street", "Laura Lane", "Eanes"],
    faqs: [
      ["Is a 25-year-old Sub-Zero worth repairing?", "Very often, yes. These units were built to be serviced, and fans, defrost components, gaskets and hinges are all replaceable at a fraction of replacement cost — and replacing a built-in means cabinetry work, not just an appliance. We assess the sealed system first and tell you honestly if the unit has reached the end."],
      ["Do you need special access for a hillside home?", "Tell us at booking if the driveway is steep or the entry is up or down several levels. It changes what equipment we bring, and knowing in advance is the difference between a one-visit repair and a return trip."]
    ]
  },
  {
    slug: "buda", name: "Buda", county: "Hays County",
    title: "Buda Appliance Repair, TX | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Buda, TX. Honest repair-or-replace advice on builder-grade appliances in Sunfield, Garlic Creek and Whispering Hollow.",
    heroSub: "Straight answers and same-day repair for Buda homeowners in Sunfield, Garlic Creek and Whispering Hollow.",
    intro: "Buda grew fast, and most of its homes came with builder-grade appliance packages. Those packages tend to fail on a predictable schedule — five to eight years in — which lands a lot of first-time homeowners in an unfamiliar decision about whether to repair or replace. We spend as much time here giving straight advice as we do turning wrenches.",
    homesH2: "Builder-grade appliances at year six",
    homes: "The base-model refrigerators, dishwashers and ranges installed across Sunfield and Garlic Creek are genuinely repairable. A drain pump, an igniter, a door switch or a fan motor is usually a modest part and an hour of labor, and it buys several more years. What we will not do is sell you a large repair on a unit that will not justify it — if the numbers say replace, we tell you and you keep the diagnostic fee toward nothing you did not need.",
    condoH2: "Warranty, part sourcing and timing",
    condo: "If your appliance is still inside its manufacturer warranty, the manufacturer should cover the parts, and we will tell you so rather than charging you for work you can get free. Once that window closes, we source parts directly and can usually complete common Buda repairs on the first visit because we stock what these appliance packages actually break.",
    commonH2: "The Buda repair list",
    common: [
      ["Dishwasher not draining", "Drain pumps and check valves on builder-installed dishwashers around the six-year mark."],
      ["Refrigerator freezing food in the fresh food section", "Failed thermistors and damper controls — inexpensive parts with dramatic symptoms."],
      ["Gas range that clicks but will not light", "Worn igniters, dirty burner caps and failed safety valves."]
    ],
    waterH2: "Hays County hard water",
    water: "Hays County water is hard, and in Buda it shortens the life of ice makers, dishwasher heating elements and washing machine inlet valves. If your ice production has quietly dropped off over a couple of years rather than stopping suddenly, scale is almost always the reason, and it is a cheaper fix than the ice maker assembly most people expect to pay for.",
    hoods: ["Sunfield", "Garlic Creek", "Whispering Hollow", "Stonefield", "Elm Grove", "Bradfield Village", "Meadow Woods", "Cullen Country"],
    faqs: [
      ["My appliance is only six years old. Repair or replace?", "At six years, repair is usually the better value on a builder-grade appliance — most failures at that age are single inexpensive components. We quote the repair against what the unit is worth and tell you which way the math points before you commit."],
      ["Do you charge a diagnostic fee?", "We quote before any work starts, so you always know the cost before you approve it. Call or text us and we will explain exactly how the visit is priced for your appliance and location."]
    ]
  },
  {
    slug: "kyle", name: "Kyle", county: "Hays County",
    title: "Kyle Appliance Repair, TX | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Kyle, TX. Same-day service for Plum Creek, Steeplechase, Brookside and Waterleaf. Call (512) 740-0408.",
    heroSub: "Same-day appliance repair across Kyle — Plum Creek, Steeplechase, Brookside and Waterleaf.",
    intro: "Kyle has been one of the fastest-growing cities in Texas, and the appliances reflect it: Plum Creek, Steeplechase, Brookside and Waterleaf are full of homes whose original builder-installed appliances are just now coming out of warranty. That timing is exactly when a good repair is worth far more than a replacement.",
    homesH2: "Just out of warranty",
    homes: "The most common Kyle call starts with the phrase we heard last month. An appliance that fails shortly after its manufacturer warranty expires is almost never worn out — it has a single failed component, and replacing that component restores a machine with most of its life left. We diagnose to the component rather than to the assembly, which is the difference between a modest repair bill and an unnecessary one.",
    condoH2: "New construction quirks",
    condo: "New builds come with their own issues that have nothing to do with appliance quality: dishwashers plumbed without a proper drain loop, dryer vents crushed behind the machine during installation, refrigerator water lines pinched at the shutoff. We check the installation first, because in a house built in the last few years that is frequently what is actually wrong.",
    commonH2: "Frequent Kyle repairs",
    common: [
      ["Dryer not drying properly", "Vent runs crushed or restricted during construction, plus failed heating elements."],
      ["Dishwasher backing up into the sink", "Missing high loop or air gap on builder-plumbed dishwashers."],
      ["Ice maker slow or empty", "Pinched water lines at the shutoff and hard-water scale in the fill valve."]
    ],
    waterH2: "Hard water on the Hays County side",
    water: "Kyle water carries a heavy mineral load like the rest of Hays County. It builds up quietly in ice maker valves, dishwasher spray arms and washer inlet screens, and it is the reason so many Kyle appliances develop water-related faults well before anything mechanical wears out. Descaling is often the entire repair.",
    hoods: ["Plum Creek", "Steeplechase", "Brookside", "Waterleaf", "6 Creeks", "Post Oak", "Amberwood", "Bunton Creek", "Silverado"],
    faqs: [
      ["My appliance is still under manufacturer warranty. Should I call you?", "If the appliance is in warranty, contact the manufacturer first — parts and often labor should be covered, and we would rather tell you that than take the job. We handle out-of-warranty work and repairs the manufacturer network will not schedule quickly."],
      ["How soon can you get to Kyle?", "Kyle is on our regular southbound route, so same-day is often possible when you call in the morning. We give you a call-ahead window rather than making you wait at home all day."]
    ]
  },
  {
    slug: "the-hills", name: "The Hills", county: "Travis County",
    title: "The Hills Appliance Repair, TX | Nova Refrigeration",
    desc: "Built-in and high-end appliance repair in The Hills, TX. Gated-community service for custom Lakeway-area homes. Call (512) 740-0408.",
    heroSub: "Discreet, scheduled service for custom homes in The Hills of Lakeway.",
    intro: "The Hills is a small village of custom homes built around the golf course, and the appliance mix follows: built-in refrigeration, wine storage, professional ranges and bar refrigeration are the norm rather than the exception. It is a community where service calls need to be scheduled properly rather than squeezed in, and we work that way here.",
    homesH2: "Custom kitchens and specified appliances",
    homes: "Homes here were designed around their appliances, which means a failed built-in is a cabinetry problem as much as an appliance problem — the replacement will not simply slide into the opening the old one left. That is why restoring the existing unit is almost always the right answer, and why sealed-system diagnosis matters more than a parts-cannon approach.",
    condoH2: "Gate access and scheduled arrivals",
    condo: "Guard-gate entry means an unannounced technician does not get in. When you book we take the details the gate needs and confirm our arrival window in advance, so the visit runs on time. If you would rather we coordinate directly with the gate or a property manager, we will.",
    commonH2: "What we service in The Hills",
    common: [
      ["Built-in refrigeration running warm", "Condenser and evaporator fan failures, defrost faults and aging door seals."],
      ["Wine storage temperature drift", "Thermostat and compressor faults, plus ventilation blocked by surrounding cabinetry."],
      ["Professional range and oven faults", "Igniters, burner assemblies, temperature sensors and control boards."]
    ],
    waterH2: "Hill Country conditions on refrigeration",
    water: "As in the rest of the Lake Travis area, cedar pollen and limestone dust foul built-in condensers faster than most homeowners expect. Left alone, a clogged condenser makes the compressor work hot for years and then fail expensively. We clean condensers as part of every built-in visit and set a realistic interval for the next one.",
    hoods: ["The Hills of Lakeway", "Flintrock Falls", "Hills of Lakeway golf course area", "Lakeway Boulevard", "Rocky Ridge"],
    faqs: [
      ["How does gate access work for a service call?", "Give us the gate requirements when you book — a name on the list, a code, or a call to the guard house — and we will confirm our arrival window in advance so the entry is straightforward. We can also coordinate with a property manager if you prefer."],
      ["Do you service wine and beverage refrigeration?", "Yes. Wine cabinets, beverage centers and undercounter refrigeration are sealed refrigeration systems and fall squarely within our EPA-certified work. Temperature drift is usually a thermostat, a fan or restricted ventilation rather than a dead compressor."]
    ]
  },
  {
    slug: "dripping-springs", name: "Dripping Springs", county: "Hays County",
    title: "Dripping Springs Appliance Repair | Nova Refrigeration",
    desc: "Appliance and refrigerator repair in Dripping Springs, TX. Well-water and propane appliance experience for Belterra, Headwaters and Caliterra.",
    heroSub: "Hill Country appliance repair built around well water, propane ranges and acreage properties.",
    intro: "Dripping Springs is the most distinctive service area we cover, because the utilities are different. Many properties out here run on private wells and propane rather than city water and natural gas, and both change how appliances fail and how they should be repaired. If a technician does not account for that, they will misdiagnose the same appliance twice.",
    homesH2: "Well water is hard on appliances",
    homes: "Well water carries far more mineral content and sediment than treated municipal supply, and appliances that use water take the damage first. Ice maker fill valves scale shut, dishwasher spray arms clog, washing machine inlet screens block with sediment, and refrigerator water filters exhaust months ahead of schedule. We check filtration and inlet screens before we ever quote an ice maker or a valve assembly.",
    condoH2: "Propane ranges and cooktops",
    condo: "Many homes out here run propane rather than natural gas, and the two are not interchangeable. Orifice sizing and regulator settings differ, and an appliance converted incorrectly burns badly — yellow flames, soot, uneven heat and burners that will not stay lit. We check the conversion and the regulator as part of diagnosing any propane range complaint.",
    commonH2: "Typical Dripping Springs calls",
    common: [
      ["Ice maker stopped entirely", "Well-water scale and sediment in the fill valve and supply line."],
      ["Dishwasher leaving grit on dishes", "Sediment clogging spray arms and filters faster than on municipal water."],
      ["Propane burners that will not stay lit", "Incorrect orifices or regulator settings after an LP conversion, plus worn safety valves."]
    ],
    waterH2: "Filtration is the real fix",
    water: "On a well, the appliance repair is often only half the job. Without sediment filtration and softening ahead of the kitchen, the same fill valve will scale shut again within a year or two. We will tell you where the filtration should sit so the repair we just did actually lasts, whether or not that work is ours.",
    hoods: ["Belterra", "Headwaters", "Caliterra", "Rim Rock", "Highpointe", "Arrowhead Ranch", "Sunset Canyon", "Founders Ridge"],
    faqs: [
      ["Does well water really affect my ice maker?", "More than anything else out here. Well water carries mineral content and sediment that municipal supply does not, and it scales the ice maker fill valve shut over a year or two. Replacing the ice maker without filtering the water means repeating the repair."],
      ["Do you service propane ranges and cooktops?", "Yes. Propane appliances need different orifices and regulator settings than natural gas, and an incorrect conversion is one of the most common causes of poor burner performance out here. We check the conversion as part of the diagnosis."]
    ]
  },
];

const REVIEWS = [
  { stars: 5, text: "Our Sub-Zero stopped cooling and Nova had a tech out the same day. Diagnosed a sealed-system leak, fixed it right, and saved us from buying a new unit. Professional and honest.", who: "Marcus T.", where: "West Lake Hills" },
  { stars: 5, text: "Washer wouldn't drain on a Sunday morning with a houseful of laundry. Quick call, fast response, fixed in under an hour. Fair price too.", who: "Priya R.", where: "Round Rock" },
  { stars: 5, text: "Our freezer was building up frost and the fridge was getting warm. They explained exactly what was wrong, replaced the defrost sensor, and it's been perfect since.", who: "Dana K.", where: "Cedar Park" },
  { stars: 5, text: "Gas oven wouldn't ignite. The technician was on time, clean, and clearly knew the brand inside out. Highly recommend for any appliance repair.", who: "Jorge M.", where: "Pflugerville" },
  { stars: 5, text: "Ice maker quit completely. They had the assembly and water valve on the truck and replaced it on the spot. Same-day service as promised.", who: "Allison W.", where: "Georgetown" },
  { stars: 5, text: "Dryer was taking three cycles to dry a load. Turned out to be a clogged vent and a failing heating element. Fast, friendly, and reasonably priced.", who: "Ben S.", where: "Leander" },
];

const FAQS = [
  { q: "Do you offer same-day appliance repair?", a: "Yes. We offer same-day service for most refrigerator, freezer, and appliance repairs throughout the Austin metro area whenever scheduling allows. Call us early in the day for the best chance at a same-day appointment." },
  { q: "What areas do you serve?", a: "We serve Austin and the surrounding metro, including Round Rock, Cedar Park, Leander, Georgetown, Pflugerville, Lakeway, Bee Cave, West Lake Hills, Buda, Kyle, and Hutto." },
  { q: "Which appliance brands do you repair?", a: "We service all major brands including Samsung, LG, Whirlpool, Maytag, KitchenAid, GE Appliances, Frigidaire, Electrolux, Bosch, Thermador, Sub-Zero, Viking, JennAir, and Wolf — plus built-in and high-end refrigeration like Sub-Zero, Thermador, Viking, Bosch, and GE Monogram." },
  { q: "Do you repair sealed refrigeration systems?", a: "Yes. Sealed-system work is a specialty. We handle compressor replacement, refrigerant leak diagnosis and repair, filter drier replacement, system evacuation and recharge, capillary tube restrictions, and full sealed-system rebuilds." },
  { q: "How much does a repair cost?", a: "Every repair is different. We provide a clear diagnosis and an up-front estimate before any work begins, so you can decide with no surprises. Call or request service online for a quote." },
  { q: "Do you repair both gas and electric appliances?", a: "Yes. We service gas and electric ovens, ranges, cooktops, and dryers, including ignition, gas valve, and ventilation-related issues." },
  { q: "How do I schedule a repair?", a: "Call us, send a text, or use the Request Service form on our website. Tell us your appliance, brand, and the problem, and we'll get you scheduled — often the same day." },
];

/* Active promotions — swap the `img` files in /assets for your own photos any time. */
const PROMOS = [
  {
    img: "assets/promo-labor.png",
    badge: "Service Special",
    price: "$185",
    unit: "minimum labor",
    title: "Flat Minimum Labor Rate",
    desc: "Straightforward, up-front pricing on every visit — a $185 minimum labor charge covers diagnosis and getting hands on the repair. No hidden fees, no surprises.",
  },
  {
    img: "assets/promo-military.jpg",
    badge: "We Support Our Troops",
    price: "$30 OFF",
    unit: "for military",
    title: "Military Discount",
    desc: "A thank-you to those who serve. Active-duty and veteran households receive $30 off their appliance repair. Just mention it when you book.",
  },
];

/* Trust / value highlights shown on the home page. */
const FEATURES = [
  { icon: "shield", title: "Spare Parts Guarantee", text: "We stand behind our work — every spare part we install is backed by a guarantee." },
  { icon: "clock", title: "Same-Day Repair", text: "Same-day appliance repair is available across the Austin metro whenever scheduling allows." },
  { icon: "badge", title: "Insured & EPA Certified", text: "Our technicians are fully insured and EPA certified for safe, code-compliant refrigeration work." },
  { icon: "trophy", title: "Proven Track Record", text: "5+ years of experience and 10,000+ completed orders for homeowners across the metro." },
];

const FEATURE_ICONS = {
  shield: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M40 8l28 10v20c0 18-12 30-28 34C24 68 12 56 12 38V18z"/><path d="M30 40l8 8 14-16"/></svg>',
  clock: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="42" r="30"/><path d="M40 24v18l12 8"/><path d="M28 8h24"/></svg>',
  badge: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="32" r="22"/><path d="M30 48l-6 24 16-9 16 9-6-24"/><path d="M31 32l6 6 12-12"/></svg>',
  trophy: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="#1763b6" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 12h32v18a16 16 0 0 1-32 0z"/><path d="M24 18H14v6a10 10 0 0 0 10 10M56 18h10v6a10 10 0 0 1-10 10"/><path d="M34 46h12M30 68h20M40 46v22"/></svg>',
};

/* ----------------------------------------------------------------------- */
/* HELPERS                                                                 */
/* ----------------------------------------------------------------------- */
const C = CONFIG;
const smsHref = `sms:${C.phoneTel}?&body=${encodeURIComponent(C.smsBody)}`;
const telHref = `tel:${C.phoneTel}`;

// `depth` = how many directories deep the page is from root (0 = root, 1 = services/x.html)
const rel = (depth, p) => (depth === 0 ? "" : "../".repeat(depth)) + p;

function head(depth, { title, desc, canonical }) {
  const base = `https://${C.domain}/`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){try{var t=localStorage.getItem("theme");if(!t){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${rel(depth, "assets/favicon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${rel(depth, "assets/favicon.svg")}">
<meta name="description" content="${desc}">
<link rel="canonical" href="${base}${canonical === "index.html" ? "" : canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#0b2a4a">
<link rel="preconnect" href="https://www.google.com">
<link rel="stylesheet" href="${rel(depth, "css/styles.css")}">
</head>
<body>`;
}

function header(depth, active) {
  const link = (href, label, key) =>
    `<a href="${rel(depth, href)}"${active === key ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
  return `
<div class="topbar">
  <div class="container">
    <span>⭐ 5-Star Rated · Serving ${C.cityState} & Surrounding Areas</span>
    <div class="topbar-right">
      <span>🕒 ${C.hours}</span>
      <a href="${telHref}">📞 ${C.phoneDisplay}</a>
    </div>
  </div>
</div>
<header class="site-header">
  <div class="container">
    <a class="brand" href="${rel(depth, "index.html")}">
      <img class="logo-mark logo-dark" src="${rel(depth, "assets/logo.svg")}" alt="${C.name} logo" width="48" height="54">
      <img class="logo-mark logo-white" src="${rel(depth, "assets/logo-white.svg")}" alt="${C.name} logo" width="48" height="54">
      <span>${C.name.split(" & ")[0]}<small>Refrigeration &amp; Appliance Repair</small></span>
    </a>
    <nav class="nav" aria-label="Main navigation">
      ${link("index.html", "Home", "home")}
      ${link("about.html", "About", "about")}
      ${link("services.html", "Services", "services")}
      ${link("service-areas.html", "Service Areas", "areas")}
      ${link("our-work.html", "Our Work", "work")}
      ${link("contact.html", "Contact", "contact")}
    </nav>
    <div class="header-actions">
      <button class="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">🌙</button>
      <a class="btn btn-call" href="${telHref}">📞 Call Now</a>
      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

function ctaBand(depth) {
  return `
<section class="section cta-band">
  <div class="container">
    <h2>Call Now for Fast Appliance Repair Service</h2>
    <p>Same-day service available across the ${C.cityState} metro. Talk to a real technician and get your appliance fixed today.</p>
    <div class="hero-cta">
      <a class="btn btn-call btn-lg" href="${telHref}">📞 Call ${C.phoneDisplay}</a>
      <a class="btn btn-outline btn-lg" href="${smsHref}">💬 Text Us</a>
      <a class="btn btn-ghost btn-lg" href="${rel(depth, "contact.html")}">Schedule Service Online</a>
    </div>
  </div>
</section>`;
}

function footer(depth) {
  const sLinks = SERVICES.slice(0, 7)
    .map((s) => `<li><a href="${rel(depth, "services/" + s.slug + ".html")}">${s.name}</a></li>`).join("\n        ");
  const aLinks = AREAS.slice(0, 8)
    .map((a) => `<li><a href="${rel(depth, "areas/" + a.slug + ".html")}">${a.name}</a></li>`).join("\n        ");
  return `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a class="brand" href="${rel(depth, "index.html")}" style="color:#fff">
          <img class="logo-mark" src="${rel(depth, "assets/logo-white.svg")}" alt="${C.name} logo" width="48" height="54">
          <span style="color:#fff">${C.name.split(" & ")[0]}<small style="color:#9fc1e3">Refrigeration &amp; Appliance Repair</small></span>
        </a>
        <p style="margin-top:14px;max-width:34ch">Residential appliance repair and refrigeration services for ${C.cityState} and the surrounding metro. Same-day service available.</p>
        <p><a href="${telHref}">📞 ${C.phoneDisplay}</a><br><a href="${smsHref}">💬 Text us</a><br><a href="mailto:${C.email}">✉️ ${C.email}</a></p>
      </div>
      <div>
        <h4>Services</h4>
        <ul>
        ${sLinks}
        </ul>
      </div>
      <div>
        <h4>Service Areas</h4>
        <ul>
        ${aLinks}
        <li><a href="${rel(depth, "service-areas.html")}">View all areas →</a></li>
        </ul>
      </div>
      <div>
        <h4>Company</h4>
        <ul>
          <li><a href="${rel(depth, "about.html")}">About Us</a></li>
          <li><a href="${rel(depth, "our-work.html")}">Our Work</a></li>
          <li><a href="${rel(depth, "index.html")}#reviews">Reviews</a></li>
          <li><a href="${rel(depth, "index.html")}#faq">FAQ</a></li>
          <li><a href="${rel(depth, "contact.html")}">Contact Us</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; 2021&ndash;<span data-year>2026</span> ${C.name}. All rights reserved.</span>
      <span>${C.cityState} · ${C.hours}</span>
    </div>
  </div>
</footer>
<div class="mobile-callbar">
  <a class="mc-call" href="${telHref}">📞 Call Now</a>
  <a class="mc-text" href="${smsHref}">💬 Text Us</a>
</div>
<script src="${rel(depth, "js/main.js")}"></script>
</body>
</html>`;
}

function pageHero(depth, { title, sub, crumbs }) {
  const trail = crumbs
    ? `<div class="breadcrumb"><a href="${rel(depth, "index.html")}">Home</a> › ${crumbs}</div>`
    : "";
  return `
<section class="page-hero">
  <div class="container">
    ${trail}
    <h1>${title}</h1>
    ${sub ? `<p>${sub}</p>` : ""}
  </div>
</section>`;
}

function localBusinessSchema() {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: C.name,
  telephone: C.phoneDisplay,
  email: C.email,
  url: `https://${C.domain}/`,
  areaServed: AREAS.map((a) => a.name + ", TX"),
  address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" },
  openingHours: "Mo-Sa 07:00-19:00",
  description: "Residential appliance repair and refrigeration services in the Austin, Texas metro area.",
}, null, 2)}
</script>`;
}

function write(relPath, html) {
  const full = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, "utf8");
  console.log("  wrote " + relPath);
}

/* ----------------------------------------------------------------------- */
/* PAGE BUILDERS                                                           */
/* ----------------------------------------------------------------------- */

function serviceCards(depth) {
  return SERVICES.map((s) => `
    <a class="card service-card" href="${rel(depth, "services/" + s.slug + ".html")}">
      <div class="icon"><img src="${rel(depth, "assets/icons/" + s.slug + ".svg")}" alt="${s.name} icon" width="44" height="44"></div>
      <h3>${s.name}</h3>
      <p>${s.blurb}</p>
      <span class="arrow">Learn more →</span>
    </a>`).join("");
}

function promoCards(depth) {
  return PROMOS.map((p) => `
    <div class="card promo-card">
      <div class="promo-media"><img src="${rel(depth, p.img)}" alt="${p.title}" loading="lazy"><span class="promo-badge">${p.badge}</span></div>
      <div class="promo-body">
        <div class="promo-price">${p.price} <span>${p.unit}</span></div>
        <h3>${p.title}</h3>
        <p>${p.desc}</p>
        <a class="btn btn-call" href="${telHref}">📞 Claim This Offer</a>
      </div>
    </div>`).join("");
}

function featureCards() {
  return FEATURES.map((f) => `
    <div class="feature">
      <div class="feature-icon">${FEATURE_ICONS[f.icon]}</div>
      <h3>${f.title}</h3>
      <p>${f.text}</p>
    </div>`).join("");
}

function faqItems() {
  return FAQS.map((f) => `
      <details class="faq-item">
        <summary>${f.q}</summary>
        <div class="faq-body">${f.a}</div>
      </details>`).join("");
}

function faqSchema() {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
}, null, 2)}
</script>`;
}

function brandChips() {
  return BRANDS.map((b) => `<div class="chip">${b}</div>`).join("\n      ");
}

function areaLinks(depth) {
  return AREAS.map((a) => `<a href="${rel(depth, "areas/" + a.slug + ".html")}">📍 ${a.name}</a>`).join("\n      ");
}

function reviewCards(list) {
  return (list || REVIEWS).map((r) => `
    <div class="review">
      <div class="stars">${"★".repeat(r.stars)}${"☆".repeat(5 - r.stars)}</div>
      <p>"${r.text}"</p>
      <p class="who">${r.who}<span>${r.where}</span></p>
    </div>`).join("");
}

/* ---------- HOME ---------- */
function buildHome() {
  const html = head(0, {
    title: `Same-Day Appliance Repair in Austin, TX | Nova`,
    desc: `Fast, reliable residential appliance and refrigerator repair in ${C.cityState} and surrounding areas. Same-day service. Call ${C.phoneDisplay}.`,
    canonical: "index.html",
  }) + localBusinessSchema() + faqSchema() + header(0, "home") + `
<section class="hero">
  <div class="container">
    <span class="same-day">⚡ Same-Day Service Available</span>
    <h1>Fast, Reliable Appliance &amp; Refrigerator Repair in ${C.cityState}</h1>
    <p class="lead">From refrigerators and freezers to washers, dryers, ovens, and more — Nova gets your home appliances working again, often the same day.</p>
    <div class="hero-badges">
      <span>✓ Same-Day Service</span>
      <span>✓ All Major Brands</span>
      <span>✓ Sealed-System Specialists</span>
    </div>
    <div class="hero-cta">
      <a class="btn btn-call btn-lg" href="${telHref}">📞 Call Now: ${C.phoneDisplay}</a>
      <a class="btn btn-outline btn-lg" href="${smsHref}">💬 Text Us</a>
      <a class="btn btn-ghost btn-lg" href="contact.html">Request Service</a>
    </div>
  </div>
</section>

<section class="section" id="promos">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Active Promotions</span>
      <h2>Current Offers &amp; Discounts</h2>
      <p>Honest pricing and a little extra appreciation for our customers.</p>
    </div>
    <div class="grid grid-2 promo-grid">
      ${promoCards(0)}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Why Homeowners Choose Nova</span>
      <h2>Repairs You Can Trust</h2>
    </div>
    <div class="grid grid-4 feature-grid">
      ${featureCards()}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">What We Repair</span>
      <h2>Appliance Repair Services</h2>
      <p>Expert residential repair for every major appliance in your home.</p>
    </div>
    <div class="grid grid-3">
      ${serviceCards(0)}
    </div>
    <div style="text-align:center;margin-top:36px">
      <a class="btn btn-primary btn-lg" href="services.html">View All Services →</a>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="stats">
      <div class="stat"><div class="big">10,000+</div><div class="lbl">Orders Completed</div></div>
      <div class="stat"><div class="big">5+ yrs</div><div class="lbl">Experience</div></div>
      <div class="stat"><div class="big">14+</div><div class="lbl">Brands Serviced</div></div>
      <div class="stat"><div class="big">Same-Day</div><div class="lbl">Service Available</div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Simple Process</span>
      <h2>How It Works</h2>
    </div>
    <div class="steps">
      <div class="step"><div class="num"></div><h3>Call or Request Online</h3><p>Tell us your appliance, brand, and the problem. We'll schedule a visit — often the same day.</p></div>
      <div class="step"><div class="num"></div><h3>Expert Diagnosis</h3><p>Our technician inspects the appliance and gives you a clear, up-front estimate before any work begins.</p></div>
      <div class="step"><div class="num"></div><h3>Fixed Right</h3><p>We complete the repair with quality parts and get your home running smoothly again.</p></div>
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Brands We Service</span>
      <h2>We Repair All Major Brands</h2>
      <p>Including specialized experience with high-end and built-in refrigeration.</p>
    </div>
    <div class="chips">
      ${brandChips()}
    </div>
  </div>
</section>

<section class="section" id="reviews">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Reviews</span>
      <h2>What Our Customers Say</h2>
      <p>Homeowners across the ${C.cityState} metro trust Nova for honest, fast repairs.</p>
    </div>
    <div class="grid grid-3">
      ${reviewCards(REVIEWS)}
    </div>
    <p class="form-note" style="text-align:center;margin-top:28px">Reviews shown are representative customer testimonials.</p>
  </div>
</section>

<section class="section alt" id="faq">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">FAQ</span>
      <h2>Frequently Asked Questions</h2>
      <p>Everything you need to know about scheduling appliance repair with Nova.</p>
    </div>
    <div class="container" style="max-width:840px;padding:0">
      ${faqItems()}
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Service Areas</span>
      <h2>Proudly Serving the Greater ${C.cityState} Area</h2>
    </div>
    <div class="area-grid">
      ${areaLinks(0)}
    </div>
  </div>
</section>

` + ctaBand(0) + footer(0);
  write("index.html", html);
}

/* ---------- ABOUT ---------- */
function buildAbout() {
  const html = head(0, {
    title: `About Us | ${C.name}`,
    desc: `Meet the EPA-certified team behind Nova — residential appliance and refrigeration repair across the ${C.cityState} metro since 2021.`,
    canonical: "about.html",
  }) + header(0, "about")
    + pageHero(0, { title: "About Nova Refrigeration & Appliance Repair", sub: `Trusted residential appliance and refrigeration repair serving ${C.cityState} and surrounding communities.`, crumbs: "About" })
    + `
<section class="section">
  <div class="container split">
    <div class="prose">
      <p>${C.name} is a residential appliance repair and refrigeration company based in ${C.cityState}. We help homeowners across the metro keep their kitchens and laundry rooms running — quickly, honestly, and affordably.</p>
      <h2>Refrigeration is our specialty</h2>
      <p>While we repair every major home appliance, refrigeration is where we go deepest. Our technicians handle sealed-system work that many shops won't touch — compressor replacement, refrigerant leak diagnosis and repair, filter drier replacement, system evacuation and recharge, capillary tube restrictions, and full sealed-system rebuilds.</p>
      <p>We also have specialized experience with high-end and built-in refrigeration, including Sub-Zero, Thermador, Viking, Bosch, and GE Monogram.</p>
      <h2>Why homeowners choose Nova</h2>
      <ul>
        <li><b>Same-day service</b> available across the ${C.cityState} metro.</li>
        <li><b>Up-front pricing</b> with a clear estimate before any work begins.</li>
        <li><b>All major brands</b> — from Samsung and LG to Sub-Zero and Wolf.</li>
        <li><b>Honest diagnostics</b> — we'll tell you when a repair makes sense and when it doesn't.</li>
      </ul>
      <p>Whether your refrigerator stopped cooling overnight or your dryer just won't heat, we're ready to help. Call us, text us, or request service online.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Need a repair now?</h3>
        <p class="form-note">Call or text and talk to a real technician. Same-day appointments available.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">💬 Text Us</a>
        <a class="btn btn-ghost btn-lg" href="contact.html" style="width:100%">Request Service Online</a>
        <ul class="info-list" style="margin-top:18px">
          <li><span class="ico">📍</span><div><b>Service Area</b>${C.cityState} & surrounding metro</div></li>
          <li><span class="ico">🕒</span><div><b>Hours</b>${C.hours}</div></li>
        </ul>
      </div>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("about.html", html);
}

/* ---------- SERVICES OVERVIEW ---------- */
function buildServicesOverview() {
  const specialized = SPECIALIZED.map((s) => `
      <div class="card">
        <h3>${s.name}</h3>
        <p>${s.intro}</p>
        <ul class="checklist">
          ${s.issues.map((i) => `<li>${i}</li>`).join("\n          ")}
        </ul>
      </div>`).join("");

  const html = head(0, {
    title: `Appliance Repair Services in Austin, TX | Nova`,
    desc: `Refrigerator, freezer, washer, dryer, dishwasher, oven and cooktop repair in ${C.cityState}. Built-in and sealed-system specialists.`,
    canonical: "services.html",
  }) + header(0, "services")
    + pageHero(0, { title: "Appliance Repair Services", sub: "Expert residential repair for every major appliance in your home — plus specialized refrigeration services.", crumbs: "Services" })
    + `
<section class="section">
  <div class="container">
    <div class="grid grid-3">
      ${serviceCards(0)}
    </div>
  </div>
</section>

<section class="section alt">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Specialized</span>
      <h2>Specialized Refrigeration Services</h2>
      <p>Advanced repairs many shops won't take on.</p>
    </div>
    <div class="grid grid-2">
      ${specialized}
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("services.html", html);
}

/* ---------- INDIVIDUAL SERVICE PAGES ---------- */
function buildServicePages() {
  SERVICES.forEach((s) => {
    const others = SERVICES.filter((o) => o.slug !== s.slug).slice(0, 4);
    const html = head(1, {
      title: `${s.name} in Austin, TX | Nova Refrigeration`,
      desc: s.metaDesc,
      canonical: "services/" + s.slug + ".html",
    }) + header(1, "services")
      + pageHero(1, {
          title: s.name,
          sub: s.blurb,
          crumbs: `<a href="${rel(1, "services.html")}">Services</a> › ${s.name}`,
        })
      + `
<section class="section">
  <div class="container split">
    <div class="prose">
      <p>${s.intro}</p>
      <h2>Common ${s.name.replace(" Repair", "")} problems we fix</h2>
      <ul class="checklist">
        ${s.issues.map((i) => `<li>${i}</li>`).join("\n        ")}
      </ul>
      <h2>All major brands serviced</h2>
      <p>We repair ${BRANDS.join(", ")}, and more — including high-end and built-in models.</p>
      <h2>Same-day service across the ${C.cityState} metro</h2>
      <p>We serve ${AREAS.map((a) => a.name).join(", ")}. Call or request service online and we'll get you scheduled — often the same day.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Request ${s.name}</h3>
        <p class="form-note">Talk to a real technician. Same-day appointments available.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">💬 Text Us</a>
        <a class="btn btn-ghost btn-lg" href="${rel(1, "contact.html")}" style="width:100%">Schedule Online</a>
      </div>
      <div class="card" style="margin-top:22px">
        <h3>Other Repairs</h3>
        <ul class="info-list">
          ${others.map((o) => `<li><span class="ico ico-img"><img src="${rel(1, "assets/icons/" + o.slug + ".svg")}" alt="" width="24" height="24"></span><div><a href="${o.slug}.html"><b>${o.name}</b></a></div></li>`).join("\n          ")}
        </ul>
      </div>
    </div>
  </div>
</section>
` + ctaBand(1) + footer(1);
    write("services/" + s.slug + ".html", html);
  });
}

/* ---------- SERVICE AREAS OVERVIEW ---------- */
function buildAreasOverview() {
  const html = head(0, {
    title: `Service Areas in the Austin Metro | Nova Repair`,
    desc: `Appliance and refrigerator repair across the ${C.cityState} metro — Austin, Round Rock, Cedar Park, Georgetown, Lakeway, Buda, Kyle and more.`,
    canonical: "service-areas.html",
  }) + header(0, "areas")
    + pageHero(0, { title: "Service Areas", sub: `Proudly serving ${C.cityState} and communities across the metro with same-day appliance repair.`, crumbs: "Service Areas" })
    + `
<section class="section">
  <div class="container">
    <div class="area-grid">
      ${areaLinks(0)}
    </div>
  </div>
</section>
<section class="section alt">
  <div class="container" style="text-align:center">
    <iframe class="map-embed" loading="lazy" title="Service area map"
      src="https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&output=embed"></iframe>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("service-areas.html", html);
}

/* ---------- INDIVIDUAL AREA PAGES ---------- */
function buildAreaPages() {
  AREAS.forEach((a) => {
    const faqLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: a.faqs.map(([q, ans]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: ans.replace(/&deg;/g, "\u00b0") },
      })),
    };

    const html = head(1, {
      title: a.title,
      desc: a.desc,
      canonical: "areas/" + a.slug + ".html",
    }) + header(1, "areas")
      + pageHero(1, {
          title: `Appliance &amp; Refrigerator Repair in ${a.name}, TX`,
          sub: a.heroSub,
          crumbs: `<a href="${rel(1, "service-areas.html")}">Service Areas</a> \u203a ${a.name}`,
        })
      + `
<section class="section">
  <div class="container split">
    <div class="prose">
      <p class="lead-in">${a.intro}</p>

      <h2>${a.homesH2}</h2>
      <p>${a.homes}</p>

      <h2>${a.condoH2}</h2>
      <p>${a.condo}</p>

      <h2>${a.commonH2}</h2>
      <ul class="reason-list">
        ${a.common.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join("\n        ")}
      </ul>

      <h2>${a.waterH2}</h2>
      <p>${a.water}</p>

      <h2>Appliance repairs we handle in ${a.name}</h2>
      <ul class="checklist">
        ${SERVICES.map((s) => `<li><a href="${rel(1, "services/" + s.slug + ".html")}">${s.name} in ${a.name}</a></li>`).join("\n        ")}
      </ul>

      <h2>Neighborhoods we cover in ${a.name}</h2>
      <p>We take calls throughout ${a.name} and ${a.county}, including ${a.hoods.slice(0, -1).join(", ")} and ${a.hoods[a.hoods.length - 1]}. If you are just outside these, call us anyway \u2014 we cover the surrounding ${C.cityState} metro.</p>

      <h2>${a.name} appliance repair questions</h2>
      <div class="faq">
        ${a.faqs.map(([q, ans]) => `<details class="faq-item"><summary>${q}</summary><div class="faq-body"><p>${ans}</p></div></details>`).join("\n        ")}
      </div>

      <h2>Brands we service in ${a.name}</h2>
      <p>${BRANDS.join(", ")}, and more \u2014 including sealed-system work on built-in and high-end refrigeration.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Book Repair in ${a.name}</h3>
        <p class="form-note">Same-day appointments available. Talk to a real technician.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">\ud83d\udcde Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">\ud83d\udcac Text Us</a>
        <a class="btn btn-ghost btn-lg" href="${rel(1, "contact.html")}" style="width:100%">Schedule Online</a>
      </div>
      <iframe class="map-embed" style="margin-top:22px;height:240px" loading="lazy" title="${a.name}, TX service area map"
        src="https://www.google.com/maps?q=${encodeURIComponent(a.name + ", TX")}&output=embed"></iframe>
    </div>
  </div>
</section>
<script type="application/ld+json">
${JSON.stringify(faqLd, null, 2)}
</script>
` + ctaBand(1) + footer(1);
    write("areas/" + a.slug + ".html", html);
  });
}

/* ---------- OUR WORK ---------- */
function buildOurWork() {
  const html = head(0, {
    title: `Our Work | ${C.name}`,
    desc: `Recent appliance and refrigeration repairs completed by Nova across the ${C.cityState} metro — built-ins, sealed systems and everyday fixes.`,
    canonical: "our-work.html",
  }) + header(0, "work")
    + pageHero(0, { title: "Our Work", sub: "A look at recent appliance and refrigeration repairs we've completed across the metro.", crumbs: "Our Work" })
    + `
<section class="section">
  <div class="container">
    <div class="coming-soon">
      <div class="coming-soon-icon">🛠️</div>
      <h2>Coming Soon</h2>
      <p>We're putting together a gallery of our completed repairs and projects. Check back soon to see our work in action.</p>
      <div class="hero-cta" style="justify-content:center">
        <a class="btn btn-call btn-lg" href="${telHref}">📞 Call ${C.phoneDisplay}</a>
        <a class="btn btn-ghost btn-lg" href="contact.html">Request Service</a>
      </div>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("our-work.html", html);
}

/* ---------- CONTACT ---------- */
function buildContact() {
  const serviceOptions = SERVICES.map((s) => `<option>${s.name}</option>`).join("\n              ");
  const html = head(0, {
    title: `Contact Us | ${C.name}`,
    desc: `Call, text or request service online for same-day appliance and refrigerator repair in ${C.cityState}. Talk to a real technician.`,
    canonical: "contact.html",
  }) + header(0, "contact")
    + pageHero(0, { title: "Contact Us & Request Service", sub: "Call, text, or send a request — same-day appointments available across the metro.", crumbs: "Contact" })
    + `
<section class="section">
  <div class="container split">
    <div>
      <h2>Request Service</h2>
      <p>Tell us about your appliance and we'll get back to you fast. For the quickest response, call or text us directly.</p>
      <div class="form-wrap">
        <div class="form-success" role="status" style="display:none"></div>
        <form id="service-form" method="POST" action="https://api.web3forms.com/submit" novalidate>
          <input type="hidden" name="access_key" value="${C.web3formsKey}">
          <input type="hidden" name="subject" value="New Service Request — ${C.name}">
          <input type="hidden" name="from_name" value="${C.name} Website">
          <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off" style="display:none" aria-hidden="true">
          <p class="form-note" style="margin-top:0">Fields marked <span class="req" aria-hidden="true">*</span> are required.</p>
          <div class="form-row">
            <div class="field">
              <label for="name">Full Name <span class="req" aria-hidden="true">*</span></label>
              <input id="name" name="name" type="text" required minlength="2" maxlength="60"
                     autocomplete="name" placeholder="Jane Doe" aria-describedby="name-error">
              <p class="field-error" id="name-error" role="alert"></p>
            </div>
            <div class="field">
              <label for="phone">Phone <span class="req" aria-hidden="true">*</span></label>
              <input id="phone" name="phone" type="tel" required maxlength="24" inputmode="tel"
                     autocomplete="tel" placeholder="(512) 555-0123" aria-describedby="phone-error">
              <p class="field-error" id="phone-error" role="alert"></p>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="email">Email</label>
              <input id="email" name="email" type="email" maxlength="120" inputmode="email"
                     autocomplete="email" placeholder="you@example.com" aria-describedby="email-error">
              <p class="field-error" id="email-error" role="alert"></p>
            </div>
            <div class="field">
              <label for="city">City <span class="req" aria-hidden="true">*</span></label>
              <select id="city" name="city" required aria-describedby="city-error">
                <option value="">Select your city…</option>
                ${AREAS.map((a) => `<option>${a.name}</option>`).join("\n                ")}
                <option>Other / nearby</option>
              </select>
              <p class="field-error" id="city-error" role="alert"></p>
            </div>
          </div>
          <div class="form-row">
            <div class="field">
              <label for="appliance">Appliance / Service Needed <span class="req" aria-hidden="true">*</span></label>
              <select id="appliance" name="appliance" required aria-describedby="appliance-error">
                <option value="">Select a service…</option>
              ${serviceOptions}
                <option>Other</option>
              </select>
              <p class="field-error" id="appliance-error" role="alert"></p>
            </div>
            <div class="field">
              <label for="brand">Appliance Brand</label>
              <input id="brand" name="brand" type="text" maxlength="40"
                     placeholder="e.g. Samsung, Sub-Zero" aria-describedby="brand-error">
              <p class="field-error" id="brand-error" role="alert"></p>
            </div>
          </div>
          <div class="field">
            <label for="urgency"><input type="checkbox" id="urgency" name="urgency" style="width:auto;margin-right:8px"> This is an emergency — I need same-day service</label>
          </div>
          <div class="field">
            <label for="message">Describe the Problem <span class="req" aria-hidden="true">*</span></label>
            <textarea id="message" name="message" required minlength="10" maxlength="1200"
                      placeholder="What's happening with your appliance?"
                      aria-describedby="message-count message-error"></textarea>
            <p class="field-hint" id="message-count" aria-live="polite"></p>
            <p class="field-error" id="message-error" role="alert"></p>
          </div>
          <button class="btn btn-call btn-lg" type="submit" style="width:100%">Request Service</button>
          <p class="form-note" style="margin-top:12px">By submitting, you agree to be contacted about your repair request. Submissions are delivered by email via Web3Forms.</p>
        </form>
      </div>
    </div>
    <div>
      <h2>Get in Touch</h2>
      <ul class="info-list">
        <li><span class="ico">📞</span><div><b>Call</b><a href="${telHref}">${C.phoneDisplay}</a></div></li>
        <li><span class="ico">💬</span><div><b>Text</b><a href="${smsHref}">${C.phoneDisplay}</a></div></li>
        <li><span class="ico">✉️</span><div><b>Email</b><a href="mailto:${C.email}">${C.email}</a></div></li>
        <li><span class="ico">📍</span><div><b>Service Area</b>${C.cityState} & surrounding metro</div></li>
        <li><span class="ico">🕒</span><div><b>Hours</b>${C.hours}</div></li>
      </ul>
      <div style="margin:18px 0">
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">📞 Call Now</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%">💬 Text Us</a>
      </div>
      <iframe class="map-embed" loading="lazy" title="Service area map"
        src="https://www.google.com/maps?q=${encodeURIComponent(C.mapQuery)}&output=embed"></iframe>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("contact.html", html);
}

/* ----------------------------------------------------------------------- */
/* SITEMAP + ROBOTS                                                        */
/* ----------------------------------------------------------------------- */
/* Every URL listed here must match the page's <link rel="canonical">.
 * The home page is canonicalised to the bare domain, so it is listed as "". */
function siteUrls() {
  return [
    { loc: "",                    changefreq: "weekly",  priority: "1.0" },
    { loc: "services.html",       changefreq: "monthly", priority: "0.9" },
    { loc: "service-areas.html",  changefreq: "monthly", priority: "0.9" },
    { loc: "contact.html",        changefreq: "monthly", priority: "0.9" },
    ...SERVICES.map((s) => ({ loc: "services/" + s.slug + ".html", changefreq: "monthly", priority: "0.8" })),
    ...AREAS.map((a) => ({ loc: "areas/" + a.slug + ".html", changefreq: "monthly", priority: "0.7" })),
    { loc: "about.html",          changefreq: "yearly",  priority: "0.6" },
    { loc: "our-work.html",       changefreq: "monthly", priority: "0.6" },
  ];
}

function buildSitemap() {
  const base = `https://${C.domain}/`;
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = siteUrls()
    .map((u) => `  <url>
    <loc>${base}${u.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`)
    .join("\n");

  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`);
}

function buildRobots() {
  const base = `https://${C.domain}/`;
  write("robots.txt", `User-agent: *
Allow: /

Sitemap: ${base}sitemap.xml
`);
}

/* ----------------------------------------------------------------------- */
/* RUN                                                                     */
/* ----------------------------------------------------------------------- */
console.log("Building " + C.name + " site...");
buildHome();
buildAbout();
buildServicesOverview();
buildServicePages();
buildAreasOverview();
buildAreaPages();
buildOurWork();
buildContact();
buildSitemap();
buildRobots();
console.log("Done.");
