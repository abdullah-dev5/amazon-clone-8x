import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function img(seed: string, w = 600, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type VariantSeed = {
  name: string;
  priceCents: number;
  compareAtCents?: number;
  stock: number;
};

type ProductSeed = {
  title: string;
  brand: string;
  description: string;
  variants: VariantSeed[];
  reviews: { authorName: string; rating: number; title?: string; body: string }[];
};

type CategorySeed = {
  slug: string;
  name: string;
  products: ProductSeed[];
};

const catalog: CategorySeed[] = [
  {
    slug: "electronics",
    name: "Electronics",
    products: [
      {
        title: "Noise-Cancelling Over-Ear Headphones",
        brand: "Audiora",
        description:
          "Wireless over-ear headphones with active noise cancellation, 30-hour battery life, and plush memory-foam ear cups for all-day comfort.",
        variants: [
          { name: "Midnight Black", priceCents: 12999, compareAtCents: 15999, stock: 42 },
          { name: "Arctic White", priceCents: 12999, stock: 18 },
          { name: "Navy Blue", priceCents: 13499, stock: 7 },
        ],
        reviews: [
          { authorName: "Priya K.", rating: 5, title: "Best headphones I've owned", body: "The noise cancellation is incredible on flights. Battery easily lasts a full week of commuting." },
          { authorName: "Marcus T.", rating: 4, title: "Great sound, a bit tight", body: "Sound quality is excellent but they run a little snug on bigger heads." },
          { authorName: "Elena R.", rating: 5, body: "Comfortable enough for 6+ hour work sessions. Worth the price." },
        ],
      },
      {
        title: "65W USB-C Fast Charger with 2 Ports",
        brand: "VoltEdge",
        description:
          "Compact GaN charger delivering 65W total output across two USB-C ports, fast enough to charge a laptop and phone simultaneously.",
        variants: [
          { name: "Standard", priceCents: 2999, stock: 120 },
        ],
        reviews: [
          { authorName: "Dev P.", rating: 5, body: "Tiny brick, charges my laptop faster than the stock charger did." },
          { authorName: "Sam O.", rating: 4, title: "Solid", body: "Gets warm under heavy load but never dangerously so." },
        ],
      },
      {
        title: "4K Ultra HD Smart Monitor, 27-inch",
        brand: "Clearview",
        description:
          "27-inch 4K IPS monitor with HDR10, 99% sRGB color accuracy, built-in speakers, and USB-C connectivity with 65W power delivery.",
        variants: [
          { name: "27-inch", priceCents: 32999, compareAtCents: 37999, stock: 25 },
          { name: "32-inch", priceCents: 44999, stock: 11 },
        ],
        reviews: [
          { authorName: "Lauren F.", rating: 5, title: "Gorgeous display", body: "Colors are punchy and text is razor sharp for coding all day." },
          { authorName: "Ibrahim A.", rating: 3, body: "Good panel but the stand only tilts, no height adjustment." },
        ],
      },
      {
        title: "Mechanical Keyboard, Hot-Swappable Switches",
        brand: "KeyForge",
        description:
          "75% layout mechanical keyboard with hot-swappable switches, PBT keycaps, and per-key RGB backlighting. Wired and Bluetooth modes.",
        variants: [
          { name: "Linear Red Switches", priceCents: 8999, stock: 33 },
          { name: "Tactile Brown Switches", priceCents: 8999, stock: 29 },
          { name: "Clicky Blue Switches", priceCents: 8999, stock: 14 },
        ],
        reviews: [
          { authorName: "Grace L.", rating: 5, title: "Feels premium", body: "Swapped switches in ten minutes with no tools besides the included puller." },
          { authorName: "Owen B.", rating: 4, body: "Great board, Bluetooth pairing to a third device is a little finicky." },
        ],
      },
      {
        title: "Portable Bluetooth Speaker, Waterproof",
        brand: "Audiora",
        description:
          "IP67 waterproof portable speaker with 24-hour battery, deep bass, and pairing for two speakers in stereo mode.",
        variants: [
          { name: "Charcoal", priceCents: 5999, stock: 60 },
          { name: "Coral", priceCents: 5999, stock: 22 },
          { name: "Ocean Blue", priceCents: 6299, stock: 15 },
        ],
        reviews: [
          { authorName: "Nina C.", rating: 5, body: "Took it kayaking, survived a full dunk with zero issues." },
          { authorName: "Tyler M.", rating: 4, title: "Loud for its size", body: "Bass is surprisingly strong. Docks a star for the case-only charging port." },
        ],
      },
      {
        title: "Fitness Tracker with Heart Rate & GPS",
        brand: "Pulseware",
        description:
          "Slim fitness band with built-in GPS, continuous heart-rate tracking, sleep scoring, and 10-day battery life.",
        variants: [
          { name: "Black Band", priceCents: 7999, stock: 48 },
          { name: "Sand Band", priceCents: 7999, stock: 31 },
        ],
        reviews: [
          { authorName: "Ana S.", rating: 4, body: "GPS lock is fast and accurate for runs. App could be better." },
          { authorName: "Chris D.", rating: 5, title: "Battery life as advertised", body: "Genuinely lasts over a week for me with always-on display off." },
        ],
      },
      {
        title: "Wireless Charging Stand, 15W",
        brand: "VoltEdge",
        description:
          "Adjustable-angle 15W wireless charging stand compatible with most Qi-enabled phones, with a status LED and non-slip base.",
        variants: [
          { name: "Standard", priceCents: 2499, stock: 90 },
        ],
        reviews: [
          { authorName: "Rosa H.", rating: 4, body: "Works through most thin cases without removing them. Good value." },
        ],
      },
      {
        title: "1TB Portable SSD, USB-C",
        brand: "Clearview",
        description:
          "Pocket-sized 1TB solid-state drive with read speeds up to 1050MB/s, shock-resistant aluminum housing, and USB-C cable included.",
        variants: [
          { name: "1TB", priceCents: 8999, stock: 40 },
          { name: "2TB", priceCents: 15999, stock: 16 },
        ],
        reviews: [
          { authorName: "Femi O.", rating: 5, title: "Blazing fast", body: "Editing 4K footage directly off this drive with no stutter." },
          { authorName: "Kelly W.", rating: 5, body: "Small enough to keep on a keychain, genuinely." },
        ],
      },
    ],
  },
  {
    slug: "home-kitchen",
    name: "Home & Kitchen",
    products: [
      {
        title: "Stainless Steel French Press, 34oz",
        brand: "Brewline",
        description:
          "Double-wall insulated stainless steel French press that keeps coffee hot for hours, with a fine mesh filter to reduce sediment.",
        variants: [
          { name: "34oz", priceCents: 3499, stock: 55 },
          { name: "50oz", priceCents: 4299, stock: 20 },
        ],
        reviews: [
          { authorName: "Walt B.", rating: 5, body: "Keeps coffee hot for over two hours. Cleanup is easy too." },
          { authorName: "Maria G.", rating: 4, title: "Sturdy build", body: "Handle gets a little warm with very hot water but not uncomfortable." },
        ],
      },
      {
        title: "Non-Stick Ceramic Cookware Set, 10-Piece",
        brand: "Hearthcraft",
        description:
          "10-piece ceramic non-stick cookware set including frying pans, saucepans, and a stockpot, all oven-safe up to 450°F.",
        variants: [
          { name: "10-Piece Set", priceCents: 15999, compareAtCents: 19999, stock: 24 },
        ],
        reviews: [
          { authorName: "Diane K.", rating: 5, title: "Replaced my old Teflon set", body: "Nothing sticks, even eggs with no oil. Feels much healthier to cook with." },
          { authorName: "Robert J.", rating: 3, body: "Good pans but the lids don't seal as tightly as I'd like." },
        ],
      },
      {
        title: "Robot Vacuum with Mapping",
        brand: "Sweepix",
        description:
          "Self-charging robot vacuum with LiDAR room mapping, app-controlled zone cleaning, and a self-emptying base with 60-day capacity.",
        variants: [
          { name: "With Self-Empty Base", priceCents: 34999, stock: 12 },
          { name: "Without Base", priceCents: 22999, stock: 19 },
        ],
        reviews: [
          { authorName: "Yusuf A.", rating: 4, title: "Maps the house perfectly", body: "The zone-cleaning feature is a game changer for pet hair around the couch." },
          { authorName: "Beth N.", rating: 5, body: "Self-empty base means I genuinely forget it's running for weeks." },
        ],
      },
      {
        title: "6-Quart Programmable Slow Cooker",
        brand: "Hearthcraft",
        description:
          "6-quart slow cooker with programmable timer, three heat settings, and a locking lid for easy transport to potlucks.",
        variants: [
          { name: "Stainless Steel", priceCents: 4499, stock: 38 },
          { name: "Matte Black", priceCents: 4699, stock: 21 },
        ],
        reviews: [
          { authorName: "Carol S.", rating: 5, body: "Set it before work, dinner's ready by the time I'm home. Every time." },
        ],
      },
      {
        title: "Memory Foam Bath Mat, Extra Soft",
        brand: "Nestwell",
        description:
          "Ultra-plush memory foam bath mat with a non-slip backing and quick-dry surface, machine washable.",
        variants: [
          { name: "Grey", priceCents: 1999, stock: 80 },
          { name: "Sage Green", priceCents: 1999, stock: 65 },
          { name: "Terracotta", priceCents: 1999, stock: 40 },
        ],
        reviews: [
          { authorName: "Hana M.", rating: 5, body: "So plush, feels like stepping onto a cloud out of the shower." },
          { authorName: "Greg P.", rating: 4, body: "Great mat, takes a while to fully air dry in humid weather." },
        ],
      },
      {
        title: "Digital Air Fryer, 6-Quart",
        brand: "Sweepix",
        description:
          "6-quart digital air fryer with 8 presets, a dishwasher-safe basket, and rapid hot-air circulation for crispy results with little oil.",
        variants: [
          { name: "6-Quart", priceCents: 7999, compareAtCents: 9999, stock: 45 },
        ],
        reviews: [
          { authorName: "Isabel R.", rating: 5, title: "Use it almost daily", body: "Fries, wings, reheated pizza — all come out crisp, not soggy like the microwave." },
          { authorName: "Noah L.", rating: 4, body: "Great results, basket is a bit loud when shaking mid-cook." },
        ],
      },
      {
        title: "Bamboo Cutting Board Set, 3-Piece",
        brand: "Nestwell",
        description:
          "Set of three organic bamboo cutting boards in graduated sizes, with juice grooves and built-in handles for easy storage.",
        variants: [
          { name: "3-Piece Set", priceCents: 2999, stock: 70 },
        ],
        reviews: [
          { authorName: "Trevor H.", rating: 4, body: "Solid boards, knife-friendly surface. Wish the handles were a bit bigger." },
        ],
      },
      {
        title: "Adjustable Standing Desk Converter",
        brand: "Deskline",
        description:
          "Spring-assisted standing desk converter with a spacious keyboard tray, smooth height adjustment, and dual monitor support.",
        variants: [
          { name: "28-inch", priceCents: 12999, stock: 17 },
          { name: "35-inch", priceCents: 15999, stock: 9 },
        ],
        reviews: [
          { authorName: "Fatima Z.", rating: 5, title: "Easy transition to standing", body: "Goes from sitting to standing in two seconds, no motor needed." },
          { authorName: "Colin W.", rating: 3, body: "Works well but takes up more desk depth than I expected — measure first." },
        ],
      },
    ],
  },
  {
    slug: "books",
    name: "Books",
    products: [
      {
        title: "The Midnight Cartographer",
        brand: "Harlow & Vine Press",
        description:
          "A sweeping literary mystery about a mapmaker who discovers her latest commission traces the route of a disappearance decades old.",
        variants: [
          { name: "Paperback", priceCents: 1699, stock: 150 },
          { name: "Hardcover", priceCents: 2699, stock: 40 },
          { name: "Kindle Edition", priceCents: 999, stock: 9999 },
        ],
        reviews: [
          { authorName: "Bookish_Nell", rating: 5, title: "Couldn't put it down", body: "The twist in the final third completely recontextualizes the first half." },
          { authorName: "Quiet Reader", rating: 4, body: "Slow start but the payoff is worth it." },
        ],
      },
      {
        title: "Deep Work Habits: A Practical Guide",
        brand: "Anchor Point Books",
        description:
          "A pragmatic, research-backed guide to building focus habits in a distraction-saturated world, with weekly exercises.",
        variants: [
          { name: "Paperback", priceCents: 1899, stock: 90 },
          { name: "Kindle Edition", priceCents: 1099, stock: 9999 },
        ],
        reviews: [
          { authorName: "Productivity_Dan", rating: 5, body: "Actually changed how I structure my mornings. Not just theory." },
          { authorName: "SkepticalReader", rating: 3, title: "Useful but repetitive", body: "Good core ideas stretched across more pages than needed." },
        ],
      },
      {
        title: "Atlas of Forgotten Coastlines",
        brand: "Harlow & Vine Press",
        description:
          "A richly illustrated collection of essays on vanished coastal towns, paired with hand-drawn historical maps.",
        variants: [
          { name: "Hardcover", priceCents: 3499, stock: 22 },
        ],
        reviews: [
          { authorName: "MapCollector", rating: 5, body: "Gorgeous production quality, the fold-out maps alone are worth it." },
        ],
      },
      {
        title: "The Quiet Algorithm",
        brand: "Northfall Publishing",
        description:
          "A near-future thriller following an engineer who discovers her company's recommendation engine is quietly rewriting elections.",
        variants: [
          { name: "Paperback", priceCents: 1599, stock: 120 },
          { name: "Kindle Edition", priceCents: 899, stock: 9999 },
        ],
        reviews: [
          { authorName: "TechyTina", rating: 4, body: "Plausible enough to be unsettling. Pacing drags a little in the middle." },
          { authorName: "Marcus T.", rating: 5, title: "Best tech-thriller in years", body: "Read it in two sittings." },
        ],
      },
      {
        title: "Small Kitchen, Big Flavor",
        brand: "Anchor Point Books",
        description:
          "A cookbook built around one-pan and one-pot meals for tiny kitchens, with 90 recipes and swap suggestions for common allergens.",
        variants: [
          { name: "Hardcover", priceCents: 2299, stock: 55 },
        ],
        reviews: [
          { authorName: "HomeChef_Ana", rating: 5, body: "Every recipe I've tried has worked exactly as written, first try." },
          { authorName: "Rentkitchen", rating: 4, body: "Great for small spaces, wish there were more vegetarian options." },
        ],
      },
      {
        title: "Children of the Long Winter",
        brand: "Northfall Publishing",
        description:
          "Book one of an epic fantasy trilogy set in a world where the seasons last a generation each.",
        variants: [
          { name: "Paperback", priceCents: 1799, stock: 200 },
          { name: "Hardcover", priceCents: 2899, stock: 30 },
          { name: "Kindle Edition", priceCents: 1099, stock: 9999 },
        ],
        reviews: [
          { authorName: "FantasyFan22", rating: 5, title: "New favorite series", body: "World-building rivals the greats. Can't wait for book two." },
          { authorName: "CriticalReader", rating: 3, body: "Strong world, but the middle third meanders." },
        ],
      },
    ],
  },
  {
    slug: "fashion",
    name: "Clothing, Shoes & Jewelry",
    products: [
      {
        title: "Classic Fit Oxford Button-Down Shirt",
        brand: "Harbor & Finch",
        description:
          "100% cotton oxford shirt with a classic fit, button-down collar, and reinforced stitching for everyday wear.",
        variants: [
          { name: "Small", priceCents: 4499, stock: 30 },
          { name: "Medium", priceCents: 4499, stock: 45 },
          { name: "Large", priceCents: 4499, stock: 38 },
          { name: "X-Large", priceCents: 4499, stock: 20 },
        ],
        reviews: [
          { authorName: "Devon K.", rating: 5, body: "Fits true to size and the fabric feels substantial, not flimsy." },
          { authorName: "Marcus T.", rating: 4, title: "Great shirt, runs slightly long", body: "Good quality for the price, just a bit long in the torso for me." },
        ],
      },
      {
        title: "High-Waisted Running Leggings",
        brand: "Pace & Grain",
        description:
          "Squat-proof high-waisted leggings with a hidden waistband pocket, four-way stretch fabric, and flatlock seams.",
        variants: [
          { name: "XS", priceCents: 3999, stock: 40 },
          { name: "S", priceCents: 3999, stock: 55 },
          { name: "M", priceCents: 3999, stock: 60 },
          { name: "L", priceCents: 3999, stock: 33 },
        ],
        reviews: [
          { authorName: "Runner_Kate", rating: 5, title: "Genuinely squat-proof", body: "Held up through a full marathon training block, zero pilling." },
          { authorName: "Olivia N.", rating: 5, body: "The pocket fits my phone securely even sprinting." },
        ],
      },
      {
        title: "Leather Minimalist Wallet",
        brand: "Harbor & Finch",
        description:
          "Slim genuine-leather wallet with RFID-blocking lining, six card slots, and a discreet cash pocket.",
        variants: [
          { name: "Espresso Brown", priceCents: 3499, stock: 65 },
          { name: "Black", priceCents: 3499, stock: 70 },
        ],
        reviews: [
          { authorName: "Ian F.", rating: 4, body: "Slim as promised, took a couple weeks to break in and lay flat." },
        ],
      },
      {
        title: "Waterproof Hiking Boots",
        brand: "Summit Trail",
        description:
          "Mid-cut waterproof hiking boots with an aggressive rubber outsole, cushioned midsole, and breathable membrane lining.",
        variants: [
          { name: "US 8", priceCents: 12999, stock: 12 },
          { name: "US 9", priceCents: 12999, stock: 20 },
          { name: "US 10", priceCents: 12999, stock: 25 },
          { name: "US 11", priceCents: 12999, stock: 15 },
        ],
        reviews: [
          { authorName: "TrailBlazer_Sam", rating: 5, title: "Kept my feet dry through creek crossings", body: "Sole grip on wet rock is excellent. Comfortable out of the box." },
          { authorName: "Weekend_Hiker", rating: 4, body: "Great boots, took a short break-in period before they felt fully comfortable." },
        ],
      },
      {
        title: "Sterling Silver Pendant Necklace",
        brand: "Wren & Co.",
        description:
          "Handcrafted sterling silver pendant on an 18-inch adjustable chain, tarnish-resistant coating, comes in a gift box.",
        variants: [
          { name: "18-inch", priceCents: 5499, stock: 28 },
          { name: "20-inch", priceCents: 5799, stock: 19 },
        ],
        reviews: [
          { authorName: "Grace L.", rating: 5, body: "Beautiful in person, arrived in lovely packaging — great gift." },
        ],
      },
      {
        title: "Merino Wool Crew Socks, 3-Pack",
        brand: "Summit Trail",
        description:
          "Cushioned merino wool blend crew socks, naturally odor-resistant and temperature-regulating for all-day wear.",
        variants: [
          { name: "S/M", priceCents: 2199, stock: 90 },
          { name: "L/XL", priceCents: 2199, stock: 75 },
        ],
        reviews: [
          { authorName: "Petra V.", rating: 5, title: "No more sweaty feet", body: "Wear these hiking and at the office both. Never bunch up." },
        ],
      },
    ],
  },
  {
    slug: "sports-outdoors",
    name: "Sports & Outdoors",
    products: [
      {
        title: "Adjustable Dumbbell Set, 5-52.5 lbs",
        brand: "Ironloop",
        description:
          "Space-saving adjustable dumbbells that replace 15 sets of weights, adjustable in 2.5lb increments via a dial.",
        variants: [
          { name: "Pair", priceCents: 34999, compareAtCents: 39999, stock: 14 },
        ],
        reviews: [
          { authorName: "LiftLog_Jay", rating: 5, title: "Replaced my whole rack", body: "Dial adjustment is fast between sets, no fumbling with plates." },
          { authorName: "HomeGymHelen", rating: 4, body: "Bulky when set to max weight but functions flawlessly." },
        ],
      },
      {
        title: "Insulated Stainless Steel Water Bottle, 32oz",
        brand: "Trailpeak",
        description:
          "Double-wall vacuum insulated bottle that keeps drinks cold for 24 hours or hot for 12, with a leak-proof flip lid.",
        variants: [
          { name: "Forest Green", priceCents: 2799, stock: 100 },
          { name: "Slate Grey", priceCents: 2799, stock: 85 },
          { name: "Sunset Orange", priceCents: 2799, stock: 40 },
        ],
        reviews: [
          { authorName: "TrailBlazer_Sam", rating: 5, body: "Still had ice cubes after 20 hours in a hot car. Impressive." },
        ],
      },
      {
        title: "2-Person Backpacking Tent, 3-Season",
        brand: "Trailpeak",
        description:
          "Ultralight 2-person tent with a freestanding aluminum pole structure, double-wall design, and a 3-minute setup.",
        variants: [
          { name: "Standard", priceCents: 18999, stock: 16 },
        ],
        reviews: [
          { authorName: "Weekend_Hiker", rating: 5, title: "Survived a surprise storm", body: "Stayed bone dry through heavy rain and wind on the AT." },
          { authorName: "Petra V.", rating: 4, body: "Great tent, vestibule is a bit tight for two packs." },
        ],
      },
      {
        title: "Yoga Mat, Extra Thick Non-Slip",
        brand: "Ironloop",
        description:
          "6mm extra-thick yoga mat with a textured non-slip surface on both sides and a carrying strap included.",
        variants: [
          { name: "Deep Teal", priceCents: 2999, stock: 70 },
          { name: "Blush Pink", priceCents: 2999, stock: 60 },
          { name: "Charcoal", priceCents: 2999, stock: 55 },
        ],
        reviews: [
          { authorName: "Runner_Kate", rating: 4, body: "Nice cushion for knees, slight rubber smell for the first day or two." },
        ],
      },
      {
        title: "Folding Camping Chair with Cup Holder",
        brand: "Trailpeak",
        description:
          "Lightweight folding camp chair with a padded seat, side cup holder, and a compact carry bag, rated to 300 lbs.",
        variants: [
          { name: "Forest Green", priceCents: 3999, stock: 45 },
          { name: "Navy", priceCents: 3999, stock: 38 },
        ],
        reviews: [
          { authorName: "CampfireCarl", rating: 5, body: "Sets up in seconds and packs down smaller than I expected." },
        ],
      },
      {
        title: "Bike Repair Tool Kit, 16-in-1",
        brand: "Ironloop",
        description:
          "Compact multi-tool with 16 functions for on-the-go bike repairs, including tire levers and a chain breaker, in a zip case.",
        variants: [
          { name: "Standard", priceCents: 2499, stock: 88 },
        ],
        reviews: [
          { authorName: "CommuteCyclist", rating: 5, title: "Saved my ride home", body: "Fixed a snapped chain on the trail with the built-in breaker. Worth every cent." },
        ],
      },
    ],
  },
  {
    slug: "beauty",
    name: "Beauty & Personal Care",
    products: [
      {
        title: "Vitamin C Brightening Serum",
        brand: "Lumeglow",
        description:
          "20% vitamin C serum with ferulic acid and vitamin E, formulated to brighten skin tone and reduce the look of fine lines.",
        variants: [
          { name: "30ml", priceCents: 2899, stock: 75 },
          { name: "50ml", priceCents: 4299, stock: 30 },
        ],
        reviews: [
          { authorName: "SkinCareSteph", rating: 5, title: "Visible difference in two weeks", body: "Brightened my under-eye area more than any product I've tried." },
          { authorName: "GlowGetter", rating: 4, body: "Great serum, a little sticky until fully absorbed." },
        ],
      },
      {
        title: "Electric Sonic Toothbrush with Travel Case",
        brand: "Brightline",
        description:
          "Rechargeable sonic toothbrush with 5 cleaning modes, a 2-minute smart timer, and a magnetic charging travel case.",
        variants: [
          { name: "White", priceCents: 4999, stock: 50 },
          { name: "Black", priceCents: 4999, stock: 42 },
        ],
        reviews: [
          { authorName: "DentalDan", rating: 5, body: "My hygienist noticed the difference at my last cleaning." },
        ],
      },
      {
        title: "Argan Oil Hair Mask, Deep Conditioning",
        brand: "Lumeglow",
        description:
          "Weekly deep-conditioning hair mask with argan oil and shea butter to repair dry, damaged, or color-treated hair.",
        variants: [
          { name: "8oz", priceCents: 1899, stock: 64 },
        ],
        reviews: [
          { authorName: "CurlyCarmen", rating: 5, title: "Tamed my frizz completely", body: "One use and my curls were soft and defined, not crunchy." },
          { authorName: "ColorTreated_Jo", rating: 4, body: "Great for damaged ends, a little heavy if used on roots." },
        ],
      },
      {
        title: "Mineral Sunscreen SPF 50, Reef Safe",
        brand: "Brightline",
        description:
          "Broad-spectrum mineral sunscreen with zinc oxide, water-resistant for 80 minutes, and reef-safe with no white cast.",
        variants: [
          { name: "1.7oz", priceCents: 2199, stock: 90 },
        ],
        reviews: [
          { authorName: "BeachDay_Bri", rating: 5, body: "Finally a mineral sunscreen with zero white cast on my skin tone." },
          { authorName: "TrailBlazer_Sam", rating: 4, body: "Great protection, needs a firm rub-in to avoid streaking." },
        ],
      },
      {
        title: "Bamboo Safety Razor with 10 Blades",
        brand: "Brightline",
        description:
          "Sustainable bamboo-handle safety razor with a stainless steel head and 10 replacement blades included.",
        variants: [
          { name: "Standard", priceCents: 2499, stock: 55 },
        ],
        reviews: [
          { authorName: "EcoEthan", rating: 5, title: "Closest shave I've had", body: "Took two tries to get the angle right, now it's the best shave of my life." },
        ],
      },
    ],
  },
  {
    slug: "toys-games",
    name: "Toys & Games",
    products: [
      {
        title: "1000-Piece Jigsaw Puzzle, Mountain Vista",
        brand: "Puzzlecraft",
        description:
          "1000-piece jigsaw puzzle featuring a hand-illustrated mountain vista, printed on premium thick cardboard with a linen finish.",
        variants: [
          { name: "Standard", priceCents: 1799, stock: 60 },
        ],
        reviews: [
          { authorName: "PuzzleParent", rating: 5, body: "Pieces fit snugly, no fuzzy edges like cheaper puzzles. Beautiful image too." },
        ],
      },
      {
        title: "Wooden Building Block Set, 120 Pieces",
        brand: "Timberjoy",
        description:
          "120-piece natural wood building block set in varied shapes, sanded smooth and finished with non-toxic paint, for ages 3+.",
        variants: [
          { name: "120-Piece Set", priceCents: 3499, stock: 40 },
        ],
        reviews: [
          { authorName: "ToddlerMom_Lee", rating: 5, title: "Holds attention for an hour straight", body: "Great variety of shapes, no splinters or sharp edges." },
        ],
      },
      {
        title: "Strategy Board Game: Settlers of Kaldara",
        brand: "Puzzlecraft",
        description:
          "A resource-trading strategy board game for 3-5 players, roughly 90 minutes per game, with expansion-ready components.",
        variants: [
          { name: "Base Game", priceCents: 4499, stock: 35 },
        ],
        reviews: [
          { authorName: "BoardGameBex", rating: 5, title: "New game night staple", body: "Deep enough to stay interesting after a dozen plays, rules teach fast." },
          { authorName: "CasualCarl", rating: 4, body: "Great game, first playthrough rules explanation takes a while." },
        ],
      },
      {
        title: "Remote Control Stunt Car",
        brand: "Timberjoy",
        description:
          "All-terrain RC stunt car with 360-degree flips, dual-mode wheels for wall driving, and a 40-minute battery life.",
        variants: [
          { name: "Red", priceCents: 3999, stock: 48 },
          { name: "Blue", priceCents: 3999, stock: 30 },
        ],
        reviews: [
          { authorName: "RC_Robbie", rating: 4, body: "Flips are genuinely fun, battery could last a bit longer." },
        ],
      },
      {
        title: "Modeling Clay Kit, 24 Colors",
        brand: "Timberjoy",
        description:
          "24-color non-toxic modeling clay kit with sculpting tools and a reusable storage case, air-dry and oven-bake options.",
        variants: [
          { name: "24-Color Kit", priceCents: 2299, stock: 70 },
        ],
        reviews: [
          { authorName: "ArtsyAva", rating: 5, body: "Colors mix well and don't dry out even after weeks in the case." },
        ],
      },
    ],
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  for (const cat of catalog) {
    const category = await prisma.category.create({
      data: {
        slug: cat.slug,
        name: cat.name,
        imageUrl: img(`cat-${cat.slug}`, 400, 300),
      },
    });

    for (const p of cat.products) {
      const slug = slugify(`${p.brand}-${p.title}`);
      const images = [img(`${slug}-1`), img(`${slug}-2`), img(`${slug}-3`)];
      const avgRating =
        p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length;

      const product = await prisma.product.create({
        data: {
          slug,
          title: p.title,
          description: p.description,
          brand: p.brand,
          categoryId: category.id,
          images: JSON.stringify(images),
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: p.reviews.length,
        },
      });

      for (let i = 0; i < p.variants.length; i++) {
        const v = p.variants[i];
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: v.name,
            sku: slugify(`${slug}-${v.name}`),
            priceCents: v.priceCents,
            compareAtCents: v.compareAtCents,
            stock: v.stock,
            imageUrl: img(`${slug}-${slugify(v.name)}`),
            isDefault: i === 0,
          },
        });
      }

      for (const r of p.reviews) {
        await prisma.review.create({
          data: {
            productId: product.id,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            body: r.body,
          },
        });
      }
    }
  }

  const demoPasswordHash = await bcrypt.hash("password123", 10);
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@example.com",
      passwordHash: demoPasswordHash,
      name: "Demo Shopper",
    },
  });

  await prisma.address.create({
    data: {
      userId: demoUser.id,
      fullName: "Demo Shopper",
      line1: "500 Amazon Way",
      line2: "Apt 12",
      city: "Seattle",
      state: "WA",
      postalCode: "98109",
      country: "US",
      phone: "555-010-1234",
      isDefault: true,
    },
  });

  await prisma.cart.create({ data: { userId: demoUser.id } });
  await prisma.wishlist.create({ data: { userId: demoUser.id } });

  const productCount = await prisma.product.count();
  const categoryCount = await prisma.category.count();
  console.log(
    `Seeded ${categoryCount} categories, ${productCount} products, and a demo user (demo@example.com / password123).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
