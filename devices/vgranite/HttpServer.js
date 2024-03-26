/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Device, Port, Rule } = require('vrack2-core')
const { CoreError } = require('vrack2-core')
const express = require('express')
const path = require('path') 

module.exports = class HttpServer extends Device {
  description = 'Поднимает HTTP сервер для REST API'
  
  checkOptions() {
    return {
      port: Rule.number().default(3000).integer().min(1).max(65655),
      static: Rule.string().default(path.join(__dirname, 'web'))
    }
  }

  outputs(){
    const ports = {}
    for (const rp of this.options.requestPorts){
      ports[rp + '.request'] = Port.return()
    }
    return ports
  }

  app = express();

  process () {
    this.app.use(express.static(this.options.static))
    this.app.use(express.json())
    this.app.use(async (req, res, next) => {
      try {
        
        await this.ports.output['guard.request'].push({ req, res, next })
      } catch (error) { this.errorResponse(res, error) }
    })

    for (let i = 0; i < this.options.routes.length; i++) {
      const route = this.options.routes[i]
      this.app[route.method](route.path, async (req, res, next) => {
        try {
          const result = await this.ports.output[route.port].push({ req, res, next })
          if (result === undefined) return
          this.successResponse(res, result)
        } catch (error) {
          console.error(error)
          this.errorResponse(res, error)
        }
      })
    }

    this.app.listen(this.options.port)
  }

  successResponse (res, data) {
    res.json({ result: 'success', resultData: data })
  }

  errorResponse (res, error) {
    // if (error.stack) delete error.stack
    const ner = CoreError.objectify(error)
    res.json({ result: 'error', resultData: ner })
  }
}
