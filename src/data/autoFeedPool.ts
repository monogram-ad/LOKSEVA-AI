export interface AutoFeedSample {
  id: string;
  transcript: string;
  callerId: string;
  category: string;
}

export const AUTO_FEED_POOL: AutoFeedSample[] = [
  {
    id: 'af-1',
    category: 'Electricity / Danger',
    callerId: '+91 98114 99021',
    transcript: 'Sparking live electric wire snapped from pole and is swinging near pedestrian crossing outside Metro Gate 2, Sector 12. Urgent emergency dispatch needed!',
  },
  {
    id: 'af-2',
    category: 'Water Outage',
    callerId: '+91 98450 33112',
    transcript: 'Third call from Sector 12 Market Road. The ruptured water pipe is now eroding the road foundation and shops are completely inundated without drinking water.',
  },
  {
    id: 'af-3',
    category: 'Sanitation',
    callerId: '+91 97118 77650',
    transcript: 'Sanitation tractor dumped wet bio-waste on open vacant plot in Block C. Stray dogs fighting over it and sickening foul smell spreading to residential balconies.',
  },
  {
    id: 'af-4',
    category: 'Roads & PWD',
    callerId: '+91 99201 44589',
    transcript: 'Another scooterist fell because of the deep crater at Market Road flyover descent. Rim bent and minor injuries, please barricade this spot before dark.',
  },
  {
    id: 'af-5',
    category: 'Health / Gas Leak',
    callerId: '+91 98300 11928',
    transcript: 'Extremely strong commercial LPG gas odor intensifying near Sector 12 community kitchen. People feeling nausea and dizziness, send emergency fire and health team!',
  },
  {
    id: 'af-6',
    category: 'Police / Harassment',
    callerId: '+91 91104 88390',
    transcript: 'Intoxicated anti-social youths blocking women bus passengers on Market Road. Aggressive catcalling and physical intimidation happening right now.',
  },
  {
    id: 'af-7',
    category: 'Electricity',
    callerId: '+91 98210 55431',
    transcript: 'All six street lights on 8th Cross Sector 5 are dead since sunset. The entire avenue is pitch black and ladies returning from work feel unsafe.',
  },
  {
    id: 'af-8',
    category: 'Water Board',
    callerId: '+91 98801 22904',
    transcript: 'Sewage wastewater backflowing into domestic freshwater drinking sump at Block C house 52. Urgent suction tanker required.',
  },
  {
    id: 'af-9',
    category: 'Multi-Issue Hazard',
    callerId: '+91 99014 66723',
    transcript: 'Severe storm drain overflow flooding Sector 5 main road and an underground electric junction box is submerged and boiling with electrical current.',
  },
  {
    id: 'af-10',
    category: 'Roads & PWD',
    callerId: '+91 97412 33819',
    transcript: 'Heavy rain washed away asphalt on Sector 12 cross road, creating a 10-meter gravel ditch where city buses are getting stuck.',
  },
  {
    id: 'af-11',
    category: 'Health',
    callerId: '+91 98319 44012',
    transcript: 'Stagnant chemical sludge in open ditch behind market emitting irritating fumes. Shopkeepers suffering burning eyes and throat pain.',
  },
  {
    id: 'af-12',
    category: 'Police',
    callerId: '+91 99120 77112',
    transcript: 'Unlicensed loud sound system blasting at ear-splitting volume past midnight near Sector 5 residential hospital zone.',
  },
];
