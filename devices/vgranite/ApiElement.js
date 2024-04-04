/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Port, Rule } = require('vrack2-core')
const ApiDevice = require('./ApiDevice')
const ApiError = require('./extends/ApiError')
const crypto = require('crypto')
const joi = require('joi')

module.exports = class ApiElement extends ApiDevice {
  description = ''

  inputs(){
    return {
      request: Port.return(),
      connect: Port.standart()
    }
  }

  outputs(){
    return {
      connect: Port.standart(),
      'connect.update': Port.standart(),
      'metric': Port.standart(),
    }
  }

  modelScheme = joi.object({ id: joi.string().allow(null, ''), })
  idScheme = joi.object({ id: joi.string().required() })

  checkOptions() {
    return {
      markers: Rule.object().example({})
        .description('String markers')
    }
  }

  storage = { list: {} }
  shares = { 
    status: {},
    traffic: {}
  }

  elements = {}

  /**
   * Path to struct file for frontend
   * Can by relative ('./device/vgranite...')
  */
  structPath = ''

  /**
   * Fields structures
  */
  struct = {}

  process(){
    this.loadStruct()
    this.fillConnector()
    this.initElements()
    setInterval(()=>{
      this.initElements()
    }, 15*1000)
    setInterval(()=>{
      this.calcTraffic()
    },60*1000)
  }
  
  loadStruct(){
    this.struct = require(this.structPath)
  }

  inputConnect(data){
    if (this.elements[data.id] === undefined) return
    if (this.shares.status[data.id].status === 'off') return
    this.elements[data.id].inputBuffer(data.data)
    this.shares.traffic[data.id].in += data.data.length
    this.shares.traffic[data.id].mIn += data.data.length
  }
  
  fillConnector(){
    for (const id in this.storage.list) {
      this.connectUpdate('add', this.storage.list[id])
    }
  }

  connectUpdate(command, data){
    this.ports.output['connect.update'].push({ data, command })
  }

  async initElements(){
    for (const id in this.storage.list) {
      if (this.shares.traffic[id] === undefined) this.shares.traffic[id] = { in: 0, out:0, mIn:0, mOut:0 }
      if (!this.shares.status[id] || this.shares.status[id].status === "off") {
        await this.startElement(id)
      }
    }
  }

  async GETMarkers(){
    return this.options.markers
  }

  async GETStruct(){
    return this.struct
  }

  async GETList(){
    return {
      list: this.storage.list,
      status: this.shares.status,
      traffic: this.shares.traffic
    }
  }

  async PUTCreate(express){
    const { error, value } = this.modelScheme.validate(express.req.body)
    this.validationResponse(error)

    for (const id in this.storage.list) { 
      const conf = this.storage.list[id]
      if (conf.path === value.path) throw new ApiError('Uid in used', 'UidInUsed') 
    }
    value.id = this.makeToken()
    this.storage.list[value.id] = value
    this.connectUpdate('add', this.storage.list[value.id])
    this.save()
    this.shares.traffic[value.id] = { in:0, out:0, mIn: 0, mOut: 0}
    await this.startElement(value.id)
    return { id: value.id }
  }


  async PUTUpdate(express){
    const { error, value } = this.modelScheme.validate(express.req.body)
    this.validationResponse(error)

    for (const id in this.storage.list) { 
      const conf = this.storage.list[id]
      if (conf.path === value.path && id !== value.id) throw new ApiError('Uid in used', 'UidInUsed') 
    }
    this.getConfig(value.id)
    await this.stopElement(value.id)
    this.storage.list[value.id] = value
    this.save()
    await this.startElement(value.id)
    return {}
  }

  async POSTDelete(express){
    const { error, value } = this.idScheme.validate(express.req.body)
    this.validationResponse(error)

    await this.stopElement(value.id)
    this.connectUpdate('delete', this.storage.list[value.id])
    delete this.elements[value.id]
    delete this.storage.list[value.id]
    delete this.shares.status[value.id]
    delete this.shares.traffic[value.id]
    this.save()
    return {}
  }

  startElement(id){

  }

  stopElement(id){ 
    
  }

  calcTraffic(){
    for (const id in this.shares.traffic){
      this.writeMetric(`traffic.${id}.mOut`,this.shares.traffic[id].mOut)
      this.writeMetric(`traffic.${id}.mIn`,this.shares.traffic[id].mIn)
      this.shares.traffic[id].mOut = 0
      this.shares.traffic[id].mIn = 0
    }
  }

  writeMetric(path, value){
    this.ports.output['metric'].push([Math.floor(Date.now()/1000), value, path])
  }

  receiveData(id, data){
    this.ports.output.connect.push({ id, data })
    this.shares.traffic[id].out += data.length
    this.shares.traffic[id].mOut += data.length
  }

  getConfig(id){
    if (!this.storage.list[id]) throw new ApiError("Object Not Found","ObjectNotFound")
    return this.storage.list[id]
  }

  setStatus(id, status, message, params = {}){
    this.shares.status[id] = { status, message, params }
  }

  makeToken () {
    return crypto.randomBytes(20).toString('hex')
  }
}
