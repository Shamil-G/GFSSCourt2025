// /static/js/core/dispatcher.js

import { EventDispatcher } from "./EventDispatcher.js";

let dispatcher = null;

function initDispatcher(graph) {
    dispatcher = new EventDispatcher(graph);
    return dispatcher;
}

function getDispatcher() {
    if (!dispatcher) {
        throw new Error("Dispatcher not initialized. Call initDispatcher(graph) first.");
    }
    return dispatcher;
}

export { initDispatcher, getDispatcher };
