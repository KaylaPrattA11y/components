import ARIA from "../../dom/aria";
import statusTypes from "../../ui/statusTypes";

/**
 * @desc Deploy and dismiss inline alert messages at a chosen placement using static methods or custom events.
 * @see {@link https://driven-web.qat.fuels.fleetcor.co/style-guide/#inlineAlerts}
 */
export default class InlineAlerts {
  /**
   * @param {Object} settings The settings for the inline alert
   * @param {String} settings.messageHTML
   * @param {"success"|"trouble"|"error"|"featured"|"info"|"system"} settings.type The type of the inline alert, which changes the color and icon
   * @param {String} settings.id Strongly recommended to provide a unique id so that the inline alert can be dismissed by id
   * @returns {Boolean} Returns true if the settings are valid
   */
  static validateSettings({ messageHTML, type, id }) {
    let isValid = true;

    if (!messageHTML) {
      isValid = false;
      console.warn(`InlineAlerts.deploy() - requires a "messageHTML" in the settings object`);
    }
    if (id && typeof id !== "string") {
      isValid = false;
      console.warn(`InlineAlerts.deploy() - "id" in the settings object must be a string`);
    }
    if (!statusTypes.includes(type)) {
      isValid = false;
      console.warn(
        `InlineAlerts.deploy() - "type" in the settings object must be one of the following: ${statusTypes.join(", ")}`
      );
    }
    return isValid;
  }

  /**
   * Deploys an inline alert messageHTML.
   * @param {Object} settings
   * @param {String} settings.messageHTML The messageHTML to display in the inline alert
   * @param {HTMLElement} settings.targetElement The element relevant to the inline alert, typically a form fieldset or a section of content
   * @param {"beforebegin"|"afterbegin"|"beforeend"|"afterend"} [settings.placement="beforeend"] Where to insert the inline alert `messageHTML` in relation to the `targetElement`
   * @param {String} [settings.classes] Additional classes to add to the inline alert container, space-separated
   * @param {Function} [settings.onDismiss] The function to call when the inline alert is dismissed
   * @param {String} [settings.id=ARIA.generateUniqueID("inlineAlert")] The id of the inline alert, strongly recommended to provide a unique id so that the alert can be dismissed by id
   * @param {Boolean} [settings.scrollIntoView=true] If true, scrolls to the Inline Alert messageHTML element after deploying the inline alert
   * @param {Boolean} [settings.showIcon=true] If true, shows an icon in the inline alert corresponding to the `type`. If false, no icon is shown
   * @param {Number} [settings.duration=0] The duration to display the inline alert, Default is infinite. Value range of `1`-`9` is not allowed due to the fact that it fails WCAG 2.2 AA compliance (https://www.w3.org/WAI/WCAG22/Understanding/enough-time.html), in which case, the duration will automatically be infinite
   * @param {"success"|"trouble"|"error"|"featured"|"info"|"system"} [settings.type="error"] The type of the inline alert, which changes the colors
   * @param {"top"|"right"|"bottom"|"left"} [settings.arrowPlacement] The placement of the arrow relative to the inline alert box. If not provided, no arrow is shown
   */
  static deploy({
    messageHTML,
    targetElement,
    placement = "beforeend",
    classes,
    onDismiss,
    id = ARIA.generateUniqueID("inlineAlert"),
    scrollIntoView = true,
    showIcon = true,
    duration = 0,
    type = "error",
    arrowPlacement,
  }) {
    if (!InlineAlerts.validateSettings({ messageHTML, type })) return;
    let messageElement = document.getElementById(id);
    if (messageElement && messageElement.classList.contains("inline-alerts")) {
      return; // Prevent deploying the same inline alert multiple times
    }
    messageElement = document.createElement("div");

    messageElement.id = id;
    messageElement.className = `inline-alerts is-${type}`;
    messageElement.innerHTML = `
      <div class="inline-alerts--content">
        ${showIcon ? `<div class="inline-alerts--icon"></div>` : ""}
        <div class="inline-alerts--message">
          ${messageHTML}
        </div>
      </div>`;
    targetElement.insertAdjacentElement(placement, messageElement);

    if (arrowPlacement) {
      messageElement.classList.add("has-arrow", `arrow-${arrowPlacement}`);
    }
    if (showIcon) {
      messageElement.classList.add("has-icon");
    }
    if (classes) {
      messageElement.classList.add(...classes.split(" ").filter(cls => cls.trim() !== ""));
    }
    if (onDismiss) {
      messageElement.addEventListener("InlineAlerts:dismissed", onDismiss);
    }
    if (scrollIntoView) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      targetElement.focus();
    }
    if (duration !== 0) {
      if (duration > 9) {
        setTimeout(() => InlineAlerts.dismiss(messageElement.id), duration * 1000);
      } else {
        // Set to 10 seconds if duration is between 1 and 9 seconds to ensure WCAG compliance
        setTimeout(() => InlineAlerts.dismiss(messageElement.id), 10000);
      }
    }
    messageElement.classList.add("is-deployed");
    messageElement.dispatchEvent(
      new CustomEvent("InlineAlerts:deployed", { bubbles: true, detail: { id: messageElement.id } })
    );
  }

  /**
   * @desc Dismiss a inline alert by id, removing it from the DOM and dispatching custom event "InlineAlerts:dismissed"
   * @param {String} id
   * @example InlineAlerts.dismiss("alertId");
   */
  static dismiss(id) {
    const messageElement = document.getElementById(id);
    if (messageElement) {
      messageElement.addEventListener("transitionend", () => {
        messageElement.remove();
        messageElement.dispatchEvent(new CustomEvent("InlineAlerts:dismissed", { bubbles: true, detail: { id } }));
      });
      messageElement.classList.remove("is-deployed");
    }
  }
}
