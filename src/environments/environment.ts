// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig : {
    // apiKey: "AIzaSyDCd6-PYTdE6CfanjsaUw_1FA4z04yHJrs",
    // authDomain: "carpe-ced53.firebaseapp.com",
    // databaseURL: "https://carpe-ced53.firebaseio.com",
    // projectId: "carpe-ced53",
    // storageBucket: "carpe-ced53.appspot.com",
    // messagingSenderId: "65652437253",
    // appId: "1:65652437253:web:62f3028c79e1f909"

    apiKey: "AIzaSyANkU9YwZHBQHo919vII2DkO9Y83nIbuXQ",
    authDomain: "carpeprod-b158f.firebaseapp.com",
    databaseURL: "https://carpeprod-b158f.firebaseio.com",
    projectId: "carpeprod-b158f",
    storageBucket: "carpeprod-b158f.appspot.com",
    messagingSenderId: "361305835202",
    appId: "1:361305835202:web:68f6837ccfd6137a"

  },
  openPay:{
    id: 'mheooheg0vr66jjepnm7',
    apiKey: 'pk_3f05e8b74c5048fc920949d064b31b49'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
