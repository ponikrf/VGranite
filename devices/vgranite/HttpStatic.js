/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Device, Rule } = require('vrack2-core')
const express = require('express')
const path = require('path') 

module.exports = class HttpServer extends Device {
  description = 'Поднимает HTTP сервер для REST API'
  
  checkOptions() {
    return {
      port: Rule.number().default(8040).integer().min(1).max(65655),
      static: Rule.string().default('./apidoc')
    }
  }

  app = express();

  process () {
    this.app.use(express.static(this.options.static))
    this.app.listen(this.options.port)
  }
}
