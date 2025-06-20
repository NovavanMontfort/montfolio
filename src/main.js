import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import Background from './skull';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);

class Echo {
    constructor(attributes) {
        this.$element = attributes.element;
        this.$lines = this.$element.querySelectorAll("[data-select='line']");
        this.$clones = [];

        [...this.$lines].forEach(($line, index) => {
            // Create clone
            this.$clones[index] = $line.cloneNode(true);
            this.$clones[index].style.position = 'absolute';
            this.$clones[index].style.left = 0;
            $line.parentNode.appendChild(this.$clones[index]);

            // Animate chars
            const $chars = [...$line.querySelectorAll('path')];
            const $cloned = [...this.$clones[index].querySelectorAll('path')];

            gsap.from($cloned, {
                yPercent: -110,
                ease: 'power4.inOut',
                duration: 2,
                stagger: 0.2,
                repeat: -1,
                yoyo: true,
            });
            gsap.to($chars, {
                yPercent: 110,
                ease: 'power4.inOut',
                duration: 2,
                stagger: 0.2,
                repeat: -1,
                yoyo: true,
            });
        });
    }
}

class Label {
    constructor(attributes) {
        this.$element = attributes.element;
        this.setup();
    }

    setup() {
        this.$words = new SplitText(this.$element, { type: 'words' }).words;
        this.$words.forEach(($word) => ($word.style.overflow = 'hidden'));
        this.$child = new SplitText(this.$words, { type: 'words' }).words;
        gsap.from(this.$child, { yPercent: -100, ease: 'power2.out', duration: 0.6, stagger: 0.05, scrollTrigger: { trigger: this.$element, start: 'top 90%' } });
    }

    destroy() {}
}

/**
 * Quote
 */
class Quote {
    constructor(attributes = {}) {
        this.$element = attributes.element;
        this.setup();
    }

    setup() {
        this.$lines = new SplitText(this.$element, { type: 'lines' }).lines;
        gsap.fromTo(
            this.$lines,
            { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
            { clipPath: 'polygon(100% 0, 0 0, 0 100%, 100% 100%)', duration: 1, ease: 'none', stagger: 1, scrollTrigger: { trigger: this.$element, scrub: true, start: 'top 75%', end: 'bottom 25%' } }
        );
    }
    destroy() {}
}

class Parallax {
    constructor(attributes = {}) {
        this.$element = attributes.element;
        this.$image = this.$element.querySelector("[data-select='image']");
        this.setup();
    }

    setup() {
        gsap.fromTo(
            this.$image,
            {
                yPercent: -20,
            },
            {
                yPercent: 20,
                ease: 'none',
                scrollTrigger: {
                    trigger: this.$element,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            }
        );
    }
    destroy() {}
}

/**
 *
 * Factory
 */
document.fonts.ready.then(() => {
    const $elements = {
        echo: [...document.querySelectorAll("[data-component='echo']")],
        label: [...document.querySelectorAll("[data-component='label']")],
        quote: [...document.querySelectorAll("[data-component='quote']")],
        background: [...document.querySelectorAll("[data-component='background']")],
        parallax: [...document.querySelectorAll("[data-component='parallax']")],
    };

    const components = {
        echo: $elements.echo.map(($element) => new Echo({ element: $element })),
        label: $elements.label.map(($element) => new Label({ element: $element })),
        quote: $elements.quote.map(($element) => new Quote({ element: $element })),
        background: $elements.background.map(($element) => new Background({ element: $element })),
        parallax: $elements.parallax.map(($element) => new Parallax({ element: $element })),
    };
});
