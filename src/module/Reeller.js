/*!
 * Cuberto Reeller
 * https://github.com/Cuberto/reeller
 * https://cuberto.com/
 *
 * @version 0.0.5
 * @license The MIT License (MIT)
 * @author Cuberto, Artem Dordzhiev (Draft)
 */

import Base from './Base';
import Filler from './Filler';

export default class Reeller extends Base {
    /**
     * @typedef {Object} ReellerOptions
     * @property {string|HTMLElement|null} container Container element or selector.
     * @property {string|HTMLElement|null} wrapper Inner element or selector.
     * @property {string|null} itemSelector Items CSS selector.
     * @property {string} [cloneClassName] Class name of the new clones.
     * @property {number} [speed] Movement speed.
     * @property {string} [ease] Timing function.
     * @property {number} [initialSeek] Initial seek of timeline.
     * @property {boolean} [loop] Loop movement.
     * @property {boolean} [paused] Initialize in paused mode.
     * @property {boolean} [reversed] Reverse mode.
     * @property {boolean} [autoStop] Use IntersectionObserver to auto stop movement.
     * @property {boolean} [autoUpdate] Use ResizeObserver to auto update clones number.
     * @property {boolean} [clonesOverflow] Create artificial overflow with clones.
     * @property {boolean} [clonesFinish] Bring the cycle of clones to an end.
     * @property {boolean} [clonesMin] Minimum number of clones.
     * @property {Object|null} [plugins] Options for plugins.
     */

    /**
     * Default options.
     *
     * @type {ReellerOptions}
     */
    static defaultOptions = {
        container: null,
        wrapper: null,
        itemSelector: null,
        cloneClassName: '-clone',
        speed: 10,
        ease: 'none',
        initialSeek: 10,
        loop: true,
        paused: true,
        reversed: false,
        autoStop: true,
        autoUpdate: true,
        clonesOverflow: true,
        clonesFinish: false,
        clonesMin: 0,
        plugins: null,
    };

    /**
     * Registered plugin storage.
     *
     * @type {Object}
     */
    static plugins = {};

    /**
     * Create Reeller instance.
     *
     * @param {ReellerOptions} [options] Reeller options.
     */
    constructor(options) {
        super();

        /** @type {ReellerOptions} **/
        this.options = {...Reeller.defaultOptions, ...options};
        this.gsap = Reeller.gsap || window.gsap;
        this.paused = this.options.paused;

        this.createFiller();
        this.createTimeline();
        if (this.options.autoStop) this.bindIntersectionObserver();
        if (this.options.plugins) this.initPlugins();
    }

    /**
     * Register GSAP animation library.
     *
     * @param {GSAP} gsap GSAP library.
     */
    static registerGSAP(gsap) {
        Reeller.gsap = gsap;
    }

    /**
     * Register plugins.
     */
    static use(...plugins) {
        plugins.forEach((plugin) => {
            const name = plugin.pluginName;
            if (typeof name !== 'string') throw new TypeError('Invalid plugin. Name is required.');
            Reeller.plugins[name] = plugin;
        });
    }

    /**
     * Create filler.
     */
    createFiller() {
        this.filler = new Filler(this.options);

        this.filler.on('update', (filler, calcData) => {
            this.invalidate();
            this.trigger('update', calcData);
        });

        this.filler.on('refresh', () => {
            this.trigger('refresh');
        });
    }

    /**
     * Create timeline.
     */
    createTimeline() {
        this.tl = new this.gsap.timeline({
            paused: this.options.paused,
            reversed: this.options.reversed,
            repeat: -1,
            yoyo: !this.options.loop,
            onReverseComplete: function () {
                this.progress(1);
            },
        });

        this.gsap.set(this.filler.container, {overflow: 'hidden'});

        this.tl.fromTo(
            this.filler.wrapper,
            {
                x: () => {
                    if (!this.options.clonesOverflow) {
                        return -(this.filler.calcData.fullWidth - this.filler.calcData.containerWidth);
                    }
                    return -this.filler.calcData.itemsWidth;
                },
            },
            {
                x: 0,
                duration: this.options.speed,
                ease: this.options.ease,
            },
        );

        this.tl.seek(this.options.seek);

        return this.tl;
    }

    /**
     * Bind IntersectionObserver to container for autoplay.
     */
    bindIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.resume();
            } else {
                this.pause();
            }
        });
        this.intersectionObserver.observe(this.filler.container);
    }

    /**
     * Init plugins from options.
     */
    initPlugins() {
        this.plugin = {};
        for (const [name, options] of Object.entries(this.options.plugins)) {
            const factory = Reeller.plugins[name];
            if (factory) {
                this.plugin[name] = new factory(this, options);
            } else {
                console.error(`Plugin ${name} not found. Make sure you register it with Reeller.use()`);
            }
        }
    }

    /**
     * Destroy initialized plugins.
     */
    destroyPlugins() {
        for (const instance of Object.values(this.plugin)) {
            if (instance.destroy) instance.destroy();
        }
    }

    /**
     * Resume moving.
     */
    resume() {
        this.gsap.set(this.filler.container, {z: '0'});
        this.gsap.set(this.filler.wrapper, {willChange: 'transform'});
        this.paused = false;
        this.tl.resume();
        this.trigger('resume');
    }

    /**
     * Set reversed moving.
     *
     * @param {boolean} [reversed] Is movement reversed?
     */
    reverse(reversed = true) {
        this.tl.reversed(reversed);
        this.resume();
        this.trigger('reverse', reversed);
    }

    /**
     * Pause moving.
     */
    pause() {
        this.gsap.set(this.filler.container, {clearProps: 'z'});
        this.gsap.set(this.filler.wrapper, {willChange: 'auto'});
        this.paused = true;
        this.tl.pause();
        this.trigger('pause');
    }

    /**
     * Refresh timeline.
     */
    invalidate() {
        this.tl.invalidate();
        this.trigger('invalidate');
    }

    /**
     * Recalculate data.
     */
    update() {
        this.filler.update();
    }

    /**
     * Fully refresh and update all clones and position.
     *
     * @param {boolean} [update] Update after refresh.
     */
    refresh(update = true) {
        this.filler.refresh(update);
    }

    /**
     * Destroy Reeller instance.
     *
     * @param {boolean} [removeClones] Remove clones from DOM.
     * @param {boolean} [clearProps] Remove transformations.
     */
    destroy(removeClones = false, clearProps = false) {
        if (this.intersectionObserver) this.intersectionObserver.disconnect();
        if (this.options.plugins) this.destroyPlugins();
        this.tl.kill();
        this.filler.destroy(removeClones);
        if (clearProps) {
            this.gsap.set(this.filler.container, {clearProps: 'overflow'});
            this.gsap.set(this.filler.wrapper, {clearProps: 'x,willChange'});
        }
        this.trigger('destroy');
    }
}
