"use strict";

const express = require ('express');
const mongodb = require ('mongodb').MongoClient;
const fs = require ('fs');
const marked = require ('marked');
const co = require('co');
const GoogleSearch = require('google-search');
const auth_data = parseJSON (process.env.auth_data) || require ('./auth_data');

let googleSearch = new GoogleSearch ({
  key: auth_data.apikey,
  cx: auth_data.cx
});

let app = express ();

app.get ('/search/*', (req, res, next) => {
  if ( req.params[0] == '' ) {
    next ();
    return;
  }

  co (function* () {
    let query = req.params[0];
    let offset = 0;

    if ( 'offset' in req.query )
      offset = +req.query.offset;

    res.writeHead (200, { 'Content-Type': 'application/json' });
    res.end (JSON.stringify ({ query: query, offset: offset }));
  });
});

app.get ('*', (req, res) => {
  res.writeHead (200, { 'Content-Type': 'text/html' });

  let buf = fs.readFileSync ('README.md');
  res.end ('<html><head><title>Image Search - Neckers</title></head><body>'
          + marked (buf.toString ()) + '</body></html>');
});

app.listen ( process.env.PORT || 8080)
