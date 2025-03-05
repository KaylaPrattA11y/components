// eslint-disable-next-line import/no-unresolved
import ARIA from "js/dom/aria";
import FocusTrap from "js/dom/FocusTrap";

/**
 * @desc Alert banners component. Can deploy and dismiss banners at the top or bottom of the page.
 */
export default class AlertBanners {
  /**
   *
   * @param {object} settings The settings for the alert banner
   * @param {string} settings.message
   * @param {string} settings.id
   * @param {string | "success" | "trouble" | "error" | "featured" | "info" | "system"} settings.type
   * @param {string | "top" | "bottom"} settings.location
   * @returns {boolean} Returns true if the settings are valid
   */
  static validateSettings(settings) {
    const { message, location, type, id } = settings;
    let isValid = true;

    if (!message) {
      isValid = false;
      throw new Error(`AlertBanners.deploy() -  requires a "message" in the settings object`);
    }
    if (id && typeof id !== "string") {
      isValid = false;
      throw new Error(`AlertBanners.deploy() - "id" in the settings object must be a string`);
    }
    if (!["top", "bottom"].includes(location)) {
      isValid = false;
      throw new Error(
        `AlertBanners.deploy() - "location" in the settings object must be one of the following: ${location.join(", ")}`
      );
    }
    if (!["success", "trouble", "error", "featured", "info", "system"].includes(type)) {
      isValid = false;
      throw new Error(
        `AlertBanners.deploy() - "type" in the settings object must be one of the following: ${type.join(", ")}`
      );
    }
    return isValid;
  }

  /**
   * @desc Deploy an alert banner to the top or bottom of the page, dispatches custom event "AlertBanners:deployed"
   * @param {object} settings The settings for the alert banner
   * @param {string} settings.message The message to display in the banner. Can use an HTML template literal. Required
   * @param {string} settings.id Strongly recommended to provide a unique id so that the banner can be dismissed by id. Optional
   * @param {function} settings.onDismiss The function to call when the banner is dismissed. Optional
   * @param {function} settings.actionCallback The function to call when the CTA is clicked. Optional
   * @param {string} settings.actionText The text to display on the CTA button. Optional
   * @param {string | "success" | "trouble" | "error" | "featured" | "info" | "system"} settings.type The type of the banner, which changes the color and icon. Default is `"info"`
   * @param {boolean} settings.dismissible If true, displays a dismiss button on the banner. Default is `true`
   * @param {number} settings.duration The duration to display the banner in seconds. Default is `0` (infinite)
   * @param {string | "top" | "bottom"} settings.location The location to place the banner. Default is `"top"`
   * @param {boolean} settings.removeOthers If true, dismisses all other banners before deploying the new one. Default is `false`
   * @example AlertBanners.deploy({
   * message: "<p>Do you want to drop the Sector 7 Plate?</p>",
   * id: "exampleBanner",
   * onDismiss: () => console.log("Banner dismissed"),
   * actionCallback: () => console.log("Sector 7 Plate dropped"),
   * actionText: "Drop Sector 7 Plate"
   * type: "trouble",
   * dismissible: true,
   * duration: 0,
   * location: "top",
   * removeOthers: false,
   * });
   */
  static deploy({
    message,
    id,
    onDismiss,
    actionCallback,
    actionText,
    duration = 0,
    location = "top",
    type = "info",
    dismissible = true,
    removeOthers = false,
  }) {
    const container = document.getElementById(`${location}AlertBanners`);
    const template = document.getElementById("alertBannerTemplate");
    const clone = document.importNode(template.content, true);
    const banner = clone.querySelector(`[data-alert-banner="item"]`);
    const bannerMessage = clone.querySelector(`[data-alert-banner="message"]`);
    const bannerControls = clone.querySelector(`[data-alert-banner="controls"]`);
    const bannerDismiss = clone.querySelector("button[data-alert-banner='dismiss']");
    const bannerCTA = clone.querySelector("button[data-alert-banner='cta']");
    const hasCTA = actionCallback && actionText;

    if (!AlertBanners.validateSettings({ message, location, type })) return;
    if (removeOthers) {
      AlertBanners.dismissAll(location);
    }
    banner.id = id || ARIA.generateUniqueID("alertBanner");
    banner.setAttribute("role", hasCTA ? "alertdialog" : "alert");
    banner.classList.add(`${type}-bg`);
    bannerMessage.innerHTML = message;
    bannerControls.classList.toggle("hidden", !dismissible && !hasCTA);
    bannerDismiss.addEventListener("click", () => AlertBanners.dismiss(banner.id));
    bannerDismiss.classList.toggle("hidden", !dismissible);
    bannerDismiss.setAttribute("aria-controls", banner.id);
    if (onDismiss) {
      banner.addEventListener("AlertBanners:dismissed", onDismiss);
    }
    if (hasCTA) {
      bannerCTA.textContent = actionText;
      bannerCTA.addEventListener("click", actionCallback);
      bannerCTA.classList.remove("hidden");
    }
    container.appendChild(banner);
    if (hasCTA) {
      FocusTrap.start(banner);
    }
    if (duration) {
      setTimeout(() => AlertBanners.dismiss(banner.id), duration * 1000);
    }
    banner.dispatchEvent(
      new CustomEvent("AlertBanners:deployed", { bubbles: true, detail: { id: banner.id } })
    );
  }

  /**
   * @desc Dismiss a banner by id, removing it from the DOM and dispatching custom event "AlertBanners:dismissed"
   * @param {string} id
   * @example AlertBanners.dismiss("bannerId");
   */
  static dismiss(id) {
    const banner = document.getElementById(id);
    if (banner) {
      banner.remove();
      banner.dispatchEvent(new CustomEvent("AlertBanners:dismissed", { bubbles: true, detail: { id } }));
    }
  }

  /**
   * @desc Dismiss all banners, removing them from the DOM and dispatching custom event "AlertBanners:dismissedAll"
   * @param {string | "top" | "bottom"} location The location to dismiss all banners. Leave blank to dismiss all banners at both the top and bottom locations
   * @example AlertBanners.dismissAll("top");
   */
  static dismissAll(location) {
    let container = document.body;

    if (["top", "bottom"].includes(location)) {
      container = document.getElementById(`${location}AlertBanners`);
    }
    container.querySelectorAll(`[data-alert-banner="item"]`)?.forEach(banner => AlertBanners.dismiss(banner.id));
    document.dispatchEvent(new CustomEvent("AlertBanners:dismissedAll", { bubbles: true, detail: { location } }));
  }
}
