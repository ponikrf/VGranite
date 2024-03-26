/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const net = require('net')
module.exports = class {
  params = {
    host: '127.0.0.1',
    port: 4001,
    timeout: 30000,
  }
  
  state = {
      timeout: false,
      connection: false,
      connected: false
  }

  #client = {};

  process () {
    return this.startClient()
  }

  lastError = new Error("No Error")

  startClient () {
    return new Promise((resolve, reject) => {
        this.#client = new net.Socket()
        this.#client.setTimeout(this.params.timeout)
        this.state.timeout = false
        this.#client.on('connect', () => {
            this.state.timeout = false
            this.state.connection = false
            this.state.connected = true
            this.lastError = false
            resolve()
        })
        this.#client.on('timeout', () => {
            this.state.timeout = true
            this.#client.destroy(new Error('Socket connection timeout'))
        })

        this.#client.on('error', (error) => { 
          this.lastError = error 
        })
        this.#client.on('close', () => {
          if (this.lastError === false) this.lastError = new Error('Socket is close')
          this.state.connected = false
          this.state.connection = false
          this.onError(this.lastError)
          reject(this.lastError)
        })
        this.#client.on('data', (data)=>{
            this.dataReceive(data)
        })
        this.state.connection = true
        try {
          this.#client.connect(this.params)
        }catch(error){
          reject(error)
        }
    })
  }

  terminate () { this.#client.destroy(new Error('Socket terminate')) }
  onError(error){}
  dataReceive(data){}
  inputBuffer (data) {
    if (this.#client) this.#client.write(data)
  }
}
