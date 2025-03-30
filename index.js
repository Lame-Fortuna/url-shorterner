require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const fs = require('fs');
const urlParser = require('url');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const port = process.env.PORT || 3000;

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Ensure urls.json exists
const filePath = 'urls.json';
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, '[]'); // Create an empty array if file doesn't exist
}

// Shorten URL endpoint
app.post('/api/shorturl', (req, res) => {
  const { url } = req.body;

  try {
    const parsedUrl = urlParser.parse(url);
    
    if (!parsedUrl.protocol || !/^https?:$/.test(parsedUrl.protocol)) {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(parsedUrl.hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }

      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Server error' });

        let jsonData = JSON.parse(data);
        const id = jsonData.length + 1;

        const newEntry = { original_url: url, short_url: id };
        jsonData.push(newEntry);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
          if (err) return res.status(500).json({ error: 'Error saving data' });

          res.json(newEntry);
        });
      });
    });
  } catch (err) {
    res.json({ error: 'invalid url' });
  }
});

// Redirect endpoint
app.get('/api/shorturl/:num', (req, res) => {
  const num = parseInt(req.params.num, 10);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Error reading file' });

    const jsonData = JSON.parse(data);
    const urlEntry = jsonData.find((item) => item.short_url === num);

    if (urlEntry) {
      res.redirect(urlEntry.original_url);
    } else {
      res.json({ error: 'invalid url' });
    }
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
