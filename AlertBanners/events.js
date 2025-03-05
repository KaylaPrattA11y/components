import AlertBanners from "./component";

/**
 * @desc Adds custom event listeners for the AlertBanners component. You can dispatch custom events to deploy or dismiss banners.
 * @example document.dispatchEvent(new CustomEvent("AlertBanners:deploy", { detail: { message: "Hello, world!" } }));
 * @example document.dispatchEvent(new CustomEvent("AlertBanners:dismiss", { detail: { id: "bannerId" } }));
 * @example document.dispatchEvent(new CustomEvent("AlertBanners:dismissAll", { detail: { location: "top" } }));
 */
export default function alertBannersCustomEventListeners() {
  document.addEventListener("AlertBanners:deploy", event => {
    AlertBanners.deploy(event.detail);
  });
  document.addEventListener("AlertBanners:dismiss", event => {
    AlertBanners.dismiss(event.detail.id);
  });
  document.addEventListener("AlertBanners:dismissAll", event => {
    AlertBanners.dismissAll(event.detail.location);
  });
}