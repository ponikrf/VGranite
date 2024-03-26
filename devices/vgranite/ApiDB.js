/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/


const { Port, Rule } = require('vrack2-core')
const ApiDevice = require('./ApiDevice')
const joi = require('joi')
const { Database } = require('vrack-db')

module.exports = class extends ApiDevice {

  description = 'Небольшая база для хранения в виде графиков'

  inputs(){
    return {
      request: Port.return(),
      'metric%d': Port.standart().dynamic(this.options.inputs)
    }
  }


  outputs(){
    return {}
  }

  checkOptions(){
    return {
        inputs: Rule.number().default(4).require().description('Number of metrics inputs'),
    }
  }

  preProcess(){
    for(let i = 1; i<= this.options.inputs; i++ ){
      this['inputMetric' + i] = this.inputMetric.bind(this)
    }
  }

  readScheme = joi.object({
    path: joi.string().required(),
    period: joi.string().required(),
    precision: joi.any(),
    func: joi.string().default('last')
  })

  DB = new Database()

  process(){
    this.DB.scheme('system', 'system.*', '5s:1h,1m:6h,5m:1d,30m:1w,1h:1mon,12h:1y')
    this.DB.scheme('connect', 'connect.*', '1m:24h,5m:7d,1h:1mon,6h:1y')
    this.DB.scheme('traffic', 'traffic.*', '1m:24h,5m:7d,1h:1mon,6h:1y')
  }

  POSTRead(express){
    const { error, value } = this.readScheme.validate(express.req.body)
    this.validationResponse(error)
    return this.DB.read(value.path, value.period, value.precision, value.func)
  }

  /**
   * [time, value, path]
  */
  inputMetric (data) {
    if (typeof data[1] === 'string') data[1] = parseFloat(data[1])
    this.DB.write(data[2], data[1], data[0])
  }

}
