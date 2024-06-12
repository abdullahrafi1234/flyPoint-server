const express = require('express');
const cors = require('cors');
//env file
require('dotenv').config()
const jwt = require('jsonwebtoken')
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
    await client.connect();


    const bookingCollection = client.db("flyPoint").collection("bookings")
    const userCollection = client.db("flyPoint").collection("users")

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

    //for statistics
    app.get('/bookings', async (req, res) => {
      // const email = req.query.email
      // const query = { email: email }
      const result = await bookingCollection.find().toArray()
      res.send(result)
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



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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