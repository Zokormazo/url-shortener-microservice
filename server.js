var express = require('express')
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient
var shortid = require('shortid')
var url = require('url')

var app = express()

app.set('port', (process.env.PORT || 5000))
app.enable('trust proxy')

var mongoUrl = process.env.MONGO_URI
var db;



// Initialize connection once
MongoClient.connect(mongoUrl, function(err, database) {
    if(err) throw err;
    
    db = database;
    
    // Start the application after the database connection is ready
    app.listen(app.get('port'), function() {
        console.log('Node app is running on port', app.get('port'))
    })
});

app.get('/new/*', function(req, res) {
    var originalUrl = req.originalUrl.substr(5)
    var longUrl = url.parse(originalUrl)
    if (longUrl.hostname && (longUrl.hostname.slice(-1) !== ".") && (longUrl.hostname.indexOf('.') !== -1))
        db.collection('url-shortener').insertOne({
            url: originalUrl,
            _id: shortid.generate()
        }, function(err, docs) {
            if (err) throw err

            var shortURL = req.protocol + '://' + req.get('host') + '/' + docs.ops[0]._id;
            res.send({
                original_url: originalUrl,
                short_url: shortURL
            })
        })
    else
        res.send({error: 'Invalid URL'})
})

app.get('/:shortUrl', function(req, res) {
    db.collection('url-shortener').findOne({_id: req.params.shortUrl}, function(err, doc) {
        if (err) {
            throw err
        }
        if (doc)
            res.redirect(301, doc.url)
        else
            res.sendStatus(404)
    })
})