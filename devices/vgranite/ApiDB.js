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
        shcemes: Rule.array().default([]).content(Rule.object().fields({
          shceme: Rule.string().require().description('Scheme name').example('test'),
          pattern: Rule.string().require().description('Path pattern').example('test.*'),
          retention: Rule.string().require().description('Retention settings').example('1m:24h,5m:7d,1h:1mon,6h:1y'),
        })).require().description('Schemes settings {scheme, pattern, retention}')
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
    for (const scheme of this.options.shcemes){
      this.DB.scheme(scheme.scheme, scheme.pattern, scheme.retention)      
    }
  }

  /**
   * @api {post} /database/read Read from database
   * @apiName DatabaseRead
   * @apiGroup Database
   * 
   * @apiParam {String} path Metric path
   * @apiParam {String} period Period string ('now-1h:now')
   * @apiParam {String | Number} precision ('5s', 123,'1m') 
   * @apiParam {String} func Aggregate function ('last','min','max','first','avg')
   * 
   * @apiSuccess {Number} relevant
   * @apiSuccess {Number} start
   * @apiSuccess {Number} end 
   * @apiSuccess {Array<IMetric>} rows
   *  
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * 
   *  { 
   *    "relevant": true, "start": 1712202660, "end": 1712213460,
   *    "rows": [{ "time": 1712202660, "value": 0 },
   *            { "time": 1712213460, "value": 0 }
   *   ]}
  */
  POSTRead(express){
    const { error, value } = this.readScheme.validate(express.req.body)
    this.validationResponse(error)
    return this.DB.read(value.path, value.period, value.precision, value.func)
  }

  /**
   * Input for metric dynamic ports 
   * @see inputs
   * 
   * format:
   * [time (in second - integer), value (float, integer), path (string)],
   * 
   * @example
   * [123123123, 1.234, "path.to.metric"]
  */
  inputMetric (data) {
    if (typeof data[1] === 'string') data[1] = parseFloat(data[1])
    this.DB.write(data[2], data[1], data[0])
  }

}
