/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const net = require('net')
module.exports = class {
  params = {
    port: 4001,
    host: '0.0.0.0',
    // client activity timeout
    timeout: 10000,
    // max clients
    clients: 5,
    // if true - shift clients array
    clientsQueue: false,
  }

  #server = {};

  // new
  #clients = {}
  #queue = []
  #timers = []
  #index = 1

  process () {
    if (this.params.timeout === undefined) this.params.timeout = 60000
    if (this.params.clients === undefined) this.params.clients = 5
    if (this.params.clientsQueue === undefined) this.params.clientsQueue = true
    return this.startServer()
  }

  startServer () {
    return new Promise((resolve, reject) => {
      this.#server = net.createServer(this.addClientToPull.bind(this))
      this.#server.on('error', (error) => {
        this.onError(error)
        reject(error)
      })
      this.#server.listen({
        port:this.params.port,
        host:this.params.host
      }, () => { resolve() })
    })
  }

  addClientToPull(client){
    if (this.#queue.length >= this.params.clients){
      if (!this.params.clientsQueue) {
        client.end()
        return
      } 
      const idx = this.#queue.shift()
      this.clientEnd(idx)
    }
    this.#index++
    let idx = this.#index
    this.#clients[idx] = client
    this.#queue.push(idx)

    client.on('end', () => { this.clientEnd(idx) })
    client.on('data', (data) => {
      this.updateClientTimeout(idx)
      this.dataReceive(data)
    })
    client.on('error', () => { return })
    this.updateClientTimeout(idx)
  }

  updateClientTimeout(idx){
    if (!this.params.timeout) return
    if (this.#timers[idx]) clearTimeout(this.#timers[idx])
    this.#timers[idx] = setTimeout(() => {
      this.clientEnd(idx)
    }, this.params.timeout )
  }

  clientEnd(idx){
    if (this.#clients[idx] === undefined) return
    this.#clients[idx].end()
    const qid = this.#queue.indexOf(idx)
    if (qid !== -1) this.#queue.splice(qid, 1)
    if (this.#timers[qid]) clearTimeout(this.#timers[qid])
    delete this.#timers[qid]
    delete this.#clients[idx]
  }

  terminate () { this.#server.close() }
  onError(error){}

  inputBuffer (data) {
    for (const idx in this.#clients){
      this.#clients[idx].write(data)
      this.updateClientTimeout(idx)
    }
  }
}
