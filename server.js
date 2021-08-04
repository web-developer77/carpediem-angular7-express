//Install express server
const express = require("express");
const path = require("path");
const sgMail = require("@sendgrid/mail");
const bodyParser = require("body-parser");
const Openpay = require("openpay");
const firebase = require("firebase");
const moment = require("moment");
require("dotenv").config();
const fs = require("fs");
const nocache = require("nocache");
const cors = require("cors");
const json2xls = require("json2xls");

// const jwplayer = require('jwplayer-node')({api_key: process.env.JWPAPI, api_secret: process.env.JWPSECRET});

// jwplayer.call_api({method: 'get',path: '/v1/videos/list',}).then(succ => {
//   console.log(succ.data)
// }).catch(err => console.log(err))
// ;
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DB_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_APP_ID,
} = process.env;
const app = express();
const firebaseClient = firebase.initializeApp({
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DB_URL,
  projectId: FIREBASE_PROJECT_ID,
  appId: FIREBASE_APP_ID,
});
const db = firebaseClient.firestore();

// Serve only the static files form the dist directory
app.use(cors());
app.use(json2xls.middleware);
app.use(express.static(__dirname + "/dist"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(nocache());

const isOpenpayProd = process.env.OPEN_PAY_PROD === "true";
const openpay = new Openpay(process.env.OPEN_PAY_ID, process.env.OPEN_PAY_KEY, [
  isOpenpayProd,
]);

openpay.setProductionReady(isOpenpayProd);

app.get("/pay/:id", (req, res) => {
  const { id } = req.params;

  openpay.charges.get(id, function (error, body) {
    if (error) {
      console.log(error);
      return res.send(error);
    } else {
      return res.send(body);
    }
  });
});

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname + "/dist/index.html"));
});

app.post("/sendEmail", (req, res) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  req.body.from = {
    email: req.body.from,
    name: "Carpe Diem Mindful Training",
  };
  return sgMail
    .send(req.body)
    .then((success) => {
      return res.send(success);
    })
    .catch((error) => {
      return res.status(400).send({ message: error });
    });
});

app.post("/log", (req, res) => {
  fs.appendFile(
    process.env.LOGS_PATH,
    `${req.body.timestamp} | ${req.body.message} \n`,
    (err) => {
      if (err) console.log(err);
    }
  );
});

app.post("/sendEmailT", (req, res) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // bienvenido, reservaciones, compras, general
  const templates = [
    "d-0ae4666423634225b7b102b20726d994",
    "d-6f4a283455924f92ab71f9dfd783dab2",
    "d-c6471e22688b408fb740060857fe26ae",
    "d-452ef8caa6734ea28256f33fea36dd6f",
  ];
  const msg = {
    to: req.body.to,
    from: {
      email: req.body.from,
      name: "Carpe Diem Mindful Training",
    },
    templateId: templates[req.body.template],
    dynamic_template_data: {
      data: req.body.data,
    },
  };
  return sgMail
    .send(msg)
    .then((success) => {
      return res.send(success);
    })
    .catch((error) => {
      return res.status(400).send({ message: error });
    });
});

app.post("/pay", (req, res) => {
  const { client_id, customer_id } = req.body;

  if (client_id) delete req.body.client_id;
  if (customer_id) delete req.body.customer_id;

  openpay.customers.charges.create(
    client_id || customer_id,
    req.body,
    function (error, body) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(body);
      }
    }
  );
});

app.post("/createCustomer", (req, res) => {
  openpay.customers.create(req.body, function (error, customer) {
    if (error) {
      return res.send(error);
    } else {
      return res.send(customer);
    }
  });
});

app.post("/addCardClient", (req, res) => {
  openpay.customers.cards.create(
    req.body.client_id,
    req.body,
    function (error, card) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(card);
      }
    }
  );
});

app.post("/addPlan", (req, res) => {
  const { client_id, customer_id } = req.body;

  if (client_id) delete req.body.client_id;
  if (customer_id) delete req.body.customer_id;

  openpay.customers.subscriptions.create(
    client_id || customer_id,
    req.body,
    function (error, subscription) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(subscription);
      }
    }
  );
});

app.post("/getClientCard", (req, res) => {
  openpay.customers.cards.get(
    req.body.client_id,
    req.body.card,
    function (error, subscription) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(subscription);
      }
    }
  );
});

app.post("/deleteClientCard", (req, res) => {
  openpay.customers.cards.delete(
    req.body.client_id,
    req.body.card,
    function (error, subscription) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(subscription);
      }
    }
  );
});

app.post("/cancelSubscription", (req, res) => {
  openpay.customers.subscriptions.delete(
    req.body.client_id,
    req.body.plan_id,
    function (error, subscription) {
      if (error) {
        return res.send(error);
      } else {
        return res.send(subscription);
      }
    }
  );
});

app.post("/export", (req, res) => {
  console.log("request->", req.body.id);
  const reportId = req.body.id;
  const fileName = `${reportId}.xlsx`;

  return db
    .collection(reportId)
    .get()
    .then((querySnapshot) => {
      const temp = [];

      querySnapshot.forEach((doc) => {
        temp.push(doc.data());
      });
      console.log("data--->", temp[0]);
      return json2xls(temp);
    })
    .then((csv) => {
      return fs.writeFileSync(fileName, csv, "binary");
    })
    .catch((err) => console.log(err));
});

app.post("/createWebhook", (req, res) => {
  const {
    OPEN_PAY_WEBHOOK_URL,
    OPEN_PAY_WEBHOOK_USER,
    OPEN_PAY_WEBHOOK_PASS,
  } = process.env;

  openpay.webhooks.create(
    {
      url: OPEN_PAY_WEBHOOK_URL,
      user: OPEN_PAY_WEBHOOK_USER,
      password: OPEN_PAY_WEBHOOK_PASS,
      event_types: ["charge.succeeded", "subscription.charge.failed"],
    },
    function (response) {
      res.json(response);
    }
  );
});

app.post("/subscriptionPayment", (req, res) => {
  // we seve the request with the time in firebase for debuging
  const subscriptionPaymentsRef = db.collection("AllPayments");
  // req.body.createdOn = moment().locale('es').format('LLL').toString()
  req.body.createdOn = moment().toDate();
  subscriptionPaymentsRef.add(req.body);

  const type = req.body.type;
  // we get req necesary variables
  const {
    transaction: { subscription_id, description, customer_id },
  } = req.body;
  //we must check that the description starts with Subscription that the type is succeeded and is not first month otherwise return
  description_first = description.split(" ")[0];
  month = description.split(" ")[4];

  if (description_first !== "Subscription") {
    return res.json({ msg: "Not a subscription" });
  }
  // if its the first month we dont process since it was done in the angular code
  if (month === "1") {
    return res.json({ msg: "First month" });
  }

  // if the renovation failed
  if (type === "subscription.charge.failed") {
    // add to firebase and return
    const ref = db.collection("FailedSubscriptions");
    ref.add(req.body);
    return res.json({ msg: "Failed subscription" });
  } else {
    // add to firebase for debbuging
    const ref = db.collection("SuccessfulSubscriptions");
    ref.add(req.body);

    // we get the user
    const usersRef = db
      .collection("users")
      .where("openPay_id", "==", customer_id)
      .get();
    usersRef
      .then((snapshot) => {
        snapshot.forEach((doc) => {
          let { $key, open_plan, credits, plan_id } = doc.data();
          // we match the plan with the openPay plan id
          if (open_plan !== subscription_id) {
            res.json({
              msg: "Plan does not exist",
            });
          }
          // if its a limited plan check if it expired for credits restart
          if (plan_id == 6) {
            credits = 20;
          }

          // if current expiration is before new expiration update else take current expiratipon
          let parsedExpirationDate = "";
          if (plan_id == 8) {
            parsedExpirationDate = moment().add(1, "Y");
          } else {
            parsedExpirationDate = moment().add(1, "M");
          }

          // opedte user and return success
          db.collection("users")
            .doc($key)
            .update({
              ...doc.data(),
              plan_expiration: parsedExpirationDate,
              credits: credits,
              subscription_count: parseInt(month),
              updatedOn: moment().locale("es").format("LLL").toString(),
            })
            .then(
              () => {
                const purchase = {
                  createdOn: moment().toDate(),
                  subscription: true,
                  user: $key,
                  amount: req.body.transaction.amount,
                  package: req.body.transaction.description,
                  subscription_count: parseInt(month),
                  date: moment().toDate(),
                  expiration: parsedExpirationDate
                    .locale("es")
                    .format("LL")
                    .toString(),
                  expirationObj: parsedExpirationDate.toDate(),
                  card: req.body.transaction.card.card_number,
                };
                db.collection("purchase")
                  .add({ purchase })
                  .then(() => {
                    fs.appendFile(
                      process.env.LOGS_PATH,
                      `${moment()
                        .locale("es")
                        .format("LLL")
                        .toString()} --|-- Se actualizo la subscripcion de ${$key} \n`,
                      (err) => {
                        if (err) console.log(err);
                      }
                    );
                    // we log it for debbuging and return success
                    return res.json({ msg: "User updated successfully." });
                  });
              },
              (err) => {
                return res.json({ msg: "Error " + err });
              }
            );
        });
      })
      .catch((err) => {
        return res.json({ msg: "Error " + err });
      });
  }
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8081);
