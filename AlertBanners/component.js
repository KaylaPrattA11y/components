/* eslint-disable import/no-unresolved */
import ARIA from "js/dom/aria";
import FocusTrap from "js/dom/FocusTrap";

/**
 * @desc Deploy and dismiss banners at the top or bottom of the page using static methods or custom events.
 * @see {@link https://ifleet-v2.dev.myfleetcard.net/style-guide/#alertBanners}
 */
export default class AlertBanners {
  /**
   *
   * @param {Object} settings The settings for the alert banner
   * @param {String} settings.message
   * @param {"top" | "bottom"} [settings.location="top"] The location to place the banner. Default is `"top"`
   * @param {"success" | "trouble" | "error" | "featured" | "info" | "system"} [settings.type="info"] The type of the banner, which changes the color and icon
   * @param {String} [settings.id=ARIA.generateUniqueID("alertBanner")] Strongly recommended to provide a unique id so that the banner can be dismissed by id
   * @returns {Boolean} Returns true if the settings are valid
   */
  static validateSettings(settings) {
    const { message, location, type, id } = settings;
    let isValid = true;

    if (!message) {
      isValid = false;
      console.warn(`AlertBanners.deploy() -  requires a "message" in the settings object`);
    }
    if (id && typeof id !== "string") {
      isValid = false;
      console.warn(`AlertBanners.deploy() - "id" in the settings object must be a string`);
    }
    if (!["top", "bottom"].includes(location)) {
      isValid = false;
      console.warn(
        `AlertBanners.deploy() - "location" in the settings object must be one of the following: ${location.join(", ")}`
      );
    }
    if (!["success", "trouble", "error", "featured", "info", "system"].includes(type)) {
      isValid = false;
      console.warn(
        `AlertBanners.deploy() - "type" in the settings object must be one of the following: ${type.join(", ")}`
      );
    }
    return isValid;
  }

  /**
   * @desc Deploy an alert banner to the top or bottom of the page, dispatches custom event "AlertBanners:deployed"
   * @param {Object} settings The settings for the alert banner
   * @param {String} settings.message The message to display in the banner. Can use an HTML template literal. Required
   * @param {Function} [settings.onDismiss] The function to call when the banner is dismissed
   * @param {Function} [settings.actionCallback] The function to call when the CTA is clicked
   * @param {String} [settings.actionText] The text to display on the CTA button
   * @param {"success" | "trouble" | "error" | "featured" | "info" | "system"} [settings.type="info"] The type of the banner, which changes the color and icon
   * @param {Boolean} [settings.dismissible=true] If true, displays a dismiss button on the banner
   * @param {String} [settings.id=ARIA.generateUniqueID("alertBanner")] Strongly recommended to provide a unique id so that the banner can be dismissed by id
   * @param {Number} [settings.duration=0] The duration to display the banner in seconds. Default is infinite. Value range of `1`-`9` is not allowed due to the fact that it fails WCAG 2.2 AA compliance (https://www.w3.org/WAI/WCAG22/Understanding/enough-time.html), in which case, the duration will automatically be infinite
   * @param {"top" | "bottom"} [settings.location="top"] The location to place the banner. Default is `"top"`
   * @param {Boolean} [settings.removeOthers=false] If true, dismisses all other banners before deploying the new one
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
    onDismiss,
    actionCallback,
    actionText,
    id = ARIA.generateUniqueID("alertBanner"),
    duration = 0,
    location = "top",
    type = "info",
    dismissible = true,
    removeOthers = false,
  }) {
    if (!AlertBanners.validateSettings({ message, location, type })) return;
    let banner = document.getElementById(id);
    if (id != null && banner && banner.classList.contains("alert-banners--item")) {
      banner.remove();
    }
    const container = document.getElementById(`${location}AlertBanners`);
    const template = document.getElementById("alertBannerTemplate");
    const clone = document.importNode(template.content, true);
    banner = clone.querySelector(`[data-alert-banner="item"]`);
    const bannerMessage = clone.querySelector(`[data-alert-banner="message"]`);
    const bannerControls = clone.querySelector(`[data-alert-banner="controls"]`);
    const bannerDismiss = clone.querySelector("button[data-alert-banner='dismiss']");
    const bannerCTA = clone.querySelector("button[data-alert-banner='cta']");
    const hasCTA = actionCallback && actionText;

    if (removeOthers) {
      AlertBanners.dismissAll(location);
    }
    banner.id = id;
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
    if (duration !== 0) {
      if (duration > 9) {
        setTimeout(() => AlertBanners.dismiss(banner.id), duration * 1000);
      } else {
        // Set to 10 seconds if duration is between 1 and 9 seconds to ensure WCAG compliance
        setTimeout(() => AlertBanners.dismiss(banner.id), 10000);
      }
    }
    banner.dispatchEvent(new CustomEvent("AlertBanners:deployed", { bubbles: true, detail: { id: banner.id } }));
  }

  /**
   * @desc Dismiss a banner by id, removing it from the DOM and dispatching custom event "AlertBanners:dismissed"
   * @param {String} id
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
   * @param {"top" | "bottom" | null} location The location to dismiss all banners. Leave blank to dismiss all banners at both the top and bottom locations
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
