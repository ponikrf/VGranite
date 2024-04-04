/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const ApiElement = require('./ApiElement')
const joi = require('joi')
const Client = require('./classes/Client')

module.exports = class ApiNetClients extends ApiElement {
  description = 'API для упарвления серверами'

  modelScheme = joi.object({
    id: joi.string().allow(null, ''),
    marker: joi.string().allow(null, ''),
    path: joi.string().default("127.0.0.1:4001"),
    description: joi.string().allow(null, '')
  })

  elements = {}

  structPath = './struct/ApiNetClients.json'

  process(){
    this.load(__filename)
    super.process()
  }

  /**
   * @api {get} /net/clients/struct Get structure of NetClient form
   * @apiName GetNetClientsStruct 
   * @apiGroup NetClients
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {"blocks": [{
   *    "label": "Client settings",
   *    "fields": [
   *      { "type": "text", "model": "path", "label": "Path","default": "127.0.0.1:4001","description": "Host for connect" },
   *      { "type": "textarea", "model": "description", "label": "Description","default": "", "description": "" }
   *    ]}
   * ]}
   *
   */
  async GETStruct(){
    return await super.GETStruct()
  }


  /**
   * @api {get} /net/clients/list Get all clients with traffic & status
   * @apiName GetNetClientsList
   * @apiGroup NetClients
   * 
   * @apiSuccess {Object} list  List of NetClients (see struct for list fields)
   * @apiSuccess {Object} status  List of each NetClient status
   * @apiSuccess {Object} traffic  List of each NetClient traffic
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *  "resultData": {
   *     "list": {
   *       "uid": {
   *         "path": "0.0.0.0:4001",
   *         "description": "Доп описание",
   *         "id": "uid"
   *       }
   *     },
   *     "status": {
   *       "uid": { "status": "on", "message": "Started", "params": {} }
   *     },
   *     "traffic": {
   *       "uid": { "in": 0, "out": 0,"mIn": 0, "mOut": 0 }
   *     }
   *   }
   * }
  */
  async GETList(){
    return await super.GETList()
  }

  /**
   * @api {put} /net/clients/create Create new NetClient
   * @apiName CreateNetClient
   * @apiGroup NetClients
   * 
   * @apiParam {String} path Path for new client host:port format
   * @apiParam {String} description Description for new client
   * 
   * @apiSuccess {String} id  UID of new created client
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { "id": "uid" }
  */ 
  async PUTCreate(express){
    return await super.PUTCreate(express)
  }

  /**
   * @api {put} /net/clients/update Update NetClient
   * @apiName UpdateNetClient
   * @apiGroup NetClients
   * 
   * @apiParam {String} id uid client for update
   * @apiParam {String} path New path host:port format
   * @apiParam {String} description Updated description
   * 
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { }
  */ 
  async PUTUpdate(express){
    return await super.PUTUpdate(express)
  }

  /**
   * @api {post} /net/clients/delete Delete NetClient
   * @apiName DeleteNetClient
   * @apiGroup NetClients
   * 
   * @apiParam {String} id uid client for delete
   * 
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * {}
  */
  async POSTDelete(express){
    return await super.POSTDelete(express)
  }

  async startElement(id){
    const conf = this.getConfig(id)
    const status = this.shares.status[id]
    if (status && status.status === "on") return
    this.elements[id] = new Client()
    try {
      const acts =  conf.path.split(':')
      this.elements[id].params.host = acts[0]
      this.elements[id].params.port = acts[1]
      this.elements[id].dataReceive = (data) => {
        this.receiveData(id,data)
      }
      this.elements[id].onError = (error) => {
        this.setStatus(id,'off', error.toString())
      }
      await this.elements[id].process()
      this.setStatus(id, 'on', 'Started')
      return true
    } catch (error) {
      this.setStatus(id,'off', error.toString())
      return false
    }
  }

  async stopElement(id){
    this.getConfig(id)
    const status = this.shares.status[id]
    if (status && status === "off") return true
    try {
      this.elements[id].terminate()
      this.setStatus(id, 'off', 'Stopped')
      return true
    }catch (error){
      this.shares.status[id].message = error.toString()
      return false
    }
  }
}
