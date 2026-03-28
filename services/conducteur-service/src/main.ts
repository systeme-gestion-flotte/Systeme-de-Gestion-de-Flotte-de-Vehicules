import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Service Node.js en ligne !');
});

app.listen(port, () => {
  console.log(`Service démarré sur le port ${port}`);
});