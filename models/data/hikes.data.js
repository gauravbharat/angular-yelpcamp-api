const majorVersion = 1;
exports.hikeDataList = [
  {
    seasons: [
      { id: 1, indianName: 'vasanta', englishName: 'spring' },
      { id: 2, indianName: 'grishma', englishName: 'summer' },
      { id: 3, indianName: 'varsha', englishName: 'rainy or monsoon' },
      { id: 4, indianName: 'sharat', englishName: 'autumn' },
      { id: 5, indianName: 'hemant', englishName: 'pre-winter' },
      { id: 6, indianName: 'shishira', englishName: 'winter' },
    ],
    hikingLevels: [
      {
        level: 1,
        levelName: 'Moderate Walking',
        levelDesc:
          'For people new to walking tours and especially for people who look for plenty of rest and relaxation as well as walking amidst stunning scenery, we strongly recommend our moderate walking tours. You will walk on easy and well-maintained walking paths and with a good basic fitness level the daily tours with walking times of 3 to 4.5 hours will be a pleasure for anyone.',
      },
      {
        level: 2,
        levelName: 'Walking',
        levelDesc:
          'At this level you can expect moderate walks on well-maintained walking paths without the need for any technical requirements. Daily walks with walking times of up to 5 hours (sometimes a little bit longer depending on your pace) with slight alterations in altitude. To be able to fully enjoy these tours good health and a good basic fitness level are required.',
      },
      {
        level: 3,
        levelName: 'Mountain Hiking',
        levelDesc:
          'The change in altitude and/or distances increases somewhat with tours of this category. Additionally you mainly walk on walking trails which require surefootedness and in some sections a head for heights. Expect daily walking times from 4 up to 6.5 hours, including small summit ascents. Hence a good fitness level is necessary in order to enjoy the high altitude paths.',
      },
      {
        level: 4,
        levelName: 'Trekking',
        levelDesc:
          'Depending on each individual tour you will walk on Alpine mountain paths, rocky and from time to time exposed trails on an altitude ranging from 1500m to 2500m. Surefootedness, a head for hights and a good fitness level are essential requirements for tours of up to 7 hours daily walking time. Trekking experience is prerequisite for self-guided individual tours. A good quality equipment is vital, since in parts there is no luggage transfer with overnight stays in chalets or cabins, so backpacks need to be carried by each individual.',
      },
    ],
    trekTechnicalGrades: [
      {
        level: 1,
        levelName: 'Level 1',
        levelDesc:
          'Walking with a low chance of injury, light trekking shoes or approach shoes are okay for this level.',
      },
      {
        level: 2,
        levelName: 'Level 2',
        levelDesc:
          'Mountain climbing, with the possibility of occasional use of the hands or chains or ropes to move up the route. Little potential danger is encountered. Ankle high hiking boots strongly recommended.',
      },
      {
        level: 3,
        levelName: 'Level 3',
        levelDesc:
          'Scrambling with increased exposure. Handholds are necessary. Chains, ladders, and other aids may be in place on the route to navigate safely. Exposure is present, and falls could result in serious injury or death. ​',
      },
    ],
    fitnessLevels: [
      {
        level: '1',
        levelName: 'Easiest',
        levelDesc:
          'Suitable for people of all ages who are in fair condition. Elevation gain of less than 500 meters and less than 10km of distance total.',
      },
      {
        level: '2',
        levelName: 'Easy',
        levelDesc:
          'Suitable for people of most ages who have a basic fitness level. Elevation gain of less than 800 meters and less than 12km of distance total.',
      },
      {
        level: '3',
        levelName: 'Moderate',
        levelDesc:
          'Reasonably fit hikers who get out at least once a month should be able to do this level. This level would be considered easy for frequent hikers. Elevation gain of 800~1,500 meters and a maximum distance of 15km in a day.',
      },
      {
        level: '4',
        levelName: 'Challenging',
        levelDesc:
          'Regular hiking experience is required to participate in hikes at this level. Elevation gain of more than 1,000 meters and potentially more than 15km distance in one day. Combination of significant elevation gain and long distance make this level a challenge for many.',
      },
      {
        level: '5',
        levelName: 'Very Difficult',
        levelDesc:
          'Long distances and big elevation gains make this level. High fitness level is required because speed will be important to complete.',
      },
    ],
    majorVersion,
  },
];
