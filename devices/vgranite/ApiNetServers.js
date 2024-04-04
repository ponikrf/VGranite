/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const ApiElement = require('./ApiElement')
const joi = require('joi')
const Server = require('./classes/Server')

module.exports = class ApiNetServers extends ApiElement {
  description = 'API для упарвления серверами'

  modelScheme = joi.object({
    id: joi.string().allow(null, ''),
    marker: joi.string().allow(null, ''),
    path: joi.string().default("0.0.0.0:4001"),
    // host: joi.string().default("0.0.0.0"),
    // port: joi.number().min(1).max(65535).required(),
    timeout: joi.number().min(0).required(),
    clients: joi.number().min(0).required(),
    clientsQueue: joi.boolean().default(true).required(),
    description: joi.string().allow(null, '')
  })

  elements = {}

  structPath = './struct/ApiNetServers.json'
  
  process(){
    this.load(__filename)
    super.process()
  }

  
  /**
   * @api {get} /net/servers/struct Get structure of NetServer form
   * @apiName GetNetServersStruct 
   * @apiGroup NetServers
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * { "blocks": [
   *   { "label": "Server settings",
   *     "fields": [{"type": "text", "model": "path", "label": "Path", "default": "0.0.0.0:4001", "description": "Server host:port" },
   *       {"type": "textarea", "model": "description", "label": "Description","default": "", "description": "" }]},
   *   { "label": "Additional",
   *     "fields": [{"type": "number","model": "timeout","label": "Timeout in ms ","default": 60000,"min": 0,"max": 3600000, "description": "Idle connection timeout (0 for off timeout)" },
   *       { "type": "number", "model": "clients", "label": "Clients", "default": 5, "min": 1, "max": 1200, "description": "Maximum clients connections" },
   *       { "type": "checkbox","model": "clientsQueue", "label": "Clients queue","default": true, "description": "Terminate connections in a queuing cycle" }
   *     ]}
   * ]}
   *
   */
  async GETStruct(){
    return await super.GETStruct()
  }


  /**
   * @api {get} /net/servers/list Get all servers with traffic & status
   * @apiName GetNetServersList
   * @apiGroup NetServers
   * 
   * @apiSuccess {Object} list  List of NetServer (see struct for list fields)
   * @apiSuccess {Object} status  List of each NetServer status
   * @apiSuccess {Object} traffic  List of each NetServer traffic
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
   * @api {put} /net/servers/create Create new NetServer
   * @apiName CreateNetServer
   * @apiGroup NetServers
   * 
   * @apiParam {String} path Path for new server host:port format
   * @apiParam {String} description Description for new server
   * @apiParam {Number} timeout Idle connection timeout (0 for off timeout)
   * @apiParam {Number} clients Maximum clients connections
   * @apiParam {Boolean} clientsQueue Terminate connections in a queuing cycle
   * 
   * @apiSuccess {String} id  UID of new created server
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { "id": "uid" }
  */ 
    async PUTCreate(express){
      return await super.PUTCreate(express)
    }
  
  
  /**
   * @api {put} /net/servers/update Update NetServer
   * @apiName UpdateNetServer
   * @apiGroup NetServers
   * 
   * @apiParam {String} id uid Server for update
   * @apiParam {String} path Path for server host:port format
   * @apiParam {String} description Description for new server
   * @apiParam {Number} timeout Idle connection timeout (0 for off timeout)
   * @apiParam {Number} clients Maximum clients connections
   * @apiParam {Boolean} clientsQueue Terminate connections in a queuing cycle
   * 
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { }
  */ 
  async PUTUpdate(express){
    return await super.PUTUpdate(express)
  }

  /**
   * @api {post} /net/servers/delete Delete NetServer
   * @apiName DeleteNetServer
   * @apiGroup NetServers
   * 
   * @apiParam {String} id uid Server for delete
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
    this.elements[id] = new Server()
    try {
      const acts =  conf.path.split(':')
      this.elements[id].params.host = acts[0]
      this.elements[id].params.port = acts[1]
      this.elements[id].params.timeout = conf.timeout
      this.elements[id].params.clients = conf.clients
      this.elements[id].params.clientsQueue = conf.clientsQueue
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
