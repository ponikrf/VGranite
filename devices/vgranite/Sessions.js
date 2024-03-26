/*
 * Copyright © 2024 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

const { Device, Port } = require('vrack2-core')

module.exports = class extends Device {
  description = 'Локальное хранилище сессий (inMemory)'

  inputs(){
    return {
      'session.add': Port.return(),
      'session.close': Port.return(),
      'session.get': Port.return()
    }
  }

  shares = { sessions: {} }

  process () {
    setInterval(() => {
      this.clearExpired()
    }, 1000 * 60 * 60)
  }

  clearExpired () {
    const now = Date.now()
    for (const token in this.shares.sessions) {
      const t = this.shares.sessions[token]
      if (t.end < now) delete this.shares.sessions[token]
    }
  }

  /**
   * Добавление сессии
   *
   * @param {String} data.token
   * @param {Number} data.start
   * @param {Number} data.end
  */
  inputSessionAdd (data) {
    this.shares.sessions[data.token] = data
  }

  /**
   * Закрытие сессии
   *
   * @param {String} data.token
  */
  inputSessionClose (data) {
    if (this.shares.sessions[data.token]) {
      delete this.shares.sessions[data.token]
    }
  }

  /**
   * Получение сессии
   *
   * @param {String} data.token
  */
  inputSessionGet (data) {
    if (this.shares.sessions[data.token]) {
      const t = this.shares.sessions[data.token]
      if (t.end > Date.now()) return t
      delete this.shares.sessions[data.token]
    }
  }
}
