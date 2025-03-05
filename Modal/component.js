import { i18n } from "js/translations";
import FocusTrap from "js/dom/FocusTrap";

/**
 * @desc A modal dialog component
 */
export default class Modal {
  /**
   * @param {string} settings.id ID of the `<dialog>` element. Required
   * @param {function} settings.onClickOutside Function to call when the dialog is clicked outside. Optional
   * @param {function} settings.onShow Function to call when the dialog is shown. Optional
   * @param {function} settings.onClose Function to call when the dialog is closed. Optional
   * @param {string} settings.maxWidth The max-width of the dialog. Default is set in the CSS
   * @param {boolean} settings.hasCloseButton Whether the dialog has a close button (x). Default is `true`
   * @param {string|"modal"|"offcanvas-right"|"offcanvas-left"} settings.variant A "modal" will display in the center of the screen. "offcanvas-right" will slide in from the right. "offcanvas-left" will slide in from the left. Default is "modal"
   * @param {number} settings.animationSpeed The speed of the dialog animation in milliseconds. Default is `250`
   * @param {string|"slide"|"fade"|"none"} settings.animationStyle The animation style of the dialog. Default is "slide". Other options are "fade" and "none"
   * @param {boolean} settings.hasBackdrop Whether the dialog has a backdrop. Default is `true`
   */
  constructor({ id, onClickOutside, onShow, onClose, maxWidth, hasCloseButton = true, variant = "modal", animationSpeed = 250, animationStyle = "slide", hasBackdrop = true }) {
    this.id = id;
    this.dialog = document.getElementById(id);
    this.onClickOutside = onClickOutside;
    this.onShow = onShow;
    this.onClose = onClose;
    this.maxWidth = maxWidth;
    this.hasCloseButton = hasCloseButton;
    this.variant = variant;
    this.animationSpeed = animationSpeed;
    this.animationStyle = animationStyle;
    this.hasBackdrop = hasBackdrop;

    this.init();
  }

  /**
   * @desc Initialize this modal by setting attributes, adding event listeners, and building its close button.
   */
  init() {
    this.setAttributes();
    this.wrapInnerContentInDiv();
    this.buildCloseButton();
    this.addEventListeners();
  }

  /**
   * @desc Set the attributes and classes of this modal
   */
  setAttributes() {
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.classList.add("neo-dialog", `is-${this.variant}`, `has-animation-${this.animationStyle}`);
    this.dialog.classList.toggle("has-backdrop", this.hasBackdrop);
    this.dialog.style.setProperty("--animation-speed", `${this.animationSpeed}ms`);
    if (this.maxWidth) {
      this.dialog.style.setProperty("--max-width", this.maxWidth);
    }
  }

  /**
   * @desc Wrap the inner content of this modal in a div with the class `dialog-content`. This is critical for ensuring the modal's onClickOutside function works as expected
   *
   */
  wrapInnerContentInDiv() {
    const div = document.createElement("div");

    div.className = "neo-dialog-content";
    div.innerHTML = this.dialog.innerHTML;
    this.dialog.innerHTML = "";
    this.dialog.appendChild(div);
  }

  /**
   * @desc Add event listeners to this modal
   */
  addEventListeners() {
    this.dialog.addEventListener("click", event => {
      if (this.onClickOutside && event.target === this.dialog) {
        this.onClickOutside(this.dialog);
      }
    });
    this.dialog.addEventListener("close", () => {
      this.handleClosed(this.dialog);
      this.dialog.dispatchEvent(
        new CustomEvent("Modal:closed", {
          bubbles: true,
          detail: {
            id: this.dialog.id,
            dialog: this.dialog,
            variant: this.dialog.classList[1]?.replace("is-", ""),
          },
        })
      );
    });
    this.dialog.addEventListener("Modal:shown", () => this.handleShown());
  }

  /**
   * @desc Build the close button for this modal
   */
  buildCloseButton() {
    if (this.hasCloseButton) {
      const closeButton = document.createElement("button");
      closeButton.classList.add("neo-dialog-close", "icon-sm", "icon-error-x", "btn-primary");
      closeButton.setAttribute("type", "button");
      closeButton.setAttribute("aria-label", i18n("close"));
      closeButton.setAttribute("aria-controls", this.id);
      this.dialog.prepend(closeButton);
    }
  }

  /**
   * @desc Handle what happens after the modal is shown
   */
  handleShown(dialog = this.dialog) {
    if (this.onShow) {
      this.onShow(dialog);
    }
  }

  /**
   * @desc Handle what happens after the modal is closed
   */
  handleClosed(dialog = this.dialog) {
    if (Modal.isLocked(dialog)) return;
    setTimeout(() => {
      document.body.style.overflowY = "unset";
      document.body.style.paddingInlineEnd = "unset";
      if (this.onClose) {
        this.onClose(dialog);
      }
    }, this.animationSpeed);
  }

  /**
   * @desc Toggles the modal's visibility based on its current state
   * @param {string} id
   * @param {boolean} closeOthers If being opened, whether to close all other open modals. Default `true`
   */
  static toggle(id, closeOthers = true) {
    if (Modal.isOpen(id)) {
      Modal.close(id);
    } else {
      Modal.show(id, closeOthers);
    }
  }

  /**
   * @desc Shows the modal by ID
   * @param {string} id
   * @param {boolean} closeOthers Whether to close all other open modals. Default `true`
   */
  static show(id, closeOthers = true) {
    const dialog = document.getElementById(id);

    if (closeOthers) {
      Modal.closeAll();
    }
    dialog.showModal();
    FocusTrap.start(dialog);
    document.body.style.overflowY = "hidden";
    document.body.style.paddingInlineEnd = "16px";
    dialog.dispatchEvent(
      new CustomEvent("Modal:shown", {
        bubbles: true,
        detail: {
          id,
          dialog,
          variant: dialog.classList[1]?.replace("is-", ""),
        },
      })
    );
  }

  /**
   * @desc Closes the modal by ID
   * @param {string} id
   */
  static close(id) {
    const dialog = document.getElementById(id);
    const animationSpeed = dialog.style.getPropertyValue("--animation-speed") || 250;
    const toMs = animationSpeed.replace(/[^\d]/g, "");

    if (Modal.isLocked(dialog)) return;
    FocusTrap.stop(dialog);
    dialog.close();
    setTimeout(() => {
      document.body.style.overflowY = "unset";
      document.body.style.paddingInlineEnd = "unset";
    }, Number(toMs));
  }

  /**
   * @desc Closes all open modals
   */
  static closeAll() {
    const openDialogs = document.querySelectorAll("dialog[open]");
    openDialogs?.forEach(dialog => Modal.close(dialog.id));
  }

  /**
   * @param {string} id
   * @returns {boolean} Whether the modal is currently open
   */
  static isOpen(id) {
    return document.getElementById(id).hasAttribute("open");
  }

  /**
   * @returns {boolean} Whether any modals are open
   */
  static anyOpen() {
    if (document.querySelector("dialog[open]")) {
      return true;
    }
    return false;
  }

  /**
   * @param {string} id
   * @returns {boolean} Whether the modal is locked open, preventing it from being closed by the user.
   */
  static isLocked(id) {
    return id.getAttribute("data-locked") === "true";
  }

  /**
   * @desc Whether to lock the modal open, preventing it from being closed by the user. Default is `true`
   * @param {string} id
   * @param {boolean} doLock
   */
  static lock(id, doLock = true) {
    const dialog = document.getElementById(id);
    const preventEscape = event => {
      if (event.key !== "Escape") return;
      event.preventDefault();
    };

    dialog.setAttribute("data-locked", doLock);
    dialog.querySelectorAll(`[aria-controls="${id}"]`)?.forEach(button => {
      button.toggleAttribute("disabled", doLock);
    });
    if (!dialog._preventEscape) {
      dialog._preventEscape = preventEscape;
    }
    if (doLock) {
      dialog.addEventListener("keydown", dialog._preventEscape);
    } else {
      dialog.removeEventListener("keydown", dialog._preventEscape);
    }
    dialog.dispatchEvent(
      new CustomEvent(`Modal:${doLock ? "locked" : "unlocked"}`, {
        bubbles: true,
        detail: {
          id,
          dialog,
          variant: dialog.classList[1]?.replace("is-", ""),
        },
      })
    );
  }
}
