/* Static site generator for Nova Refrigeration & Appliance Repair
 * Run: node build.js
 * Outputs plain static HTML into the project root (index.html, services/, areas/, ...).
 * All content is sourced from nova.txt. Contact details are PLACEHOLDERS — search
 * for the values in the CONFIG block below and replace them with the real ones. */

const fs = require("fs");
const path = require("path");
const COLLECTIONS = JSON.parse(fs.readFileSync(path.join(__dirname, "content", "collections.json"), "utf8"));
const HOME = JSON.parse(fs.readFileSync(path.join(__dirname, "content", "home.json"), "utf8"));
const SERVICE_CONTENT = JSON.parse(fs.readFileSync(path.join(__dirname, "content", "services.json"), "utf8"));
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

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
  priceRange: "$$",
  policyUpdated: "8 September 2026",   // bump when the privacy policy changes
  ogImage: "assets/og-image.jpg",
  geo: { lat: 30.2672, lng: -97.7431 },     // Austin, TX city centre
  // Public profiles, emitted as schema.org sameAs. Add the Google Business
  // Profile URL as soon as the listing is live — it is the strongest single
  // local-SEO signal this site can carry.
  social: [],
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

// Every supplied logo appears in the two rows directly below the home hero.
const BRAND_LOGOS = [
  ["Whirlpool", "residential/whirlpool logo1.webp"],
  ["Samsung", "residential/samsung.png"],
  ["Roper", "residential/roper-1.jpg"],
  ["Maytag", "residential/Maytag-logo-500x281.png"],
  ["LG", "residential/LG_logo_(2014).svg.webp"],
  ["GE Appliances", "residential/ge-appliances.png"],
  ["Frigidaire", "residential/Frigidaire-Logo-500x281.png"],
  ["Electrolux", "residential/electrolux.webp"],
  ["Bosch", "residential/bosch.webp"],
  ["Amana", "residential/Amana-Logo-500x300.png"],
  ["Wolf", "luxury/wolf.png"],
  ["Viking", "luxury/viking website.webp"],
  ["True Residential", "luxury/true logo1.webp"],
  ["Thor Kitchen", "luxury/thor kitchen.png"],
  ["Thermador", "luxury/Thermador_Logo-3000x443.png"],
  ["Sub-Zero", "luxury/Sub-Zero_(logo).svg.webp"],
  ["Speed Queen", "luxury/sppedqueen.webp"],
  ["Smeg", "luxury/Smeg_Logo-s1280.png"],
  ["Monogram", "luxury/monogram.png"],
  ["Miele", "luxury/miele-logo-png_seeklogo-92498.png"],
  ["KitchenAid", "luxury/kitchenaid.png"],
  ["JennAir", "luxury/jennair-logo-png_seeklogo-378387.png"],
  ["Gaggenau", "luxury/gaggenau-logo.png"],
  ["Fisher & Paykel", "luxury/fisher paykel.png"],
  ["Dacor", "luxury/dacor-logo-png-transparent.png"],
  ["Cove", "luxury/Cove_(logo).svg.webp"],
  ["Asko", "luxury/Asko_logo_wordmark-700x159.png"],
  ["Monogram", "luxury/67620f34e25f7843bb22e15f_monogram-logo-sandstone.svg"],
  ["Turbo Air", "commercial/Turbo_air_1200x666.png"],
  ["True Manufacturing", "commercial/true-manufacturing.png"],
  ["Traulsen", "commercial/traulsen.png"],
  ["Scotsman", "commercial/scotsman.png"],
  ["Hoshizaki", "commercial/hoshizaki.png"],
];

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

const FAQS = HOME.faq.map((item) => ({ q: item.question, a: item.answer }));

/* Active promotions — swap the `img` files in /assets for your own photos any time. */
const PROMOS = HOME.offers;

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

function cleanPath(p) {
  return p === "index.html" || p === "" ? "" : p.replace(/\.html$/, "");
}

function cleanPublicLinks(html, relPath) {
  const base = `https://${C.domain}/`;
  const domain = C.domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(new RegExp(`https://${domain}/([a-z0-9/-]+)\\.html(?=[#?"<\\s]|$)`, "g"), (_, p) => base + cleanPath(p + ".html"));
  return html.replace(/href="([^"]+\.html(?:[?#][^"]*)?)"/g, (match, href) => {
    const target = new URL(href, base + relPath);
    if (target.origin !== new URL(base).origin) return match;
    return `href="/${cleanPath(target.pathname.slice(1))}${target.search}${target.hash}"`;
  });
}

function head(depth, { title, desc, canonical, noindex, image, imageAlt, ogType }) {
  const base = `https://${C.domain}/`;
  const socialImage = image || C.ogImage;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<script>(function(){var t="light";try{if(localStorage.getItem("theme")==="dark")t="dark";}catch(e){}document.documentElement.setAttribute("data-theme",t);})();</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="icon" href="${rel(depth, "assets/favicon.svg")}" type="image/svg+xml">
<link rel="apple-touch-icon" href="${rel(depth, "assets/favicon.svg")}">
<meta name="description" content="${esc(desc)}">
${noindex ? '<meta name="robots" content="noindex, follow">\n' : ""}
<link rel="canonical" href="${base}${canonical === "index.html" ? "" : canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${ogType || "website"}">
<meta property="og:site_name" content="${C.name}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${base}${canonical === "index.html" ? "" : canonical}">
<meta property="og:image" content="${base}${socialImage}">
${image ? "" : '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">'}
<meta property="og:image:alt" content="${esc(imageAlt || `${C.name} — same-day appliance and refrigerator repair in ${C.cityState}`)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${base}${socialImage}">
<meta name="theme-color" content="#0b2a4a">
<link rel="stylesheet" href="${rel(depth, "css/styles.css")}?v=20260927-13">
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
      <details class="nav-group"><summary${active === "services" || active.startsWith("service:") ? ' class="active"' : ""}>Services</summary><div class="nav-submenu">
        ${link("services.html", "All Services", "services")}
        ${SERVICES.map((s) => link("services/" + s.slug + ".html", esc(s.name), "service:" + s.slug)).join("")}
      </div></details>
      <details class="nav-group"><summary${["areas", "work", "blog", "brands"].includes(active) ? ' class="active"' : ""}>Explore</summary><div class="nav-submenu">
        ${link("service-areas.html", "Service Areas", "areas")}
        ${link("our-work.html", "Our Work", "work")}
        ${link("blog.html", "Repair Guides", "blog")}
        ${link("brands.html", "Brands", "brands")}
        ${link("about.html", "About Us", "about")}
      </div></details>
      ${link("contact.html", "Contact", "contact")}
    </nav>
    <div class="header-actions">
      <button class="theme-toggle" aria-label="Toggle dark mode" title="Toggle dark mode"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.3 15.7A9 9 0 0 1 8.3 3.7 9 9 0 1 0 20.3 15.7Z"/></svg></button>
      <a class="btn btn-call" href="${telHref}">Call Now</a>
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
      <a class="btn btn-call btn-lg" href="${telHref}">Call ${C.phoneDisplay}</a>
      <a class="btn btn-outline btn-lg" href="${smsHref}">Text Us</a>
      <a class="btn btn-ghost btn-lg" href="${rel(depth, "contact.html")}">Schedule Service Online</a>
    </div>
  </div>
</section>`;
}

function footer(depth) {
  const sLinks = SERVICES
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
          <li><a href="${rel(depth, "privacy.html")}">Privacy Policy</a></li>
          <li><a href="${rel(depth, "our-work.html")}">Our Work</a></li>
          <li><a href="${rel(depth, "blog.html")}">Repair Guides</a></li>
          <li><a href="${rel(depth, "brands.html")}">Brands</a></li>
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
  <a class="mc-call" href="${telHref}">Call Now</a>
  <a class="mc-text" href="${smsHref}">Text Us</a>
</div>
<script src="${rel(depth, "js/main.js")}"></script>
${localBusinessSchema()}
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

const SITE = `https://${C.domain}/`;
const BIZ_ID = SITE + "#business";

function ldBlock(obj) {
  return `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, "\\u003c")}\n</script>`;
}

/* The business itself. Emitted on every page from footer() under one stable
 * @id, so every Service and BreadcrumbList can point back at the same node. */
function localBusinessSchema() {
  return ldBlock({
    "@context": "https://schema.org",
    "@type": ["HomeAndConstructionBusiness", "LocalBusiness"],
    "@id": BIZ_ID,
    name: C.name,
    alternateName: C.shortName,
    url: SITE,
    telephone: C.phoneTel,
    email: C.email,
    image: SITE + C.ogImage,
    logo: SITE + "assets/logo.svg",
    priceRange: C.priceRange,
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Credit Card, Debit Card",
    address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" },
    geo: { "@type": "GeoCoordinates", latitude: C.geo.lat, longitude: C.geo.lng },
    areaServed: AREAS.map((a) => ({ "@type": "City", name: a.name, addressRegion: "TX" })),
    openingHoursSpecification: [{
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "07:00", closes: "19:00",
    }],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Appliance repair services",
      itemListElement: SERVICES.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, url: SITE + "services/" + s.slug + ".html" },
      })),
    },
    description: "Residential appliance repair and refrigeration services in the Austin, Texas metro area.",
    ...(C.social.length ? { sameAs: C.social } : {}),
  });
}

function websiteSchema() {
  return ldBlock({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE + "#website",
    url: SITE,
    name: C.name,
    publisher: { "@id": BIZ_ID },
    inLanguage: "en-US",
  });
}

/* trail: [["Services", "services.html"], ["Dryer Repair", null]] — the last
 * item is the current page and carries no link. */
function breadcrumbSchema(trail) {
  return ldBlock({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [["Home", "index.html"], ...trail].map(([name, href], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
      ...(href ? { item: SITE + (href === "index.html" ? "" : href) } : {}),
    })),
  });
}

function serviceSchema(s) {
  return ldBlock({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": SITE + "services/" + s.slug + ".html#service",
    name: `${s.name} in ${C.cityState}`,
    serviceType: s.name,
    description: s.metaDesc,
    url: SITE + "services/" + s.slug + ".html",
    provider: { "@id": BIZ_ID },
    areaServed: AREAS.map((a) => ({ "@type": "City", name: a.name, addressRegion: "TX" })),
    audience: { "@type": "Audience", audienceType: "Homeowners" },
  });
}


/* Pages whose output actually changed in this run. The sitemap uses this so
 * <lastmod> reflects a real content change rather than the build date — telling
 * Google every page changed on every build devalues the signal. */
const changed = new Set();

function write(relPath, html) {
  const full = path.join(__dirname, relPath);
  const override = path.join(__dirname, "content", "page-overrides", relPath);
  if (relPath.endsWith(".html") && fs.existsSync(override)) {
    const saved = fs.readFileSync(override, "utf8");
    html = relPath === "index.html" ? syncHomeContent(saved, html) : saved;
  }
  if (relPath.endsWith(".html")) html = cleanPublicLinks(html, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  let previous = null;
  try { previous = fs.readFileSync(full, "utf8"); } catch (e) {}
  if (previous !== html) changed.add(relPath.replace(/\\/g, "/"));
  fs.writeFileSync(full, html, "utf8");
  console.log("  wrote " + relPath);
}

/* Keep structured home content current even when the visual page editor has
 * saved other customizations in an HTML override. */
function syncHomeContent(saved, generated) {
  for (const id of ["promos", "faq"]) {
    const re = new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/section>`, "i");
    const latest = generated.match(re)?.[0];
    if (latest && re.test(saved)) saved = saved.replace(re, latest);
  }
  const scriptRe = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi;
  const faqScript = [...generated.matchAll(scriptRe)].find(([block]) => {
    try { return JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/gi, "").trim())["@type"] === "FAQPage"; } catch { return false; }
  })?.[0];
  if (faqScript) saved = saved.replace(scriptRe, (block) => {
    try { return JSON.parse(block.replace(/^<script[^>]*>|<\/script>$/gi, "").trim())["@type"] === "FAQPage" ? faqScript : block; } catch { return block; }
  });
  return saved;
}

/* Reuse the <lastmod> already published for pages that did not change. */
function previousLastmod() {
  const map = new Map();
  try {
    const xml = fs.readFileSync(path.join(__dirname, "sitemap.xml"), "utf8");
    const re = /<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
    let m;
    while ((m = re.exec(xml))) map.set(m[1], m[2]);
  } catch (e) {}
  return map;
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
  return PROMOS.filter((p) => p.status !== "draft").map((p) => `
    <div class="card promo-card">
      <div class="promo-media"><img src="${rel(depth, esc(p.img))}" alt="${esc(p.alt || p.title)}" width="${Number(p.w) || 1200}" height="${Number(p.h) || 800}" loading="lazy" decoding="async"><span class="promo-badge">${esc(p.badge)}</span></div>
      <div class="promo-body">
        <div class="promo-price">${esc(p.price)} <span>${esc(p.unit)}</span></div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.desc)}</p>
        <a class="btn btn-call" href="${telHref}">Claim This Offer</a>
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
        <summary>${esc(f.q)}</summary>
        <div class="faq-body">${esc(f.a)}</div>
      </details>`).join("");
}

function faqSchema() {
  return ldBlock({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });
}

function brandChips() {
  return BRANDS.map((b) => `<div class="chip">${b}</div>`).join("\n      ");
}

function brandLogoRow(logos, reverse = false) {
  const items = (hidden) => logos.map(([name, file]) => {
    const src = encodeURI(`assets/logo/${file}`);
    const alt = hidden ? "" : `${name.replace(/&/g, "&amp;")} logo`;
    const classes = ["brand-logo-image"];
    if (name === "Viking") classes.push("brand-logo-viking");
    if (name === "Fisher & Paykel") classes.push("brand-logo-invert");
    if (["Whirlpool", "Bosch", "Electrolux", "Speed Queen", "Turbo Air", "Hoshizaki", "Roper"].includes(name)) classes.push("brand-logo-paper");
    if (["Roper", "Amana", "Frigidaire", "JennAir", "Miele", "Gaggenau", "Turbo Air", "Electrolux"].includes(name)) classes.push("brand-logo-crop");
    return `<span class="brand-logo-item"><img class="${classes.join(" ")}" src="${src}" alt="${alt}" width="160" height="72" loading="lazy" decoding="async"></span>`;
  }).join("\n        ");
  return `<div class="brand-logo-row${reverse ? " brand-logo-row-reverse" : ""}">
    <div class="brand-logo-track">
      <div class="brand-logo-group">${items(false)}</div>
      <div class="brand-logo-group" aria-hidden="true">${items(true)}</div>
    </div>
  </div>`;
}

function brandLogoSection() {
  const midpoint = Math.ceil(BRAND_LOGOS.length / 2);
  return `<section class="brand-logos" aria-labelledby="brand-logos-title">
  <h2 id="brand-logos-title" class="sr-only">Appliance brands we service</h2>
  ${brandLogoRow(BRAND_LOGOS.slice(0, midpoint))}
  ${brandLogoRow(BRAND_LOGOS.slice(midpoint), true)}
</section>`;
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
  }) + websiteSchema() + faqSchema() + header(0, "home") + `
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
      <a class="btn btn-call btn-lg" href="${telHref}">Call Now: ${C.phoneDisplay}</a>
      <a class="btn btn-outline btn-lg" href="${smsHref}">Text Us</a>
      <a class="btn btn-ghost btn-lg" href="contact.html">Request Service</a>
    </div>
    <div class="hero-truck">
      <img src="assets/nova-frontier-black.webp" alt="Black Nova-branded Nissan Frontier pickup facing left" width="1921" height="720" fetchpriority="high" decoding="async">
    </div>
  </div>
</section>

${brandLogoSection()}

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
  }) + breadcrumbSchema([["About Us", null]]) + header(0, "about")
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
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">Text Us</a>
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
  }) + breadcrumbSchema([["Services", null]]) + header(0, "services")
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
  const relatedGuides = { "refrigerator-repair": "refrigerator-warm-freezer-cold", "ice-maker-repair": "ice-maker-not-making-ice-guide", "washer-repair": "washer-not-draining-guide", "dryer-repair": "dryer-not-heating-guide" };
  SERVICES.forEach((s) => {
    const others = SERVICES.filter((o) => o.slug !== s.slug).slice(0, 4);
    const warranty = SERVICE_CONTENT.warranty;
    const serviceFaq = SERVICE_CONTENT.faq[s.slug] || [];
    const html = head(1, {
      title: `${s.name} in Austin, TX | Nova Refrigeration`,
      desc: s.metaDesc,
      canonical: "services/" + s.slug + ".html",
    }) + serviceSchema(s) + collectionFaqSchema(serviceFaq)
      + breadcrumbSchema([["Services", "services.html"], [s.name, null]])
      + header(1, "service:" + s.slug)
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
      ${(SERVICE_CONTENT.details[s.slug] || []).map((item) => `<h2>${esc(item.heading)}</h2><p>${esc(item.body)}</p>`).join("\n      ")}
${relatedGuides[s.slug] ? `      <p class="related-service-link">Want to understand the symptoms first? Read our <a href="${rel(1, `blog/${relatedGuides[s.slug]}.html`)}">${esc(COLLECTIONS.blog.posts.find((post) => post.slug === relatedGuides[s.slug]).title)}</a>.</p>` : ""}
      <h2>All major brands serviced</h2>
      <p>We repair ${BRANDS.join(", ")}, and more — including high-end and built-in models.</p>
      <h2>Same-day service across the ${C.cityState} metro</h2>
      <p>We serve ${AREAS.map((a) => a.name).join(", ")}. Call or request service online and we'll get you scheduled — often the same day.</p>
    </div>
    <div>
      <div class="form-wrap">
        <h3>Request ${s.name}</h3>
        <p class="form-note">Talk to a real technician. Same-day appointments available.</p>
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">Text Us</a>
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
<section class="section alt warranty-section" aria-labelledby="warranty-heading">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">Our commitment</span>
      <h2 id="warranty-heading">${esc(warranty.heading)}</h2>
      <p>${esc(warranty.intro)}</p>
    </div>
    <div class="grid grid-2 warranty-grid">
      ${warranty.cards.map((card) => `<div class="warranty-card"><span class="warranty-duration">${esc(card.duration)}</span><h3>${esc(card.title)}</h3><p>${esc(card.description)}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>
` + faqSection(serviceFaq) + ctaBand(1) + footer(1);
    write("services/" + s.slug + ".html", html);
  });
}

/* ---------- SERVICE AREAS OVERVIEW ---------- */
function buildAreasOverview() {
  const areaFaq = [
    { question: "Which Austin-area cities does Nova serve?", answer: "We serve Austin and nearby communities including Round Rock, Cedar Park, Georgetown, Pflugerville, Lakeway, Bee Cave, West Lake Hills, Buda, Kyle, The Hills, and Dripping Springs. Contact us to confirm an address near the edge of the service area." },
    { question: "Can I request more than one appliance repair during a visit?", answer: "Yes. Tell us about every appliance and its symptoms when booking so we can plan the appointment and explain the available options." }
  ];
  const html = head(0, {
    title: `Service Areas in the Austin Metro | Nova Repair`,
    desc: `Appliance and refrigerator repair across the ${C.cityState} metro — Austin, Round Rock, Cedar Park, Georgetown, Lakeway, Buda, Kyle and more.`,
    canonical: "service-areas.html",
  }) + breadcrumbSchema([["Service Areas", null]]) + collectionSchema("Appliance Repair Service Areas", "service-areas.html", `Appliance repair across the ${C.cityState} metro.`, AREAS.map((a) => ({ name: a.name, url: `areas/${a.slug}.html` }))) + collectionFaqSchema(areaFaq) + header(0, "areas")
    + pageHero(0, { title: "Service Areas", sub: `Proudly serving ${C.cityState} and communities across the metro with same-day appliance repair.`, crumbs: "Service Areas" })
    + `
<section class="section">
  <div class="container">
    <div class="section-head"><span class="eyebrow">Local coverage</span><h2>Find appliance repair in your city</h2><p>Choose your area for local service details, common appliance concerns, and the neighborhoods we cover.</p></div>
    <div class="area-overview-grid">
      ${AREAS.map((a) => `<a class="area-overview-card" href="${rel(0, `areas/${a.slug}.html`)}"><h3>${esc(a.name)}, TX</h3><p>${esc(a.heroSub)}</p><span>Explore ${esc(a.name)} service →</span></a>`).join("\n      ")}
    </div>
  </div>
</section>
<section class="section alt">
  <div class="container"><div class="section-head"><span class="eyebrow">What we repair</span><h2>Refrigeration, laundry, and kitchen appliances</h2><p>Our service area covers refrigerator and freezer cooling, ice makers, washers, dryers, dishwashers, ovens, and cooktops. Start with the appliance that needs attention, then check your city page.</p></div><div class="grid grid-3 area-service-links"><a href="${rel(0, "services/refrigerator-repair.html")}">Refrigerator Repair</a><a href="${rel(0, "services/washer-repair.html")}">Washer Repair</a><a href="${rel(0, "services/oven-repair.html")}">Oven &amp; Range Repair</a></div></div>
</section>
<section class="section">
  <div class="container narrow"><h2>Before you request an appointment</h2><p>Share the appliance brand and model number, the symptom, any error code, and your city. If more than one appliance needs attention, mention both when you contact us. Those details help us plan a useful visit and discuss availability.</p></div>
</section>
${faqSection(areaFaq)}
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
    }) + breadcrumbSchema([["Service Areas", "service-areas.html"], [a.name, null]])
      + header(1, "areas")
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

      <h2>Planning a repair visit in ${a.name}</h2>
      <p>Have the appliance model number, a description of the problem, and any error code ready when you contact us. If your concern involves ${a.common[0][0].toLowerCase()}, note when it started and whether the symptom changes during a cycle or at a particular time of day. That information helps us plan the right diagnostic checks.</p>

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
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">Call ${C.phoneDisplay}</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%;margin-bottom:10px">Text Us</a>
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
const published = (items) => items.filter((item) => item.status === "published");
const faqSection = (faq) => !faq?.length ? "" : `<section class="section section-alt"><div class="container narrow"><h2>Frequently Asked Questions</h2>${faq.map((item) => `<details class="faq-item"><summary>${esc(item.question)}</summary><div class="faq-body">${esc(item.answer)}</div></details>`).join("")}</div></section>`;
const collectionFaqSchema = (faq) => !faq?.length ? "" : ldBlock({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) });
const collectionSchema = (name, url, description, items) => ldBlock({ "@context": "https://schema.org", "@type": "CollectionPage", name, url: SITE + url, description, mainEntity: { "@type": "ItemList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name || item.title, url: SITE + item.url })) } });
const collectionCard = (depth, item) => `<a class="collection-card" href="${rel(depth, item.url)}">${item.image ? `<div class="collection-media"><img src="${rel(depth, item.image)}" alt="${esc(item.imageAlt || item.title)}" loading="lazy"></div>` : ""}<div class="collection-card-body">${item.kicker ? `<span class="eyebrow">${esc(item.kicker)}</span>` : ""}<h2>${esc(item.title)}</h2><p>${esc(item.excerpt)}</p><span class="arrow">Read more →</span></div></a>`;

function buildOurWork() {
  const data = COLLECTIONS.work;
  const projects = published(data.projects);
  const cards = projects.map((project) => ({ ...project, url: `work/${project.slug}.html`, kicker: project.sample ? "Illustrative example" : `${project.appliance} · ${project.area}` }));
  write("our-work.html", head(0, { title: `${data.title} | ${C.name}`, desc: data.metaDescription, canonical: "our-work.html" })
    + breadcrumbSchema([["Our Work", null]]) + collectionSchema(data.title, "our-work.html", data.metaDescription, cards) + collectionFaqSchema(data.faq)
    + header(0, "work") + pageHero(0, { title: data.title, sub: data.intro, crumbs: "Our Work" })
    + `<section class="section"><div class="container"><div class="collection-intro"><span class="eyebrow">Project gallery</span><h2>How appliance problems get solved</h2><p>Each story describes the symptoms, the diagnostic path, and the result. The examples below are illustrative placeholders until verified customer projects and photos are available.</p></div><div class="collection-grid">${cards.map((card) => collectionCard(0, card)).join("")}</div></div></section>`
    + faqSection(data.faq) + ctaBand(0) + footer(0));
  for (const project of projects) {
    const url = `work/${project.slug}.html`;
    const title = project.seoTitle || project.title;
    write(url, head(1, { title, desc: project.metaDescription, canonical: url, noindex: !!project.sample, image: project.image, imageAlt: project.imageAlt })
      + breadcrumbSchema([["Our Work", "our-work.html"], [project.title, null]])
      + ldBlock({ "@context": "https://schema.org", "@type": "WebPage", name: project.title, description: project.metaDescription, url: SITE + url, image: SITE + project.image, about: { "@type": "Service", name: `${project.appliance} repair`, provider: { "@id": BIZ_ID } } }) + collectionFaqSchema(project.faq)
      + header(1, "work") + pageHero(1, { title: project.title, sub: project.excerpt, crumbs: `<a href="${rel(1, "our-work.html")}">Our Work</a> › ${esc(project.title)}` })
      + `<section class="section"><div class="container article-layout"><article class="article-main">${project.sample ? `<p class="sample-note"><strong>Illustrative example:</strong> This scenario is sample content and does not describe a verified customer job.</p>` : ""}<img class="article-hero-image" src="${rel(1, project.image)}" alt="${esc(project.imageAlt)}"><div class="case-facts"><span>${esc(project.appliance)}</span><span>${esc(project.brand)}</span><span>${esc(project.area)}</span></div><h2>The problem</h2><p>${esc(project.problem)}</p><h2>Diagnosis</h2><p>${esc(project.diagnosis)}</p><h2>Result</h2><p>${esc(project.solution)}</p></article><aside class="article-aside"><h3>Have a similar problem?</h3><p>Describe your appliance and its symptoms. We can plan a diagnosis for your specific unit.</p><a class="btn btn-call" href="${telHref}">Call ${C.phoneDisplay}</a></aside></div></section>`
      + faqSection(project.faq) + ctaBand(1) + footer(1));
  }
}

function buildBlog() {
  const data = COLLECTIONS.blog;
  const posts = published(data.posts);
  const cards = posts.map((post) => ({ ...post, url: `blog/${post.slug}.html`, kicker: post.datePublished }));
  write("blog.html", head(0, { title: `${data.title} | ${C.name}`, desc: data.metaDescription, canonical: "blog.html" })
    + breadcrumbSchema([["Repair Guides", null]]) + collectionSchema(data.title, "blog.html", data.metaDescription, cards) + collectionFaqSchema(data.faq)
    + header(0, "blog") + pageHero(0, { title: data.title, sub: data.intro, crumbs: "Repair Guides" })
    + `<section class="section"><div class="container"><div class="collection-grid">${cards.map((card) => collectionCard(0, card)).join("")}</div></div></section>`
    + faqSection(data.faq) + ctaBand(0) + footer(0));
  for (const post of posts) {
    const url = `blog/${post.slug}.html`;
    write(url, head(1, { title: post.seoTitle || post.title, desc: post.metaDescription, canonical: url, image: post.image, imageAlt: post.imageAlt, ogType: "article" })
      + breadcrumbSchema([["Repair Guides", "blog.html"], [post.title, null]])
      + ldBlock({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.metaDescription, image: SITE + post.image, datePublished: post.datePublished, dateModified: post.dateModified, author: { "@type": "Organization", name: post.author, url: SITE }, publisher: { "@id": BIZ_ID }, mainEntityOfPage: SITE + url }) + collectionFaqSchema(post.faq)
      + header(1, "blog") + pageHero(1, { title: post.title, sub: post.excerpt, crumbs: `<a href="${rel(1, "blog.html")}">Repair Guides</a> › ${esc(post.title)}` })
      + `<section class="section"><div class="container article-layout"><article class="article-main"><p class="article-meta">${esc(post.datePublished)} · ${esc(post.author)}</p><img class="article-hero-image" src="${rel(1, post.image)}" alt="${esc(post.imageAlt)}">${post.sections.map((section) => `<h2>${esc(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}`).join("")}${post.relatedService && SERVICES.some((s) => s.slug === post.relatedService) ? `<p class="related-service-link">Need hands-on help? Explore our <a href="${rel(1, `services/${post.relatedService}.html`)}">${esc(SERVICES.find((s) => s.slug === post.relatedService).name)} service</a> in Austin.</p>` : ""}${post.sources?.length ? `<div class="article-sources"><h2>Sources</h2><ul>${post.sources.filter((source) => /^https:\/\//.test(source.url)).map((source) => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a></li>`).join("")}</ul></div>` : ""}</article><aside class="article-aside"><h3>Need a diagnosis?</h3><p>Tell us the model and what your appliance is doing. We serve Austin and nearby communities.</p><a class="btn btn-call" href="${telHref}">Call ${C.phoneDisplay}</a></aside></div></section>`
      + faqSection(post.faq) + ctaBand(1) + footer(1));
  }
}

function buildBrands() {
  const data = COLLECTIONS.brands;
  const profiles = published(data.profiles);
  const cards = profiles.map((brand) => ({ ...brand, url: `brands/${brand.slug}.html` }));
  write("brands.html", head(0, { title: `${data.title} | ${C.name}`, desc: data.metaDescription, canonical: "brands.html" })
    + breadcrumbSchema([["Brands", null]]) + collectionSchema(data.title, "brands.html", data.metaDescription, cards) + collectionFaqSchema(data.faq)
    + header(0, "brands") + pageHero(0, { title: data.title, sub: data.intro, crumbs: "Brands" })
    + `<section class="section"><div class="container"><div class="brand-page-grid">${cards.map((brand) => `<a class="brand-page-card" href="${rel(0, brand.url)}"><img src="${rel(0, brand.logo)}" alt="${esc(brand.name)} logo" loading="lazy"><h2>${esc(brand.name)}</h2><span>Explore service information →</span></a>`).join("")}</div></div></section>`
    + faqSection(data.faq) + ctaBand(0) + footer(0));
  for (const brand of profiles) {
    const url = `brands/${brand.slug}.html`;
    const index = profiles.findIndex((item) => item.slug === brand.slug);
    const related = Array.from({ length: Math.min(4, profiles.length - 1) }, (_, offset) => profiles[(index + offset + 1) % profiles.length]);
    write(url, head(1, { title: brand.title, desc: brand.metaDescription, canonical: url })
      + breadcrumbSchema([["Brands", "brands.html"], [brand.name, null]])
      + ldBlock({ "@context": "https://schema.org", "@type": "Service", name: brand.title, description: brand.metaDescription, url: SITE + url, provider: { "@id": BIZ_ID }, areaServed: { "@type": "City", name: "Austin", addressRegion: "TX" }, serviceType: `${brand.name} appliance repair` }) + collectionFaqSchema(brand.faq)
      + header(1, "brands") + pageHero(1, { title: brand.title, sub: brand.intro, crumbs: `<a href="${rel(1, "brands.html")}">Brands</a> › ${esc(brand.name)}` })
      + `<section class="section"><div class="container brand-detail"><div><span class="eyebrow">Brand service</span><h2>Common ${esc(brand.name)} issues we diagnose</h2><p>${esc(brand.intro)}</p><ul class="checklist">${brand.focus.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>${(brand.sections || []).map((section) => `<h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p>`).join("")}<p class="form-note">${esc(brand.name)} is a trademark of its owner. Nova does not claim manufacturer authorization.</p></div><div class="brand-logo-panel"><img src="${rel(1, brand.logo)}" alt="${esc(brand.name)} logo"><a class="btn btn-call" href="${telHref}">Call ${C.phoneDisplay}</a></div></div></section><section class="section alt"><div class="container"><div class="section-head"><span class="eyebrow">More brands</span><h2>Other appliance brands we service</h2><p>Explore repair information for other brands used in Austin homes.</p></div><div class="brand-page-grid">${related.map((item) => `<a class="brand-page-card" href="${rel(1, `brands/${item.slug}.html`)}"><img src="${rel(1, item.logo)}" alt="${esc(item.name)} logo" loading="lazy"><h3>${esc(item.name)}</h3><span>View brand service →</span></a>`).join("")}</div></div></section>`
      + faqSection(brand.faq) + ctaBand(1) + footer(1));
  }
}

/* ---------- PRIVACY POLICY ---------- */
function buildPrivacy() {
  const html = head(0, {
    title: `Privacy Policy | ${C.shortName}`,
    desc: `How ${C.name} collects, uses and protects the information you share when you request appliance repair service in the ${C.cityState} metro.`,
    canonical: "privacy.html",
  }) + breadcrumbSchema([["Privacy Policy", null]]) + header(0, "")
    + pageHero(0, {
        title: "Privacy Policy",
        sub: "What we collect when you contact us, why we collect it, and what we never do with it.",
        crumbs: "Privacy Policy",
      })
    + `
<section class="section">
  <div class="container">
    <div class="prose" style="max-width:760px">
      <p class="lead-in">${C.name} is a residential appliance repair company serving the ${C.cityState} metro. This policy explains what happens to the information you give us when you call, text or use the service request form on this site. It was last updated on ${C.policyUpdated}.</p>

      <h2>What we collect</h2>
      <p>When you submit the service request form we receive the name, phone number, email address, city, appliance type, brand and problem description you enter. When you call or text us we have your phone number and whatever you tell us about the repair. That is the entire set \u2014 we do not ask for payment details through this website, and the site does not process payments.</p>

      <h2>Why we collect it</h2>
      <p>Solely to schedule and carry out your repair: to call you back, confirm an appointment window, bring the right parts and follow up on the work. We may contact you about that specific request by phone, text or email.</p>

      <h2>What we do not do</h2>
      <ul class="checklist">
        <li>We do not sell, rent or trade your information to anyone.</li>
        <li>We do not add you to a marketing list because you requested a repair.</li>
        <li>We do not share your details with third parties except the service providers below.</li>
      </ul>

      <h2>Service providers</h2>
      <p>Form submissions are delivered to our email inbox through <a href="https://web3forms.com/" rel="noopener nofollow" target="_blank">Web3Forms</a>, which processes the submission and forwards it to us. The service area maps on this site are embedded from Google Maps, and Google may set cookies when a map loads. We do not run advertising trackers or sell data to advertising networks.</p>

      <h2>Cookies and local storage</h2>
      <p>This site stores one thing in your browser: your light or dark mode preference, kept in local storage on your own device so the site looks the same on your next visit. It is not an identifier, it never leaves your browser, and clearing your browser data removes it.</p>

      <h2>How long we keep it</h2>
      <p>Service requests stay in our email and job records for as long as we need them for warranty, follow-up repairs and standard business records. You can ask us to delete your information at any time.</p>

      <h2>Your choices</h2>
      <p>Ask us to correct or delete what we hold, or ask us to stop contacting you, and we will \u2014 call ${C.phoneDisplay} or email <a href="mailto:${C.email}">${C.email}</a>. If you would rather not submit anything through this website at all, call or text us instead; nothing is required through the form.</p>

      <h2>Children</h2>
      <p>This site is meant for homeowners arranging appliance repair and is not directed at children under 13. We do not knowingly collect information from children.</p>

      <h2>Changes</h2>
      <p>If this policy changes we will update this page. Material changes will be reflected in the date at the top.</p>

      <h2>Contact us</h2>
      <p>Questions about this policy? Call or text ${C.phoneDisplay}, or email <a href="mailto:${C.email}">${C.email}</a>.</p>
    </div>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("privacy.html", html);
}

/* ---------- 404 ---------- */
function build404() {
  const html = head(0, {
    title: `Page Not Found | ${C.shortName}`,
    desc: `That page could not be found. Call ${C.phoneDisplay} for same-day appliance and refrigerator repair in the ${C.cityState} metro, or browse our repair services.`,
    canonical: "404.html",
    noindex: true,
  }) + header(0, "")
    + pageHero(0, {
        title: "That page has moved on",
        sub: "The page you were after is not here \u2014 but your appliance still needs fixing. Start with one of these.",
      })
    + `
<section class="section">
  <div class="container">
    <div class="hero-cta" style="justify-content:center;margin-bottom:36px">
      <a class="btn btn-call btn-lg" href="${telHref}">Call ${C.phoneDisplay}</a>
      <a class="btn btn-primary btn-lg" href="${smsHref}">Text Us</a>
      <a class="btn btn-ghost btn-lg" href="contact.html">Request Service</a>
    </div>
    <h2 style="text-align:center">Repairs we handle</h2>
    <div class="grid grid-4" style="margin-top:24px">${serviceCards(0)}</div>
    <p class="form-note" style="text-align:center;margin-top:30px">
      Looking for your city? See every <a href="service-areas.html">area we serve</a>,
      or head back to the <a href="index.html">home page</a>.
    </p>
  </div>
</section>
` + ctaBand(0) + footer(0);
  write("404.html", html);
}

/* ---------- CONTACT ---------- */
function buildContact() {
  const serviceOptions = SERVICES.map((s) => `<option>${s.name}</option>`).join("\n              ");
  const html = head(0, {
    title: `Contact Us | ${C.name}`,
    desc: `Call, text or request service online for same-day appliance and refrigerator repair in ${C.cityState}. Talk to a real technician.`,
    canonical: "contact.html",
  }) + breadcrumbSchema([["Contact", null]]) + header(0, "contact")
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
        <a class="btn btn-call btn-lg" href="${telHref}" style="width:100%;margin-bottom:10px">Call Now</a>
        <a class="btn btn-primary btn-lg" href="${smsHref}" style="width:100%">Text Us</a>
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
    { loc: "", file: "index.html", changefreq: "weekly",  priority: "1.0" },
    { loc: "services.html",       changefreq: "monthly", priority: "0.9" },
    { loc: "service-areas.html",  changefreq: "monthly", priority: "0.9" },
    { loc: "contact.html",        changefreq: "monthly", priority: "0.9" },
    ...SERVICES.map((s) => ({ loc: "services/" + s.slug + ".html", changefreq: "monthly", priority: "0.8" })),
    ...AREAS.map((a) => ({ loc: "areas/" + a.slug + ".html", changefreq: "monthly", priority: "0.7" })),
    { loc: "about.html",          changefreq: "yearly",  priority: "0.6" },
    { loc: "our-work.html",       changefreq: "monthly", priority: "0.6" },
    ...published(COLLECTIONS.work.projects).filter((p) => !p.sample).map((p) => ({ loc: `work/${p.slug}.html`, changefreq: "monthly", priority: "0.6" })),
    { loc: "blog.html",           changefreq: "weekly", priority: "0.7" },
    ...published(COLLECTIONS.blog.posts).map((p) => ({ loc: `blog/${p.slug}.html`, changefreq: "monthly", priority: "0.6" })),
    { loc: "brands.html",         changefreq: "monthly", priority: "0.7" },
    ...published(COLLECTIONS.brands.profiles).map((p) => ({ loc: `brands/${p.slug}.html`, changefreq: "monthly", priority: "0.6" })),
    { loc: "privacy.html",        changefreq: "yearly",  priority: "0.3" },
  ];
}

function buildSitemap() {
  const base = `https://${C.domain}/`;
  const today = new Date().toISOString().slice(0, 10);
  const previous = previousLastmod();
  const urls = siteUrls()
    .map((u) => `  <url>
    <loc>${base}${cleanPath(u.loc)}</loc>
    <lastmod>${changed.has(u.file || u.loc) ? today : previous.get(base + cleanPath(u.loc)) || today}</lastmod>
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
buildBlog();
buildBrands();
buildContact();
buildPrivacy();
build404();
buildSitemap();
buildRobots();
console.log("Done.");
