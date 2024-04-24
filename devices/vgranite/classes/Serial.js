/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

var { SerialPort } = require('serialport')

module.exports = class {
  params = {
    path: '/dev/tty.usbserial-11140',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    exceptRequest: false,
    delayData: false,
    delayTimeout: 150 
  }

  shares = { bufferCount: 0 };
  except = 0;
  port = false

  delayTimer = false
  delayData = Buffer.alloc(0)

  process () {
    return this.startPort()
  }

  startPort () {
    return new Promise((resolve, reject) => {
      const serialport = new SerialPort(this.params)
      serialport.on('data', (data) => {
        if (this.params.exceptRequest && this.except > 0){
          if (data.length === this.except) { this.except = 0; return }
          if (data.length < this.except){ this.except -= data.length; return  }
          if (data.length > this.except) data = data.subarray(this.except)
        }

        if (!this.params.delayData) return this.serialData(data)
        if (this.delayTimer){ 
          this.delayData = Buffer.concat([this.delayData, data]) 
          return
        }
        this.delayData = data;
        this.delayTimer = setTimeout(() => {
          this.delayTimer = false; 
          this.serialData(this.delayData);
        }, this.params.delayTimeout)
      })
      serialport.on('error', (error) => {
        this.onError(error)
        reject(error)
      })
      serialport.on("close", (error)=> {
        this.onError(error)
      })
      this.port = serialport
      resolve()
    })
  }

  terminate () {
    return new Promise((resolve, reject)=>{
      if (this.port && !this.port.isOpen) { resolve() }
      if (this.port) this.port.close(()=>{
        resolve()
      }, new Error('Terminate port'))  
    })
  }

  onError (error) { console.log(error) }

  serialData (data) { }

  inputBuffer (data) {
    this.except = data.length
    this.port.write(data)
  }
}
