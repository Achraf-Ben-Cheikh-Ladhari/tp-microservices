const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
//const { MongoClient } = require('mongodb');
const mongoose=require('mongoose');
const Movie = require('./models/movieModel');

const movieProtoPath = 'movie.proto';
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;

const url = 'mongodb://localhost:27017/moviesDB';
//const dbName = 'moviesDB';

mongoose.connect(url)
.then(()=>{
    console.log('connected to database!');
}).catch((err)=>{
    console.log(err);
})

const movieService = {
    getMovie: async (call, callback) => {
        try {
            const movieId = call.request.movie_id;
           // console.log(call.request);
            const movie = await Movie.findOne({ _id: movieId }).exec();
            //console.log(movieId);
            if (!movie) {
                callback({ code: grpc.status.NOT_FOUND, message: 'Movie not found' });
                return;
            }
            callback(null, { movie });
        } catch (error) {
            callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching movie' });
        }
    },
    searchMovies: (call, callback) => {
        Movie.find({})
            .exec() 
            .then(movies => {
                callback(null, { movies });
            })
            .catch(error => {
                callback({ code: grpc.status.INTERNAL, message: 'Error occurred while fetching movies' });
            });
    },  
    addMovie: (call, callback) => {
        const { title, description } = call.request;
        const newMovie = new Movie({ title, description });
        newMovie.save()
            .then(savedMovie => {
                callback(null, { movie: savedMovie });
            })
            .catch(error => {
                callback({ code: grpc.status.INTERNAL, message: 'Error occurred while adding movie' });
            });
    }
    
    
};

const server = new grpc.Server();
server.addService(movieProto.MovieService.service, movieService);
const port = 50051;
server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Failed to bind server:', err);
            return;
        }
        console.log(`Server is running on port ${port}`);
        server.start();
    });
console.log(`Movie microservice is running on port ${port}`);