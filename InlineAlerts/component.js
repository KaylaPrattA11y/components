import ARIA from "../../dom/aria";
import statusTypes from "../../ui/statusTypes";
import { dataOn } from "../../../v1.5/binding-utils";

/**
 * @class InlineAlerts
 * @classdesc Deploy and dismiss inline alert messages at a chosen placement using static methods or custom events.
 * @see {@link https://driven-web.qat.fuels.fleetcor.co/style-guide/#inlineAlerts|Inline Alerts} in the Developer Pattern Guide
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
   * @param {String|null} [settings.classes] Additional classes to add to the inline alert container, space-separated
   * @param {Function|null} [settings.onDismiss] The function to call when the inline alert is dismissed
   * @param {Function|null} [settings.onDeploy] The function to call when the inline alert is deployed. Useful if the inline alert has a delayed deployment
   * @param {String} [settings.id=ARIA.generateUniqueID("inlineAlert")] The id of the inline alert, strongly recommended to provide a unique id so that the alert can be dismissed by id
   * @param {Boolean} [settings.scrollIntoView=true] If true, scrolls to the Inline Alert messageHTML element after deploying the inline alert
   * @param {Boolean} [settings.showIcon=true] If true, shows an icon in the inline alert corresponding to the `type`. If false, no icon is shown
   * @param {Number} [settings.timeToLive=0] The time to live in seconds. Value range of `1`-`9` is not allowed due to the fact that it fails {@link https://www.w3.org/WAI/WCAG22/Understanding/enough-time.html|WCAG 2.2 AA compliance - Enough Time}, in which case, the time to live will automatically be set to 10 seconds.
   * @param {Number} [settings.timeToDelay=0] The time to delay deployment in seconds.
   * @param {"success"|"trouble"|"error"|"featured"|"info"|"system"} [settings.type="error"] The type of the inline alert, which changes the colors
   * @param {"top"|"bottom"|null} [settings.anchorTo] The absolute placement of the message element relative to the target element. If not provided, message will be positioned according to the flow of the document. If there are issues with positioning, check the `placement` setting value
   */
  static deploy({
    messageHTML,
    targetElement,
    placement = "beforeend",
    classes,
    onDismiss,
    onDeploy,
    id = ARIA.generateUniqueID("inlineAlert"),
    scrollIntoView = true,
    showIcon = true,
    timeToLive = 0,
    timeToDelay = 0,
    type = "error",
    anchorTo,
  }) {
    if (!InlineAlerts.validateSettings({ messageHTML, type })) return;
    let messageElement = document.getElementById(id);
    if (messageElement && messageElement.classList.contains("inline-alerts")) {
      if (scrollIntoView) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        targetElement.focus();
      }
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
          ${
            anchorTo
              ? `<div class="text-center mbs-xs"><button type="button" data-on="click:dismiss" class="inline-alerts--dismiss-button ts-subtitle-2 btn-link">Close</button></div>`
              : ""
          }
        </div>
      </div>`;

    targetElement.insertAdjacentElement(placement, messageElement);
    if (anchorTo) {
      messageElement.classList.add("is-anchored", `is-anchored-${anchorTo}`, "border-radius-md", "shadow-md");
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
    if (onDeploy) {
      messageElement.addEventListener("InlineAlerts:deployed", onDeploy);
    }
    // Delay the deployment if time to delay is set
    setTimeout(() => {
      if (scrollIntoView) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        targetElement.focus();
      }
      // Set time to live
      if (timeToLive !== 0) {
        if (timeToLive > 9) {
          setTimeout(() => InlineAlerts.dismiss(messageElement.id), timeToLive * 1000);
        } else {
          // Set to 10 seconds if time to live is between 1 and 9 seconds to ensure WCAG compliance
          setTimeout(() => InlineAlerts.dismiss(messageElement.id), 10000);
        }
      }
      dataOn(messageElement, {
        dismiss: () => InlineAlerts.dismiss(messageElement.id),
      });
      messageElement.classList.add("is-deployed");
      messageElement.dispatchEvent(
        new CustomEvent("InlineAlerts:deployed", { bubbles: true, detail: { id: messageElement.id } })
      );
    }, timeToDelay * 1000);
  }

  /**
   * @desc Dismiss a inline alert by id, removing it from the DOM and dispatching custom event "InlineAlerts:dismissed"
   * @param {String} id
   * @example InlineAlerts.dismiss("alertId");
   */
  static dismiss(id) {
    const messageElement = document.getElementById(id);
    if (messageElement) {
      const transitionDuration = messageElement.style.getPropertyValue("--transition-duration");
      const duration = parseInt(transitionDuration?.replace(/\D/g, ""), 10) || 250; // default to 250ms if not set

      messageElement.classList.remove("is-deployed");
      setTimeout(() => {
        messageElement.dispatchEvent(new CustomEvent("InlineAlerts:dismissed", { bubbles: true, detail: { id } }));
        messageElement.remove();
      }, duration);
    }
  }

  /**
   * Dismiss all inline alerts within a specific container
   * @param {HTMLElement} container The container element to search within
   */
  static dismissAll(container = document.body) {
    const alerts = container.querySelectorAll(".inline-alerts");
    alerts?.forEach(alert => {
      InlineAlerts.dismiss(alert.id);
    });
  }
}
