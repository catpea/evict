export class Memoize {
  #target;
  #cache = new Map();
  #config = new Map();
  #pendingAsync = new Map(); // Prevent duplicate async calls
  #defaultOptions;

  constructor(target, keys = [], options = {}) {
    this.#target = target;
    this.#defaultOptions = options;

    // Build configuration map from keys array
    for (const item of keys) {
      this.#processKeyConfig(item);
    }

    return new Proxy(target, {
      get: (target, prop, receiver) => this.#handleGet(target, prop, receiver)
    });
  }

  #processKeyConfig(item) {
    if (typeof item === 'string') {
      // Simple string: "name"
      this.#config.set(item, { ttl: this.#defaultOptions.ttl });
    } else if (typeof item === 'function') {
      // Function reference: this.books
      const name = this.#findMethodName(item);
      if (name) {
        this.#config.set(name, { ttl: this.#defaultOptions.ttl });
      }
    } else if (typeof item === 'object' && item.key) {
      // Config object: {key: this.books, ttl: 1000}
      const keyName = typeof item.key === 'string'
        ? item.key
        : this.#findMethodName(item.key);
      if (keyName) {
        this.#config.set(keyName, {
          ttl: item.ttl ?? this.#defaultOptions.ttl
        });
      }
    }
  }

  #findMethodName(fn) {
    // Search prototype chain for the method name
    let proto = Object.getPrototypeOf(this.#target);
    while (proto) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        if (proto[key] === fn) return key;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  #handleGet(target, prop, receiver) {
    // Not configured for memoization - return original
    if (!this.#config.has(prop)) {
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    }

    const config = this.#config.get(prop);
    const descriptor = this.#getPropertyDescriptor(prop);

    // Handle getters
    if (descriptor?.get) {
      return this.#memoizeGetter(prop, descriptor.get, config);
    }

    // Handle methods
    const value = Reflect.get(target, prop, receiver);
    if (typeof value === 'function') {
      return this.#memoizeMethod(prop, value, config);
    }

    return value;
  }

  #getPropertyDescriptor(prop) {
    let proto = Object.getPrototypeOf(this.#target);
    while (proto) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
      if (descriptor) return descriptor;
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  }

  #memoizeGetter(prop, getter, config) {
    const cacheKey = `getter:${prop}`;

    // Check cache
    const cached = this.#getFromCache(cacheKey, config);
    if (cached !== undefined) return cached.value;

    // Compute and cache
    const result = getter.call(this.#target);
    this.#setInCache(cacheKey, result, config);
    return result;
  }

  #memoizeMethod(prop, method, config) {
    return (...args) => {
      const cacheKey = `method:${prop}:${this.#serializeArgs(args)}`;

      // Check cache
      const cached = this.#getFromCache(cacheKey, config);
      if (cached !== undefined) return cached.value;

      // Execute method
      const result = method.apply(this.#target, args);

      // Handle async methods
      if (result instanceof Promise) {
        // Prevent duplicate async calls
        if (this.#pendingAsync.has(cacheKey)) {
          return this.#pendingAsync.get(cacheKey);
        }

        const promise = result
          .then(resolved => {
            this.#setInCache(cacheKey, resolved, config);
            this.#pendingAsync.delete(cacheKey);
            return resolved;
          })
          .catch(error => {
            this.#pendingAsync.delete(cacheKey);
            throw error; // Don't cache errors by default
          });

        this.#pendingAsync.set(cacheKey, promise);
        return promise;
      }

      // Handle sync methods
      this.#setInCache(cacheKey, result, config);
      return result;
    };
  }

  #serializeArgs(args) {
    if (args.length === 0) return '';
    try {
      return JSON.stringify(args);
    } catch (e) {
      // Fallback for non-serializable arguments
      return args.map((arg, i) => `${i}:${typeof arg}:${String(arg)}`).join('|');
    }
  }

  #getFromCache(key, config) {
    if (!this.#cache.has(key)) return undefined;

    const entry = this.#cache.get(key);

    // Check TTL expiration
    if (config.ttl !== undefined && config.ttl !== null) {
      if (Date.now() - entry.timestamp > config.ttl) {
        this.#cache.delete(key);
        return undefined;
      }
    }

    return entry;
  }

  #setInCache(key, value, config) {
    this.#cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: config.ttl
    });
  }

  // Public API for cache management
  clearCache(methodName = null) {
    if (methodName) {
      // Clear specific method's cache
      for (const key of this.#cache.keys()) {
        if (key.includes(`:${methodName}:`)) {
          this.#cache.delete(key);
        }
      }
    } else {
      // Clear all
      this.#cache.clear();
      this.#pendingAsync.clear();
    }
  }

  getCacheStats() {
    return {
      size: this.#cache.size,
      pending: this.#pendingAsync.size,
      entries: Array.from(this.#cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl
      }))
    };
  }
}
