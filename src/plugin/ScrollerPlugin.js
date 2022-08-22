export default class ScrollerPlugin {
    /**
     * @typedef {Object} ScrollerPluginOptions
     * @property {number} [speed] Movement and inertia speed.
     * @property {number} [multiplier] Movement multiplier.
     * @property {number} [threshold] Movement threshold.
     * @property {string} [ease] Timing function.
     * @property {boolean} [overwrite] GSAP overwrite mode.
     * @property {boolean} [bothDirection] Allow movement in both directions.
     * @property {boolean} [reversed] Reverse scroll movement.
     * @property {boolean} [stopOnEnd] Use IntersectionObserver to auto stop movement.
     * @property {function} [scrollProxy] Use ResizeObserver to auto update clones number.
     */

    /**
     * Plugin name.
     *
     * @type {string}
     */
    static pluginName = 'scroller';

    /**
     * Default options.
     *
     * @type {ScrollerPluginOptions}
     */
    static defaultOptions = {
        speed: 1,
        multiplier: 0.5,
        threshold: 1,
        ease: 'expo.out',
        overwrite: true,
        bothDirection: true,
        reversed: false,
        stopOnEnd: false,
        scrollProxy: null,
    };

    /**
     * Reeller ScrollerPlugin.
     *
     * @param {Reeller} reeller Reeller instance.
     * @param {object} options Options
     */
    constructor(reeller, options) {
        /** @type {ScrollerPluginOptions} **/
        this.options = {...ScrollerPlugin.defaultOptions, ...options};
        this.reeller = reeller;
        this.gsap = this.reeller.gsap;
        this.tl = this.reeller.tl;

        this.init();
    }

    /**
     * Return scroll position.
     *
     * @return {number} Scroll position.
     */
    getScrollPos() {
        if (this.options.scrollProxy) return this.options.scrollProxy();
        return window.pageYOffset;
    }

    /**
     * Initialize plugin.
     */
    init() {
        let lastScrollPos = this.getScrollPos();
        let lastDirection = 1;
        let reachedEnd = true;

        this.tickerFn = () => {
            const scrollPos = this.getScrollPos();
            let velocity = scrollPos - lastScrollPos;

            if (!this.options.bothDirection) {
                velocity = Math.abs(velocity);
            }

            if (this.options.reversed) {
                velocity *= -1;
            }

            if (this.reeller.paused) {
                lastDirection = Math.sign(velocity);
                lastScrollPos = scrollPos;
                if (!reachedEnd) {
                    this.gsap.killTweensOf(this.tl);
                    reachedEnd = true;
                }
                this.tl.timeScale(lastDirection * this.options.threshold);
                return;
            }

            if (velocity) {
                const delta = velocity * this.options.multiplier;
                const timeScale =
                    delta > 0 ? Math.max(this.options.threshold, delta) : Math.min(-this.options.threshold, delta);

                this.tween = this.gsap.to(this.tl, {
                    timeScale: timeScale,
                    duration: this.options.speed,
                    ease: this.options.ease,
                    overwrite: this.options.overwrite,
                });

                reachedEnd = false;
            } else {
                if (!reachedEnd) {
                    const timeScale = this.options.stopOnEnd ? 0 : lastDirection * this.options.threshold;

                    this.gsap.killTweensOf(this.tl);
                    this.tween = this.gsap.to(this.tl, {
                        timeScale: timeScale,
                        duration: this.options.speed,
                        overwrite: this.options.overwrite,
                        ease: this.options.ease,
                    });
                    reachedEnd = true;
                }
            }

            lastDirection = Math.sign(velocity);
            lastScrollPos = scrollPos;
        };
        this.gsap.ticker.add(this.tickerFn);
    }

    /**
     * Destroy plugin.
     */
    destroy() {
        if (this.tickerFn) {
            this.gsap.ticker.remove(this.tickerFn);
            this.tickerFn = null;
        }
        if (this.tween) this.tween.kill();
    }
}
