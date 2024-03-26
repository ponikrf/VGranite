/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/

import { Container, DeviceManager, ImportManager, MainProcess } from "vrack2-core";

const MainProcessPath = 'vrack2-core.MainProcess'
const DeviceManagerPath = 'vrack2-core.DeviceManager'
const ContainerPath = 'vrack2-core.Container'
const serviceFile = 'devices/vgranite/service.json'


async function run (){ 
    const service = await ImportManager.importJSON(serviceFile)
    const ContainerClass = await ImportManager.importClass(ContainerPath) as typeof Container
    const DeviceManagerClass = await ImportManager.importClass(DeviceManagerPath) as typeof DeviceManager
    const MainProcessClass = await ImportManager.importClass(MainProcessPath) as typeof MainProcess
    const MainProcessEx = new MainProcessClass(ContainerClass, DeviceManagerClass, service)
    MainProcessEx.run()
}

run()