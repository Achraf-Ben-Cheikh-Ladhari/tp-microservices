const mongoose = require('mongoose');

const tvShowsSchema = new mongoose.Schema({
    title: String,
    description: String,
});

const tvShows = mongoose.model('tvShows', tvShowsSchema);

module.exports = tvShows;