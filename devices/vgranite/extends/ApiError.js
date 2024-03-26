/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

module.exports = class extends Error {
    constructor (message, name) {
      super(message)
      this.name = name
    }
  }
  