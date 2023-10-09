# Cuberto Reeller

<a href="https://www.npmjs.com/package/reeller"><img src="https://img.shields.io/npm/v/reeller?color=red" alt="NPM Version"></a>
<a href="https://github.com/Cuberto/reeller/blob/dev/LICENSE"><img src="https://img.shields.io/github/license/Cuberto/reeller?color=orange&v=2" alt="Licence"></a>
<img src="https://img.shields.io/bundlephobia/min/reeller?color=green" alt="Bundle file size">
<img src="https://img.shields.io/bundlephobia/minzip/reeller?color=yellow&label=gzip%20size" alt="Bundle file size (gzip)">
<a href="https://npmcharts.com/compare/reeller?minimal=true"><img src="https://img.shields.io/npm/dm/reeller?color=blue" alt="NPM Downloads"></a>
<img src="https://img.shields.io/github/actions/workflow/status/Cuberto/reeller/ci.yml?branch=dev" alt="GitHub Workflow Status">

Flexible, powerful and modern library for creating the running horizontal blocks effect, also known as ticker or the «marquee effect».

The library uses [GSAP](https://greensock.com/gsap/),
[IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
and [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to achieve the best performance
results.

<img src="https://user-images.githubusercontent.com/11841379/185962914-effd2364-edc2-4575-8089-4fef2a195fa1.gif">

⚠️
**Notice: This library is currently in beta.**

## Dependencies

GSAP v3 (https://greensock.com/gsap/)

## Quick start

### Install from NPM

Reeller requires GSAP library to work.

```
npm install gsap --save
npm install reeller --save
```

Import GSAP, Reeller and initialize it:

```js
import Reeller from 'reeller';
import gsap from 'gsap';

Reeller.registerGSAP(gsap);

const reeller = new Reeller({
    container: '.my-reel',
    wrapper: '.my-reel-wrap',
    itemSelector: '.my-reel-item',
    speed: 10,
});
```

### Use from CDN

If you don't want to include Reeller files in your project, you can use library from CDN:

```html
<script src="https://unpkg.com/reeller@0/dist/reeller.min.js"></script>
```

Reeller requires GSAP to work. You need to import it above the Reeller if you didn't have it before:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.10.4/gsap.min.js"></script>
<script src="https://unpkg.com/reeller@0/dist/reeller.min.js"></script>
<script>
    var reeller = new Reeller.Reeller({
        container: '.my-reel',
        wrapper: '.my-reel-wrap',
        itemSelector: '.my-reel-item',
        speed: 10,
    });
</script>
```

_Note: All modules (Reeller, Filler, ScrollerPlugin) will be imported into `Reeller` namespace when using from CDN, so you must use a prefix._

## Options

You can configure Reeller via options.

The following options with defaults is available:

```js
const reeller = new Reeller({
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
});
```

| Option           |             Type              | Default  | Description                                                              |
| :--------------- | :---------------------------: | :------: | :----------------------------------------------------------------------- |
| `container`      | `string` &vert; `HTMLElement` |  `null`  | **Required.** Container element or selector.                             |
| `wrapper`        | `string` &vert; `HTMLElement` |  `null`  | **Required.** Inner element or selector.                                 |
| `itemSelector`   |           `string`            |  `null`  | **Required.** Items CSS selector.                                        |
| `cloneClassName` |           `string`            | `-clone` | Class name of the new clones.                                            |
| `speed`          |           `number`            |   `10`   | Movement speed.                                                          |
| `ease`           |           `string`            | `'none'` | Timing function. See [gsap easing](https://greensock.com/docs/v3/Eases). |
| `initialSeek`    |           `number`            |   `10`   | Initial seek of timeline.                                                |
| `loop`           |           `boolean`           |  `true`  | Loop movement.                                                           |
| `pause`          |           `boolean`           |  `true`  | Initialize in paused mode.                                               |
| `reversed`       |           `boolean`           | `false`  | Reverse mode.                                                            |
| `autoStop`       |           `boolean`           |  `true`  | Use IntersectionObserver to auto stop movement.                          |
| `autoUpdate`     |           `boolean`           |  `true`  | Use ResizeObserver to auto update clones number.                         |
| `clonesOverflow` |           `boolean`           |  `true`  | Create artificial overflow with clones.                                  |
| `clonesFinish`   |           `boolean`           | `false`  | Bring the cycle of clones to an end.                                     |
| `clonesMin`      |           `boolean`           |   `0`    | Minimum number of clones.                                                |
| `plugins`        |           `Object`            |  `null`  | Options for plugins. See [Plugins section](#plugins).                    |

## API

### Methods

| Method                               | Description                                                                                              |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------- |
| `reeller.resume()`                   | Resumes movement.                                                                                        |
| `reeller.pause()`                    | Pauses movement.                                                                                         |
| `reeller.reverse([reversed=true])`   | Set reversed moving.                                                                                     |
| `reeller.invalidate()`               | Refresh GSAP Timeline.                                                                                   |
| `reeller.update()`                   | Calculates and sets the number of clones and update movement position.                                   |
| `reeller.refresh(update=true)`       | Fully refresh and update all clones and position. Use this only after adding or removing original items. |
| `reeller.destroy(removeClones=true)` | Destroy Reeller instance, detach all observers and remove clones.                                        |
| `Reeller.registerGSAP(gsap)`         | Static method to register the gsap library.                                                              |
| `Reeller.use(...plugins)`            | Static method to register a plugins.                                                                     |

### Properties

| Property          |       Type       | Description                                           |
| :---------------- | :--------------: | :---------------------------------------------------- |
| `reeller.paused`  |    `boolean`     | Indicates that the movement is stopped.               |
| `reeller.tl`      |    `Timeline`    | GSAP Timeline.                                        |
| `reeller.filler`  |     `Filler`     | Inner Filler instance. See [Filler section](#filler). |
| `reeller.options` | `ReellerOptions` | Current Reeller options.                              |
| `reeller.plugin`  |     `Object`     | Initialized plugins.                                  |

### Events

Reeller comes with a useful events you can listen. Events can be assigned in this way:

```js
reeller.on('update', () => {
    console.log('Reeller update happened!');
});
```

You can also delete an event that you no longer want to listen in these ways:

```js
reeller.off('update');
reeller.off('update', myHandler);
```

| Event     | Arguments             | Description                        |
| :-------- | :-------------------- | :--------------------------------- |
| `update`  | `(reeller, calcData)` | Event will be fired after update.  |
| `refresh` | `(reeller)`           | Event will be fired after refresh. |
| `destroy` | `(reeller)`           | Event will be fired after destroy. |

### Plugins

Reeller support plugins to extend functionality.

At this moment there is only one plugin that comes with the official package: **ScrollerPlugin**.

This plugin allows you to attach movement to the scroll:

```js
import {Reeller, ScrollerPlugin} from 'reeller';
import gsap from 'gsap';

Reeller.registerGSAP(gsap);
Reeller.use(ScrollerPlugin);

const reeller = new Reeller({
    container: '.my-reel',
    wrapper: '.my-reel-wrap',
    itemSelector: '.my-reel-item',
    speed: 10,
    plugins: {
        scroller: {
            speed: 1,
            multiplier: 0.5,
            threshold: 1,
        },
    },
});
```

The following options of ScrollerPlugin is available:

| Option          |    Type    |   Default    | Description                                                                           |
| :-------------- | :--------: | :----------: | :------------------------------------------------------------------------------------ |
| `speed`         |  `number`  |     `1`      | Movement and inertia speed.                                                           |
| `multiplier`    |  `number`  |    `0.5`     | Movement multiplier.                                                                  |
| `threshold`     |  `number`  |     `1`      | Movement threshold.                                                                   |
| `ease`          |  `string`  | `'expo.out'` | Timing function. See [gsap easing](https://greensock.com/docs/v3/Eases).              |
| `overwrite`     | `boolean`  |    `true`    | See [gsap overwrite modes](https://greensock.com/conflict/).                          |
| `bothDirection` | `boolean`  |    `true`    | Allow movement in both directions.                                                    |
| `reversed`      | `boolean`  |   `false`    | Reverse scroll movement.                                                              |
| `stopOnEnd`     | `boolean`  |   `false`    | Stop movement on end scrolling.                                                       |
| `scrollProxy`   | `function` |    `null`    | A function that returns the scroll position. Can be used in cases with custom scroll. |

In cases with using of custom scroll libraries (e.g. [smooth-scrollbar](https://github.com/idiotWu/smooth-scrollbar)),
you can use the `scrollProxy` option to return the current scroll position:

```js
import Scrollbar from 'smooth-scrollbar';
import {Reeller, ScrollerPlugin} from 'reeller';
import gsap from 'gsap';

Reeller.registerGSAP(gsap);
Reeller.use(ScrollerPlugin);

const scrollbar = Scrollbar.init(document.querySelector('#my-scrollbar'));

const reeller = new Reeller({
    container: '.my-reel',
    wrapper: '.my-reel-wrap',
    itemSelector: '.my-reel-item',
    speed: 10,
    plugins: {
        scroller: {
            speed: 1,
            multiplier: 0.5,
            threshold: 1,
            scrollProxy: () => scrollbar.scrollTop,
        },
    },
});
```

## Filler

Reeller library works on top of the **Filler** module. This is a separate tool for automatically calculating the number
of clones and filling the container with them.

You can use only Filler (without Reeller) if you need to fill the whole space with clones, without movement, animations
and GSAP:

```js
import {Filler} from 'reeller';

const filler = new Filler({
    container: '.my-container',
    itemSelector: '.-my-item',
    cloneClassName: '-clone',
});
```

### Options

| Option           |             Type              |  Default   | Description                                      |
| :--------------- | :---------------------------: | :--------: | :----------------------------------------------- |
| `container`      | `string` &vert; `HTMLElement` |   `null`   | **Required.** Container element or selector.     |
| `itemSelector`   |           `string`            |   `null`   | **Required.** Items CSS selector.                |
| `wrapper`        | `string` &vert; `HTMLElement` |   `null`   | Inner element or selector.                       |
| `cloneClassName` |           `string`            | `'-clone'` | Class name of the new clones.                    |
| `autoUpdate`     |           `boolean`           |   `true`   | Use ResizeObserver to auto update clones number. |
| `clonesOverflow` |           `boolean`           |  `false`   | Create artificial overflow with clones.          |
| `clonesFinish`   |           `boolean`           |  `false`   | Bring the cycle of clones to an end.             |
| `clonesMin`      |           `boolean`           |  `false`   | Minimum number of clones.                        |

### Methods

| Method                              | Description                                                                                 |
| :---------------------------------- | :------------------------------------------------------------------------------------------ |
| `filler.addClones(count, offset=0)` | Creates and adds clones to end in the desired number from given offset.                     |
| `filler.removeClones(count)`        | Removes the desired number of clones from the end.                                          |
| `filler.setClonesCount(count)`      | Sets the desired number of clones.                                                          |
| `filler.getCalcData()`              | Returns a calculated data object (number of clones, widths, etc.)                           |
| `filler.update()`                   | Calculates and sets the number of clones.                                                   |
| `filler.refresh(update=true)`       | Fully refresh and update all clones. Use this only after adding or removing original items. |
| `filler.destroy(removeClones=true)` | Destroy Filler instance, detach all observers and remove clones.                            |

### Properties

| Property           |         Type          | Description                                       |
| :----------------- | :-------------------: | :------------------------------------------------ |
| `filler.container` |     `HTMLElement`     | Container element.                                |
| `filler.wrapper`   |     `HTMLElement`     | Inner element.                                    |
| `filler.item`      | `Array.<HTMLElement>` | Items array.                                      |
| `filler.calcData`  |       `Object`        | Calculated data (number of clones, widths, etc.). |
| `filler.options`   |   `ReellerOptions`    | Current Filler options.                           |

### Events

| Event     | Arguments            | Description                        |
| :-------- | :------------------- | :--------------------------------- |
| `update`  | `(filler, calcData)` | Event will be fired after update.  |
| `refresh` | `(filler)`           | Event will be fired after refresh. |
| `destroy` | `(filler)`           | Event will be fired after destroy. |

## Examples of use

-   [Cuberto](https://cuberto.com/): Leading digital agency.
-   [Potion](https://www.sendpotion.com/): Video email for top sales professionals.
-   [Weltio](https://weltio.com/): More ways to grow your money.
-   [WorkJam](https://www.workjam.com/): Drive Employee Engagement.
-   [Spendwisor](https://spendwisor.app/): Make your shopping easier.
-   [Sleepiest](https://www.sleepiest.com/): The Sleepiest App.
-   [Perform](https://perform.fm/): Unlock workout superpowers.

## License

[The MIT License (MIT)](https://github.com/Cuberto/reeller/blob/dev/LICENSE)
