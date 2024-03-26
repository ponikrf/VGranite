/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Port } = require('vrack2-core')
const ApiDevice = require('./ApiDevice')
var { SerialPort } = require('serialport')

module.exports = class ApiSerial extends ApiDevice {
  description = 'Данные для последовательного порта'

  inputs(){
    return {
      request: Port.return(),
    }
  }

    /**
   * @api {get} /serial/path Get serial path list 
   * @apiName GetSerialPath
   * @apiGroup Serial
   * @apiSuccessExample {json} Success-Response:
   * HTTP/1.1 200 OK
	 * { 
   *    "/dev/tty.Bluetooth-Incoming-Port": "/dev/tty.Bluetooth-Incoming-Port",
	 *    "/dev/tty.usbserial-1210": "/dev/tty.usbserial-1210"
	 * }
   */
  async GETPath () {
    const a = await SerialPort.list()
    const result = {}
    for (const s of a){
      result[s.path] = s.path
    }
    return result
  }
}
