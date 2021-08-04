const functions = require('firebase-functions');
const admin = require('firebase-admin');
const serviceAccount = require("./key/key.json");
const moment = require('moment');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://carpeprod-b158f.firebaseio.com"
});
const db = admin.firestore();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.createClasses = functions.pubsub
  .schedule('every sun 04:00')
  .timeZone('America/Mexico_City')
  .onRun(context => {

    moment.locale('es');
    // we start our date 4 weeks in advance
    const date = moment().add(3, 'weeks');
    const clases = [];
    const promises = [];
    db.collection('class').get().then(snapshot => {
      snapshot.forEach(doc => {
        var clase = doc.data();
        clase.$key = doc.id;
        clases.push(clase);
      });
      // we generate one week for one month in advace
      for (let i = 0; i < 7; i++) {
        date.add(1, 'days')
        clases.forEach(clase => {
          // if the class objects inculdes the day of the week
          if (clase.days.includes(date.day())) {
            // if the class repated every weel than we should render it
            if (clase.weeks === 'all') {
              promises.push(createSubClass(clase, date));
              // if its only every other week we check if the class is on pair (2,4) ot inpar weeks (1,3)
            } else if (clase.weeks === 'inpair' && date.week() % 2 === 1) {
              promises.push(createSubClass(clase, date));
            } else if (clase.weeks === 'pair' && date.week() % 2 === 0) {
              promises.push(createSubClass(clase, date));
            }
          }
        })
      }
      return Promise.all(promises).then(res => {
        const log = res.map(sub => sub.id);
        console.log(`Se crearon ${log.length} subClases, ids ${log}`);
        return true;
      }).catch(err => console.log('promise.all error reason: ' + err))
    }).catch(reason => {
      console.log('db.collection("clases").get gets err, reason: ' + reason);
      return false;
    });
  });



const createSubClass = (clase, date) => {
  const humanDate = moment(date).format('LL');
  const sub_class = {
    class: clase.$key,
    color: clase.color,
    date: humanDate,
    dateObj: new Date(date),
    end: clase.end,
    instructor: clase.instructor,
    start: clase.start,
    type: clase.type,
    description: clase.description ? clase.description : '',
    createdOn: admin.firestore.FieldValue.serverTimestamp()
  }
  return db.collection('sub_class').add(sub_class);
}


// compute stats by instructor and total classes
exports.instructorStats = functions.pubsub
  .schedule('every sun 05:00')
  .timeZone('America/Mexico_City')
  .onRun(context => {
    moment.locale('es');
    var instructors = {}
    db.collection('sub_class').get().then(snapshot => {
      snapshot.forEach(sub => {
        const data = sub.data()
        if (!instructors[data.instructor.$key]){
          instructors[data.instructor.$key] = {
            class_count : 1,
            assistence: 0,
            occupancy: 0,
            total_spots: 0
          }
        } else {
          instructors[data.instructor.$key].class_count++;
          instructors[data.instructor.$key].total_spots += data.type === 'Indoor Cycling' ? 34 : 15;
        }
        
      })

      db.collection('booking').get().then(snapshot => {
        snapshot.forEach(booking => {
          const data = booking.data()
          if (instructors[data.instructor.$key]){
            instructors[data.instructor.$key].assistence++;
          }
        })
        Object.keys(instructors).forEach( key => {
          instructors[key].occupancy = (instructors[key].assistence / instructors[key].total_spots) * 100;
          return db.collection('instructor').doc(key).get().then(doc => {
            if (doc.data()){
              return db.collection('instructor').doc(key).update({
                ...doc.data(),
                class_count :  instructors[key].class_count,
                assistence:  instructors[key].assistence,
                occupancy:  instructors[key].occupancy,
                total_spots:  instructors[key].total_spots,
                updatedOn: moment().toDate()
              }).then(res => console.log(res));
            } 
            return;
          })
        });
        return;
      }).catch(err => console.log(err));
      return;
    }).catch(err => console.log(err));
  });

  exports.test = functions.https.onRequest((request, response) => {
    moment.locale('es');
    const date = moment().startOf('day').subtract(15, 'days');
    let confirmed_users = new Array(15).fill(0);
    let total_confirmed = 0;
    let canceled_users = new Array(15).fill(0);
    let total_canceled = 0;
    let selected_users = new Array(15).fill(0);
    let total_selected = 0;
    let assisted_users = new Array(15).fill(0);
    let total_assisted = 0;
    let new_users = new Array(15).fill(0);
    let total_new = 0;

    const bookP = new Promise((resolve, reject) => {
      db.collection('booking').where('dateObj', '>', date.toDate()).where('dateObj', '<', moment().toDate()).get().then(snapshot => {
      snapshot.forEach(book => {
        const booking = book.data()
        const index = moment.unix(booking.dateObj.seconds).diff(date, 'days') - 1;
        switch (booking.status) {
          case 'confirmed':
            confirmed_users[index]++;
            total_confirmed++;
            break;
          case 'canceled':
            canceled_users[index]++;
            total_canceled++;
            break;
          case 'selected':
            selected_users[index]++;
            total_selected++;
            break;
          case 'assisted':
            assisted_users[index]++;
            total_assisted++;
            break;
        }
      })
      return resolve(true);
    }).catch(err => { reject(err); console.log(err)})
  });

  const usersP = new Promise((resolve, reject) => {
    db.collection('users').where('createdOn', '>', date.toDate()).get().then(snapshot => {
      snapshot.forEach(snap => {
        const user = snap.data();
        const index = moment.unix(user.createdOn.seconds).diff(date, 'days')-1;
        new_users[index]++;
        total_new++;
      })
      return resolve(true);
    }).catch(err => { reject(err); console.log(err)})
  }) 

  return Promise.all([bookP, usersP]).then(res => {
    return db.collection('homeData').add({confirmed_users, canceled_users, selected_users, assisted_users, new_users});
  }).catch(err =>  err);

  });