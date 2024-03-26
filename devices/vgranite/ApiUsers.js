/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Port, Rule } = require('vrack2-core')
const ApiDevice = require('./ApiDevice')
const ApiError = require('./extends/ApiError')
const joi = require('joi')
const crypto = require('crypto')

module.exports = class extends ApiDevice {
  description = 'API для управления пользователями'

  inputs(){
    return {
      request: Port.return(),
    }
  }


  outputs(){
    return {
      'session.add': Port.return(),
      'session.close': Port.return()
    }
  }

  checkOptions(){
    return {
        username: Rule.string().default('admin').require().description('Username'),
        password: Rule.string().default('admin').require().description('Password')
    }
  }

  actions () { return [] }

  loginSchema = joi.object({
    username: joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required(),

    password: joi.string()
      .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
  })

  logoutSchema = joi.object({
    token: joi.string()
      .pattern(new RegExp('^[a-z0-9]{15,45}$'))
  })

  /**
   * @api {post} /users/login Basic users authorized
   * @apiName UsersLogin
   * @apiGroup Users
   *
   * @apiParam {string} username Login
   * @apiParam {string} password Password
   *
   * @apiSaccess {string} token New token
   * @apiSaccess {number} start Token start timestamp
   * @apiSaccess {number} end Token end timestamp
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
	 * "token": "5946fe7259ba4abaaff5610f512d45031995e0ae",
	 * "start": 1711440786131,
	 * "end": 1711444386131
   * }
   * 
   * @apiDescription The method is intended for basic user authorization
   * to receive authorization token. After obtaining the token it is possible to
   * access other API methods.
   *
  */
  async POSTLogin (express) {
    // Validation
    const { error, value } = this.loginSchema.validate(express.req.body)
    this.validationResponse(error)
    // if not found or password incorrect
    if (this.options.username !== value.username || this.options.password !== value.password
    ) throw new ApiError('Login or password incorrect', 'LoginIncorrect')
    // Autorize success
    const token = this.makeToken()
    const start = Date.now(); const end = start + (1000 * 60 * 60)
    this.ports.output['session.add'].push({ token, start, end })
    return { token, start, end }
  }

  /**
   * @api {post} /users/logout Method for close active token
   * @apiName UsersLogout
   * @apiGroup Users
   *
   * @apiQuery {string} token Active user token
  */
  async POSTLogout (express) {
    const { error, value } = this.logoutSchema.validate(express.req.query)
    this.validationResponse(error)
    this.ports.output['session.close'].push({ token: value.token })
    return {}
  }

  makeToken () {
    return crypto.randomBytes(20).toString('hex')
  }
}
