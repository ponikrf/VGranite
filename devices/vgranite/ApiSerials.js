/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const ApiElement = require('./ApiElement')
const joi = require('joi')
const Serial = require('./classes/Serial')

module.exports = class ApiSerials extends ApiElement {
  description = 'API для управления последовательными портами'

  modelScheme = joi.object({
    id: joi.string().allow(null, ''),
    marker: joi.string().allow(null, ''),
    path: joi.string().required(),
    baudRate: joi.number().min(2400).max(921600).default(9600),
    dataBits: joi.number().min(5).max(8).default(8),
    stopBits: joi.number().min(1).max(2).default(1),
    parity: joi.string().valid('none', 'even', 'odd'),
    description: joi.string().allow(null, ''),
    exceptRequest: joi.boolean().default(false).required(),
    delayData: joi.boolean().default(false).required(),
    delayTimeout: joi.number().min(150).max(5000).default(300).required(),
  })

  structPath = './struct/ApiSerials.json'

  process(){
    this.load(__filename)
    super.process()
  }



  /**
   * @api {get} /serials/struct Get structure of Serial form
   * @apiName GetSerialsStruct 
   * @apiGroup Serials
   * @apiDescription See full struct in file `devices/vgranite/struct/ApiSerials.json`
   */
  async GETStruct(){
    return await super.GETStruct()
  }


  /**
   * @api {get} /serials/list Get all servers with traffic & status
   * @apiName GetSerialsList
   * @apiGroup Serials
   * 
   * @apiSuccess {Object} list  List of Serials (see struct for list fields)
   * @apiSuccess {Object} status  List of each Serials status
   * @apiSuccess {Object} traffic  List of each Serials traffic
   * 
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
   * {
   *  "resultData": {
   *     "list": {
   *       "uid": {
   *         "path": "path/to/file",
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
   * @api {put} /serials/create Create new Serial
   * @apiName CreateSerial
   * @apiGroup Serials
   * 
   * @apiParam {String} path Path to serial device (like a 'COM1', '/dev/ttyUSB1')
   * @apiParam {String} description Description for new serial
   * @apiParam {Number} baudRate Serial port speed (See serial BaudRate table, like a 9600,19200...)
   * @apiParam {Number} dataBits Count of data Bits (8,7,6,5)
   * @apiParam {Number} stopBits Description for new serial (1,2)
   * @apiParam {String} parity Party option ("none", "even", "odd")
   * 
   * @apiSuccess {String} id  UID of new created serial
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { "id": "uid" }
  */ 
    async PUTCreate(express){
      return await super.PUTCreate(express)
    }
  
  
  /**
   * @api {put} /serials/update Update Serial
   * @apiName UpdateSerial
   * @apiGroup Serials
   * 
   * @apiParam {String} id uid Serial for update
   * @apiParam {String} path Path to serial device (like a 'COM1', '/dev/ttyUSB1')
   * @apiParam {String} description Description for new serial
   * @apiParam {Number} baudRate Serial port speed (See serial BaudRate table, like a 9600,19200...)
   * @apiParam {Number} dataBits Count of data Bits (8,7,6,5)
   * @apiParam {Number} stopBits Description for new serial (1,2)
   * @apiParam {String} parity Party option ("none", "even", "odd")
   * 
   * @apiSuccessExample Success-Response:
   * HTTP/1.1 200 OK
   * { }
  */ 
  async PUTUpdate(express){
    return await super.PUTUpdate(express)
  }

  /**
   * @api {post} /serials/delete Delete Serials
   * @apiName DeleteSerial
   * @apiGroup Serials
   * 
   * @apiParam {String} id uid Serial for delete
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
    this.elements[id] = new Serial()
    try {
      this.elements[id].params.path = conf.path
      this.elements[id].params.baudRate = conf.baudRate
      this.elements[id].params.dataBits = conf.dataBits
      this.elements[id].params.stopBits = conf.stopBits
      this.elements[id].params.parity = conf.parity
      this.elements[id].params.exceptRequest = conf.exceptRequest
      this.elements[id].params.delayData = conf.delayData
      this.elements[id].params.delayTimeout = conf.delayTimeout

      this.elements[id].serialData = (data) => {
        this.receiveData(id,data)
      }
      this.elements[id].onError = (error) => {
        if (error){
          this.setStatus(id,'off', error.toString())
        }else{
          this.setStatus(id,'off', "Unknown error")
        }
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
      await this.elements[id].terminate()
      this.setStatus(id, 'off', 'Stopped')
    }catch (error){
      this.shares.status[id].message = error.toString()
    }
  }
}
