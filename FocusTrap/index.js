/**
 * @desc FocusTrap is a class that traps focus inside a container element by using hidden focus bumper elements
 */
export default class FocusTrap {
  /**
   * @desc Checks a list of conditions to verify if the Target Element is focusable
   * @param {HTMLElement} t Target Element
   * @returns Boolean
   */
  static canBeFocused = t => {
    const hasTabIndex = t.tabIndex > -1;
    const isVisible = !!(t.offsetWidth || t.offsetHeight || t.getClientRects().length);
    const isNotHidden = !t.hasAttribute("hidden") && !t.classList.contains("hidden") && !t.classList.contains("d-none");
    const isNotDisabled = !t.hasAttribute("disabled");
    // Check if the element is not a focus bumper
    const isNotABumper = !t.hasAttribute("data-bumper");
    const canBeFocused = hasTabIndex && isVisible && isNotHidden && isNotDisabled && isNotABumper;

    return canBeFocused;
  };

  /**
   * @desc Gets all focusable elements inside Target Element
   * @param {HTMLElement} t Target Element
   * @returns {Array<HTMLElement>} Array of HTMLElements
   */
  static getFocusableElements(t) {
    const focusableElements = t?.querySelectorAll(
      'audio, button, canvas, details, iframe, [href], input, select, summary, textarea, video, progress, [accesskey], [contenteditable], [tabindex]:not([tabindex="-1"])'
    );
    return [...focusableElements]?.filter(item => FocusTrap.canBeFocused(item));
  }

  /**
   * @desc Gets the last focusable element inside Target Element
   * @param {HTMLElement} t Target Element
   * @returns {HTMLElement} HTMLElement
   */
  static getLastFocusableElement(t) {
    return FocusTrap.getFocusableElements(t)
      ?.reverse()
      ?.find(element => element.tabIndex > -1);
  }

  /**
   * @desc Gets the first focusable element inside Target Element
   * @param {HTMLElement} t Target Element
   * @returns {HTMLElement} HTMLElement
   */
  static getFirstFocusableElement(t) {
    return FocusTrap.getFocusableElements(t)?.find(element => element.tabIndex > -1);
  }

  /**
   * @desc Builds invisible elements at the start and end of the container that "block" the user from tabbing outside the element
   * @param {HTMLElement} container The containing element
   */
  static buildFocusBumperElements(container) {
    if (container.querySelectorAll(`focus-bumper`).length) return; // If bumpers already exist, do not create new ones
    const bumperStart = document.createElement("focus-bumper");
    const bumperEnd = document.createElement("focus-bumper");

    bumperStart.tabIndex = "0";
    bumperStart.dataset.bumper = "start";
    bumperEnd.tabIndex = "0";
    bumperEnd.dataset.bumper = "end";
    container.insertAdjacentElement("afterbegin", bumperStart);
    container.insertAdjacentElement("beforeend", bumperEnd);
    FocusTrap.addEventListenerToBumpers(container);
  }

  /**
   * @desc Handles the way focus is redirected inside the container
   * @param {Event} event The focus event
   * @param {HTMLElement} container The element in which focus shall be trapped
   */
  static focusTrapHandler = (event, container) => {
    // If tabbing behind the beginning of the container element, send focus to last focusable element
    if (event.target.matches("focus-bumper[data-bumper='start']")) {
      FocusTrap.getLastFocusableElement(container)?.focus();
    }
    // If tabbing past the end of the container element, send focus to the close button
    if (event.target.matches("focus-bumper[data-bumper='end']")) {
      FocusTrap.getFirstFocusableElement(container)?.focus();
    }
  };

  /**
   * @desc Adds event listeners to the focus bumper elements to handle focus trapping
   * @param {HTMLElement} container The element in which focus shall be trapped
   */
  static addEventListenerToBumpers(container) {
    container.querySelectorAll(`focus-bumper`).forEach(bumper => {
      bumper.addEventListener("focus", event => FocusTrap.focusTrapHandler(event, container));
    });
  }

  /**
   * @desc Traps focus inside the container by using hidden focus bumper elements
   * @param {HTMLElement} container The element in which focus shall be trapped
   */
  static start(container) {
    FocusTrap.buildFocusBumperElements(container);
    FocusTrap.getFirstFocusableElement(container)?.focus();
  }

  /**
   * @desc Prevents focus from being trapped inside the container by destroying the focus bumper elements
   * @param {HTMLElement} container The element in which the focus bumpers reside
   */
  static stop(container) {
    container.querySelectorAll(`focus-bumper`)?.forEach(bumper => bumper.remove());
  }
}
