/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Device } = require('vrack2-core')
const { CoreError } = require('vrack2-core')
const fs  = require('fs')
const path = require('path')
module.exports = class ApiDevice extends Device {
  
  storageFp = ''

  save(){
    fs.writeFileSync(this.storageFp, JSON.stringify(Object.assign({}, this.storage)))
  }

  load(filepath){
    const fname = path.basename(filepath)
    const acts = fname.split('.')
    acts.pop()
    acts.push('json')
    this.storageFp = path.join(__dirname,'storage',acts.join('.'))

    if (fs.existsSync(this.storageFp)){ this.storage = require(this.storageFp) }
  }

  /**
   * @param {Object} express  { req, res, next }
  */
  async inputRequest (express) {
    const method = this.makeMethod(express.req)
    if (this[method]) return await this[method](express)
    else {
      express.res.status(404).send('Method not found')
    }
  }

  response (express, result, data) {
    if (result === 'error') express.res.json({ result, resultData: CoreError.objectify(data) })
    else express.res.json({ result, resultData: data })
  }

  validationResponse (error) {
    if (!error) return true
    error.name = 'ValidationError'
    throw error
  }

  makeMethod (req) {
    const acts = req.path.split('/')
    let method = acts.pop()
    method = method.charAt(0).toUpperCase() + method.slice(1)
    return req.method + method
  }
}
