"use strict";
/*
 * Copyright © 2023 Boris Bobylev. All rights reserved.
 * Licensed under the Apache License, Version 2.0
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vrack2_core_1 = require("vrack2-core");
const MainProcessPath = 'vrack2-core.MainProcess';
const DeviceManagerPath = 'vrack2-core.DeviceManager';
const ContainerPath = 'vrack2-core.Container';
const serviceFile = 'devices/vgranite/service.json';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const service = yield vrack2_core_1.ImportManager.importJSON(serviceFile);
        const ContainerClass = yield vrack2_core_1.ImportManager.importClass(ContainerPath);
        const DeviceManagerClass = yield vrack2_core_1.ImportManager.importClass(DeviceManagerPath);
        const MainProcessClass = yield vrack2_core_1.ImportManager.importClass(MainProcessPath);
        const MainProcessEx = new MainProcessClass(ContainerClass, DeviceManagerClass, service);
        MainProcessEx.run();
    });
}
run();
