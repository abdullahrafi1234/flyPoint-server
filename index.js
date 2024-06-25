const express = require('express');
const cors = require('cors');
//env file
require('dotenv').config()
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const app = express()
const port = process.env.PORT || 5000


//middleware
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ev0lfe7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const bookingCollection = client.db("flyPoint").collection("bookings")
    const userCollection = client.db("flyPoint").collection("users")
    const reviewCollection = client.db("flyPoint").collection("reviews")

    //jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token })
    })

    //middlewares 
    const verifyToken = (req, res, next) => {
      console.log('inside verify token', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded
        next();
      })
      // next()
    }


    //users related api

    // get all users data from db
    app.get('/users', verifyToken, async (req, res) => {
      console.log(req.headers)
      const result = await userCollection.find().toArray()
      res.send(result)
    })

    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;

      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: 'forbidden access' })
      // }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'Admin';
      }
      res.send({ admin });
    });

    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;

      // if (email !== req.decoded.email) {
      //     return res.status(403).send({ message: 'forbidden access' })
      // }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let role = "User";
      if (user) {
        type = user?.role;
      }
      res.send({ role: role });
    });

    app.get('/users/delivery-men', async (req, res) => {
      const query = { role: "Delivery Man" };
      const deliveryMen = await userCollection.find(query).toArray();
      res.send(deliveryMen);
    });

    //manage button api
    app.patch('/parcels/update-admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateParcel = req.body;
      const parcel = {
        $set: {
          deliveryManID: updateParcel.deliveryManID,
          approxDeliveryDate: updateParcel.approxDeliveryDate,
          status: "On The Way"
        }
      }
      const result = await bookingCollection.updateOne(filter, parcel, options);
      res.send(result);
    })

    app.get('/userCount', async (req, res) => {
      const query = { role: "User" };
      const count = await userCollection.countDocuments(query);
      res.send({ count });
    })


    app.get('/user-booking-count/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const count = await bookingCollection.countDocuments(query);
      res.send({ count });
    })

    app.post('/users', async (req, res) => {
      const user = req.body
      //checking existing user
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user)
      res.send(result)
    })

    //all delivery man api
    app.get('/users/delivery-men', async (req, res) => {
      const query = { role: "Delivery Man" };
      const deliveryMen = await userCollection.find(query).toArray();
      res.send(deliveryMen);
    });


    app.get('/delivery-man-delivered-count/:id', async (req, res) => {
      const id = req.params.id;
      const query = { deliveryManID: id, status: "Delivered" }
      const count = await bookingCollection.countDocuments(query);
      res.send({ count });
    })

    app.get('/delivery-man-average-rating/:id', async (req, res) => {
      const id = req.params.id;
      const result = await reviewCollection.aggregate([
        {
          $match: { deliveryManID: id }
        },
        {
          $group: {
            _id: '$deliveryManID',
            averageRating: { $avg: '$rating' }
          }
        }
      ]).toArray();

      const averageRating = result.length > 0 ? result[0].averageRating : 0;

      res.json({ averageRating });
    })


    // get a user info by email from db
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email
      const result = await userCollection.findOne({ email })
      res.send(result)
    })

    //make admin
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'Admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    //make delivery man
    app.patch('/userss/admin/:id', async (req, res) => {
      const id = req.params.id
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          role: 'Delivery Man'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    app.get('/userCount', async (req, res) => {
      const query = { role: "User" };
      const count = await userCollection.countDocuments(query);
      res.send({ count });
    })


    //delivery man related api
    app.get('/user-by-email/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    app.get('/parcels/delivery-man/:id', async (req, res) => {
      const id = req.params.id;
      const query = { deliveryManID: id }
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })

    //booking related api

    // get all parcel data from db
    app.get('/bookings', async (req, res) => {
      const result = await bookingCollection.find().toArray()
      res.send(result)
    })

    app.get('/booking', async (req, res) => {
      const email = req.query.email
      const query = { email: email }
      const result = await bookingCollection.find(query).toArray()
      res.send(result)
    })

    app.get('/parcelsCount', async (req, res) => {
      const count = await bookingCollection.countDocuments();
      res.send({ count });
    })

    app.get('/deliveredParcelsCount', async (req, res) => {
      const query = { status: "Delivered" };
      const count = await bookingCollection.countDocuments(query);
      res.send({ count });
    })


    app.get('/top-delivery-men', async (req, res) => {
      const deliveryMen = await userCollection.aggregate([
        {
          $match: { role: "Delivery Man" }
        },
        {
          $lookup: {
            from: 'bookings',
            let: { deliveryManId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$deliveryManID', { $toString: '$$deliveryManId' }] },
                      { $eq: ['$status', 'Delivered'] }
                    ]
                  }
                }
              }
            ],
            as: 'deliveredParcels'
          }
        },
        {
          $addFields: {
            deliveredCount: { $size: '$deliveredParcels' }
          }
        },
        {
          $lookup: {
            from: 'reviews',
            let: { deliveryManId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$deliveryManID', { $toString: '$$deliveryManId' }]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  averageRating: { $avg: '$rating' }
                }
              }
            ],
            as: 'ratingInfo'
          }
        },
        {
          $addFields: {
            averageRating: { $arrayElemAt: ['$ratingInfo.averageRating', 0] }
          }
        },
        {
          $sort: { deliveredCount: -1 }
        },
        {
          $limit: 3
        },
        {
          $project: {
            _id: 1,
            email: 1,
            name: 1,
            photo: 1,
            deliveredCount: 1,
            averageRating: 1
          }
        }
      ]).toArray();

      res.send(deliveryMen);
    });


    app.get('/delivery-man/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { deliveryManID: id }
      const result = await reviewCollection.find(query).toArray();
      res.send(result);
    });


    app.post('/delivery-man/review', async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });

    // //for statistics
    // app.get('/bookings', async (req, res) => {
    //   // const email = req.query.email
    //   // const query = { email: email }
    //   const result = await bookingCollection.find().toArray()
    //   res.send(result)
    // })

    //Statistics
    app.get('/statistics', async (req, res) => {
      const bookings = await bookingCollection.aggregate([
        {
          $group: {
            _id: "$bookingDate",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray();

      const delivered = await bookingCollection.aggregate([
        { $match: { status: "Delivered" } },
        {
          $group: {
            _id: "$bookingDate",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]).toArray();

      const dates = bookings.map(b => b._id);
      const bookingsData = bookings.map(b => b.count);
      const deliveredData = delivered.map(d => d.count);

      res.json({ bookings: bookingsData, delivered: deliveredData, dates });
    })

    app.get('/booking/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await bookingCollection.findOne(query)
      res.send(result)
    })

    app.post('/booking', async (req, res) => {
      const booking = req.body
      console.log(booking)
      const result = await bookingCollection.insertOne(booking)
      res.send(result)
    })

    //update method
    app.patch('/booking/:id', async (req, res) => {
      const parcel = req.body
      const id = req.params?.id
      console.log(id)
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          phone: parcel.phone,
          type: parcel.type,
          weight: parcel.weight,
          receiversName: parcel.receiversName,
          receiversPhone: parcel.receiversPhone,
          deliveryAddress: parcel.deliveryAddress,
          deliveryDate: parcel.deliveryDate,
          latitude: parcel.latitude,
          longitude: parcel.longitude
        }
      }
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    //cancel method
    app.patch('/bookings/:id', async (req, res) => {
      const parcel = req.body
      const id = req.params?.id
      console.log(id)
      const filter = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          status: parcel.status,
        }
      }
      const result = await bookingCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    //payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100)
      console.log('inside amount', amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: [
          'card'
        ]
      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Fly point is flying')
})

app.listen(port, () => {
  console.log(`Fly Point is Flying on port: ${port}`)
})