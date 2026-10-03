import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { pool } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

const images = {
  rajasthan: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=1600&auto=format&q=70',
  uttarakhand: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?w=1600&auto=format&q=70',
  himachal: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1600&auto=format&q=70',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1600&auto=format&q=70',
  punjab: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=1600&auto=format&q=70'
};

const destinationData = [
  {
    slug: 'rajasthan', name: 'Rajasthan', region: 'North-West India', short_desc: 'A journey through forts, palaces, desert landscapes and living craft traditions.',
    description: 'Rajasthan brings together historic cities, monumental forts, palace architecture, desert landscapes and long-standing craft traditions. A route can move from Delhi toward Jaipur, Jodhpur, Udaipur and the Thar region while balancing heritage sightseeing with local food and cultural experiences.',
    image: images.rajasthan, featured: true, sort: 1,
    why_visit: ['Historic forts and palace architecture', 'Thar Desert landscapes around Jaisalmer', 'Distinctive Rajasthani textiles, crafts and cuisine', 'Historic trading cities including Jaipur and Jodhpur'],
    top_places: [
      ['Jaipur', 'The Pink City, known for the City Palace, Amber Fort and Hawa Mahal.'],
      ['Jodhpur', 'The Blue City, dominated by the hilltop Mehrangarh Fort.'],
      ['Udaipur', 'A lake city with the City Palace complex and views around Lake Pichola.'],
      ['Jaisalmer', 'Golden sandstone architecture and access to the Thar Desert.'],
      ['Pushkar', 'A pilgrimage town around Pushkar Lake and the Brahma Temple.'],
      ['Ranthambore', 'A historic fort and a major wildlife landscape for tiger safaris.']
    ],
    travel_info: { best_time: 'October to March', how_to_reach: 'Jaipur, Jodhpur and Udaipur have airports; Delhi and Jaipur are major rail and road gateways.', tips: ['Carry sun protection in desert areas.', 'Keep an extra layer for winter evenings.', 'Confirm safari zones and permits before visiting Ranthambore.'] }
  },
  {
    slug: 'uttarakhand', name: 'Uttarakhand', region: 'Himalayan North India', short_desc: 'River towns, Himalayan valleys, pilgrimage routes, meadows and mountain viewpoints.',
    description: 'Uttarakhand spans the Garhwal and Kumaon Himalaya, with destinations ranging from the Ganga towns of Rishikesh and Haridwar to hill stations, high-altitude meadows and pilgrimage routes. Conditions vary considerably by altitude and season.',
    image: images.uttarakhand, featured: true, sort: 2,
    why_visit: ['Himalayan landscapes and mountain valleys', 'Important pilgrimage centres and temple routes', 'River and outdoor experiences around Rishikesh', 'High-altitude meadows and trekking routes'],
    top_places: [
      ['Rishikesh', 'A Ganga-side destination associated with yoga, rafting and riverfront ghats.'],
      ['Haridwar', 'An important pilgrimage city on the Ganga, known for Har Ki Pauri.'],
      ['Mussoorie', 'A hill station in the Garhwal Himalaya with views toward surrounding ranges.'],
      ['Nainital', 'A lake town built around Naini Lake in Kumaon.'],
      ['Chopta', 'A mountain base for trails toward Tungnath and Chandrashila.'],
      ['Tungnath', 'A high-altitude Shiva temple reached by a trekking route from Chopta.'],
      ['Auli', 'A Himalayan mountain destination known for alpine scenery and winter snow.'],
      ['Kedarnath', 'A high-altitude pilgrimage destination reached through a regulated trekking route.'],
      ['Badrinath', 'A major Char Dham pilgrimage site in the Alaknanda valley.'],
      ['Devprayag', 'The confluence of the Bhagirathi and Alaknanda rivers, forming the Ganga.']
    ],
    travel_info: { best_time: 'March to June and September to November for many lower and mid-altitude routes; high-altitude access is seasonal.', how_to_reach: 'Dehradun and Haridwar are major gateways; rail reaches Haridwar and Rishikesh, while mountain destinations continue by road.', tips: ['Allow buffer time for mountain roads.', 'Check weather and route advisories before high-altitude travel.', 'Acclimatize for higher elevations and carry essential medicines.'] }
  },
  {
    slug: 'himachal-pradesh', name: 'Himachal Pradesh', region: 'Western Himalaya', short_desc: 'Mountain towns, pine forests, valleys and high Himalayan scenery.',
    description: 'Himachal Pradesh offers a wide range of Himalayan travel, from accessible hill stations such as Shimla and Manali to higher valleys and trekking areas. Road travel is an important part of many itineraries and conditions can change with weather.',
    image: images.himachal, featured: true, sort: 3,
    why_visit: ['Himalayan valleys and forested mountain landscapes', 'Hill towns with colonial and local architectural heritage', 'Trekking, snow and outdoor activities', 'Distinctive mountain cultures and cuisine'],
    top_places: [
      ['Shimla', 'A historic hill station and former summer capital of British India.'],
      ['Manali', 'A major Kullu Valley base for mountain and outdoor trips.'],
      ['Kasol', 'A Parvati Valley settlement used as a base for nearby walks and villages.'],
      ['Dharamshala', 'A Kangra Valley destination associated with Tibetan culture and mountain views.'],
      ['Spiti Valley', 'A high-altitude cold-desert valley with monasteries and dramatic landscapes.'],
      ['Dalhousie', 'A hill station in the Chamba region with access to nearby viewpoints and trails.']
    ],
    travel_info: { best_time: 'March to June for many lower valleys; October to November for clear autumn conditions; winter snow travel is seasonal.', how_to_reach: 'Chandigarh and Delhi are common road gateways; airports serve Shimla, Kullu and Kangra with limited schedules.', tips: ['Check road conditions before high-altitude routes.', 'Keep warm layers even in shoulder seasons.', 'Plan extra travel time on mountain roads.'] }
  },
  {
    slug: 'delhi', name: 'Delhi', region: 'National Capital Region', short_desc: 'A historic capital with Mughal monuments, colonial landmarks, markets and diverse food.',
    description: 'Delhi combines layers of historic settlement with the planned avenues of New Delhi. It works as both a destination and a practical gateway for North India circuits, including Agra, Jaipur and Amritsar.',
    image: images.delhi, featured: true, sort: 4,
    why_visit: ['Red Fort, Humayun’s Tomb and Qutub Minar', 'Historic neighbourhoods and markets', 'Mughlai, North Indian and regional cuisine', 'Major rail, air and road connections across North India'],
    top_places: [
      ['Red Fort', 'A Mughal-era fort complex in Old Delhi and a UNESCO World Heritage Site.'],
      ['Qutub Minar', 'A medieval minaret complex in South Delhi and a UNESCO World Heritage Site.'],
      ['Humayun’s Tomb', 'A Mughal garden tomb complex that influenced later Mughal architecture.'],
      ['India Gate', 'A prominent early-20th-century war memorial on Kartavya Path.'],
      ['Jama Masjid', 'A major Mughal-era mosque in Old Delhi.'],
      ['Chandni Chowk', 'A historic market district in Old Delhi known for food and traditional commerce.']
    ],
    travel_info: { best_time: 'October to March for cooler sightseeing weather.', how_to_reach: 'Indira Gandhi International Airport, major railway stations and extensive road connections.', tips: ['Allow time for traffic.', 'Start outdoor sightseeing early in warmer months.', 'Use metro and pre-booked transfers for efficient city travel.'] }
  },
  {
    slug: 'punjab', name: 'Punjab', region: 'North-West India', short_desc: 'A food-rich cultural region with Sikh heritage, historic cities and lively markets.',
    description: 'Punjab offers a strong combination of Sikh heritage, historic sites, food traditions, agriculture landscapes and city culture. Amritsar is a natural anchor, while Chandigarh and Patiala add architectural and historical contrasts.',
    image: images.punjab, featured: false, sort: 5,
    why_visit: ['Golden Temple and Sikh heritage in Amritsar', 'Historic sites associated with the partition era', 'Punjabi cuisine and food traditions', 'Distinctive architecture in Chandigarh and Patiala'],
    top_places: [
      ['Amritsar', 'A major cultural centre known for the Golden Temple and Jallianwala Bagh.'],
      ['Golden Temple', 'The Harmandir Sahib, the central gurdwara of the Sikh faith in Amritsar.'],
      ['Chandigarh', 'A planned city associated with Le Corbusier and modernist architecture.'],
      ['Patiala', 'A historic city known for Qila Mubarak and Punjabi cultural heritage.'],
      ['Wagah-Attari Border', 'A land-border crossing known for its public Beating Retreat ceremony.'],
      ['Anandpur Sahib', 'A major Sikh pilgrimage centre in Punjab’s Rupnagar district.']
    ],
    travel_info: { best_time: 'October to March for comfortable sightseeing.', how_to_reach: 'Amritsar airport and railway station provide major access; Chandigarh is another strong regional gateway.', tips: ['Dress respectfully at religious sites.', 'Follow photography and entry rules at gurdwaras.', 'Check ceremony timings before visiting the border.'] }
  }
];

const packageData = [
  {
    slug: 'rajasthan-royal-heritage-tour', title: 'Rajasthan Royal Heritage Tour', destination: 'rajasthan', route: 'Delhi · Jaipur · Jodhpur · Udaipur', category: 'cultural', duration_days: 7, price: 34999, best_seller: true, featured: true,
    image: images.rajasthan, short_desc: 'A seven-day introduction to Rajasthan’s major heritage cities, forts and palace districts.',
    highlights: ['Amber Fort and Jaipur heritage quarter', 'Mehrangarh Fort in Jodhpur', 'Blue City lanes and local craft districts', 'Udaipur lakeside heritage', 'Regional cuisine and market time'],
    itinerary: [
      { day: 1, title: 'Arrive Delhi and transfer to Jaipur', description: 'Travel to Jaipur and settle into the Pink City.', activities: ['Arrival transfer', 'Hotel check-in', 'Evening at leisure'] },
      { day: 2, title: 'Jaipur heritage', description: 'Explore the historic core and hilltop fort complex.', activities: ['Amber Fort', 'City Palace', 'Hawa Mahal exterior', 'Old-city market'] },
      { day: 3, title: 'Jaipur to Jodhpur', description: 'Travel west toward the Blue City.', activities: ['Road transfer', 'Local market walk', 'Clock Tower area'] },
      { day: 4, title: 'Jodhpur heritage', description: 'Explore the fort and old city.', activities: ['Mehrangarh Fort', 'Jaswant Thada', 'Blue City viewpoints'] },
      { day: 5, title: 'Jodhpur to Udaipur', description: 'Continue south through Rajasthan.', activities: ['Road transfer', 'En-route heritage stop', 'Lake Pichola waterfront'] },
      { day: 6, title: 'Udaipur', description: 'Explore the lake city and palace district.', activities: ['City Palace', 'Jagdish Temple exterior', 'Local bazaars', 'Optional boat ride'] },
      { day: 7, title: 'Departure', description: 'Transfer for onward travel.', activities: ['Breakfast', 'Departure transfer'] }
    ],
    inclusions: ['Accommodation in selected category', 'Daily breakfast', 'Private transfers for the itinerary', 'Driver allowances and tolls', 'Sightseeing as listed'],
    exclusions: ['Flights and train tickets', 'Monument entry fees unless specified', 'Lunches and dinners', 'Personal expenses', 'Travel insurance'],
    info: { important: ['DEMO PRICES — edit before launch.', 'Travel times can change with traffic and road conditions.'], tips: ['Carry comfortable walking shoes.', 'Reserve heritage monument tickets where available.'] }
  },
  {
    slug: 'uttarakhand-devbhoomi-yatra', title: 'Uttarakhand Devbhoomi Yatra', destination: 'uttarakhand', route: 'Haridwar · Rishikesh · Devprayag · Kedarnath region · Badrinath', category: 'spiritual', duration_days: 6, price: 28999, best_seller: false, featured: true,
    image: images.uttarakhand, short_desc: 'A structured pilgrimage-oriented route through major Garhwal river valleys and temple destinations.',
    highlights: ['Ganga aarti experience in Haridwar or Rishikesh', 'Devprayag confluence', 'Kedarnath pilgrimage route planning', 'Badrinath temple visit', 'Mountain-road and valley scenery'],
    itinerary: [
      { day: 1, title: 'Haridwar to Rishikesh', description: 'Begin the journey along the Ganga.', activities: ['Arrival', 'Har Ki Pauri or riverfront visit', 'Rishikesh transfer'] },
      { day: 2, title: 'Rishikesh to Devprayag', description: 'Travel into the Garhwal hills.', activities: ['River viewpoints', 'Devprayag confluence', 'Continue toward the overnight halt'] },
      { day: 3, title: 'Toward Kedarnath route', description: 'Continue to the designated Kedarnath route base.', activities: ['Mountain road journey', 'Route briefing', 'Rest and acclimatization'] },
      { day: 4, title: 'Kedarnath pilgrimage day', description: 'Undertake the regulated pilgrimage route subject to current access conditions.', activities: ['Early start', 'Temple visit', 'Return or overnight as route permits'] },
      { day: 5, title: 'Toward Badrinath', description: 'Travel through the upper Alaknanda valley.', activities: ['Mountain drive', 'Scenic stops', 'Badrinath area'] },
      { day: 6, title: 'Badrinath and departure route', description: 'Visit the temple area and begin onward travel.', activities: ['Temple visit', 'Mana-area visit if conditions permit', 'Departure'] }
    ],
    inclusions: ['Accommodation in selected category', 'Breakfast and dinner where specified', 'Road transfers', 'Driver allowances and tolls', 'Basic itinerary coordination'],
    exclusions: ['Helicopter or special transport', 'Temple donations', 'Personal porter charges', 'Travel insurance', 'Meals not listed'],
    info: { important: ['DEMO PRICES — edit before launch.', 'High-altitude routes are subject to weather, government advisories and local access rules.', 'Kedarnath and Badrinath access is seasonal.'], tips: ['Carry warm layers and rain protection.', 'Allow buffer days for mountain travel.'] }
  },
  {
    slug: 'chopta-tungnath-trek', title: 'Chopta Tungnath Trek', destination: 'uttarakhand', route: 'Rishikesh · Rudraprayag · Chopta · Tungnath · Chandrashila', category: 'adventure', duration_days: 4, price: 15999, best_seller: false, featured: false,
    image: images.uttarakhand, short_desc: 'A short Himalayan trekking itinerary around Chopta, Tungnath and the Chandrashila trail.',
    highlights: ['Chopta alpine scenery', 'Tungnath temple trail', 'Chandrashila summit route when conditions allow', 'Garhwal road journey', 'Mountain camping or lodge-style stay'],
    itinerary: [
      { day: 1, title: 'Rishikesh to Chopta', description: 'Drive into the Garhwal mountains.', activities: ['Mountain transfer', 'Scenic stops', 'Check-in and rest'] },
      { day: 2, title: 'Tungnath and Chandrashila', description: 'Trek from Chopta toward Tungnath and onward if trail conditions permit.', activities: ['Trek briefing', 'Tungnath', 'Chandrashila attempt', 'Return to Chopta'] },
      { day: 3, title: 'Chopta and return route', description: 'Enjoy a slower mountain morning before descending.', activities: ['Short nature walk', 'Road transfer', 'Village and valley viewpoints'] },
      { day: 4, title: 'Return to Rishikesh', description: 'Complete the return journey.', activities: ['Breakfast', 'Mountain drive', 'Departure'] }
    ],
    inclusions: ['Accommodation', 'Breakfast', 'Road transfers', 'Trek coordination', 'Driver and vehicle costs'],
    exclusions: ['Trekking equipment rental', 'Personal porter', 'Travel insurance', 'Meals not listed', 'Emergency evacuation costs'],
    info: { important: ['DEMO PRICES — edit before launch.', 'Trek access and weather conditions must be checked before departure.'], tips: ['Use sturdy trekking footwear.', 'Hydrate and pace yourself at altitude.'] }
  },
  {
    slug: 'himachal-scenic-escape', title: 'Himachal Scenic Escape', destination: 'himachal-pradesh', route: 'Delhi · Shimla · Manali', category: 'family', duration_days: 6, price: 24999, best_seller: false, featured: true,
    image: images.himachal, short_desc: 'A family-friendly introduction to Shimla and Manali with relaxed mountain sightseeing.',
    highlights: ['Shimla heritage district', 'Kufri-area mountain scenery', 'Kullu Valley drive', 'Manali old town and river landscapes', 'Flexible family-paced sightseeing'],
    itinerary: [
      { day: 1, title: 'Delhi to Shimla', description: 'Travel by road to the hills.', activities: ['Departure', 'Mountain drive', 'Check-in'] },
      { day: 2, title: 'Shimla', description: 'Explore the historic hill town.', activities: ['Mall Road', 'The Ridge', 'Christ Church exterior', 'Local market'] },
      { day: 3, title: 'Shimla to Manali', description: 'Travel through the mountain valleys toward Manali.', activities: ['Scenic road journey', 'Kullu Valley stop', 'Manali check-in'] },
      { day: 4, title: 'Manali', description: 'Explore the town and nearby river valley.', activities: ['Hadimba Temple area', 'Old Manali', 'Vashisht area'] },
      { day: 5, title: 'Solang or local excursion', description: 'Choose an excursion based on season and access.', activities: ['Solang Valley if open', 'Optional activities', 'Leisure time'] },
      { day: 6, title: 'Departure', description: 'Begin onward travel.', activities: ['Breakfast', 'Check-out', 'Departure transfer'] }
    ],
    inclusions: ['Accommodation', 'Breakfast', 'Private road transfers', 'Sightseeing as listed', 'Driver costs'],
    exclusions: ['Adventure activity charges', 'Lunch and dinner', 'Entry tickets', 'Travel insurance', 'Personal expenses'],
    info: { important: ['DEMO PRICES — edit before launch.', 'High-altitude and excursion access varies by weather and local restrictions.'], tips: ['Carry warm layers year-round for mountain evenings.', 'Keep the itinerary flexible in case of road delays.'] }
  },
  {
    slug: 'manali-honeymoon-retreat', title: 'Manali Honeymoon Retreat', destination: 'himachal-pradesh', route: 'Delhi · Manali · Solang Valley', category: 'honeymoon', duration_days: 5, price: 27999, best_seller: false, featured: false,
    image: images.himachal, short_desc: 'A slower Manali stay combining scenic drives, private time and seasonal mountain excursions.',
    highlights: ['Private Manali sightseeing', 'Valley viewpoints', 'Solang excursion subject to access', 'Couple-focused flexible time', 'Local café and market exploration'],
    itinerary: [
      { day: 1, title: 'Delhi to Manali', description: 'Travel overnight or by day depending on selected transport.', activities: ['Departure', 'Scenic journey', 'Check-in'] },
      { day: 2, title: 'Manali old town', description: 'Take a relaxed introduction to Manali.', activities: ['Hadimba Temple area', 'Old Manali', 'Café time'] },
      { day: 3, title: 'Solang Valley', description: 'Visit the valley if seasonal conditions permit.', activities: ['Valley excursion', 'Optional activities', 'Leisure evening'] },
      { day: 4, title: 'Flexible Manali day', description: 'Keep a free day for local exploration.', activities: ['Vashisht area', 'Shopping', 'Optional private experience'] },
      { day: 5, title: 'Departure', description: 'Begin onward journey.', activities: ['Breakfast', 'Check-out', 'Departure'] }
    ],
    inclusions: ['Accommodation', 'Breakfast', 'Private transfers', 'Sightseeing as listed', 'Driver costs'],
    exclusions: ['Flights or bus tickets', 'Adventure activities', 'Lunch and dinner', 'Entry fees', 'Travel insurance'],
    info: { important: ['DEMO PRICES — edit before launch.', 'Room category and seasonal rates should be confirmed before booking.'], tips: ['Confirm weather before high-altitude excursions.', 'Reserve preferred room category early during peak periods.'] }
  },
  {
    slug: 'delhi-agra-amritsar-tour', title: 'Delhi Agra Amritsar Tour', destination: 'delhi', route: 'Delhi · Agra · Delhi · Amritsar', category: 'cultural', duration_days: 6, price: 25999, best_seller: true, featured: false,
    image: images.delhi, short_desc: 'A North India heritage circuit connecting Delhi, the Taj Mahal in Agra and Amritsar.',
    highlights: ['Old and New Delhi heritage', 'Taj Mahal and Agra Fort', 'Golden Temple complex', 'Jallianwala Bagh', 'Amritsar food and market culture'],
    itinerary: [
      { day: 1, title: 'Delhi arrival', description: 'Settle into Delhi and begin local sightseeing.', activities: ['Arrival', 'India Gate area', 'Hotel check-in'] },
      { day: 2, title: 'Old and New Delhi', description: 'Explore major historic landmarks.', activities: ['Red Fort area', 'Jama Masjid', 'Humayun’s Tomb', 'Qutub Minar'] },
      { day: 3, title: 'Agra day trip', description: 'Travel to Agra for Mughal heritage.', activities: ['Taj Mahal', 'Agra Fort', 'Return to Delhi'] },
      { day: 4, title: 'Delhi to Amritsar', description: 'Transfer to Punjab by train or road.', activities: ['Departure', 'Amritsar arrival', 'Evening at leisure'] },
      { day: 5, title: 'Amritsar heritage', description: 'Explore key sites around the old city.', activities: ['Golden Temple', 'Jallianwala Bagh', 'Old city markets'] },
      { day: 6, title: 'Departure', description: 'Optional border ceremony depending on timing.', activities: ['Breakfast', 'Optional Attari-Wagah visit', 'Departure'] }
    ],
    inclusions: ['Accommodation', 'Breakfast', 'Private transfers', 'Sightseeing as listed', 'Driver costs'],
    exclusions: ['Train tickets unless specified', 'Monument entry fees', 'Meals not listed', 'Travel insurance', 'Personal expenses'],
    info: { important: ['DEMO PRICES — edit before launch.', 'Taj Mahal is closed to visitors on Fridays; schedule accordingly.'], tips: ['Start Taj Mahal sightseeing early.', 'Dress respectfully at the Golden Temple.'] }
  },
  {
    slug: 'punjab-cultural-experience', title: 'Punjab Cultural Experience', destination: 'punjab', route: 'Amritsar · Attari · Patiala · Chandigarh', category: 'cultural', duration_days: 4, price: 16999, best_seller: false, featured: false,
    image: images.punjab, short_desc: 'A compact Punjab circuit focused on Sikh heritage, food, historic architecture and Chandigarh.',
    highlights: ['Golden Temple', 'Jallianwala Bagh', 'Punjabi food experiences', 'Patiala heritage', 'Chandigarh modernist architecture'],
    itinerary: [
      { day: 1, title: 'Amritsar arrival', description: 'Begin in Amritsar and explore the old city.', activities: ['Arrival', 'Golden Temple', 'Evening market'] },
      { day: 2, title: 'Amritsar and Attari', description: 'Explore heritage and the border area.', activities: ['Jallianwala Bagh', 'Local food walk', 'Attari-Wagah ceremony if scheduled'] },
      { day: 3, title: 'Amritsar to Patiala', description: 'Travel toward Patiala for historic architecture.', activities: ['Road transfer', 'Qila Mubarak area', 'Local market'] },
      { day: 4, title: 'Patiala to Chandigarh', description: 'Finish with Chandigarh’s planned-city landmarks.', activities: ['Road transfer', 'Capitol Complex area where accessible', 'Departure'] }
    ],
    inclusions: ['Accommodation', 'Breakfast', 'Road transfers', 'Sightseeing as listed', 'Driver costs'],
    exclusions: ['Entry tickets', 'Lunch and dinner', 'Personal expenses', 'Travel insurance', 'Optional experiences'],
    info: { important: ['DEMO PRICES — edit before launch.', 'Access to Chandigarh heritage sites can require advance permission.'], tips: ['Dress respectfully at religious sites.', 'Confirm border ceremony schedule before travel.'] }
  }
];

const experienceData = [
  { slug: 'adventure', name: 'Adventure', image: images.uttarakhand, description: 'Outdoor travel across Himalayan trails, valleys and seasonal activity zones.', examples: ['Trekking around Chopta', 'River rafting near Rishikesh', 'Snow-season activities around Auli', 'Valley walks in Himachal'] , sort: 1 },
  { slug: 'spiritual', name: 'Spiritual', image: images.uttarakhand, description: 'Pilgrimage routes, riverfront rituals and historic places of worship.', examples: ['Ganga aarti in Haridwar', 'Rishikesh ashram districts', 'Kedarnath pilgrimage', 'Badrinath pilgrimage'], sort: 2 },
  { slug: 'wildlife', name: 'Wildlife', image: images.rajasthan, description: 'Wild landscapes and protected areas where wildlife viewing is possible under local rules.', examples: ['Ranthambore tiger safari', 'Birding in wetland habitats', 'Forest nature walks', 'Desert ecology experiences'], sort: 3 },
  { slug: 'culture', name: 'Culture', image: images.rajasthan, description: 'Architecture, museums, markets, craft traditions and living cultural practices.', examples: ['Rajasthan forts', 'Old Delhi markets', 'Amritsar heritage', 'Patiala architecture'], sort: 4 },
  { slug: 'food', name: 'Food', image: images.punjab, description: 'Regional food traditions across North India, from street markets to local kitchens.', examples: ['Punjabi street food', 'Rajasthani thali', 'Delhi Mughlai dishes', 'Himachali local cuisine'], sort: 5 },
  { slug: 'photography', name: 'Photography', image: images.himachal, description: 'Scenic and architectural routes with varied light, landscapes and historic streets.', examples: ['Udaipur lakeside views', 'Jodhpur blue lanes', 'Himalayan valleys', 'Delhi heritage architecture'], sort: 6 }
];

function asJson(value) { return JSON.stringify(value); }

async function runSchema() {
  const rootConnection = await mysql.createConnection({ host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD });
  await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await rootConnection.end();

  const schema = await fs.readFile(schemaPath, 'utf8');
  const statements = schema.split(';').map((statement) => statement.trim()).filter(Boolean);
  const connection = await pool.getConnection();
  try {
    for (const statement of statements) await connection.query(statement);
  } finally {
    connection.release();
  }
}

async function seed() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required to seed.');
  await runSchema();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const destinationIds = {};
    for (const item of destinationData) {
      const [result] = await connection.execute(`INSERT INTO destinations (slug, name, region, short_desc, description, image, why_visit, top_places, travel_info, featured, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [item.slug, item.name, item.region, item.short_desc, item.description, item.image, asJson(item.why_visit), asJson(item.top_places.map(([name, description]) => ({ name, description, image: item.image }))), asJson(item.travel_info), item.featured, item.sort]);
      destinationIds[item.slug] = result.insertId;
    }

    for (const item of packageData) {
      const [result] = await connection.execute(`INSERT INTO packages (slug, title, destination_id, route, category, duration_days, price, rating, image, gallery, short_desc, highlights, itinerary, inclusions, exclusions, info, best_seller, featured, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`, [item.slug, item.title, destinationIds[item.destination], item.route, item.category, item.duration_days, item.price, null, item.image, asJson([item.image]), item.short_desc, asJson(item.highlights), asJson(item.itinerary), asJson(item.inclusions), asJson(item.exclusions), asJson(item.info), item.best_seller, item.featured]);
      void result;
    }

    for (const item of experienceData) {
      await connection.execute(`INSERT INTO experiences (slug, name, image, description, examples, sort) VALUES (?, ?, ?, ?, ?, ?)`, [item.slug, item.name, item.image, item.description, asJson(item.examples), item.sort]);
    }

    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
    await connection.execute('INSERT INTO admins (email, password_hash) VALUES (?, ?)', [env.ADMIN_EMAIL, passwordHash]);
    await connection.commit();
    console.log('Sudha Tourism database seeded successfully.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

seed().catch(async (error) => {
  console.error('Seed failed:', error.message);
  try { await pool.end(); } catch {}
  process.exit(1);
});
