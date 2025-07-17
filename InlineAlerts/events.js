import InlineAlert from "./component";

/**
 * @desc Adds custom event listeners for the InlineAlerts component. You can dispatch custom events to deploy or dismiss inline alert messages.
 * @example document.dispatchEvent(new CustomEvent("InlineAlerts:deploy", { detail: { targetElement: document.getElementById("ilTargetElement"), messageHTML: "Hello, world!" } }));
 * @example document.dispatchEvent(new CustomEvent("InlineAlerts:dismiss", { detail: { id: "inlineAlertId" } }));
 */
export default function inlineAlertsCustomEventListeners() {
  document.addEventListener("InlineAlerts:deploy", event => {
    InlineAlert.deploy(event.detail);
  });
  document.addEventListener("InlineAlerts:dismiss", event => {
    InlineAlert.dismiss(event.detail.id);
  });
}
