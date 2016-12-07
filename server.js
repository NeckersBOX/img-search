"use strict";

const express = require ('express');
const mongodb = require ('mongodb').MongoClient;
const fs = require ('fs');
const marked = require ('marked');
const request = require ('request');

let app = express ();

app.get ('/search/*', (req, res, next) => {
  if ( req.params[0] == '' ) {
    next ();
    return;
  }

  let query = req.params[0].split (' ').join (',');
  let offset = 0;

  if ( 'offset' in req.query )
    offset = +req.query.offset;

  res.writeHead (200, { 'Content-Type': 'application/json' });

  request ({
    url: 'https://api.cognitive.microsoft.com/bing/v5.0/images/search/',
    method: 'GET',
    qs: { q: query, offset: offset },
    headers: {
      'Ocp-Apim-Subscription-Key': process.env.bingkey
    }
  }, (err, bing_res, body) => {
    if ( err ) {
      res.end (JSON.stringify ({ error: err }));
      return;
    }

    let parsed = JSON.parse (body);

    if ( bing_res.statusCode !== 200 ) {
      res.end (JSON.stringify ({
        status: bing_res.statusCode,
        error: parsed.message }));
      return;
    }

    mongodb.connect (process.env.mongoauth, (err, db)=> {
      if ( err ) {
        res.end (JSON.stringify ({ error: 'Error in mongodb.connect' }));
        return;
      }

      let collection = db.collection ('recent_img_search');
      collection.findOne ({}, { 'sort': { _id: -1 } }, (err, doc) => {
        let next_id = 1;
        if ( !err && doc )
          next_id = doc._id + 1;

        collection.insert ({
          _id: next_id,
          date: Math.floor (new Date ().getTime () / 1000),
          query: query
        });

        if ( 'value' in parsed )
          res.end (JSON.stringify (parsed.value));
        else res.end (JSON.stringify ([]));
      });
    });
  });
});

app.get ('*', (req, res) => {
  res.writeHead (200, { 'Content-Type': 'text/html' });

  let buf = fs.readFileSync ('README.md');
  res.end ('<html><head><title>Image Search - Neckers</title></head><body>'
          + marked (buf.toString ()) + '</body></html>');
});

app.listen ( process.env.PORT || 8080)
