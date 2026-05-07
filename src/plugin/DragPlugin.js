export default class DragPlugin {
    /**
     * @typedef {Object} DragPluginOptions
     * @property {number} [speed] Inertia duration in seconds.
     * @property {number} [multiplier] Drag movement multiplier.
     * @property {number} [threshold] Minimum release velocity in px/s to start inertia.
     * @property {number} [inertiaMultiplier] Inertia distance multiplier.
     * @property {number} [activationDistance] Minimum movement in px before drag starts.
     * @property {number} [maxVelocity] Maximum release velocity in px/s.
     * @property {string} [ease] Timing function.
     * @property {boolean} [changeDirection] Change autoplay direction after drag.
     * @property {'x'|'y'} [axis] Pointer axis used for drag.
     * @property {boolean} [invertAxis] Invert drag direction on the selected axis.
     * @property {string|HTMLElement|null} [target] Drag target element or selector.
     * @property {boolean} [preventDefault] Prevent default pointer behaviour while dragging.
     */

    /**
     * Plugin name.
     *
     * @type {string}
     */
    static pluginName = 'drag';

    /**
     * Default options.
     *
     * @type {DragPluginOptions}
     */
    static defaultOptions = {
        speed: 1,
        multiplier: 1,
        threshold: 50,
        inertiaMultiplier: 0.2,
        activationDistance: 3,
        maxVelocity: 3000,
        ease: 'expo.out',
        changeDirection: false,
        axis: 'x',
        invertAxis: false,
        target: null,
        preventDefault: true,
    };

    /**
     * Reeller DragPlugin.
     *
     * @param {Reeller} reeller Reeller instance.
     * @param {object} options Options.
     */
    constructor(reeller, options) {
        /** @type {DragPluginOptions} **/
        this.options = {...DragPlugin.defaultOptions, ...options};
        this.reeller = reeller;
        this.gsap = this.reeller.gsap;
        this.tl = this.reeller.tl;
        this.pointerId = null;
        this.dragging = false;
        this.samples = [];
        this.basePaused = null;
        this.dragDirection = 0;
        this.nextReversed = null;
        this.init();
    }

    /**
     * Return current movement width for one cycle.
     *
     * @return {number} Movement width in pixels.
     */
    getTrackWidth() {
        const {itemsWidth = 0, fullWidth = 0, containerWidth = 0} = this.reeller.filler.calcData;

        if (this.reeller.options.clonesOverflow) return itemsWidth;
        return fullWidth - containerWidth;
    }

    /**
     * Move timeline by drag delta.
     *
     * @param {number} delta Movement delta in pixels.
     */
    applyDelta(delta) {
        const trackWidth = this.getTrackWidth();
        if (!trackWidth || !delta) return;

        const timeDelta = (delta * this.options.multiplier * this.reeller.options.speed) / trackWidth;
        this.tl.totalTime(this.tl.totalTime() + timeDelta);
    }

    /**
     * Return pointer position for active drag axis.
     *
     * @param {PointerEvent} event Pointer event.
     * @return {number} Pointer position.
     */
    getPointerPosition(event) {
        const position = this.options.axis === 'y' ? event.clientY : event.clientX;
        return this.options.invertAxis ? -position : position;
    }

    /**
     * Save point for release velocity calculation.
     *
     * @param {number} position Pointer position.
     */
    pushSample(position) {
        const time = performance.now();

        this.samples.push({position, time});

        while (this.samples.length > 5 || time - this.samples[0].time > 120) {
            this.samples.shift();
        }
    }

    /**
     * Return release velocity in px/s.
     *
     * @return {number} Release velocity in px/s.
     */
    getVelocity() {
        if (this.samples.length < 2) return 0;

        const first = this.samples[0];
        const last = this.samples[this.samples.length - 1];
        const deltaTime = last.time - first.time;

        if (!deltaTime) return 0;
        return ((last.position - first.position) / deltaTime) * 1000;
    }

    /**
     * Save autoplay direction to apply after drag.
     *
     * @param {number} velocity Release velocity in px/s.
     */
    saveDirection(velocity) {
        if (!this.options.changeDirection) return;

        const direction = Math.sign(velocity) || this.dragDirection;
        if (!direction) return;

        this.nextReversed = direction < 0;
    }

    /**
     * Start drag interaction and pause autoplay.
     */
    beginDrag() {
        this.stopInertia();
        this.dragging = true;

        if (this.basePaused === null) {
            this.basePaused = this.reeller.paused;
        }

        this.tl.pause();

        this.samples = [];
        this.pushSample(this.lastPos);
    }

    /**
     * Restore base playback state.
     */
    restorePlayback() {
        if (this.nextReversed !== null) {
            this.tl.reversed(this.nextReversed);
        }

        if (this.basePaused) {
            this.tl.pause();
        } else {
            this.tl.resume();
        }

        this.basePaused = null;
        this.nextReversed = null;
    }

    /**
     * Start inertia tween.
     *
     * @param {number} velocity Release velocity in px/s.
     */
    startInertia(velocity) {
        const maxVelocity = Math.abs(this.options.maxVelocity);
        const clampedVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, velocity));
        const distance = clampedVelocity * this.options.speed * this.options.inertiaMultiplier;

        this.restorePlayback();

        if (Math.abs(clampedVelocity) < this.options.threshold || !distance) {
            return;
        }

        const proxy = {offset: 0};
        let lastOffset = 0;

        this.inertiaTween = this.gsap.to(proxy, {
            offset: distance,
            duration: this.options.speed,
            ease: this.options.ease,
            overwrite: true,
            onUpdate: () => {
                const delta = proxy.offset - lastOffset;
                lastOffset = proxy.offset;
                this.applyDelta(delta);
            },
            onComplete: () => {
                this.inertiaTween = null;
            },
        });
    }

    /**
     * Stop current inertia tween.
     */
    stopInertia() {
        if (!this.inertiaTween) return;

        this.inertiaTween.kill();
        this.inertiaTween = null;
    }

    /**
     * Reset pointer bookkeeping.
     */
    resetPointer() {
        this.pointerId = null;
        this.dragging = false;
        this.startPos = 0;
        this.lastPos = 0;
        this.dragDirection = 0;
        this.samples = [];
    }

    /**
     * Initialize plugin.
     */
    init() {
        const {target} = this.options;

        if (!target) {
            this.target = this.reeller.filler.container;
        } else if (typeof target === 'string') {
            this.target = this.reeller.filler.container.querySelector(target) || document.querySelector(target);
        } else {
            this.target = target;
        }

        if (!this.target) {
            throw new TypeError('DragPlugin target not found.');
        }

        this.onPointerDown = (event) => {
            if (this.pointerId !== null) return;
            if (event.pointerType === 'mouse' && event.button !== 0) return;

            const position = this.getPointerPosition(event);

            this.stopInertia();
            this.pointerId = event.pointerId;
            this.startPos = position;
            this.lastPos = position;
            this.samples = [];

            if (this.target.setPointerCapture) {
                this.target.setPointerCapture(event.pointerId);
            }
        };

        this.onPointerMove = (event) => {
            if (event.pointerId !== this.pointerId) return;

            const position = this.getPointerPosition(event);

            if (!this.dragging) {
                if (Math.abs(position - this.startPos) < this.options.activationDistance) return;
                this.beginDrag();
            }

            if (this.options.preventDefault) event.preventDefault();

            const delta = position - this.lastPos;
            this.lastPos = position;

            if (!delta) return;

            this.dragDirection = Math.sign(delta);
            this.pushSample(position);
            this.applyDelta(delta);
        };

        this.onPointerUp = (event) => {
            if (event.pointerId !== this.pointerId) return;

            if (
                this.target.releasePointerCapture &&
                (!this.target.hasPointerCapture || this.target.hasPointerCapture(event.pointerId))
            ) {
                this.target.releasePointerCapture(event.pointerId);
            }

            if (!this.dragging) {
                if (this.basePaused !== null) {
                    this.restorePlayback();
                }
                this.resetPointer();
                return;
            }

            if (this.options.preventDefault) event.preventDefault();

            this.pushSample(this.getPointerPosition(event));

            const velocity = this.getVelocity();
            this.saveDirection(velocity);

            this.resetPointer();
            this.startInertia(velocity);
        };

        this.onPointerCancel = (event) => {
            if (event.pointerId !== this.pointerId) return;

            if (
                this.target.releasePointerCapture &&
                (!this.target.hasPointerCapture || this.target.hasPointerCapture(event.pointerId))
            ) {
                this.target.releasePointerCapture(event.pointerId);
            }

            if (this.dragging || this.basePaused !== null) {
                this.restorePlayback();
            }

            this.resetPointer();
        };

        this.target.addEventListener('pointerdown', this.onPointerDown);
        this.target.addEventListener('pointermove', this.onPointerMove);
        this.target.addEventListener('pointerup', this.onPointerUp);
        this.target.addEventListener('pointercancel', this.onPointerCancel);
    }

    /**
     * Destroy plugin.
     */
    destroy() {
        this.stopInertia();

        if (this.target) {
            this.target.removeEventListener('pointerdown', this.onPointerDown);
            this.target.removeEventListener('pointermove', this.onPointerMove);
            this.target.removeEventListener('pointerup', this.onPointerUp);
            this.target.removeEventListener('pointercancel', this.onPointerCancel);
        }

        this.basePaused = null;
        this.nextReversed = null;
        this.resetPointer();
    }
}
