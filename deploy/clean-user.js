
const path = require('path')
const firebase = require('firebase')
require('dotenv').config({ path: path.resolve(__dirname) + '/../.env' })

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DB_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_APP_ID
} = process.env
const firebaseClient = firebase.initializeApp({
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    databaseURL: FIREBASE_DB_URL,
    projectId: FIREBASE_PROJECT_ID,
    appId: FIREBASE_APP_ID
  })
const db = firebaseClient.firestore()
const usersRef = db.collection('users').where('$key', '==', '44pSeqcMIe0eTxBV5lmi').get()

usersRef.then((snapshot) => {
  snapshot.forEach((doc) => {
    const user = doc.data()
    console.log(user)

    db.collection('users').doc(user.$key).update({
      ...user,
      new: true,
      credits: 0,
      credit_cards: [],
      subscription: false
    }).then(() => {
      const bookings = []

      db.collection('booking').where('user', '==', user.$key)
        .get().then((snapshot) => {
          snapshot.forEach((doc) => {
            bookings.push(doc.ref.delete())
            console.log('Deleted booking: ', doc.data().$key)
          })

          Promise.all(bookings).then(() => {
            console.log('User cleaned successfully...')
            process.exit()
          })
        })
    })
  })
})
