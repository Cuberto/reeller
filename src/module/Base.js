export default class Base {
    /**
     * Base class.
     */
    constructor() {
        this.events = {};
    }

    /**
     * Attach an event handler function.
     *
     * @param {string} event Event name.
     * @param {function} callback Callback.
     */
    on(event, callback) {
        if (!(this.events[event] instanceof Array)) this.events[event] = [];
        this.events[event].push(callback);
    }

    /**
     * Remove an event handler.
     *
     * @param {string} event Event name.
     * @param {function} [callback] Callback.
     */
    off(event, callback) {
        if (callback) {
            this.events[event] = this.events[event].filter((f) => f !== callback);
        } else {
            this.events[event] = [];
        }
    }

    /**
     * Execute all handlers for the given event type.
     *
     * @param {string} event Event name.
     * @param params Extra parameters.
     */
    trigger(event, ...params) {
        if (!this.events[event]) return;
        this.events[event].forEach((f) => f.call(this, this, ...params));
    }
}
