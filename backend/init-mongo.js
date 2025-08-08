// MongoDB initialization script for OnStream

// Switch to the onstream database
db = db.getSiblingDB('onstream');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'email', 'password_hash', 'is_admin', 'created_at'],
      properties: {
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 50,
          description: 'Username must be a string between 3-50 characters'
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Email must be a valid email address'
        },
        password_hash: {
          bsonType: 'string',
          description: 'Password hash must be a string'
        },
        is_admin: {
          bsonType: 'bool',
          description: 'Admin flag must be a boolean'
        },
        created_at: {
          bsonType: 'date',
          description: 'Created date must be a valid date'
        },
        last_login: {
          bsonType: ['date', 'null'],
          description: 'Last login must be a date or null'
        }
      }
    }
  }
});

db.createCollection('movies', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tmdb_id', 'title', 'type', 'cached_at', 'expires_at'],
      properties: {
        tmdb_id: {
          bsonType: 'int',
          description: 'TMDB ID must be an integer'
        },
        title: {
          bsonType: 'string',
          minLength: 1,
          description: 'Title must be a non-empty string'
        },
        type: {
          bsonType: 'string',
          enum: ['movie', 'tv'],
          description: 'Type must be either movie or tv'
        },
        cached_at: {
          bsonType: 'date',
          description: 'Cache date must be a valid date'
        },
        expires_at: {
          bsonType: 'date',
          description: 'Expiry date must be a valid date'
        }
      }
    }
  }
});

db.createCollection('streams', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tmdb_id', 'sources', 'cached_at', 'expires_at'],
      properties: {
        tmdb_id: {
          bsonType: 'int',
          description: 'TMDB ID must be an integer'
        },
        sources: {
          bsonType: 'array',
          description: 'Sources must be an array'
        },
        cached_at: {
          bsonType: 'date',
          description: 'Cache date must be a valid date'
        },
        expires_at: {
          bsonType: 'date',
          description: 'Expiry date must be a valid date'
        }
      }
    }
  }
});

db.createCollection('favorites', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'tmdb_id', 'title', 'added_at'],
      properties: {
        username: {
          bsonType: 'string',
          description: 'Username must be a string'
        },
        tmdb_id: {
          bsonType: 'int',
          description: 'TMDB ID must be an integer'
        },
        title: {
          bsonType: 'string',
          description: 'Title must be a string'
        },
        added_at: {
          bsonType: 'date',
          description: 'Added date must be a valid date'
        }
      }
    }
  }
});

db.createCollection('watch_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['username', 'tmdb_id', 'title', 'watched_at'],
      properties: {
        username: {
          bsonType: 'string',
          description: 'Username must be a string'
        },
        tmdb_id: {
          bsonType: 'int',
          description: 'TMDB ID must be an integer'
        },
        title: {
          bsonType: 'string',
          description: 'Title must be a string'
        },
        watched_at: {
          bsonType: 'date',
          description: 'Watched date must be a valid date'
        },
        progress: {
          bsonType: ['double', 'int'],
          minimum: 0,
          maximum: 1,
          description: 'Progress must be a number between 0 and 1'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });

db.movies.createIndex({ tmdb_id: 1 }, { unique: true });
db.movies.createIndex({ type: 1 });
db.movies.createIndex({ expires_at: 1 });
db.movies.createIndex({ title: 'text', overview: 'text' });

db.streams.createIndex({ tmdb_id: 1 });
db.streams.createIndex({ expires_at: 1 });

db.favorites.createIndex({ username: 1, tmdb_id: 1 }, { unique: true });
db.favorites.createIndex({ username: 1 });

db.watch_history.createIndex({ username: 1, tmdb_id: 1 });
db.watch_history.createIndex({ username: 1 });

print('OnStream database initialized successfully!');