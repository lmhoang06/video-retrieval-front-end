class ImageCache {
  constructor(maxSize = 5000) {
    this.cache = new Map(); // Store URLs along with videoName and frameName
    this.maxSize = maxSize; // Maximum limit for cached URLs
  }

  // Save the object URL with videoName and frameName
  saveObjectURL(url, videoName, frameName) {
    const key = `${videoName}_${frameName}`; // Create a unique key using videoName and frameName

    if (this.cache.has(key)) {
      this.cache.delete(key); // Remove the old entry to update with the new URL
    }

    this.cache.set(key, { url, timestamp: Date.now() }); // Store URL with the key and timestamp

    // If cache exceeds the max size, remove the oldest/unused URL
    if (this.cache.size > this.maxSize) {
      this.removeOldest();
    }
  }

  // Remove the oldest/least recently used URL
  removeOldest() {
    const iterator = this.cache.keys(); // Get keys iterator
    const oldestKey = iterator.next().value; // The first key is the oldest

    if (oldestKey) {
      const { url } = this.cache.get(oldestKey); // Get the URL for the oldest key
      URL.revokeObjectURL(url); // Revoke the object URL to free memory
      this.cache.delete(oldestKey); // Remove from cache
    }
  }

  // Check if a URL exists for the given videoName and frameName
  hasObjectURL(videoName, frameName) {
    const key = `${videoName}_${frameName}`;
    return this.cache.has(key);
  }

  // Get the object URL for a given videoName and frameName
  getObjectURL(videoName, frameName) {
    const key = `${videoName}_${frameName}`;
    return this.cache.has(key) ? this.cache.get(key).url : null;
  }

  // Clear the cache and revoke all object URLs
  clearCache() {
    this.cache.forEach(({ url }) => URL.revokeObjectURL(url)); // Revoke all URLs
    this.cache.clear(); // Clear the cache
  }

  // Get the total number of cached URLs
  getCacheSize() {
    return this.cache.size;
  }
}

export default ImageCache;
