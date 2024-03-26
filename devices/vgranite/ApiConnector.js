/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Port, Rule } = require('vrack2-core')
const ApiDevice = require('./ApiDevice')
const joi = require('joi')
module.exports = class ApiConnector extends ApiDevice {
  description = 'API для управления соединениями'

  inputs(){
    return {
      request: Port.return(),
      'connect%d': Port.standart().dynamic(this.options.sources.length),
      'connect%d.update': Port.standart().dynamic(this.options.sources.length)
    }
  }

  outputs(){
    return {
      'connect%d': Port.standart().dynamic(this.options.sources.length),
      'metric': Port.standart()
    }
  }

  checkOptions() {
    return {
      sources: Rule.array().require().default(["ApiNetServers", "ApiSerials"])
    }
  }

  modelScheme = joi.object({
    fromID: joi.string().required(),
    toID: joi.string().required(),
  })

  storage = {
    list: {},
  }

  shares = {
    traffic: {}
  }

  sourcePorts = []

  preProcess(){
    for (let i = 1; i <= this.options.sources.length; i++){
      this.sourcePorts.push('connect' + i) 
    }
    for (let i = 1; i<= this.options.sources.length; i++){
      this['inputConnect'+i+'Update'] = (data) => {
        if (data.command === "add") this.updateAdd(data.data, i)
        if (data.command === "delete") this.updateDelete(data.data, i)
        return []
      }
    }

    for (let i = 1; i<= this.options.sources.length; i++){
      /** 
       * data.id
       * data.data
      */
      this['inputConnect' + i] = (data) => {
        if (!this.storage.list[data.id] || !this.storage.list[data.id].length) return
        
        for (const id of this.storage.list[data.id]){
          if (this.sourceToPort[id]){
            this.ports.output[this.sourceToPort[id]].push({ id, data: data.data })
          }
        }

        for (const id of this.storage.list[data.id]){   
          if (this.shares.traffic[data.id] === undefined) this.shares.traffic[data.id] = {}
          if (this.shares.traffic[data.id][id] === undefined) this.shares.traffic[data.id][id] = 0 
          this.shares.traffic[data.id][id] += data.data.length
        }
      }
    }
  }
  
  sourceToPort= {}

  updateAdd(data, port){
    this.sourceToPort[data.id] ='connect' + port 
  }

  updateDelete(data){
    delete this.sourceToPort[data.id]
  }

  process () {
    this.load(__filename)
    setInterval(()=>{
      this.calcTraffic()
    },60*1000)
  }

  /**
   * @api {get} /connect/list Get connections list
   * @apiName GetConnectList
   * @apiGroup Connects
   * 
   * @apiSuccess {Object} list  List of Serials (see struct for list fields)
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK   
   * {
   *  "b4d5e5981a3c57a5cab7a5f4d09092891c092993": ["13a1d5934e86ccb9e09615f3200b22a9e7e902ab"],
	 *  "13a1d5934e86ccb9e09615f3200b22a9e7e902ab": ["b4d5e5981a3c57a5cab7a5f4d09092891c092993"]
	 * }
   */
  GETList(){
    return this.storage.list
  }

  /**
   * @api {get} /connect/sources Get connection sources
   * @apiName GetConnectSources 
   * @apiGroup Connects
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * [{ "caption": "Servers", "device": "ApiNetServers", "path": "/net/servers/" },
   *  { "caption": "Clients", "device": "ApiNetClients", "path": "/net/clients/" },
   *  { "caption": "Serials", "device": "ApiSerials", "path": "/serials/" }]
   */
  GETSources(){
    return this.options.sources
  }

  /**
   * @api {put} /connect/create Create new Connection
   * @apiName CreateConnect
   * @apiGroup Connects
   * 
   * @apiParam {String} fromID From uid
   * @apiParam {String} toID To uid
   * 
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { }
  */ 
  PUTCreate(express){
    const { error, value } = this.modelScheme.validate(express.req.body)
    this.validationResponse(error)
    if (this.storage.list[value.fromID] === undefined){
      this.storage.list[value.fromID] = []
    }
    this.storage.list[value.fromID].push(value.toID)
    this.save()
    return {}
  }

  /**
   * @api {post} /connect/delete Delete Connection
   * @apiName DeleteConnect
   * @apiGroup Connects
   * 
   * @apiParam {String} fromID uid from connection
   * @apiParam {String} toID uid to connection
   * 
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * {}
  */
  POSTDelete(express){
    const { error, value } = this.modelScheme.validate(express.req.body)
    this.validationResponse(error)
    if (this.storage.list[value.fromID]){
      const index = this.storage.list[value.fromID].indexOf(value.toID)
      if (index !== -1) this.storage.list[value.fromID].splice(index, 1)
    }
    if (!this.storage.list[value.fromID].length) delete this.storage.list[value.fromID]
    this.save()
    return this.storage.list
  }

  calcTraffic(){
    for (const from in this.shares.traffic){
      for (const to in this.shares.traffic[from]){
        this.writeMetric(`connect.${from}.${to}`,this.shares.traffic[from][to])
        this.shares.traffic[from][to] = 0  
      }
    }
  }

  writeMetric(path, value){
    this.ports.output['metric'].push([Math.floor(Date.now()/1000), value, path])
  }
}
