const express = require('express')
const request = require('request')
const cheerio = require('cheerio')
const ejs = require('ejs')
const fs = require('fs')
const app = express()

// Login with cookie
// n


const port = process.argv[2] || 8080

app.use(express.static('public'))
app.set('view engine', 'ejs')


app.get('/', (req, res) => {
  res.render('index', { 
    movies: getMovies() 
  })
})

app.get('/search', (req, res) => {
  let { searchTerm } = req.query
  res.render('results', { 
    movies: filterMovies(searchTerm),
    searchTerm: searchTerm
  })
})

app.get('/movie/:movieId', (req, res) => {
  let {movieId} = req.params
  res.render('movie',{
    movie: getMovies(movieId)
  })
})


var getMovies = (movieId) => {
  // if (movieId == null) {
  if (movieId === undefined) {
    return movieDB
  } else {

    let foundMovie = movieDB.find((movie) => {
      if(movie.id == movieId) {
        return movie
      } else {
        console.log('No movies matched with that id!')
      }
    })
    return foundMovie
  }
}

var filterMovies = (searchTerm) => {
  let array = searchTerm.split(' ')
  console.log(array)
  let filteredDB = movieDB.filter((movie, index) => {
    let allMatched = false
    let count = 0
    let titleArray = movie.title.split(' ')
    array.forEach((word, index) => {
      for(let i = 0; i < titleArray.length; i++) {
        if (titleArray[i].toUpperCase() == word.toUpperCase()) {
          console.log(`Keyword that matched is [${word}].`)
          console.log(`Movie title is ${movie.title}`)
          count++
          i = titleArray.length
        }
      }
    })
    if(count === array.length) {
      console.log(`The movie ${movie.title} is returned.`)
      allMatched = true
    }
    return allMatched
  })
  return filteredDB
}


// Function get retrieving a list of movies
var getMoviesFromListId = (listId) => {
  // API Request for movies from a list ID
  var options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/list/${listId}`, //My TMDb Movie List
    qs: {
      language: 'en-US',
      api_key: '7a9602f5224d26b4db42b9c580059391'
    },
    body: '{}'
  }
  request(options, function(error, response, body) {
    if (error) console.log(error)
    let obj = JSON.parse(body)
    fs.writeFile(`${listId}.txt`, JSON.stringify(obj.items), function(err) {
      //checking if divs & classes exist when html is returned in a saved file
      if (err) {
        console.log(err)
      } else {
        console.log(`Wrote successfully to ${listId}.txt`)
      }
    })
  })
  updateMovieDB(listId)
}
let movieDB
// console.log(movieDB)

var updateMovieDB = (listId) => {
  fs.readFile(`${listId}.txt`, function(err, data) { // MUST USE PROMISES
    if (err) {
      console.log(err)
    } else {
      console.log(`Read successfully from ${listId}.txt`)
    }
    movieDB = JSON.parse(data)
    // console.log(movieDB)
  })
}

// function API Request for movie's credit
var getCreditsFromMovieId = (movieId) => {
  // API Request for movies from a list ID
  var options = {
    method: 'GET',
    url: `https://api.themoviedb.org/3/movie/${movieId}/credits`, //My TMDb Movie List
    qs: {
      api_key: '7a9602f5224d26b4db42b9c580059391'
    }
  }
  request(options, function(error, response, body) {
    if (error) console.log(error)
    let movieCredits = JSON.parse(body)
    console.log(movieCredits)
    return movieCredits
  })
}

// getCreditsFromMovieId('198663')
getMoviesFromListId('28')
const baseImageUrl = 'http://image.tmdb.org/t/p/original'
// console.log(movieDB)





//Sample Data
let movieDBOLD = [
  {
    id: 0,
    title: 'Blade Runner',
    year: '1982',
    rated: 'R',
    released: '25 June 1982',
    runtime: '1h 57min',
    genre: 'Sci-Fi, Thriller',
    director: 'Ridley Scott',
    writer: 'Hampton Fancher, David Peoples',
    actors: 'Harrison Ford, Rutger Hauer, Sean Young, Edward James Olmos',
    plot:
      'A blade runner must pursue and try to terminate four replicants who stole a ship in space and have returned to Earth to find their creator.',
    language: 'English',
    country: 'USA, Hong Kong',
    poster:
      'https://image.tmdb.org/t/p/w600_and_h900_bestv2/p64TtbZGCElxQHpAMWmDHkWJlH2.jpg'
  },
  {
    id: 1,
    title: 'The Maze Runner',
    year: '2014',
    rated: 'PG-13',
    released: '10 Sept 2014',
    runtime: '1h 53min',
    genre: 'Sci-Fi, Thriller, Mystery, Action',
    director: 'Wes Ball',
    writer: 'Hampton Fancher, David Peoples',
    actors: 'Noah Oppenheim, Grant Pierce Myers',
    plot:
      'Thomas is deposited in a community of boys after his memory is erased, soon learning they\'re all trapped in a maze that will require him to join forces with fellow "runners" for a shot at escape.',
    language: 'English',
    country: 'USA, UK',
    poster:
      'https://image.tmdb.org/t/p/w600_and_h900_bestv2/coss7RgL0NH6g4fC2s5atvf3dFO.jpg'
  },
  {
    id: 2,
    title: 'The Matrix',
    year: '1999',
    rated: 'R',
    released: '31 March 1999',
    runtime: '2h 26min',
    genre: 'Sci-Fi, Thriller',
    director: 'Lana Wachowski, Lilly Wachowski',
    writer: 'Lana Wachowski, Lilly Wachowski',
    actors: 'Keanu Reeves, Laurence Fishburne',
    plot:
      'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
    language: 'English',
    country: 'USA',
    poster:
      'https://image.tmdb.org/t/p/w600_and_h900_bestv2/gynBNzwyaHKtXqlEKKLioNkjKgN.jpg'
  }
]


app.listen(port, () => {
  console.log(`Listening to port ${port}...`)
  console.log('Server Started on http://localhost:8080')
  console.log('Press CTRL + C to stop server')
})

