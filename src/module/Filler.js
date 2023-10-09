import Base from './Base';

export default class Filler extends Base {
    /**
     * @typedef {Object} FillerOptions
     * @property {string|HTMLElement|null} container Container element or selector.
     * @property {string|HTMLElement|null} wrapper Inner element or selector.
     * @property {string|null} itemSelector Items CSS selector.
     * @property {string} [cloneClassName] Class name of the new clones.
     * @property {boolean} [autoUpdate] Use ResizeObserver to auto update clones number.
     * @property {boolean} [clonesOverflow] Create artificial overflow with clones.
     * @property {boolean} [clonesFinish] Bring the cycle of clones to an end.
     * @property {boolean} [clonesMin] Minimum number of clones.
     */

    /**
     * Default options.
     *
     * @type {FillerOptions}
     */
    static defaultOptions = {
        container: null,
        wrapper: null,
        itemSelector: null,
        cloneClassName: '-clone',
        autoUpdate: true,
        clonesOverflow: false,
        clonesFinish: false,
        clonesMin: 0,
    };

    /**
     * Create Filler instance.
     *
     * @param {FillerOptions} [options] Filler options.
     */
    constructor(options) {
        super();

        /** @type {FillerOptions} **/
        this.options = {...Filler.defaultOptions, ...options};
        this.container =
            typeof this.options.container === 'string'
                ? document.querySelector(this.options.container)
                : this.options.container;
        this.wrapper =
            typeof this.options.wrapper === 'string'
                ? this.container.querySelector(this.options.wrapper)
                : this.options.wrapper || this.options.container;

        /** @type Array.<HTMLElement> **/
        this.item = [];
        this.refresh(false);

        if (this.options.autoUpdate) {
            this.bindResizeObserver();
        } else {
            this.update();
        }
    }

    /**
     * Bind ResizeObserver to container for auto update.
     */
    bindResizeObserver() {
        this.resizeObserver = new ResizeObserver(() => {
            this.update();
        });
        this.resizeObserver.observe(this.container);
    }

    /**
     * Creates and adds clones to end in the desired number from given offset.
     *
     * @param {number} [count] Number of clones to add.
     * @param {number} [offset] Offset from start.
     */
    addClones(count, offset = 0) {
        const clones = [];

        for (let i = 0; i < count; i++) {
            const item = this.item[(offset + i) % this.item.length].cloneNode(true);
            item.classList.add(this.options.cloneClassName);
            clones.push(item);
        }

        this.wrapper.append(...clones);
    }

    /**
     * Removes the desired number of clones from the end.
     *
     * @param {number} [count] Number of clones to remove.
     */
    removeClones(count = 0) {
        const clones = Array.from(this.wrapper.getElementsByClassName(this.options.cloneClassName));
        clones.slice(-count).forEach((el) => el.remove());
    }

    /**
     *  Sets the desired number of clones.
     *
     * @param {number} [count] Number of clones.
     */
    setClonesCount(count) {
        if (this.clonesCount === count) return;
        if (this.clonesCount < count) this.addClones(count - this.clonesCount, this.clonesCount);
        if (this.clonesCount > count) this.removeClones(this.clonesCount - count);
        this.clonesCount = count;
    }

    /**
     * Get calculated data object.
     *
     * @return {Object} Calculated data.
     */
    getCalcData() {
        const data = {
            clonesCount: 0,
            clonesWidth: 0,
            containerWidth: this.container.offsetWidth,
            fullWidth: 0,
            itemWidth: [],
            itemsWidth: 0,
            lastIndex: 0,
        };

        this.item.map((el) => {
            const style = window.getComputedStyle(el);
            const width = el.offsetWidth + parseInt(style.marginLeft) + parseInt(style.marginRight);
            data.itemWidth.push(width);
            data.itemsWidth += width;
        });

        const itemLength = data.itemWidth.length;
        const width = this.options.clonesOverflow ? data.containerWidth : data.containerWidth - data.itemsWidth;

        while (
            width > data.clonesWidth ||
            data.clonesCount < this.options.clonesMin ||
            (this.options.clonesFinish && data.clonesCount % itemLength > 0)
        ) {
            data.lastIndex = data.clonesCount % itemLength;
            data.clonesWidth += data.itemWidth[data.lastIndex];
            data.clonesCount++;
        }

        data.fullWidth = data.clonesWidth + data.itemsWidth;

        return data;
    }

    /**
     * Calculates and sets the number of clones.
     */
    update() {
        this.calcData = this.getCalcData();
        this.setClonesCount(this.calcData.clonesCount);
        this.trigger('update', this.calcData);
    }

    /**
     * Fully refresh and update all clones.
     *
     * @param {boolean} [update] Update after refresh.
     */
    refresh(update = true) {
        this.removeClones();
        this.item = Array.from(this.container.querySelectorAll(this.options.itemSelector));
        this.calcData = {};
        this.clonesCount = 0;
        this.trigger('refresh');
        if (update) this.update();
    }

    /**
     * Destroy Reeller instance.
     *
     * @param {boolean} [removeClones] Remove clones from DOM.
     */
    destroy(removeClones = false) {
        if (removeClones) this.removeClones();
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.trigger('destroy');
    }
}
