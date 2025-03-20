/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import ARIA from "js/dom/aria";
import debounce from "lodash/debounce";
import { i18n, i18nReplace } from "js/translations";

const animationStyles = ["slide", "fade", "none"];

/**
 * @desc A Slide Show (Carousel) component that enables the user to cycle through a series of content in a specific order.
 * @desc Built using the w3.org WAI-ARIA Authoring Practices guidelines for Carousels: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 */
export default class SlideShow {
  /**
   * @param {String} settings.id An ID for the Slide Show. Required
   * @param {String} settings.label A (hidden) label for the Slide Show. Required
   * @param {Function} settings.onSlide A callback Function that fires when the Slide Show changes slides. Optional
   * @param {String} settings.className A custom class to add to the Slide Show container. Optional
   * @param {Boolean} settings.hasPicker A group of elements, often styled as small dots, that enable the user to pick a specific slide in the rotation sequence to display. Default true
   * @param {Boolean} settings.hasNavArrows Interactive elements, often styled as arrows, that displays the prev/next slide in the rotation sequence. Default true
   * @param {Boolean} settings.hasEqualSlideHeight Whether to equalize the height of the Slide Show container to the tallest slide, which prevents layout shift when changing slides. Default true
   * @param {String|"slide"|"fade"|"none"} settings.animationStyle The animation style to use when changing slides. Default `"slide"`. Other options: `"fade"`, `"none"`
   * @param {Boolean} settings.hasSlideOverflow Whether to allow the slides to overflow the container, meaning the next/previous inactive slide may be slightly visible. Incompatible with navigation arrows. Default false
   * @example new SlideShow({ id: "mySlideShow", label: "My Slide Show", hasPicker: true, hasNavArrows: false });
   */
  constructor(settings) {
    const { id, label, onSlide, className = "", hasPicker = true, hasNavArrows = true, hasEqualSlideHeight = true, animationStyle = "slide", hasSlideOverflow = false } = settings;
    this.id = id;
    this.label = label;
    this.onSlide = onSlide;
    this.className = className;
    /** @type {HTMLOListElement | null} */
    this.stage = document.getElementById(id);
    this.hasPicker = hasPicker;
    this.hasNavArrows = hasNavArrows;
    this.hasEqualSlideHeight = hasEqualSlideHeight;
    this.animationStyle = animationStyle;
    this.hasSlideOverflow = hasSlideOverflow;
    this.updateContainerHeight = this.updateContainerHeight.bind(this);
    this.resizeListener = this.resizeListener.bind(this);

    this.init();
  }

  initialized = false;

  eventsInitialized = false;

  /**
   * @desc Initializes the Slide Show component
   */
  init() {
    if (this.initialized || !this.validateSettings() || !this.validateStage() || !this.validateSlides()) return;
    this.build();
    this.addEventListeners();
    this.refreshUI();
    this.initialized = true;
  }

  /**
   * @desc Builds the Slide Show container, stage, and controls
   */
  build() {
    this.setStageAttributes();
    this.buildContainer();
    this.buildMobileHelperText();
    this.buildControls();
  }

  /**
   * @desc Adds event listeners to the Slide Show
   */
  addEventListeners() {
    if (this.eventsInitialized) return;
    this.controlsListener();
    this.swipeListeners();
    this.resizeListener();
    this.imageLoadedListener();
    this.eventsInitialized = true;
  }

  /**
   * @desc A custom event that fires when the Slide Show changes slides
   * @returns {CustomEvent} The custom event
   */
  slideShowChangeEvent() {
    /**
     * @type {CustomEvent} The custom event
     * @property {Object} detail The event detail
     * @property {HTMLLIElement} detail.slide The active slide
     * @property {Number} detail.index The active slide index
     * @property {Number} detail.totalSlides The total Number of slides
     * @property {Boolean} detail.firstSlideIsActive Whether the first slide is active
     * @property {Boolean} detail.lastSlideIsActive Whether the last slide is active
     */
    const event = new CustomEvent("SlideShow:change", {
      bubbles: true,
      detail: {
        id: this.id,
        slide: this.activeSlide,
        index: this.activeSlideIndex,
        totalSlides: this.totalSlides,
        firstSlideIsActive: this.firstSlideIsActive,
        lastSlideIsActive: this.lastSlideIsActive,
      },
    });
    return event;
  }

  /**
   * @desc Handles the click event on the Slide Show navigational arrow buttons
   * @param {HTMLButtonElement} target
   */
  handleNavArrowClick(target) {
    const { slide } = target.dataset;

    if (slide === "prev") {
      this.activateSlide(this.activeSlideIndex - 1);
    } else if (slide === "next") {
      this.activateSlide(this.activeSlideIndex + 1);
    }
  }

  /**
   * @returns {Boolean} Whether the Slide Show has valid settings
   */
  validateSettings() {
    if (!animationStyles.includes(this.animationStyle)) {
      console.warn(`Invalid animation style "${this.animationStyle}" for Slide Show. Must be one of the following: ${animationStyles.join(", ")}`);
      return false;
    }
    return true;
  }

  /**
   * @desc Validates the Slide Show stage element to ensure it is an ordered list
   * @returns {Boolean} Whether the Slide Show has a valid stage element
   */
  validateStage() {
    if (!this.stage) {
      console.error(`No Slide Show element with id #${this.id} found`);
      return false;
    }
    if (this.stage.tagName !== "OL") {
      console.error(`Slide Show stage element must be an ordered list (OL). Your element is a ${this.stage.tagName}`);
      return false;
    }
    return true;
  }

  /**
   * @desc Validates the Slide Show slides to ensure they are proper list items
   * @returns {Boolean} Whether the Slide Show has proper slides
   */
  validateSlides() {
    this.slides?.forEach((slide, index) => {
      if (slide.tagName !== "LI") {
        console.warn(
          `Slide Show slide element must be a list item (LI). Your element at index ${index} is a ${slide.tagName}`
        );
        return false;
      }
      return true;
    });
    return true; // Has no slides, but that's okay
  }

  /**
   * @desc Builds the Slide Show container, which contains all the slides and controls
   */
  buildContainer() {
    const container = document.createElement("div");

    container.className = `slides-container ${this.className}`;
    container.classList.toggle("has-picker-dots", this.hasPicker);
    container.setAttribute("role", "group");
    container.setAttribute("aria-roledescription", "carousel");
    container.setAttribute("aria-label", this.label);
    this.stage?.parentElement?.insertBefore(container, this.stage);
    container.appendChild(this.stage);

    /**
     * @type {HTMLDivElement} The Slide Show container that holds the stage and controls
     */
    this.container = container;
  }

  /**
   * @desc Builds the Slide Show mobile helper text to inform users to swipe to view more slides
   */
  buildMobileHelperText() {
    const p = document.createElement("p");

    p.classList.add("ts-body-1", "text-center", "show-is-mobile-view");
    p.textContent = i18n("swipeToViewMore");
    this.container?.appendChild(p);

    /**
     * @type {HTMLParagraphElement} The helper text that informs users to swipe on mobile
     */
    this.helperText = p;
  }

  /**
   * @desc Builds the Slide Show controls container and its children (nav arrows and picker dots)
   */
  buildControls() {
    if (!this.hasNavArrows && !this.hasPicker) {
      console.warn(`SlideShow "${this.label}" has no controls. Set "hasNavArrows" or "hasPicker" to true to enable controls.`);
      return;
    }
    const controls = document.createElement("nav");

    controls.classList.add("slides-controls", "text-center");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", `${this.label}: slide controls`);
    this.container?.appendChild(controls);

    /**
     * @type {HTMLElement} The `<nav>` element that contains the arrows/picker dots
     */
    this.controls = controls;

    this.buildNavArrows();
    this.buildPicker();
  }

  /**
   * @desc Builds the Slide Show picker controls container
   */
  buildPicker() {
    if (!this.hasPicker) return;
    const picker = document.createElement("div");

    picker.className = "slides-picker d-flex justify-content-center gap-xxs p-xxs";
    picker.setAttribute("role", "group");
    picker.setAttribute("aria-label", `${this.label}: ${i18n("slidePicker")}`);
    this.controls?.appendChild(picker);

    /**
     * @type {HTMLDivElement} The element that contains the picker dots
     */
    this.picker = picker;
  }

  /**
   * @desc Builds the Slide Show picker control button dots
   */
  buildPickerDots() {
    if (!this.hasPicker) return;
    this.picker.innerHTML = "";
    this.slides?.forEach(slide => {
      const dot = document.createElement("button");

      if (!slide.id) {
        slide.id = ARIA.generateUniqueID("slide");
      }
      dot.classList.add("slides-dot");
      dot.classList.toggle("is-active", slide.classList.contains("is-active"));
      dot.setAttribute("type", "button");
      dot.setAttribute("aria-labelledby", slide.id);
      dot.setAttribute("aria-controls", slide.id);
      this.picker.appendChild(dot);
    });
  }

  /**
   * @desc Builds the Slide Show navigational arrow buttons (prev/next)
   */
  buildNavArrows() {
    if (!this.hasNavArrows || this.hasSlideOverflow) return;
    const prevButton = document.createElement("button");
    const nextButton = document.createElement("button");

    this.container.classList.add("has-nav-arrows");
    [prevButton, nextButton].forEach(button => {
      button.classList.add(
        "slides-arrow",
        "btn-default",
        button === prevButton ? "icon-button-navigate-left" : "icon-button-navigate-right"
      );
      button.setAttribute("type", "button");
      button.setAttribute("aria-label", button === prevButton ? i18n("previousSlide") : i18n("nextSlide"));
      button.setAttribute("aria-controls", this.id);
      button.setAttribute("data-slide", button === prevButton ? "prev" : "next");
      this.controls.appendChild(button);
    });

    this.prevButton = prevButton;
    this.nextButton = nextButton;
  }

  /**
   * @desc Sets the required attributes for the Slide Show stage element
   */
  setStageAttributes() {
    this.stage.setAttribute("role", "region");
    this.stage.className = `slides-stage has-animation-${this.animationStyle}`;
    this.stage.classList.toggle("has-slide-overflow", this.hasSlideOverflow);
  }

  /**
   * @desc Sets the appropriate attributes for each Slide Show slide
   */
  setSlideAttributes() {
    this.slides?.forEach((slide, index) => {
      slide.classList.add("slides-slide");
      slide.setAttribute("role", "group");
      slide.setAttribute("aria-roledescription", "slide");
      slide.setAttribute("aria-label", `${this.label}: ${i18nReplace("slide_of_", index + 1, this.totalSlides)}`);
    });
  }

  /**
   * @desc Adds a slide to the Slide Show
   * @param {Object} settings
   * @param {String} settings.innerHTML The content to display in the Slide Show slide. Required
   * @param {String} settings.id An ID for the Slide Show slide. Must belong to a `<ol>` element. Required
   * @param {Boolean} settings.isActive Whether the slide is the active slide. Default false
   * @param {Number} settings.index The index at which to insert the slide. Default -1, which places it last
   * @example addSlide({ innerHTML: "<h2>Slide 1</h2>", id: "slide1", isActive: true, index: 0 });
   */
  addSlide(settings) {
    const { innerHTML, id, isActive = false, index = -1 } = settings;
    if (document.getElementById(id)) {
      console.error(
        `Element with ID ${id} already exists in the DOM. Please choose a different ID for your Slide Show slide.`
      );
      return;
    }
    const slide = document.createElement("li");

    slide.innerHTML = innerHTML;
    slide.id = id;
    slide.classList.toggle("is-active", isActive);
    if (index > -1 && this.slides?.length > index) {
      this.slides[index].insertAdjacentElement("afterend", slide);
    } else {
      this.stage?.appendChild(slide);
    }
    if (isActive) {
      this.activateSlide(id);
    }
    this.refreshUI();
  }

  /**
   * @desc Removes a slide from the Slide Show
   * @param {String | Number} slide The slide to remove. Can be the slide ID or the slide index
   */
  destroySlide(slide) {
    const target = this.getSlide(slide);

    target?.remove();
    this.refreshUI();
    this.container.dispatchEvent(this.slideShowChangeEvent());
  }

  /**
   * @desc Activates the chosen slide from the Slide Show. Also activates the corresponding picker dot if applicable
   * @param {String | Number} slide The slide to activate. Can be the slide ID or the slide index
   */
  activateSlide(slide) {
    const target = this.getSlide(slide);

    // Updates all slides and dots to reflect the active slide
    this.slides?.forEach(s => {
      s.classList.toggle("is-active", s === target);
      s.setAttribute("tabindex", s === target ? "0" : "-1");
      s.setAttribute("aria-hidden", s !== target);
    });
    this.dots?.forEach(d => {
      d.classList.toggle("is-active", d.getAttribute("aria-controls") === target?.id);
    });
    // Updates the prev/next buttons
    this.updatePrevNextButtons();
    // If the Slide Show does not have equal slide height, update the container height
    if (!this.hasEqualSlideHeight) {
      this.updateContainerHeight();
    }
    // Update the active slide index, which is used to align the slides in the stage
    this.stage?.style.setProperty("--active-slide-index", this.activeSlideIndex);
    // Scroll slideshow into view
    this.container.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    // Dispatch the custom event
    this.container.dispatchEvent(this.slideShowChangeEvent());
    if (this.onSlide) {
      this.onSlide(this);
    }
  }

  /**
   * @desc Updates various aspects of the UI based on the current state of the Slide Show
   */
  refreshUI() {
    if (this.hasNoActiveSlide) {
      this.activateSlide(0);
    }
    this.setSlideAttributes();
    this.buildPickerDots();
    this.updatePrevNextButtons();
    this.updateContainerHeight();
  }

  /**
   * @desc Sets the minimum height of the Slide Show container to accommodate the current settings
   * @param {Boolean} instantTransition Instantly update the height with no animation delay. Default false, which animates the height
   */
  updateContainerHeight(instantTransition = false) {
    const defaultDuration = getComputedStyle(this.container).getPropertyValue("--transition-duration");
    let duration = defaultDuration;
    let minHeight = this.hasEqualSlideHeight ? this.tallestSlide?.offsetHeight : this.activeSlide?.offsetHeight;

    if (instantTransition === true) {
      duration = "0";
    }
    this.container?.style.setProperty("--transition-duration", duration);
    if (minHeight < 100) minHeight = 100;
    this.stage?.style.setProperty("--slide-height", `${minHeight}px`);
    // Reset the transition duration to the default value
    setTimeout(() => {
      this.container?.style.setProperty("--transition-duration", defaultDuration);
    }, defaultDuration.split("ms")[0]);
  }

  /**
   * @desc Adds a resize event listener to the Slide Show container to normalize the container height
   */
  resizeListener() {
    window.addEventListener("resize", debounce(this.updateContainerHeight, 250));
  }

  /**
   * @desc Adds a load event listener to the Slide Show images to normalize the container height once the images have loaded
   */
  imageLoadedListener() {
    this.images?.forEach(image => {
      image.addEventListener("load", () => {
        this.updateContainerHeight();
      });
    });
  }

  /**
   * @desc Adds a click event listener to the Slide Show controls to handle navigation
   */
  controlsListener() {
    this.controls?.addEventListener("click", event => {
      const { target } = event;
      if (target.tagName !== "BUTTON") return;

      if (target.hasAttribute("data-slide")) {
        this.handleNavArrowClick(target);
      } else if (target.hasAttribute("aria-controls")) {
        this.activateSlide(target.getAttribute("aria-controls"));
      }
    });
  }

  /**
   * @desc Adds swipe event listeners to the Slide Show to handle touch gestures
   */
  swipeListeners() {
    const minX = 50; // Minimum swipe distance in pixels to trigger a swipe
    let startX = 0;
    let endX = 0;

    /**
     * @desc Determines the direction of the swipe
     * @returns {"LEFT"|"RIGHT"|null} The direction of the swipe
     */
    function getDirection() {
      const totalDistance = Math.abs(endX - startX);
      if (totalDistance < minX) return null;
      return endX < startX ? "LEFT" : "RIGHT";
    }

    this.stage.addEventListener("touchstart", event => {
      event.preventDefault();
      startX = event.changedTouches[0].screenX;
    });

    this.stage.addEventListener("touchend", event => {
      event.preventDefault();
      endX = event.changedTouches[0].screenX;
      if (getDirection() === "LEFT") {
        this.activateSlide(this.activeSlideIndex + 1);
      } else if (getDirection() === "RIGHT") {
        this.activateSlide(this.activeSlideIndex - 1);
      }
    });
  }

  /**
   * @desc Updates the state of the Slide Show navigation arrows based on the current active slide
   */
  updatePrevNextButtons() {
    this.prevButton?.toggleAttribute("disabled", this.firstSlideIsActive);
    this.nextButton?.toggleAttribute("disabled", this.lastSlideIsActive);
  }

  /**
   * @desc Retrieves the current state of the Slide Show
   * @returns {Object} The Slide Show data
   */
  get slideShowData() {
    return {
      tallestSlide: this.tallestSlide,
      slides: this.slides,
      dots: this.dots,
      activeSlide: this.activeSlide,
      activeSlideIndex: this.activeSlideIndex,
      activeDot: this.activeDot,
      hasNoSlides: this.hasNoSlides,
      hasNoActiveSlide: this.hasNoActiveSlide,
      firstSlideIsActive: this.firstSlideIsActive,
      lastSlideIsActive: this.lastSlideIsActive,
      totalSlides: this.totalSlides,
    };
  }

  get tallestSlide() {
    return [...this.slides].reduce((tallest, slide) => (slide.offsetHeight > tallest.offsetHeight ? slide : tallest));
  }

  /** @type {NodeListOf<li> | null} slides */
  get slides() {
    return this.stage?.querySelectorAll(":scope > li");
  }

  /** @type {NodeListOf<button> | null} buttons */
  get dots() {
    return this.picker?.querySelectorAll(":scope > button");
  }

  /**
   * @desc Retrieves the currently active slide from the Slide Show
   * @returns {HTMLLIElement | null} The active slide
   */
  get activeSlide() {
    return this.stage?.querySelector(":scope > li.is-active");
  }

  /**
   * @desc Retrieves the currently active slide index from the Slide Show
   * @returns {Number} The active slide index
   */
  get activeSlideIndex() {
    return [...this.slides]?.indexOf(this.activeSlide);
  }

  /**
   * @desc Retrieves the currently active dot from the Slide Show picker
   * @returns {HTMLButtonElement | null} The active dot
   */
  get activeDot() {
    return this.picker?.querySelector(":scope > button.is-active");
  }

  /** @type {Boolean} */
  get hasNoSlides() {
    return !this.slides || this.slides.length === 0;
  }

  /** @type {Boolean} */
  get hasNoActiveSlide() {
    return !this.activeSlide;
  }

  /** @type {Boolean} */
  get firstSlideIsActive() {
    return this.activeSlideIndex === 0;
  }

  /** @type {Boolean} */
  get lastSlideIsActive() {
    return this.activeSlideIndex === this.slides.length - 1;
  }

  /** @type {Number} */
  get totalSlides() {
    return this.slides?.length;
  }

  /**
   * @desc Retrieves the images in the Slide Show slides
   * @returns {NodeListOf<img> | null} -
   */
  get images() {
    return this.stage?.querySelectorAll("img");
  }

  /**
   * @desc Retrieves a slide element from the Slide Show
   * @param {String|Number} slide The slide to get. Can be the slide ID or the slide index
   * @returns {HTMLLIElement} The slide
   */
  getSlide(slide) {
    if (typeof slide === "number") {
      if (slide > this.slides.length - 1) {
        // Go to last slide if index is greater than the Number of slides
        return this.slides[this.slides.length - 1];
      }
      if (slide < 0) {
        // Go to first slide if index is less than 0
        return this.slides[0];
      }
      return this.slides[slide];
    }
    return this.stage?.querySelector(`#${slide}`);
  }
}
