import toSentenceCaseMulti from "js/utilities/toSentenceCase";
import ARIA from "../../dom/aria";
import statusTypes from "../../ui/statusTypes";
// eslint-disable-next-line no-unused-vars
import InlineAlerts from "../InlineAlerts";

/**
 * @class AlertBanners
 * @classdesc AlertBanners may only be deployed to one of two pre-determined locations on the page: the top or bottom.
 * @see {@link https://driven-web.qat.fuels.fleetcor.co//style-guide/#alertBanners|Alert Banners} in the Developer pattern guide
 * @note This is the correct class to use for alert banners. Do not use the dastardly doppelganger `AlertBanners` class located in `src/content/components/AlertBanner/component.js` that keeps rising like the Phoenix no matter how often we strike it down.
 *
 * @note If a message should need to be deployed to a specific location on the page, use the `InlineAlerts` class instead.
 * @see {@link InlineAlerts} The class that should be used for deploying messages to specific locations on the page
 */
export default class AlertBanners {
  /**
   * @param {Object} settings The settings for the alert banner
   * @param {String} settings.message
   * @param {"top"|"bottom"} settings.location The location to place the banner. Default is `"top"`
   * @param {"success"|"trouble"|"error"|"featured"|"info"|"system"} settings.type The type of the banner, which changes the color and icon
   * @param {String} settings.id Strongly recommended to provide a unique id so that the banner can be dismissed by id
   * @returns {Boolean} Returns true if the settings are valid
   */
  static validateSettings({ message, location, type, id }) {
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
        `AlertBanners.deploy() - "location" in the settings object must be one of the following: ${[
          "top",
          "bottom",
        ].join(", ")}`
      );
    }
    if (!statusTypes.includes(type)) {
      isValid = false;
      console.warn(
        `AlertBanners.deploy() - "type" in the settings object must be one of the following: ${statusTypes.join(", ")}`
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
   * @param {Boolean} [settings.removeOthers=false] Deprecated. This setting will do nothing because deploying a banner will remove the previous banner. If you want to remove all banners, use `AlertBanners.dismissAll(<"top"|"bottom">)` instead.
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
  }) {
    if (!AlertBanners.validateSettings({ message, location, type })) return;
    let banner = document.getElementById(id);
    if (id != null && banner && banner.classList.contains("alert-banners--item")) {
      return; // If the banner already exists, do not deploy it again
    }
    const container = document.getElementById(`${location}AlertBanners`);
    if (!container) {
      return; // If the container does not exist, do not deploy the banner
    }
    const template = document.getElementById("alertBannerTemplate");
    const clone = document.importNode(template.content, true);
    banner = clone.querySelector(`[data-alert-banner="item"]`);
    const bannerMessage = clone.querySelector(`[data-alert-banner="message"]`);
    const bannerIcon = clone.querySelector(`[data-alert-banner="icon"]`);
    const bannerControls = clone.querySelector(`[data-alert-banner="controls"]`);
    const bannerDismiss = clone.querySelector("button[data-alert-banner='dismiss']");
    const bannerCTA = clone.querySelector("button[data-alert-banner='cta']");
    const hasCTA = actionCallback && actionText;

    banner.id = id;
    banner.setAttribute("role", "alert");
    banner.classList.add(`is-${type}`);
    banner.setAttribute("data-dismissible", dismissible);
    bannerMessage.innerHTML = toSentenceCaseMulti(message);
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
    } else {
      // Remove the CTA button if not provided
      bannerCTA.remove();
    }
    // Clear the banner's previous content
    container.innerHTML = "";
    if (location === "bottom") {
      // Remove the icon for bottom banners as they are not needed
      bannerIcon.remove();
    }
    if (duration !== 0) {
      if (duration > 9) {
        setTimeout(() => AlertBanners.dismiss(banner.id), duration * 1000);
      } else {
        // Set to 10 seconds if duration is between 1 and 9 seconds to ensure WCAG compliance
        setTimeout(() => AlertBanners.dismiss(banner.id), 10000);
      }
    }
    container.appendChild(banner);
    setTimeout(() => {
      banner.classList.add("is-deployed");
      banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (hasCTA) {
        bannerCTA.focus();
      }
    }, 50);
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
      const transitionDuration = banner.style.getPropertyValue("--transition-duration");
      const duration = parseInt(transitionDuration?.replace(/\D/g, ""), 10) || 250; // default to 250ms if not set

      banner.classList.remove("is-deployed");
      setTimeout(() => {
        banner.dispatchEvent(new CustomEvent("AlertBanners:dismissed", { bubbles: true, detail: { id } }));
        banner.remove();
      }, duration);
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
    if (container) {
      container.querySelectorAll(`[data-alert-banner="item"]`)?.forEach(banner => AlertBanners.dismiss(banner.id));
      document.dispatchEvent(new CustomEvent("AlertBanners:dismissedAll", { bubbles: true, detail: { location } }));
    }
  }
}

/**
 * PageAlerts may only be deployed to one of two pre-determined locations on the page: the top or bottom.
 * @alias AlertBanners
 * @see {@link AlertBanners} The class that this is an alias for
 * @note If a message should need to be deployed to a specific location on the page, use the `InlineAlerts` class instead.
 * @see {@link InlineAlerts} The class that should be used for deploying messages to specific locations on the page
 */
export const PageAlerts = AlertBanners;
