require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs'); // For reading and writing files

app.use(express.json()); // Middleware to parse JSON in requests
app.use(express.urlencoded())

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Writing
app.post('/api/shorturl', (req, res)=>{
  const url = req.body.url

  fs.readFile('urls.json', 'utf8', (err, data) => {
    let jsonData = JSON.parse(data)

    const id = jsonData.length

    jsonData.push({"original_url": url, "short_url": id+1})
    

    fs.writeFile('urls.json', JSON.stringify(jsonData, null, 2), (err) => {
      console.log(url, id, 'written to file');
    });

    res.status(500).json({"original_url": url, "short_url": id+1})
  });

})

// Reading
app.get('/api/shorturl/:num', (req, res) => {
  const num = parseInt(req.params.num, 10); // Ensure num is treated as a number

  fs.readFile('urls.json', 'utf8', (err, data) => {
      if (err) {
          console.error('Error reading the file:', err);
          return res.status(500).json({ error: 'Error reading file' });
      }

      const jsonData = JSON.parse(data); // Parse the JSON file content
      console.log(jsonData);

      const urlEntry = jsonData.find(item => item.short_url === num);

      if (urlEntry && urlEntry.original_url) {
          res.redirect(urlEntry.original_url); // Redirect if URL is found
      } else {
          res.status(404).json({ error: 'invalid url' }); // Respond with error if not found
      }
  });
});


app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
