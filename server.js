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


app.use((req, res, next) => {
  console.log(`${new Date()} @ ${req.url}`)
  next() //allows passing onto next app.use
})


app.get('/', (req, res) => {
  res.render('index', { 
    movies: getMovies() 
  })
})


// app.get('/filter', (req, res) => {
app.get('/filter', (req, res) => {
  let { filterTerm } = req.query
  res.render('filtered-results', {
    movies: filterMovies(filterTerm),
    filterTerm: filterTerm
  })
})

// searches and displays results from TheMovieDb search API
app.get('/search', (req, res) => {
  let { searchTerm } = req.query
  let promiseObj = searchMovie(searchTerm)
    .then(function(fulfilled) {
      res.render('results', {
        movies: fulfilled,
        searchTerm: searchTerm
      })
    })
    .catch(function(error) {
      console.log(error.message)
    })
  })

app.get('/movie/:movieId', (req, res) => {
  let {movieId} = req.params
  let foundMovie = getMovies(movieId)
  if(foundMovie == undefined) {
    res.render('error', {
      message: `This movie id [${movieId}] is not in the database.` 
    })
  } else {
    res.render('movie',{
      movie: getMovies(movieId)
    })
  }
})
let searchResults

let searchMovie = (searchTerm) => new Promise (function(resolve, reject) {
  let filename = 'searchResults'
  let options = {
    method: 'GET',
    url: 'https://api.themoviedb.org/3/search/movie',
    qs: {
      include_adult: 'false',
      page: '1',
      language: 'en-US',
      api_key: '7a9602f5224d26b4db42b9c580059391',
      query: searchTerm
    }
  }
  request(options, function(error, response, body) { //TMDb API Search Request
    if (error) console.log(error)
    // console.log(body)
    let obj = JSON.parse(body)
    // console.log(obj)
    // let totalResults = obj.total_results
    fs.writeFile(`${filename}.txt`, JSON.stringify(obj.results), function(err) {
      //checking if divs & classes exist when html is returned in a saved file
      if (err) {
        console.log(err)
      } else {
        console.log(`Wrote successfully to ${filename}.txt`)
      }
      fs.readFile(`${filename}.txt`, function(err, data) {
        // MUST USE PROMISES
        if (err) {
          console.log(err)
          reject('cannot read file...')
        } else {
          console.log(`Read successfully from ${filename}.txt`)
        }
        // updateSearchResults(filename)
        searchResults = JSON.parse(data)
        // console.log(searchResults)
        resolve(searchResults)
      })
    })
  })
})

// var getResults = (searchTerm) => {
//   searchMovie(searchTerm)
//   return searchResults
// }

var getResults = (searchTerm) => new Promise(
  function (resolve, reject) {
    if (searchTerm != undefined) {
        searchMovie(searchTerm)
      resolve(searchResults)
    } else {
      reject('SearchTerm is undefined')
    }
  }
)



var getMovies = (movieId) => {
  // if (movieId == null) {
  if (movieId === undefined) {
    return movieDB
  } else {
    //console.log(`Found ID: ${movieId}.`)
    let foundMovie = movieDB.find((movie) => {
      // console.log(`Movie's Database is checking ${movie.id} with ${movieId}`)
      if(Number(movie.id) == Number(movieId)) {
        return movie
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

var getPopularMoviesList = () => {
  var options = {
    method: 'GET',
    url: 'https://api.themoviedb.org/3/movie/popular',
    qs: {
      api_key: '7a9602f5224d26b4db42b9c580059391',
      language: 'en-US',
      page: '1'
    }
  }
  request(options, function(error, response, body) {
    if (error) console.log(error)
    let obj = JSON.parse(body)
    // console.log(obj)
    fs.writeFile('popular.txt', JSON.stringify(obj.results), function(err) {
      //checking if divs & classes exist when html is returned in a saved file
      if (err) {
        console.log(err)
      } else {
        console.log(`Wrote successfully to popular.txt`)
      }
    })
  })
  updateMovieDB('popular')
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
    fs.writeFileSync(`${listId}.txt`, JSON.stringify(obj.items), function(err) {
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


var updateSearchResults = (filename) => {
  fs.readFile(`${filename}.txt`, function(err, data) { // MUST USE PROMISES
    if (err) {
      console.log(err)
    } else {
      console.log(`Read successfully from ${filename}.txt`)
    }
    searchResults = JSON.parse(data)
  })
}

var updateMovieDB = (filename) => {
  fs.readFile(`${filename}.txt`, function(err, data) { // MUST USE PROMISES
    if (err) {
      console.log(err)
    } else {
      console.log(`Read successfully from ${filename}.txt`)
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
//getMoviesFromListId('1')
getPopularMoviesList()

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

