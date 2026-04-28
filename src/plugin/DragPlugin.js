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
        inertiaMultiplier: 0.5,
        activationDistance: 3,
        maxVelocity: 3000,
        ease: 'expo.out',
        changeDirection: false,
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
     * @param {number} deltaX Horizontal movement delta in pixels.
     */
    applyDelta(deltaX) {
        const trackWidth = this.getTrackWidth();
        if (!trackWidth || !deltaX) return;

        const timeDelta = (deltaX * this.options.multiplier * this.reeller.options.speed) / trackWidth;
        this.tl.totalTime(this.tl.totalTime() + timeDelta);
    }

    /**
     * Save point for release velocity calculation.
     *
     * @param {number} x Pointer x position.
     */
    pushSample(x) {
        const time = performance.now();

        this.samples.push({x, time});

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
        return ((last.x - first.x) / deltaTime) * 1000;
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
        this.pushSample(this.lastX);
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

        if (Math.abs(clampedVelocity) < this.options.threshold || !distance) {
            this.restorePlayback();
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
                this.restorePlayback();
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
        this.startX = 0;
        this.lastX = 0;
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

            this.stopInertia();
            this.pointerId = event.pointerId;
            this.startX = event.clientX;
            this.lastX = event.clientX;
            this.samples = [];

            if (this.target.setPointerCapture) {
                this.target.setPointerCapture(event.pointerId);
            }
        };

        this.onPointerMove = (event) => {
            if (event.pointerId !== this.pointerId) return;

            if (!this.dragging) {
                if (Math.abs(event.clientX - this.startX) < this.options.activationDistance) return;
                this.beginDrag();
            }

            if (this.options.preventDefault) event.preventDefault();

            const deltaX = event.clientX - this.lastX;
            this.lastX = event.clientX;

            if (!deltaX) return;

            this.dragDirection = Math.sign(deltaX);
            this.pushSample(event.clientX);
            this.applyDelta(deltaX);
        };

        this.onPointerUp = (event) => {
            if (event.pointerId !== this.pointerId) return;

            if (this.target.releasePointerCapture) {
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

            this.pushSample(event.clientX);

            const velocity = this.getVelocity();
            this.saveDirection(velocity);

            this.resetPointer();
            this.startInertia(velocity);
        };

        this.target.addEventListener('pointerdown', this.onPointerDown);
        this.target.addEventListener('pointermove', this.onPointerMove);
        this.target.addEventListener('pointerup', this.onPointerUp);
        this.target.addEventListener('pointercancel', this.onPointerUp);
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
            this.target.removeEventListener('pointercancel', this.onPointerUp);
        }

        this.basePaused = null;
        this.nextReversed = null;
        this.resetPointer();
    }
}
