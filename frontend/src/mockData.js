// Mock data for OnStream streaming app

export const featuredMovies = [
  {
    id: 1,
    title: "Spider-Man: No Way Home",
    description: "Peter Parker's identity is revealed, forcing him to seek help from Doctor Strange to restore his secret.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    banner: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    year: 2021,
    rating: 8.4,
    genre: ["Action", "Adventure", "Sci-Fi"],
    duration: "148 min",
    quality: "HD",
    servers: ["Server 1", "Server 2", "Server 3"],
    trailer: "https://www.youtube.com/embed/JfVOs4VSpmA"
  },
  {
    id: 2,
    title: "The Batman",
    description: "Batman ventures into Gotham City's underworld when a sadistic killer leaves behind a trail of cryptic clues.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    banner: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    year: 2022,
    rating: 7.8,
    genre: ["Action", "Crime", "Drama"],
    duration: "176 min",
    quality: "HD",
    servers: ["Server 1", "Server 2", "Server 3"],
    trailer: "https://www.youtube.com/embed/mqqft2x_Aa4"
  },
  {
    id: 3,
    title: "Top Gun: Maverick",
    description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    banner: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop",
    year: 2022,
    rating: 8.7,
    genre: ["Action", "Drama"],
    duration: "130 min",
    quality: "HD",
    servers: ["Server 1", "Server 2", "Server 3"],
    trailer: "https://www.youtube.com/embed/qSqVVswa420"
  }
];

export const popularMovies = [
  {
    id: 4,
    title: "Dune",
    description: "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    year: 2021,
    rating: 8.0,
    genre: ["Action", "Adventure", "Drama"],
    duration: "155 min",
    quality: "HD"
  },
  {
    id: 5,
    title: "No Time to Die",
    description: "James Bond has left active service when his friend and CIA agent is kidnapped.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    year: 2021,
    rating: 7.3,
    genre: ["Action", "Adventure", "Thriller"],
    duration: "163 min",
    quality: "HD"
  },
  {
    id: 6,
    title: "Fast X",
    description: "Dom Toretto and his family are targeted by the vengeful son of drug kingpin Hernan Reyes.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    year: 2023,
    rating: 5.8,
    genre: ["Action", "Crime", "Thriller"],
    duration: "141 min",
    quality: "HD"
  }
];

export const tvShows = [
  {
    id: 7,
    title: "Stranger Things",
    description: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    year: 2016,
    rating: 8.7,
    genre: ["Drama", "Fantasy", "Horror"],
    seasons: 4,
    quality: "HD",
    type: "series"
  },
  {
    id: 8,
    title: "The Boys",
    description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    year: 2019,
    rating: 8.7,
    genre: ["Action", "Comedy", "Crime"],
    seasons: 3,
    quality: "HD",
    type: "series"
  },
  {
    id: 9,
    title: "House of the Dragon",
    description: "An internal succession war within House Targaryen at the height of its power, 172 years before the birth of Daenerys Targaryen.",
    poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500&h=750&fit=crop",
    year: 2022,
    rating: 8.5,
    genre: ["Action", "Adventure", "Drama"],
    seasons: 1,
    quality: "HD",
    type: "series"
  }
];

export const categories = [
  "Action",
  "Adventure", 
  "Comedy",
  "Drama",
  "Horror",
  "Sci-Fi",
  "Thriller",
  "Romance",
  "Fantasy",
  "Crime"
];

export const allContent = [...featuredMovies, ...popularMovies, ...tvShows];

// Mock user data
export const userData = {
  watchlist: [],
  downloads: [],
  recentlyWatched: [],
  preferences: {
    quality: "HD",
    subtitles: "English",
    autoplay: true
  }
};