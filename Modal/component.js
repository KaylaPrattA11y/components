/* eslint-disable no-console */
// import { i18n } from "js/translations";
import { i18n } from "../../translations";
import FocusTrap from "../../dom/FocusTrap";
import addSwipeListeners from "../../events/addSwipeListeners";

/**
 * @class Modal
 * @classdesc A modal dialog component that supports various display styles, animations, and event handling.
 * @see {@link https://ifleet-v2.dev.myfleetcard.net/style-guide/#modal}
 */
export default class Modal {
  /**
   * Creates a modal instance.
   * @param {Object} settings - Configuration options for the modal.
   * @param {String} settings.id - The ID of the `<dialog>` element. Required.
   * @param {Function} [settings.onClickOutside] - Callback when the modal is clicked outside.
   * @param {Function} [settings.onShow] - Callback when the modal is shown.
   * @param {Function} [settings.onClose] - Callback when the modal is closed.
   * @param {String} [settings.maxWidth] - The max-width of the modal. Defaults to CSS settings.
   * @param {Boolean} [settings.hasStickyCloseButton=true] - Whether the close button sticks to the top of the modal, following the user as they scroll
   * @param {Boolean} [settings.hasCloseButton=true] - Whether the modal has a close button.
   * @param {"modal"|"offcanvas-right"|"offcanvas-left"|"drawer"} [settings.variant="modal"] - Display style of the modal. A modal is a full-screen dialog, while an offcanvas is a smaller dialog that slides in from the side (slide panel). A drawer is a smaller dialog that slides in from the bottom.
   * @param {Number} [settings.animationSpeed=250] - Animation speed in milliseconds.
   * @param {"slide"|"fade"|"none"} [settings.animationStyle="slide"] - Animation style.
   * @param {Boolean} [settings.hasBackdrop=true] - Whether the modal has a backdrop.
   */
  constructor({
    id,
    onClickOutside,
    onShow,
    onClose,
    maxWidth,
    hasStickyCloseButton = true,
    hasCloseButton = true,
    variant = "modal",
    animationSpeed = 250,
    animationStyle = "slide",
    hasBackdrop = true,
  }) {
    /**  @type {String} */
    this.id = id;
    /**  @type {Function|null} */
    this.onClickOutside = onClickOutside;
    /**  @type {Function|null} */
    this.onShow = onShow;
    /**  @type {Function|null} */
    this.onClose = onClose;
    /**  @type {String|null} */
    this.maxWidth = maxWidth;
    /**  @type {Boolean} */
    this.hasStickyCloseButton = hasStickyCloseButton;
    /**  @type {Boolean} */
    this.hasCloseButton = hasCloseButton;
    /**  @type {String} */
    this.variant = variant;
    /**  @type {Number} */
    this.animationSpeed = animationSpeed;
    /**  @type {String} */
    this.animationStyle = animationStyle;
    /**  @type {Boolean} */
    this.hasBackdrop = hasBackdrop;

    this.init();
  }

  /** @type {Boolean} Whether the modal has already been initialized */
  alreadyInitialized =
    document.getElementById(this.id) != null && document.getElementById(this.id).hasAttribute("aria-modal");

  /**
   * Initialize this modal by setting attributes, adding event listeners, and building its close button.
   */
  init() {
    if (this.alreadyInitialized) return;

    /** @type {HTMLDialogElement} */
    this.dialog = document.getElementById(this.id);

    if (this.dialog && !(this.dialog instanceof HTMLDialogElement)) {
      this.dialog.remove();
    }

    this.buildDialog();
    this.setAttributes();
    this.wrapInnerContentInDiv();
    this.buildCloseButton();
    this.addEventListeners();
    this.alreadyInitialized = true;
  }

  /**
   * Build the dialog element if it doesn't already exist and appends it to the document's body
   */
  buildDialog() {
    if (!this.dialog) {
      const dialog = document.createElement("dialog");

      dialog.id = this.id;
      document.body.appendChild(dialog);
      this.dialog = dialog;
    }
  }

  /**
   * Set the attributes and classes of this modal
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
   * Wrap the inner content of this modal in a div with the class `dialog-content`. This is critical for ensuring the modal's onClickOutside function works as expected
   */
  wrapInnerContentInDiv() {
    const div = document.createElement("div");

    div.className = "neo-dialog-content";
    div.innerHTML = this.dialog.innerHTML;
    this.dialog.innerHTML = "";
    this.dialog.appendChild(div);
  }

  /**
   * Add event listeners to this modal
   */
  addEventListeners() {
    this.dialog.addEventListener("click", event => {
      if (this.onClickOutside && event.target === this.dialog) {
        this.onClickOutside(this);
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
    this.dialog.addEventListener("Modal:shown", event => this.handleShown(event));
    // Add a swipe down listener for drawer variant
    if (this.variant === "drawer") {
      addSwipeListeners({
        element: this.dialog,
        onSwipeDown: () => {
          Modal.close(this.dialog.id);
        },
      });
    }
  }

  /**
   * Build the close button for this modal
   */
  buildCloseButton() {
    const existingWrapper = this.dialog.querySelector(".neo-dialog-close-wrapper");
    if (existingWrapper) {
      existingWrapper.remove();
    }
    if (this.hasCloseButton) {
      const buttonWrapper = document.createElement("div");
      const closeButton = document.createElement("button");
      closeButton.className = "neo-dialog-close icon-error-x";
      if (["offcanvas-right", "offcanvas-left"].includes(this.variant)) {
        closeButton.classList.add("btn-primary", "icon-sm");
      }
      if (["drawer", "modal"].includes(this.variant)) {
        closeButton.classList.add("btn-default", "icon-md");
      }
      closeButton.setAttribute("type", "button");
      closeButton.setAttribute("aria-label", i18n("close"));
      closeButton.setAttribute("aria-controls", this.id);
      buttonWrapper.className = "neo-dialog-close-wrapper";
      buttonWrapper.classList.toggle("is-sticky", this.hasStickyCloseButton);
      this.dialog.prepend(buttonWrapper);
      buttonWrapper.appendChild(closeButton);
    }
  }

  /**
   * Insert content into the modal's designated content area. This will replace any existing content.
   * @param {String} id - ID of the target modal.
   * @param {string|HTMLElement} contents - The content to insert.
   */
  static insertContent(id, contents) {
    const dialog = document.getElementById(id);
    const content = dialog.querySelector(".neo-dialog-content");

    if (typeof contents === "string") {
      content.innerHTML = contents;
    } else {
      content.innerHTML = "";
      content.appendChild(contents);
    }
  }

  /**
   * @desc Handle what happens after the modal is shown
   * @param {CustomEvent} event
   * @param {HTMLDialogElement} event.detail.dialog
   * @param {String} event.detail.id
   * @param {String} event.detail.variant
   * @param {HTMLElement} event.detail.toggleButton
   */
  handleShown(event) {
    if (this.onShow) {
      this.onShow(event.detail);
    }
  }

  /**
   * Handle what happens after the modal is closed
   * @param {HTMLDialogElement} [dialog=this.dialog] - The modal instance's dialog element.
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
   * @param {String} id
   * @param {Boolean} [closeOthers=true] If being opened, whether to close all other open modals
   * @param {HTMLElement} [toggleButton] The button that triggered the modal
   */
  static toggle(id, closeOthers = true, toggleButton = null) {
    if (Modal.isOpen(id)) {
      Modal.close(id);
    } else {
      Modal.show(id, closeOthers, toggleButton);
    }
  }

  /**
   * @desc Shows the modal by ID
   * @param {String} id
   * @param {Boolean} [closeOthers=true] Whether to close all other open modals
   * @param {HTMLElement} [toggleButton] The button that triggered the modal
   */
  static show(id, closeOthers = true, toggleButton = null) {
    const dialog = document.getElementById(id);

    if (closeOthers) {
      Modal.closeAll();
    }
    if (Modal.isOpen(id)) return;
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
          toggleButton,
          variant: dialog.classList[1]?.replace("is-", ""),
        },
      })
    );
  }

  /**
   * Closes the modal by ID
   * @param {String} id - The modal ID.
   * @param {Boolean} [forceClose=false] - Whether to force the modal to close regardless of state.
   */
  static close(id, forceClose = false) {
    const dialog = document.getElementById(id);
    const animationSpeed = dialog.style.getPropertyValue("--animation-speed") || "250";
    const toMs = animationSpeed.replace(/[^\d]/g, "");

    if ((Modal.isLocked(dialog) && !forceClose) || !Modal.isOpen(id)) return;
    FocusTrap.stop(dialog);
    dialog.close();
    setTimeout(() => {
      document.body.style.overflowY = "unset";
      document.body.style.paddingInlineEnd = "unset";
    }, Number(toMs));
  }

  /**
   * Closes all open modals
   * @param {Boolean} [forceClose=false] - Whether to force close all modals.
   */
  static closeAll(forceClose = false) {
    const openDialogs = document.querySelectorAll("dialog[open]");
    openDialogs?.forEach(dialog => Modal.close(dialog.id, forceClose));
  }

  /**
   * @param {String} id - The modal ID.
   * @returns {Boolean} True if the modal is open.
   */
  static isOpen(id) {
    return document.getElementById(id).hasAttribute("open");
  }

  /**
   * @returns {Boolean} Whether any modals are open
   */
  static anyOpen() {
    if (document.querySelector("dialog[open]")) {
      return true;
    }
    return false;
  }

  /**
   * @param {String} id
   * @returns {Boolean} Whether the modal is locked open, preventing it from being closed by the user.
   */
  static isLocked(id) {
    return id.getAttribute("data-locked") === "true";
  }

  /**
   * Whether to lock the modal open, preventing it from being closed by the user. Default is `true`
   * @param {String} id - The modal ID.
   * @param {Boolean} [doLock=true] - Whether to lock (`true`) or unlock (`false`).
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
