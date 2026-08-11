const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      /^https?:\/\/localhost(?::\d+)?$/,
      /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
      /^https?:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+(?::\d+)?$/,
      /^https?:\/\/192\.168\.[0-9]+\.[0-9]+(?::\d+)?$/,
      /^https?:\/\/172\.(?:1[6-9]|2[0-9]|3[0-1])\.[0-9]+\.[0-9]+(?::\d+)?$/,
    ],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Authorization'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use('/api/v1', routes);

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use(errorMiddleware);

module.exports = app;
