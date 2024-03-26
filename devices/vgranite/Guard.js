/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Device,Rule, Port } = require('vrack2-core')
const joi = require('joi')
const ApiError = require('./extends/ApiError')

module.exports = class extends Device {
  
  description = 'Отвечате за авторизацию пользователей'

  inputs(){
    return {
      request: Port.return(),
    }
  }

  outputs(){
    return {
      command: Port.return(),
      'session.get': Port.return()
    }
  }

  checkOptions(){
    return {
      guestAccess: Rule.array().require().default(['/users/login'])
    }
  }


  querySchema = joi.object({
    token: joi.string()
      .pattern(new RegExp('^[a-z0-9]{15,45}$'))
  })

  async inputRequest (express) {
    const client = { access: 'guest' }
    if (express.req.query.token) { // Если в запросе есть токен
      //  Валидация токена
      const { error, value } = this.querySchema.validate(express.req.query)
      if (error) { error.name = 'ValidationError'; throw error }
      // Получение токена
      const tkn = this.ports.output['session.get'].push({ token: value.token })
      if (!tkn) throw new ApiError('Invalid token, try login again', 'InvalidToken')
      client.access = 'user'
      client.token = tkn
    }
    express.req.client = client
    this.checkAccess(express)
    express.next()
  }

  checkAccess (express) {
    if (express.req.client.access === 'guest' && this.options.guestAccess.indexOf(express.req.path) === -1) {
      throw new ApiError('Access denied', 'AccessDenied')
    }
  }
}
